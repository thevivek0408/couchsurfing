import { Pagination, Typography, useMediaQuery, useTheme } from "@mui/material";
import Alert from "components/Alert";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import LocationAutocomplete from "components/LocationAutocomplete";
import TextBody from "components/TextBody";
import { useTranslation } from "i18n";
import { COMMUNITIES, GLOBAL } from "i18n/namespaces";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { GeocodeResult } from "utils/hooks";
import makeStyles from "utils/makeStyles";

import EventsList from "./EventsList";
import { useEventSearch } from "./hooks";

const useStyles = makeStyles((theme) => ({
  column: {
    display: "flex",
    flexDirection: "column",
  },
  emptyState: {
    marginBottom: theme.spacing(2),
  },
  filter: {
    backgroundColor: theme.palette.grey[200],
    color: theme.palette.text.primary,
    padding: theme.spacing(1, 2),
    textAlign: "center",
    fontWeight: "bold",
    margin: theme.spacing(0.5),
    borderRadius: theme.shape.borderRadius * 6,
    "&:hover": {
      cursor: "pointer",
    },
  },
  filterTags: {
    display: "flex",
    alignItems: "center",
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  loadingBox: {
    display: "flex",
    justifyContent: "center",
    padding: theme.spacing(2),
    width: "100%",
    minHeight: theme.spacing(20),
  },
  locationSearch: {
    marginRight: theme.spacing(2),
    paddingBottom: theme.spacing(2),
  },
  pagination: {
    display: "flex",
    justifyContent: "center",
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    width: "100%",
    [theme.breakpoints.down("md")]: {
      flexDirection: "column",
    },
  },
  selectedFilter: {
    backgroundColor: theme.palette.secondary.main,
    color: theme.palette.common.white,
    padding: theme.spacing(1, 2),
    textAlign: "center",
    fontWeight: "bold",
    margin: theme.spacing(0.5),
    borderRadius: theme.shape.borderRadius * 6,
    "&:hover": {
      cursor: "pointer",
    },
  },
}));

const DiscoverEventsList = () => {
  const classes = useStyles();
  // @TODO - Basically just making the form since LocationAutocomplete required the control prop
  // We don't validate or require this field so it's just a dummy form
  // Too much refactoring needed to change existing components to not require the control prop
  // Might be worth making a new uncontrolled omponent that doesn't require the control prop
  const { control } = useForm<{ location: GeocodeResult | undefined }>({
    mode: "onChange",
  });
  const { t } = useTranslation([GLOBAL, COMMUNITIES]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const pageSize = 12;

  const [pageNumber, setPageNumber] = useState(1);
  const [isMyCommunities, setIsMyCommunities] = useState<boolean>(false);
  const [isOnlineOnly, setIsOnlineOnly] = useState<boolean>(false);
  const [locationResult, setLocationResult] = useState<GeocodeResult | "">("");

  const { data, error, isLoading } = useEventSearch({
    pastEvents: false,
    pageSize,
    pageNumber,
    isMyCommunities,
    isOnlineOnly,
    searchLocation: locationResult,
  });

  const hasEvents = data && data.eventsList && data.eventsList.length > 0;
  const numPages = Math.ceil((data?.totalItems ?? 0) / pageSize) ?? 1;

  const handlePageNumberChange = (
    event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    setPageNumber(value);
  };

  const handleFilterIsMyCommunitiesClick = () => {
    setIsMyCommunities(!isMyCommunities);
    setPageNumber(1);
  };

  const handleFilterIsOnlineOnlyClick = () => {
    setIsOnlineOnly(!isOnlineOnly);
    setPageNumber(1);
  };

  const handleOnChangeAutocomplete = (newLocationResult: GeocodeResult) => {
    if (typeof newLocationResult === "object") {
      setLocationResult(newLocationResult);
    } else {
      setLocationResult("");
    }
    setPageNumber(1);
  };

  const renderLocationAutoComplete = () => (
    <LocationAutocomplete
      className={classes.locationSearch}
      control={control}
      name="location"
      defaultValue={typeof locationResult === "object" ? locationResult : ""}
      label={t("global:location_autocomplete.search_location_button")}
      onChange={handleOnChangeAutocomplete}
      fieldError={undefined}
      fullWidth={isMobile}
    />
  );

  return (
    <>
      <div className={classes.column}>
        <Typography variant="h2">
          {t("communities:discover_events_title")}
        </Typography>
        <div className={classes.row}>
          <div className={classes.filterTags}>
            <Typography
              className={
                isMyCommunities ? classes.selectedFilter : classes.filter
              }
              variant="body2"
              onClick={handleFilterIsMyCommunitiesClick}
            >
              {t("communities:my_communities")}
            </Typography>
            <Typography
              className={isOnlineOnly ? classes.selectedFilter : classes.filter}
              variant="body2"
              onClick={handleFilterIsOnlineOnlyClick}
            >
              {t("communities:online")}
            </Typography>
          </div>
          {!isMobile && renderLocationAutoComplete()}
        </div>
        {isMobile && renderLocationAutoComplete()}
      </div>
      {!hasEvents && !isLoading && (
        <TextBody>{t("communities:events_empty_state")}</TextBody>
      )}
      {error && <Alert severity="error">{error.message}</Alert>}
      {isLoading && (
        <div className={classes.loadingBox}>
          <CenteredSpinner />
        </div>
      )}
      {hasEvents && !isLoading && (
        <>
          <EventsList events={data.eventsList} isVerticalStyle />
          <Pagination
            className={classes.pagination}
            count={numPages}
            page={pageNumber}
            color="primary"
            onChange={handlePageNumberChange}
            size="large"
          />
        </>
      )}
    </>
  );
};

export default DiscoverEventsList;
