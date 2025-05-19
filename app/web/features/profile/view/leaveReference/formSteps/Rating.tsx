import { Typography, useMediaQuery, useTheme } from "@mui/material";
import Alert from "components/Alert";
import Button from "components/Button";
import Markdown from "components/Markdown";
import RatingsSlider from "components/RatingsSlider/RatingsSlider";
import TextBody from "components/TextBody";
import { useProfileUser } from "features/profile/hooks/useProfileUser";
import ReferenceStepHeader from "features/profile/view/leaveReference/formSteps/ReferenceStepHeader";
import {
  ReferenceContextFormData,
  ReferenceStepProps,
  useReferenceStyles,
} from "features/profile/view/leaveReference/ReferenceForm";
import { useTranslation } from "i18n";
import { GLOBAL, PROFILE } from "i18n/namespaces";
import { useRouter } from "next/router";
import { ReferenceType } from "proto/references_pb";
import { Controller, useForm } from "react-hook-form";
import {
  leaveReferenceBaseRoute,
  referenceStepStrings,
  referenceTypeRoute,
} from "routes";

export default function Rating({
  referenceData,
  setReferenceValues,
  referenceType,
  hostRequestId,
}: ReferenceStepProps) {
  const { t } = useTranslation([PROFILE, GLOBAL]);
  const user = useProfileUser();
  const router = useRouter();
  const classes = useReferenceStyles();
  const theme = useTheme();
  const isSmOrWider = useMediaQuery(theme.breakpoints.up("sm"));
  const {
    control,
    handleSubmit,

    formState: { errors },
  } = useForm<ReferenceContextFormData>({
    defaultValues: {
      rating: referenceData.rating,
    },
  });

  const onSubmit = handleSubmit((values) => {
    setReferenceValues(values);
    if (
      referenceType === referenceTypeRoute[ReferenceType.REFERENCE_TYPE_FRIEND]
    ) {
      router.push(
        `${leaveReferenceBaseRoute}/${referenceType}/${user.userId}/${referenceStepStrings[2]}`,
      );
    } else {
      router.push(
        `${leaveReferenceBaseRoute}/${referenceType}/${user.userId}/${hostRequestId}/${referenceStepStrings[2]}`,
      );
    }
  });

  return (
    <form className={classes.form} onSubmit={onSubmit}>
      <ReferenceStepHeader name={user.name} referenceType={referenceType} />
      <Typography variant="h3">
        {t("profile:leave_reference.rating_how")}
      </Typography>
      <Markdown source={t("profile:leave_reference.rating_explanation")} />
      <TextBody className={classes.text}>
        {t("profile:leave_reference.private_answer")}
      </TextBody>
      {errors && errors.rating?.message && (
        <Alert className={classes.alert} severity="error">
          {errors.rating.message}
        </Alert>
      )}
      <Typography variant="h3" className={classes.text}>
        {t("profile:leave_reference.rating_question", { name: user.name })}
      </Typography>
      <Controller
        control={control}
        defaultValue={referenceData.rating}
        name="rating"
        render={({ field }) => (
          <RatingsSlider
            {...field}
            onChange={field.onChange}
            value={field.value}
          />
        )}
      />
      <div className={classes.buttonContainer}>
        <Button fullWidth={!isSmOrWider} type="submit">
          {t("profile:leave_reference.next_step_label")}
        </Button>
      </div>
    </form>
  );
}
