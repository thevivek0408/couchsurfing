import { Tooltip } from "@mui/material";
import makeStyles from "@mui/styles/makeStyles";
import { CheckCircleIcon, ErrorIcon } from "components/Icons";
import LabelAndText from "components/LabelAndText";
import { useLanguages } from "features/profile/hooks/useLanguages";
import { useTranslation } from "i18n";
import { COMMUNITIES, GLOBAL, PROFILE } from "i18n/namespaces";
import {
  BirthdateVerificationStatus,
  GenderVerificationStatus,
  User,
} from "proto/api_pb";
import { monthFormatter, timestamp2Date } from "utils/date";
import dayjs from "utils/dayjs";
import { hourMillis, timeAgoI18n } from "utils/timeAgo";

interface Props {
  user: User.AsObject;
}

export const ReferencesLastActiveLabels = ({ user }: Props) => {
  const { t } = useTranslation(PROFILE);
  //workaround for not being able to type timeAgoI18n properly
  const { t: tGlobal } = useTranslation(GLOBAL);
  return (
    <>
      <LabelAndText
        label={t("heading.references")}
        text={`${user.numReferences || 0}`}
      />
      <LabelAndText
        label={t("heading.last_active")}
        text={
          user.lastActive
            ? timeAgoI18n({
                input: timestamp2Date(user.lastActive),
                t: tGlobal,
                fuzzy: {
                  millis: hourMillis,
                  translationKey: "relative_time.less_than_one_hour_ago",
                },
              })
            : t("last_active_false")
        }
      />
    </>
  );
};

export const ResponseRateText = ({ user }: { user: User.AsObject }) => {
  const { t } = useTranslation([PROFILE]);

  let rateText = undefined;

  if (user.insufficientData) {
    rateText = t("response_rate_text_insufficient");
  } else if (user.low) {
    rateText = t("response_rate_text_low");
  } else if (user.some) {
    rateText = t("response_rate_text_some");
  } else if (user.most) {
    rateText = t("response_rate_text_most");
  } else if (user.almostAll) {
    rateText = t("response_rate_text_almost_all");
  }

  return <>{rateText}</>;
};

export const ResponseRateLabel = ({ user }: Props) => {
  const { t } = useTranslation("profile");

  let rateText = undefined;
  let timeText = undefined;

  if (user.insufficientData) {
    rateText = t("response_rate_text_insufficient");
  } else if (user.low) {
    rateText = t("response_rate_text_low");
  } else if (user.some) {
    rateText = t("response_rate_text_some");
    timeText = t("response_time_text_some", {
      p33: dayjs
        .duration(user.some.responseTimeP33!.seconds, "second")
        .humanize(),
    });
  } else if (user.most) {
    rateText = t("response_rate_text_most");
    timeText = t("response_time_text_most", {
      p33: dayjs
        .duration(user.most.responseTimeP33!.seconds, "second")
        .humanize(),
      p66: dayjs
        .duration(user.most.responseTimeP66!.seconds, "second")
        .humanize(),
    });
  } else if (user.almostAll) {
    rateText = t("response_rate_text_almost_all");
    timeText = t("response_time_text_almost_all", {
      p33: dayjs
        .duration(user.almostAll.responseTimeP33!.seconds, "second")
        .humanize(),
      p66: dayjs
        .duration(user.almostAll.responseTimeP66!.seconds, "second")
        .humanize(),
    });
  }

  return (
    <>
      <LabelAndText label={t("response_rate_label")} text={rateText ?? ""} />
      {timeText && (
        <LabelAndText label={t("response_time_label")} text={timeText} />
      )}
    </>
  );
};

const useStyles = makeStyles((theme) => ({
  iconStyles: {
    margin: theme.spacing(0.5),
    alignSelf: "center",
  },
  container: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
  },
}));

export const AgeAndGenderRenderer = ({ user }: Props) => {
  const classes = useStyles();

  const {
    birthdateVerificationStatus,
    genderVerificationStatus,
    age,
    gender,
    pronouns,
  } = user;
  const { iconStyles } = useStyles();
  const { t } = useTranslation("profile");

  const getBirthdateVerificationIcon = (
    status: BirthdateVerificationStatus,
  ) => {
    switch (status) {
      case BirthdateVerificationStatus.BIRTHDATE_VERIFICATION_STATUS_VERIFIED:
        return (
          <Tooltip title={t("heading.age_verification_verified")}>
            <CheckCircleIcon
              color="primary"
              data-testid="check-circle-icon"
              className={iconStyles}
              fontSize="inherit"
            />
          </Tooltip>
        );
      case BirthdateVerificationStatus.BIRTHDATE_VERIFICATION_STATUS_MISMATCH:
        return (
          <Tooltip title={t("heading.age_verification_mismatch")}>
            <ErrorIcon
              color="error"
              data-testid="error-icon"
              className={iconStyles}
              fontSize="inherit"
            />
          </Tooltip>
        );
      default:
        return <>&nbsp;</>;
    }
  };

  const getGenderVerificationIcon = (status: GenderVerificationStatus) => {
    switch (status) {
      case GenderVerificationStatus.GENDER_VERIFICATION_STATUS_VERIFIED:
        return (
          <Tooltip title={t("heading.gender_verification_verified")}>
            <CheckCircleIcon
              color="primary"
              data-testid="check-circle-icon"
              className={iconStyles}
              fontSize="inherit"
            />
          </Tooltip>
        );
      case GenderVerificationStatus.GENDER_VERIFICATION_STATUS_MISMATCH:
        return (
          <Tooltip title={t("heading.gender_verification_mismatch")}>
            <ErrorIcon
              color="error"
              data-testid="error-icon"
              className={iconStyles}
              fontSize="inherit"
            />
          </Tooltip>
        );
      default:
        return <>&nbsp;</>;
    }
  };
  return (
    <div className={classes.container}>
      <span>{age}</span>
      {getBirthdateVerificationIcon(birthdateVerificationStatus)}
      <span>/&nbsp;</span>
      <span>{gender}</span>
      {getGenderVerificationIcon(genderVerificationStatus)}
      {pronouns && <span>({pronouns.replace(/\s+/g, "")})</span>}
    </div>
  );
};

export const AgeGenderLanguagesLabels = ({ user }: Props) => {
  const { t } = useTranslation("profile");
  const { languages } = useLanguages();

  return (
    <>
      <LabelAndText
        label={t("heading.age_gender")}
        text={<AgeAndGenderRenderer user={user} />}
      />
      {languages && (
        <LabelAndText
          label={t("heading.languages_fluent")}
          text={
            user.languageAbilitiesList
              .map((ability) => languages[ability.code])
              .join(", ") || t("languages_fluent_false")
          }
        />
      )}
    </>
  );
};

export const RemainingAboutLabels = ({ user }: Props) => {
  const {
    t,
    i18n: { language: locale },
  } = useTranslation([GLOBAL, COMMUNITIES, PROFILE]);
  return (
    <>
      <LabelAndText
        label={t("profile:heading.hometown")}
        text={user.hometown}
      />
      <LabelAndText
        label={t("profile:heading.occupation")}
        text={user.occupation}
      />
      <LabelAndText
        label={t("profile:heading.education")}
        text={user.education}
      />
      <LabelAndText
        label={t("profile:heading.joined")}
        text={
          user.joined
            ? monthFormatter(locale).format(timestamp2Date(user.joined))
            : ""
        }
      />
      <LabelAndText
        label={t("profile:heading.local_time")}
        text={dayjs().tz(user.timezone).format("LT")}
      />
    </>
  );
};
