import {
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Radio,
  RadioGroup,
  Typography,
} from "@mui/material";
import makeStyles from "@mui/styles/makeStyles";
import classNames from "classnames";
import Alert from "components/Alert";
import Button from "components/Button";
import StyledLink from "components/StyledLink";
import {
  DONATIONSBOX_CURRENCY,
  DONATIONSBOX_VALUES,
} from "features/donations/constants";
import { RpcError } from "grpc-web";
import { Trans, useTranslation } from "i18n";
import { DONATIONS } from "i18n/namespaces";
import { useRouter } from "next/router";
import { useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useMutation } from "react-query";
import { service } from "service";

const useStyles = makeStyles((theme) => ({
  donationsBox: {
    padding: theme.spacing(2),
    border: `2px solid ${theme.palette.grey[200]}`,
    borderRadius: theme.shape.borderRadius * 2,
  },

  donationsBoxRow: {
    gridTemplateColumns: "repeat( auto-fit, minmax(160px, 1fr) )",
    gridAutoRows: "2.75rem",
    display: "grid",
    gap: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },

  donationsBoxSubRow: {
    gridTemplateColumns: "repeat( auto-fit, minmax(72px, 1fr) )",
    display: "grid",
    gap: theme.spacing(2),
  },

  buttonSecondary: {
    "&&": {
      boxShadow: "initial",
      color: theme.palette.grey[600],
      cursor: "pointer",
      fontWeight: 700,
      fontSize: theme.typography.button.fontSize,
      transition: `color ${theme.transitions.duration.short}ms ${theme.transitions.easing.easeInOut}`,
      justifyContent: "center",
      alignItems: "center",
      border: `2px solid ${theme.palette.grey[200]}`,
      borderRadius: "0.5rem",
      backgroundColor: theme.palette.grey[200],
      margin: "initial",
      height: "100%",
      width: "100%",
      display: "flex",
    },

    "&:hover": {
      border: `2px solid ${theme.palette.primary.main}`,
      backgroundColor: theme.palette.background.paper,
      color: theme.palette.primary.main,
      transition: `color ${theme.transitions.duration.short}ms ${theme.transitions.easing.easeInOut}`,
    },
  },

  buttonSecondaryRadio: {
    "&&": {
      boxShadow: "initial",
      margin: 0,
    },
    "&:hover > .MuiFormControlLabel-label": {
      border: `2px solid ${theme.palette.primary.main}`,
      backgroundColor: theme.palette.background.paper,
      color: theme.palette.primary.main,
      transition: `color ${theme.transitions.duration.short}ms ${theme.transitions.easing.easeInOut}`,
    },
    "& > .MuiRadio-root": {
      position: "absolute",
      left: "-10000px",
    },
    "& > .MuiFormControlLabel-label": {
      color: theme.palette.grey[600],
      fontWeight: 700,
      fontSize: theme.typography.button.fontSize,
      transition: `color ${theme.transitions.duration.short}ms ${theme.transitions.easing.easeInOut}`,
      justifyContent: "center",
      alignItems: "center",
      border: `2px solid ${theme.palette.grey[200]}`,
      borderRadius: "0.5rem",
      backgroundColor: theme.palette.grey[200],
      margin: "initial",
      height: "100%",
      width: "100%",
      display: "flex",
    },
    "& > .Mui-checked ~.MuiFormControlLabel-label": {
      border: `2px solid ${theme.palette.primary.main}`,
      backgroundColor: theme.palette.background.paper,
    },
  },

  buttonSecondaryActive: {
    "&&": {
      border: `2px solid ${theme.palette.primary.main}`,
      backgroundColor: theme.palette.background.paper,
    },
  },

  buttonMain: {
    backgroundColor: theme.palette.primary.main,
    "&&": {
      borderRadius: "0.5rem",
      boxShadow: "initial",
    },
    "&:hover": {
      opacity: 0.4,
      backgroundColor: theme.palette.primary.main,
    },
    "& .MuiButton-label": {
      color: theme.palette.background.paper,
      transition: `color ${theme.transitions.duration.short}ms ${theme.transitions.easing.easeInOut}`,
    },
  },

  buttonMainText: {
    color: theme.palette.background.paper,
    fontWeight: 700,
    transition: `color ${theme.transitions.duration.short}ms ${theme.transitions.easing.easeInOut}`,
  },

  formGroup: {
    width: "100%",
  },

  marginY2: {
    margin: theme.spacing(2, 0),
  },

  marginBottom2: {
    marginBottom: theme.spacing(2),
  },

  inputWrapper: {
    position: "relative",
    "&::before": {
      content: `'${DONATIONSBOX_CURRENCY}'`,
      position: "absolute",
      top: "50%",
      transform: "translateY(-50%)",
      left: theme.spacing(1),
      color: theme.palette.grey[600],
      fontWeight: 700,
      fontSize: theme.typography.button.fontSize,
    },
  },

  inputNumber: {
    width: "100%",
    height: "100%",
    border: `2px solid ${theme.palette.grey[200]}`,
    paddingLeft: theme.spacing(2),
    color: theme.palette.grey[600],
    fontWeight: 700,
    fontSize: theme.typography.button.fontSize,
    "&&": {
      borderRadius: theme.shape.borderRadius * 2,
      boxShadow: "initial",
    },
    "&:hover": {
      border: `2px solid ${theme.palette.primary.main}`,
    },
    "&:focus-visible": {
      border: `2px solid ${theme.palette.primary.main}`,
      outline: "none",
      boxShadow: "none",
    },
  },

  inputNumberActive: {
    "&&": {
      border: `2px solid ${theme.palette.primary.main}`,
    },
  },
}));

export interface DonationFormData {
  amount: number;
  recurring: "monthly" | "one-off";
}

export default function DonationsBox() {
  const { t } = useTranslation(DONATIONS);
  const stripePromise = useMemo(async () => {
    const stripe = await import("@stripe/stripe-js");
    return stripe.loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY);
  }, []);

  const classes = useStyles();

  const [isPredefinedAmount, setisPredefinedAmount] = useState(true);

  const router = useRouter();
  const [success] = useState(!!router.query["success"]);
  const [cancelled] = useState(!!router.query["cancelled"]);

  const {
    control,
    handleSubmit,
    reset: resetForm,
    formState: { errors },
  } = useForm<DonationFormData>();

  const customAmountInput = useRef<HTMLInputElement>(null);

  const checkForValidAmount = (amount: number) => {
    if (!Number.isInteger(amount)) return false;
    if (amount < 1) return false;
    return true;
  };

  const {
    error,
    isLoading,
    mutate: initiateDonation,
  } = useMutation<void, RpcError, DonationFormData>(
    async ({ amount, recurring }) => {
      if (!checkForValidAmount(amount)) {
        throw Error(t("donations_box.amount_validation_error"));
      }
      const stripe = (await stripePromise)!;
      const session_id = await service.donations.initiateDonation(
        amount,
        recurring === "monthly",
      );
      // When the customer clicks on the button, redirect them to Checkout.
      const result = await stripe.redirectToCheckout({
        sessionId: session_id,
      });
      if (result.error) {
        throw Error(result.error.message);
      }
    },
    {
      onSuccess: () => {
        resetForm();
      },
    },
  );

  const onSubmit = handleSubmit((data) => {
    initiateDonation(data);
  });

  const handleDonationAmountClick =
    ({
      amount,
      onChange,
    }: {
      amount: number;
      onChange: (...event: unknown[]) => void;
    }) =>
    () => {
      if (customAmountInput.current) customAmountInput.current.value = "";
      onChange(amount);
      setisPredefinedAmount(true);
    };

  const formatDonationValue = (val: number) =>
    new Intl.NumberFormat("en-US", {
      currency: "USD",
      minimumFractionDigits: 0,
      style: "currency",
    }).format(val);

  return (
    <>
      <form onSubmit={onSubmit} className={classes.donationsBox}>
        {error && <Alert severity="error">{error.message}</Alert>}
        {success && (
          <Alert severity="success">
            {t("donations_box.alert.success_message")}
          </Alert>
        )}
        {cancelled && (
          <Alert severity="warning">
            {t("donations_box.alert.warning_message")}
          </Alert>
        )}
        <Typography className={classes.marginBottom2} variant="h3">
          {t("donations_box.title")}
        </Typography>
        <Controller
          control={control}
          name="recurring"
          rules={{
            required: t("donations_box.validation_message"),
          }}
          defaultValue="monthly"
          render={({ field }) => (
            <FormControl variant="standard" className={classes.formGroup}>
              <RadioGroup
                {...field}
                id="recurring"
                className={classes.donationsBoxRow}
                aria-label={t("donations_box.recurrence_aria_label")}
                name="recurring-radio"
                onChange={(e, value) => field.onChange(value)}
                value={field.value}
              >
                <FormControlLabel
                  className={classes.buttonSecondaryRadio}
                  value="monthly"
                  control={<Radio />}
                  label={t("donations_box.monthly_button_label")}
                />
                <FormControlLabel
                  className={classes.buttonSecondaryRadio}
                  value="one-time"
                  control={<Radio />}
                  label={t("donations_box.one_time_button_label")}
                />
              </RadioGroup>
              <FormHelperText error={!!errors?.recurring?.message}>
                {errors?.recurring?.message}
              </FormHelperText>
            </FormControl>
          )}
        />
        <Typography variant="body2" gutterBottom>
          {t("donations_recurrence_explainer")}
        </Typography>

        <Divider className={classes.marginY2} />

        <Controller
          name="amount"
          control={control}
          defaultValue={DONATIONSBOX_VALUES[2]}
          render={({ field }) => (
            <div className={classes.donationsBoxRow}>
              <div className={classes.donationsBoxSubRow}>
                <button
                  type="button"
                  onClick={handleDonationAmountClick({
                    amount: DONATIONSBOX_VALUES[0],
                    onChange: field.onChange,
                  })}
                  className={classNames(classes.buttonSecondary, {
                    [classes.buttonSecondaryActive]:
                      field.value === DONATIONSBOX_VALUES[0] &&
                      isPredefinedAmount,
                  })}
                >
                  {formatDonationValue(DONATIONSBOX_VALUES[0])}
                </button>
                <button
                  type="button"
                  onClick={handleDonationAmountClick({
                    amount: DONATIONSBOX_VALUES[1],
                    onChange: field.onChange,
                  })}
                  className={classNames(classes.buttonSecondary, {
                    [classes.buttonSecondaryActive]:
                      field.value === DONATIONSBOX_VALUES[1] &&
                      isPredefinedAmount,
                  })}
                >
                  {formatDonationValue(DONATIONSBOX_VALUES[1])}
                </button>
              </div>

              <div className={classes.donationsBoxSubRow}>
                <button
                  type="button"
                  onClick={handleDonationAmountClick({
                    amount: DONATIONSBOX_VALUES[2],
                    onChange: field.onChange,
                  })}
                  className={classNames(classes.buttonSecondary, {
                    [classes.buttonSecondaryActive]:
                      field.value === DONATIONSBOX_VALUES[2] &&
                      isPredefinedAmount,
                  })}
                >
                  {formatDonationValue(DONATIONSBOX_VALUES[2])}
                </button>
                <button
                  type="button"
                  onClick={handleDonationAmountClick({
                    amount: DONATIONSBOX_VALUES[3],
                    onChange: field.onChange,
                  })}
                  className={classNames(classes.buttonSecondary, {
                    [classes.buttonSecondaryActive]:
                      field.value === DONATIONSBOX_VALUES[3] &&
                      isPredefinedAmount,
                  })}
                >
                  {formatDonationValue(DONATIONSBOX_VALUES[3])}
                </button>
              </div>

              <div className={classes.donationsBoxSubRow}>
                <button
                  type="button"
                  onClick={handleDonationAmountClick({
                    amount: DONATIONSBOX_VALUES[4],
                    onChange: field.onChange,
                  })}
                  className={classNames(classes.buttonSecondary, {
                    [classes.buttonSecondaryActive]:
                      field.value === DONATIONSBOX_VALUES[4] &&
                      isPredefinedAmount,
                  })}
                >
                  {formatDonationValue(DONATIONSBOX_VALUES[4])}
                </button>
                <button
                  type="button"
                  onClick={handleDonationAmountClick({
                    amount: DONATIONSBOX_VALUES[5],
                    onChange: field.onChange,
                  })}
                  className={classNames(classes.buttonSecondary, {
                    [classes.buttonSecondaryActive]:
                      field.value === DONATIONSBOX_VALUES[5] &&
                      isPredefinedAmount,
                  })}
                >
                  {formatDonationValue(DONATIONSBOX_VALUES[5])}
                </button>
              </div>

              <div className={classes.donationsBoxRow}>
                <div className={classes.donationsBoxSubRow}>
                  <button
                    type="button"
                    onClick={handleDonationAmountClick({
                      amount: DONATIONSBOX_VALUES[6],
                      onChange: field.onChange,
                    })}
                    className={classNames(classes.buttonSecondary, {
                      [classes.buttonSecondaryActive]:
                        field.value === DONATIONSBOX_VALUES[6] &&
                        isPredefinedAmount,
                    })}
                  >
                    {formatDonationValue(DONATIONSBOX_VALUES[6])}
                  </button>
                  <div className={classes.inputWrapper}>
                    <input
                      {...field}
                      value={Number(field.value)}
                      ref={customAmountInput}
                      type="number"
                      min="1"
                      onChange={(e) => {
                        field.onChange(
                          typeof e.target.valueAsNumber === "number"
                            ? e.target.valueAsNumber
                            : DONATIONSBOX_VALUES[0],
                        );
                        setisPredefinedAmount(false);
                      }}
                      className={classNames(classes.inputNumber, {
                        [classes.inputNumberActive]: !isPredefinedAmount,
                      })}
                      id="amount"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        />

        <Typography variant="body2" paragraph>
          <Trans t={t} i18nKey="donations_box.helper_text">
            You will be redirected to Stripe, our payment processor, to complete
            your donation. To cancel or update an existing donation at any time,{" "}
            <StyledLink
              href="#"
              onClick={async (e) => {
                e.preventDefault();
                router.push(await service.donations.getDonationPortalLink());
              }}
            >
              click here to go to the donation portal
            </StyledLink>
            .{t("donations_box.helper_text")}
          </Trans>
        </Typography>

        <div className={classes.donationsBoxRow}>
          <Button
            type="submit"
            loading={isLoading}
            onClick={onSubmit}
            classes={{
              root: classes.buttonMain,
              label: classes.buttonMainText,
            }}
          >
            {t("donations_box.action_button_label")}
          </Button>
        </div>
      </form>
    </>
  );
}
