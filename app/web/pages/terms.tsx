import { appGetLayout } from "components/AppRoute";
import TOS from "components/TOS";
import { GLOBAL, NOTIFICATIONS } from "i18n/namespaces";
import { GetStaticProps } from "next";
import nextI18nextConfig from "next-i18next.config";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? "en",
      [GLOBAL, NOTIFICATIONS],
      nextI18nextConfig,
    )),
  },
});

export default function TOSPage() {
  return <TOS />;
}

TOSPage.getLayout = appGetLayout({
  isPrivate: false,
  variant: "full-screen",
});
