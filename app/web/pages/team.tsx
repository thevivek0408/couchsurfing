import { appGetLayout } from "components/AppRoute";
import Team from "features/team/Team";
import { AUTH, GLOBAL, NOTIFICATIONS } from "i18n/namespaces";
import { GetStaticProps } from "next";
import nextI18NextConfig from "next-i18next.config";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? "en",
      [GLOBAL, AUTH, NOTIFICATIONS],
      nextI18NextConfig,
    )),
  },
});

export default function TeamPage() {
  return <Team />;
}

TeamPage.getLayout = appGetLayout({
  isPrivate: false,
});
