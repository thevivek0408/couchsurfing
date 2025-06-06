import Alert from "components/Alert";
import Button from "components/Button";
import HtmlMeta from "components/HtmlMeta";
import PageTitle from "components/PageTitle";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { AUTH, GLOBAL } from "i18n/namespaces";
import { useRouter } from "next/router";
import { UnsubscribeRes } from "proto/auth_pb";
import { useMutation } from "react-query";
import { service } from "service";
import stringOrFirstString from "utils/stringOrFirstString";

export interface UnsubscribeParams {
  payload?: string;
  sig?: string;
}

export default function Unsubscribe() {
  const { t } = useTranslation([AUTH, GLOBAL]);

  const router = useRouter();
  const payload = stringOrFirstString(router.query.payload);
  const sig = stringOrFirstString(router.query.sig);

  const {
    data,
    error,
    isLoading,
    isSuccess,
    mutate: unsubscribe,
  } = useMutation<UnsubscribeRes.AsObject, RpcError, UnsubscribeParams>(
    async ({ payload, sig }) => {
      if (payload === undefined || sig === undefined) {
        throw Error(t("auth:unsubscribe.missing_payload_or_sig"));
      }
      return await service.auth.unsubscribe(payload, sig);
    },
  );

  return (
    <>
      <HtmlMeta title={t("auth:unsubscribe.title")} />
      <PageTitle>{t("auth:unsubscribe.title")}</PageTitle>
      {error && (
        <Alert severity="error">
          {t("auth:unsubscribe.error_message", {
            message: error.message,
          })}
        </Alert>
      )}
      {isSuccess && <Alert severity="success">{data!.response}</Alert>}
      <Button onClick={() => unsubscribe({ payload, sig })} loading={isLoading}>
        {t("auth:unsubscribe.button_text")}
      </Button>
    </>
  );
}
