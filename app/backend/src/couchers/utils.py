import http.cookies
import re
from datetime import date, datetime, timedelta
from email.utils import formatdate
from zoneinfo import ZoneInfo

import pytz
from geoalchemy2.shape import from_shape, to_shape
from geoalchemy2.types import Geography, Geometry
from google.protobuf.duration_pb2 import Duration
from google.protobuf.timestamp_pb2 import Timestamp
from shapely.geometry import Point, Polygon, shape
from sqlalchemy.sql import cast, func
from sqlalchemy.types import DateTime

from couchers.config import config
from couchers.constants import EMAIL_REGEX, PREFERRED_LANGUAGE_COOKIE_EXPIRY
from couchers.crypto import decrypt_page_token, encrypt_page_token

utc = pytz.UTC


# When a user logs in, they can basically input one of three things: user id, username, or email
# These are three non-intersecting sets
# * user_ids are numeric representations in base 10
# * usernames are alphanumeric + underscores, at least 2 chars long, and don't start with a number, and don't start or end with underscore
# * emails are just whatever stack overflow says emails are ;)


def is_valid_user_id(field):
    """
    Checks if it's a string representing a base 10 integer not starting with 0
    """
    return re.match(r"[1-9][0-9]*$", field) is not None


def is_valid_username(field):
    """
    Checks if it's an alphanumeric + underscore, lowercase string, at least
    two characters long, and starts with a letter, ends with alphanumeric
    """
    return re.match(r"[a-z][0-9a-z_]*[a-z0-9]$", field) is not None


def is_valid_name(field):
    """
    Checks if it has at least one non-whitespace character
    """
    return re.match(r"\S+", field) is not None


def is_valid_email(field):
    return re.match(EMAIL_REGEX, field) is not None


def Timestamp_from_datetime(dt: datetime):
    pb_ts = Timestamp()
    pb_ts.FromDatetime(dt)
    return pb_ts


def Duration_from_timedelta(dt: datetime):
    pb_d = Duration()
    pb_d.FromTimedelta(dt)
    return pb_d


def parse_date(date_str: str):
    """
    Parses a date-only string in the format "YYYY-MM-DD" returning None if it fails
    """
    try:
        return date.fromisoformat(date_str)
    except ValueError:
        return None


def date_to_api(date: date):
    return date.isoformat()


def to_aware_datetime(ts: Timestamp):
    """
    Turns a protobuf Timestamp object into a timezone-aware datetime
    """
    return utc.localize(ts.ToDatetime())


def now():
    return datetime.now(utc)


def minimum_allowed_birthdate():
    """
    Most recent birthdate allowed to register (must be 18 years minimum)

    This approximation works on leap days!
    """
    return today() - timedelta(days=365.25 * 18)


def today():
    """
    Date only in UTC
    """
    return now().date()


def now_in_timezone(tz):
    """
    tz should be tzdata identifier, e.g. America/New_York
    """
    return datetime.now(pytz.timezone(tz))


def today_in_timezone(tz):
    """
    tz should be tzdata identifier, e.g. America/New_York
    """
    return now_in_timezone(tz).date()


# Note: be very careful with ordering of lat/lng!
# In a lot of cases they come as (lng, lat), but us humans tend to use them from GPS as (lat, lng)...
# When entering as EPSG4326, we also need it in (lng, lat)


def create_coordinate(lat, lng):
    """
    Creates a WKT point from a (lat, lng) tuple in EPSG4326 coordinate system (normal GPS-coordinates)
    """
    wkb_point = from_shape(Point(lng, lat), srid=4326)

    # Casting to Geography and back here to ensure coordinate wrapping
    return cast(
        cast(wkb_point, Geography(geometry_type="POINT", srid=4326)), Geometry(geometry_type="POINT", srid=4326)
    )


def create_polygon_lat_lng(points):
    """
    Creates a EPSG4326 WKT polygon from a list of (lat, lng) tuples
    """
    return from_shape(Polygon([(lng, lat) for (lat, lng) in points]), srid=4326)


def create_polygon_lng_lat(points):
    """
    Creates a EPSG4326 WKT polygon from a list of (lng, lat) tuples
    """
    return from_shape(Polygon(points), srid=4326)


def geojson_to_geom(geojson):
    """
    Turns GeoJSON to PostGIS geom data in EPSG4326
    """
    return from_shape(shape(geojson), srid=4326)


def to_multi(polygon):
    return func.ST_Multi(polygon)


def get_coordinates(geom):
    """
    Returns EPSG4326 (lat, lng) pair for a given WKT geom point or None if the input is not truthy
    """
    if geom:
        shp = to_shape(geom)
        # note the funiness with 4326 normally being (x, y) = (lng, lat)
        return (shp.y, shp.x)
    else:
        return None


def http_date(dt=None):
    """
    Format the datetime for HTTP cookies
    """
    if not dt:
        dt = now()
    return formatdate(dt.timestamp(), usegmt=True)


def _create_tasty_cookie(name: str, value, expiry: datetime, httponly: bool):
    cookie = http.cookies.Morsel()
    cookie.set(name, str(value), str(value))
    # tell the browser when to stop sending the cookie
    cookie["expires"] = http_date(expiry)
    # restrict to our domain, note if there's no domain, it won't include subdomains
    cookie["domain"] = config["COOKIE_DOMAIN"]
    # path so that it's accessible for all API requests, otherwise defaults to something like /org.couchers.auth/
    cookie["path"] = "/"
    if config["DEV"]:
        # send only on requests from first-party domains
        cookie["samesite"] = "Strict"
    else:
        # send on all requests, requires Secure
        cookie["samesite"] = "None"
        # only set cookie on HTTPS sites in production
        cookie["secure"] = True
    # not accessible from javascript
    cookie["httponly"] = httponly

    return cookie.OutputString()


def create_session_cookies(token, user_id, expiry) -> list[str]:
    """
    Creates our session cookies.

    We have two: the secure session token (in couchers-sesh) that's inaccessible to javascript, and the user id (in couchers-user-id) which the javascript frontend can access, so that it knows when it's logged in/out
    """
    return [
        _create_tasty_cookie("couchers-sesh", token, expiry, httponly=True),
        _create_tasty_cookie("couchers-user-id", user_id, expiry, httponly=False),
    ]


def create_lang_cookie(lang):
    return [
        _create_tasty_cookie(
            "couchers-preferred-language", lang, expiry=(now() + PREFERRED_LANGUAGE_COOKIE_EXPIRY), httponly=False
        )
    ]


def parse_session_cookie(headers):
    """
    Returns our session cookie value (aka token) or None
    """
    if "cookie" not in headers:
        return None

    # parse the cookie
    cookie = http.cookies.SimpleCookie(headers["cookie"]).get("couchers-sesh")

    if not cookie:
        return None

    return cookie.value


def parse_user_id_cookie(headers):
    """
    Returns our session cookie value (aka token) or None
    """
    if "cookie" not in headers:
        return None

    # parse the cookie
    cookie = http.cookies.SimpleCookie(headers["cookie"]).get("couchers-user-id")

    if not cookie:
        return None

    return cookie.value


def parse_ui_lang_cookie(headers):
    """
    Returns language cookie or None
    """
    if "cookie" not in headers:
        return None

    # else parse the cookie & return its value
    cookie = http.cookies.SimpleCookie(headers["cookie"]).get("couchers-preferred-language")

    if not cookie:
        return None

    return cookie.value


def parse_api_key(headers):
    """
    Returns a bearer token (API key) from the `authorization` header, or None if invalid/not present
    """
    if "authorization" not in headers:
        return None

    authorization = headers["authorization"]
    if not authorization.startswith("Bearer "):
        return None

    return authorization[7:]


def remove_duplicates_retain_order(list_):
    out = []
    for item in list_:
        if item not in out:
            out.append(item)
    return out


def date_in_timezone(date_, timezone):
    """
    Given a naive postgres date object (postgres doesn't have tzd dates), returns a timezone-aware timestamp for the
    start of that date in that timezone. E.g. if postgres is in 'America/New_York',

    SET SESSION TIME ZONE 'America/New_York';

    CREATE TABLE tz_trouble (to_date date, timezone text);

    INSERT INTO tz_trouble(to_date, timezone) VALUES
    ('2021-03-10'::date, 'Australia/Sydney'),
    ('2021-03-20'::date, 'Europe/Berlin'),
    ('2021-04-15'::date, 'America/New_York');

    SELECT timezone(timezone, to_date::timestamp) FROM tz_trouble;

    The result is:

            timezone
    ------------------------
     2021-03-09 08:00:00-05
     2021-03-19 19:00:00-04
     2021-04-15 00:00:00-04
    """
    return func.timezone(timezone, cast(date_, DateTime(timezone=False)))


def millis_from_dt(dt):
    return round(1000 * dt.timestamp())


def dt_from_millis(millis):
    return datetime.fromtimestamp(millis / 1000, tz=utc)


def dt_to_page_token(dt):
    """
    Python has datetime resolution equal to 1 micro, as does postgres

    We pray to deities that this never changes
    """
    assert datetime.resolution == timedelta(microseconds=1)
    return encrypt_page_token(str(round(1_000_000 * dt.timestamp())))


def dt_from_page_token(page_token):
    # see above comment
    return datetime.fromtimestamp(int(decrypt_page_token(page_token)) / 1_000_000, tz=utc)


def last_active_coarsen(dt):
    """
    Coarsens a "last active" time to the accuracy we use for last active times, currently to the last hour, e.g. if the current time is 27th June 2021, 16:53 UTC, this returns 27th June 2021, 16:00 UTC
    """
    return dt.replace(minute=0, second=0, microsecond=0)


def get_tz_as_text(tz_name):
    return datetime.now(tz=ZoneInfo(tz_name)).strftime("%Z/UTC%z")
