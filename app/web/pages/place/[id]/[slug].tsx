import { appGetLayout } from "components/AppRoute";
import PagePageComponent from "features/communities/PagePage";
import NotFoundPage from "features/NotFoundPage";
import { GLOBAL, NOTIFICATIONS } from "i18n/namespaces";
import { GetStaticPaths, GetStaticProps } from "next";
import { useRouter } from "next/router";
import nextI18NextConfig from "next-i18next.config";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { PageType } from "proto/pages_pb";
import stringOrFirstString from "utils/stringOrFirstString";

export const getStaticPaths: GetStaticPaths = () => ({
  paths: [],
  fallback: "blocking",
});

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? "en",
      [GLOBAL, NOTIFICATIONS],
      nextI18NextConfig,
    )),
  },
});
export default function PagePage() {
  const router = useRouter();

  if (!process.env.NEXT_PUBLIC_IS_COMMUNITIES_PART2_ENABLED)
    return <NotFoundPage />;

  const parsedId = Number.parseInt(stringOrFirstString(router.query.id) ?? "");
  if (isNaN(parsedId)) return <NotFoundPage />;
  const slug = stringOrFirstString(router.query.slug);

  return (
    <PagePageComponent
      pageType={PageType.PAGE_TYPE_PLACE}
      pageId={parsedId}
      pageSlug={slug}
    />
  );
}

PagePage.getLayout = appGetLayout();
