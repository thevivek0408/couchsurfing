import { Container, styled } from "@mui/material";
import { DASHBOARD } from "i18n/namespaces";
import Image from "next/image";
import { useTranslation } from "next-i18next";

import HeroButton from "./HeroButton";
import HeroImageAttribution from "./HeroImageAttribution";
import HeroLinks from "./HeroLinks";
import HeroSearch from "./HeroSearch";
// Photo by Mesut Kaya on Unsplash - https://unsplash.com/photos/eOcyhe5-9sQ
import heroImage from "./mesut-kaya-eOcyhe5-9sQ-unsplash.jpeg";

const StyledContainer = styled(Container)(({ theme }) => ({
  zIndex: 1,
  position: "relative",
  display: "flex",
  flexDirection: "column",
  padding: theme.spacing(2, 2),

  [theme.breakpoints.up("sm")]: {
    padding: theme.spacing(4, 2),
  },
}));

const StyledOuterContainer = styled("div")(({ theme }) => ({
  position: "relative",
}));

export default function Hero() {
  const { t } = useTranslation(DASHBOARD);

  return (
    <StyledOuterContainer>
      <StyledContainer maxWidth="md">
        <HeroLinks />
        <HeroSearch />
        <HeroButton />
      </StyledContainer>
      <HeroImageAttribution />
      <Image
        src={heroImage}
        placeholder="blur"
        alt={t("hero_image_alt")}
        fill
        sizes="100vw"
        style={{
          objectFit: "cover",
          objectPosition: "50% 50%",
        }}
      />
    </StyledOuterContainer>
  );
}
