import "react-phone-number-input/style.css";

import { Typography, useMediaQuery, useTheme } from "@mui/material";
import Alert from "components/Alert";
import Button from "components/Button";
import StyledLink from "components/StyledLink";
import TextField from "components/TextField";
import { accountInfoQueryKey } from "features/queryKeys";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { RpcError } from "grpc-web";
import { AUTH } from "i18n/namespaces";
import luhn from "luhn";
import { Trans, useTranslation } from "next-i18next";
import { GetAccountInfoRes } from "proto/account_pb";
import { useForm } from "react-hook-form";
import {
  formatPhoneNumberIntl,
  isValidPhoneNumber,
} from "react-phone-number-input";
import PhoneInputWithCountry from "react-phone-number-input/react-hook-form";
import { useMutation, useQueryClient } from "react-query";
import { howToDonateUrl } from "routes";
import { service } from "service";

import useChangeDetailsFormStyles from "../useChangeDetailsFormStyles";

export const validatePhoneCode = (code: string) =>
  code.length == 6 && luhn.validate(code);

interface ChangePhoneFormData {
  phone: string;
}

interface VerifyPhoneFormData {
  code: string;
}

type ChangePhoneProps = {
  accountInfo: GetAccountInfoRes.AsObject;
  className?: string;
};

export default function ChangePhone({
  className,
  accountInfo,
}: ChangePhoneProps) {
  const { t } = useTranslation([AUTH]);
  const formClasses = useChangeDetailsFormStyles();
  const theme = useTheme();
  const isMdOrWider = useMediaQuery(theme.breakpoints.up("md"));
  const queryClient = useQueryClient();

  const {
    handleSubmit: changeHandleSubmit,
    reset: resetChangeForm,
    control,
  } = useForm<ChangePhoneFormData>();
  const onChangeSubmit = changeHandleSubmit(({ phone }) => {
    changePhone({ phone });
  });

  const {
    error: changeError,
    isLoading: isChangeLoading,
    isSuccess: isChangeSuccess,
    mutate: changePhone,
    reset: resetChange,
  } = useMutation<Empty, RpcError, ChangePhoneFormData>(
    ({ phone }) => service.account.changePhone(phone),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(accountInfoQueryKey);
        resetChangeForm();
        resetVerify();
        resetRemove();
      },
    },
  );

  const {
    handleSubmit: verifyHandleSubmit,
    register: verifyRegister,
    reset: resetVerifyForm,
    formState: { errors: verifyFormErrors },
  } = useForm<VerifyPhoneFormData>({ mode: "onBlur" });
  const onVerifySubmit = verifyHandleSubmit(({ code }) => {
    verifyPhone({ code });
  });

  const {
    error: verifyError,
    isLoading: isVerifyLoading,
    isSuccess: isVerifySuccess,
    mutate: verifyPhone,
    reset: resetVerify,
  } = useMutation<Empty, RpcError, VerifyPhoneFormData>(
    ({ code }) => service.account.verifyPhone(code),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(accountInfoQueryKey);
        resetVerifyForm();
        resetChange();
        resetRemove();
      },
    },
  );

  const {
    error: removeError,
    isLoading: isRemoveLoading,
    isSuccess: isRemoveSuccess,
    mutate: removePhone,
    reset: resetRemove,
  } = useMutation<Empty, RpcError>(service.account.removePhone, {
    onSuccess: () => {
      queryClient.invalidateQueries(accountInfoQueryKey);
      resetChangeForm();
      resetVerifyForm();
      resetChange();
      resetVerify();
    },
  });

  return (
    <div className={className}>
      <Typography variant="h2">{t("auth:change_phone.title")}</Typography>
      {changeError && <Alert severity="error">{changeError.message}</Alert>}
      {verifyError && <Alert severity="error">{verifyError.message}</Alert>}
      {removeError && <Alert severity="error">{removeError.message}</Alert>}
      {isChangeSuccess && (
        <Alert severity="success">{t("auth:change_phone.add_success")}</Alert>
      )}
      {isVerifySuccess && (
        <Alert severity="success">
          {t("auth:change_phone.verify_success")}
        </Alert>
      )}
      {isRemoveSuccess && (
        <Alert severity="success">
          {t("auth:change_phone.remove_success")}
        </Alert>
      )}
      {!accountInfo.phone ? (
        !accountInfo.hasDonated ? (
          <Typography variant="body1">
            <Trans
              i18nKey="auth:change_phone.need_to_donate"
              components={{
                2: <StyledLink href={howToDonateUrl} />,
              }}
            >
              You need to <StyledLink href={howToDonateUrl}>donate</StyledLink>
              before you can complete phone verification.
            </Trans>
          </Typography>
        ) : (
          <form className={formClasses.form} onSubmit={onChangeSubmit}>
            <Typography variant="body1">
              {t("auth:change_phone.no_phone_description")}
            </Typography>
            <PhoneInputWithCountry
              name="phone"
              control={control}
              rules={{
                validate: (value: string) => isValidPhoneNumber(value),
              }}
              international
              placeholder={t("auth:change_phone.phone_label")}
              id="phone"
            />
            <Button
              fullWidth={!isMdOrWider}
              loading={isChangeLoading}
              type="submit"
            >
              {t("auth:change_phone.add_button_text")}
            </Button>
          </form>
        )
      ) : (
        <>
          {!accountInfo.phoneVerified ? (
            <form className={formClasses.form} onSubmit={onVerifySubmit}>
              <Typography variant="body1">
                <Trans
                  t={t}
                  i18nKey="auth:change_phone.phone_not_verified_description"
                  values={{ phone: formatPhoneNumberIntl(accountInfo.phone) }}
                >
                  We sent you a code to{` `}
                  <b>{formatPhoneNumberIntl(accountInfo.phone)}</b>.
                  {`To verify your number, please enter the code below:`}
                </Trans>
              </Typography>
              <TextField
                id="code"
                {...verifyRegister("code", {
                  required: true,
                  validate: (code) =>
                    validatePhoneCode(code) ||
                    t("auth:change_phone.wrong_code"),
                })}
                helperText={verifyFormErrors?.code?.message ?? " "}
                error={!!verifyFormErrors?.code?.message}
                label={t("auth:change_phone.code_label")}
                fullWidth={!isMdOrWider}
              />
              <Button
                fullWidth={!isMdOrWider}
                loading={isVerifyLoading}
                type="submit"
              >
                {t("auth:change_phone.verify_button_text")}
              </Button>
            </form>
          ) : (
            <>
              <Typography variant="body1">
                <Trans
                  t={t}
                  i18nKey="auth:change_phone.remove_phone_description"
                  values={{ phone: formatPhoneNumberIntl(accountInfo.phone) }}
                >
                  Your phone number is currently{` `}
                  <b>{formatPhoneNumberIntl(accountInfo.phone)}</b>.
                  {` You can remove your phone number below, but you will loose
                  verification.`}
                </Trans>
              </Typography>
              <Button
                fullWidth={!isMdOrWider}
                loading={isRemoveLoading}
                onClick={() => removePhone()}
              >
                {t("auth:change_phone.remove_button_text")}
              </Button>
            </>
          )}
          <form className={formClasses.form} onSubmit={onChangeSubmit}>
            <Typography variant="body1">
              {t("auth:change_phone.change_to_different_description")}
            </Typography>
            <PhoneInputWithCountry
              name="phone"
              control={control}
              rules={{
                validate: (value: string) => isValidPhoneNumber(value),
              }}
              countrySelectProps={{ unicodeFlags: true }}
              international
              placeholder={t("auth:change_phone.phone_label")}
              id="phone"
            />
            <Button
              fullWidth={!isMdOrWider}
              loading={isChangeLoading}
              type="submit"
            >
              {t("auth:change_phone.change_button_text")}
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
