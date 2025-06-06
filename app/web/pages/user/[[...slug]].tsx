import { appGetLayout } from "components/AppRoute";
import NotFoundPage from "features/NotFoundPage";
import UserPageComponent from "features/profile/view/UserPage";
import {
  CONNECTIONS,
  DASHBOARD,
  GLOBAL,
  NOTIFICATIONS,
  PROFILE,
} from "i18n/namespaces";
import { GetStaticPaths, GetStaticProps } from "next";
import { useRouter } from "next/router";
import nextI18nextConfig from "next-i18next.config";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { userTabs } from "routes";
import stringOrFirstString from "utils/stringOrFirstString";

export const getStaticPaths: GetStaticPaths = () => ({
  paths: [],
  fallback: "blocking",
});

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? "en",
      [CONNECTIONS, DASHBOARD, GLOBAL, NOTIFICATIONS, PROFILE],
      nextI18nextConfig,
    )),
  },
});

export default function UserPage() {
  const router = useRouter();

  //first element of slug is the username
  const username = stringOrFirstString(router.query.slug);
  if (!username) return <NotFoundPage />;
  const tab = router.query.slug?.[1];
  let parsedTab = undefined;
  if (tab) {
    parsedTab = userTabs.find((valid) => tab === valid);
    if (!parsedTab) return <NotFoundPage />;
  }

  return <UserPageComponent username={username} tab={parsedTab} />;
}

UserPage.getLayout = appGetLayout();
