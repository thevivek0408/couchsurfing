import { Typography } from "@mui/material";
import { Trans, useTranslation } from "i18n";
import { AUTH } from "i18n/namespaces";

interface UsernameProps {
  username: string;
  className?: string;
}

export default function Username({ className, username }: UsernameProps) {
  const { t } = useTranslation(AUTH);

  return (
    <div className={className}>
      <Typography variant="h2">
        {t("account_settings_page.username_section.title")}
      </Typography>
      <Typography variant="body1">
        <Trans
          t={t}
          i18nKey="account_settings_page.username_section.description"
          values={{ username }}
        >
          {`Your username is `}
          <strong>{username}</strong>
          {`.`}
        </Trans>
      </Typography>
      <Typography variant="body1">
        {t("account_settings_page.username_section.explanation")}
      </Typography>
    </div>
  );
}
