import {
  Card,
  Chip,
  darken,
  Link as MuiLink,
  Theme,
  Typography,
} from "@mui/material";
import { eventImagePlaceholderUrl } from "appConstants";
import Alert from "components/Alert";
import Button from "components/Button";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import HeaderButton from "components/HeaderButton";
import HtmlMeta from "components/HtmlMeta";
import { BackIcon, CalendarIcon } from "components/Icons";
import Markdown from "components/Markdown";
import Snackbar from "components/Snackbar";
import NotFoundPage from "features/NotFoundPage";
import { eventAttendeesBaseKey, eventKey } from "features/queryKeys";
import { Timestamp } from "google-protobuf/google/protobuf/timestamp_pb";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { COMMUNITIES } from "i18n/namespaces";
import Link from "next/link";
import { useRouter } from "next/router";
import { AttendanceState, Event } from "proto/events_pb";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "react-query";
import { routeToEditEvent, routeToEvent } from "routes";
import { service } from "service";
import { theme } from "theme";
import { timestamp2Date } from "utils/date";
import dayjs from "utils/dayjs";
import makeStyles from "utils/makeStyles";

import CommentTree from "../discussions/CommentTree";
import AttendanceMenu from "./AttendanceMenu";
import CancelEventDialog from "./CancelEventDialog";
import EventAttendees from "./EventAttendees";
import EventOrganizers from "./EventOrganizers";
import { useEvent } from "./hooks";
import InviteCommunityDialog from "./InviteCommunityDialog";

export const useEventPageStyles = makeStyles<Theme, { eventImageSrc: string }>(
  (theme) => ({
    eventCoverPhoto: {
      height: 100,
      [theme.breakpoints.up("md")]: {
        height: 200,
      },
      width: "100%",
      objectFit: ({ eventImageSrc }) =>
        eventImageSrc === eventImagePlaceholderUrl ? "contain" : "cover",
      marginBlockStart: theme.spacing(2),
    },
    header: {
      alignItems: "center",
      gap: theme.spacing(2, 2),
      display: "grid",
      gridTemplateAreas: `
      "backButton eventTitle eventTitle"
      "eventTime eventTime eventTime"
      "actionButtons actionButtons ."
    `,
      gridAutoFlow: "column",
      gridTemplateColumns: "3.125rem 1fr auto",
      marginBlockEnd: theme.spacing(4),
      marginBlockStart: theme.spacing(2),
      [theme.breakpoints.up("sm")]: {
        gridTemplateAreas: `
      "backButton eventTitle actionButtons"
      ". eventTime eventTime"
    `,
      },
    },
    backButton: {
      gridArea: "backButton",
      width: "3.125rem",
      height: "3.125rem",
    },
    eventTitle: {
      gridArea: "eventTitle",
    },
    onlineInfoContainer: {
      display: "grid",
      columnGap: theme.spacing(2),
      gridAutoFlow: "column",
      gridTemplateColumns: "max-content max-content",
    },
    actionButtons: {
      display: "grid",
      gridAutoFlow: "column",
      columnGap: theme.spacing(1),
      gridArea: "actionButtons",
      justifySelf: "start",
    },
    cancelButton: {
      flexShrink: 0,
      "&:hover": {
        backgroundColor: darken(theme.palette.error.main, 0.1),
      },
      backgroundColor: theme.palette.error.main,
    },
    cancelledChip: {
      backgroundColor: theme.palette.error.main,
      color: theme.palette.common.white,
      fontWeight: "bold",
    },
    eventTypeText: {
      color: theme.palette.grey[600],
    },
    eventTimeContainer: {
      alignItems: "center",
      gridArea: "eventTime",
      display: "grid",
      columnGap: theme.spacing(1),
      gridTemplateColumns: "3.75rem auto",
      [theme.breakpoints.up("md")]: {
        gridTemplateColumns: "3.75rem 30%",
      },
    },
    calendarIcon: {
      marginInlineStart: theme.spacing(-0.5),
      height: "3.75rem",
      width: "3.75rem",
    },
    eventDetailsContainer: {
      display: "grid",
      rowGap: theme.spacing(3),
      marginBlockEnd: theme.spacing(5),
    },
    cardSection: {
      padding: theme.spacing(2),
      "& + &": {
        marginBlockStart: theme.spacing(3),
      },
    },
    discussionContainer: {
      marginBlockEnd: theme.spacing(5),
    },
  }),
);

function getEventTimeString(
  startTime: Timestamp.AsObject,
  endTime: Timestamp.AsObject,
) {
  const start = dayjs(timestamp2Date(startTime));
  const end = dayjs(timestamp2Date(endTime));

  return `${start.format("LLLL")} to ${end.format(
    end.isSame(start, "day") ? "LT" : "LLLL",
  )}`;
}

export default function EventPage({
  eventId,
  eventSlug,
}: {
  eventId: number;
  eventSlug: string;
}) {
  const { t } = useTranslation([COMMUNITIES]);
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    data: event,
    error: eventError,
    isLoading,
    isValidEventId,
  } = useEvent({ eventId });

  const {
    isLoading: isSetEventAttendanceLoading,
    error: setEventAttendanceError,
    mutate: setEventAttendance,
  } = useMutation<Event.AsObject, RpcError, AttendanceState>(
    (newEventAttendance: AttendanceState) => {
      return service.events.setEventAttendance({
        attendanceState: newEventAttendance,
        eventId,
      });
    },
    {
      onSuccess(updatedEvent) {
        queryClient.setQueryData<Event.AsObject>(
          eventKey(eventId),
          updatedEvent,
        );
        queryClient.invalidateQueries(eventKey(eventId), {
          refetchActive: false,
        });
        queryClient.invalidateQueries([eventAttendeesBaseKey, eventId]);
      },
    },
  );

  const [cancelDialogIsOpen, setCancelDialogIsOpen] = useState(false);
  const [showInviteCommunitySuccess, setShowInviteCommunitySuccess] =
    useState(false);
  const [inviteCommunityDialogIsOpen, setInviteCommunityDialogIsOpen] =
    useState(false);

  const isPastEvent = event?.endTime
    ? dayjs().isAfter(timestamp2Date(event.endTime))
    : false;

  useEffect(() => {
    if (event?.slug && event.slug !== eventSlug) {
      router.replace(routeToEvent(event.eventId, event.slug));
    }
  }, [event, eventSlug, router]);

  const classes = useEventPageStyles({
    eventImageSrc: event?.photoUrl || eventImagePlaceholderUrl,
  });

  if (!isValidEventId) {
    return <NotFoundPage />;
  }

  return (
    <>
      <HtmlMeta title={event?.title} />
      {(eventError || setEventAttendanceError) && (
        <Alert severity="error">
          {eventError?.message || setEventAttendanceError?.message || ""}
        </Alert>
      )}
      {showInviteCommunitySuccess && (
        <Snackbar severity="success">
          {t("communities:invite_community_dialog.toast_success")}
        </Snackbar>
      )}
      {isLoading ? (
        <CenteredSpinner />
      ) : (
        event && (
          <>
            <img
              className={classes.eventCoverPhoto}
              src={event.photoUrl || eventImagePlaceholderUrl}
              alt=""
              data-testid="event-cover-photo"
            />
            <div className={classes.header}>
              <HeaderButton
                className={classes.backButton}
                onClick={() => router.back()}
                aria-label={t("communities:previous_page")}
              >
                <BackIcon />
              </HeaderButton>
              <div className={classes.eventTitle}>
                <Typography variant="h1">{event.title}</Typography>
                {event.onlineInformation ? (
                  <div className={classes.onlineInfoContainer}>
                    <Typography
                      className={classes.eventTypeText}
                      variant="body1"
                    >
                      {t("communities:virtual_event")}
                    </Typography>
                    <MuiLink
                      href={event.onlineInformation.link}
                      underline="hover"
                    >
                      {t("communities:event_link")}
                    </MuiLink>
                  </div>
                ) : (
                  <Typography className={classes.eventTypeText} variant="body1">
                    {event.offlineInformation?.address}
                  </Typography>
                )}
                {event.isCancelled && (
                  <Chip
                    classes={{ root: classes.cancelledChip }}
                    label={t("communities:cancelled")}
                  />
                )}
              </div>
              <div className={classes.actionButtons}>
                {event.canEdit ? (
                  <>
                    <Link
                      href={routeToEditEvent(event.eventId, event.slug)}
                      passHref
                      legacyBehavior
                    >
                      <Button
                        component="a"
                        variant="outlined"
                        disabled={event.isCancelled || isPastEvent}
                        sx={{
                          color: theme.palette.common.black,
                          borderColor: theme.palette.grey[300],

                          "&:hover": {
                            borderColor: theme.palette.grey[300],
                            backgroundColor: "#3135390A",
                          },
                        }}
                      >
                        {t("communities:edit_event")}
                      </Button>
                    </Link>
                    <Button
                      onClick={() => setCancelDialogIsOpen(true)}
                      variant="contained"
                      color="primary"
                      classes={{ containedPrimary: classes.cancelButton }}
                      disabled={event.isCancelled || isPastEvent}
                    >
                      {t("communities:cancel_event")}
                    </Button>
                    <CancelEventDialog
                      open={cancelDialogIsOpen}
                      onClose={() => setCancelDialogIsOpen(false)}
                      eventId={eventId}
                    />
                    <Button
                      onClick={() => setInviteCommunityDialogIsOpen(true)}
                      variant="contained"
                      color="secondary"
                      disabled={event.isCancelled || isPastEvent}
                    >
                      {t("communities:invite_community_dialog_buttons.open")}
                    </Button>
                    <InviteCommunityDialog
                      afterSuccess={() => setShowInviteCommunitySuccess(true)}
                      open={inviteCommunityDialogIsOpen}
                      onClose={() => setInviteCommunityDialogIsOpen(false)}
                      eventId={eventId}
                    />
                  </>
                ) : null}

                <AttendanceMenu
                  loading={isSetEventAttendanceLoading}
                  onChangeAttendanceState={(attendanceState) =>
                    setEventAttendance(attendanceState)
                  }
                  attendanceState={event.attendanceState}
                  id="event-page-attendance"
                  disabled={event.isCancelled || isPastEvent}
                />
              </div>

              <div className={classes.eventTimeContainer}>
                <CalendarIcon className={classes.calendarIcon} />
                <Typography variant="body1">
                  {getEventTimeString(event.startTime!, event.endTime!)}
                </Typography>
              </div>
            </div>
            <div className={classes.eventDetailsContainer}>
              <Card className={classes.cardSection}>
                <Typography variant="h2">
                  {t("communities:details_subheading_colon")}
                </Typography>
                {/* @ts-ignore @TODO until we sort out the Markdown thing*/}
                <Markdown source={event.content} topHeaderLevel={3} />
              </Card>
              <EventOrganizers eventId={event.eventId} />
              <EventAttendees eventId={event.eventId} />
            </div>
            <div className={classes.discussionContainer}>
              <Typography variant="h2">
                {t("communities:event_discussion")}
              </Typography>
              <CommentTree threadId={event.thread!.threadId} />
            </div>
          </>
        )
      )}
    </>
  );
}
