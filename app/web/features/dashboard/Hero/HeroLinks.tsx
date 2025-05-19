import { StyledEngineProvider, ThemeProvider, Typography } from "@mui/material";
import classNames from "classnames";
import StyledLink from "components/StyledLink";
import { DASHBOARD } from "i18n/namespaces";
import { useTranslation } from "next-i18next";
import { routeToEditProfile } from "routes";
import makeStyles from "utils/makeStyles";

import useHeroBackgroundTheme from "./useHeroBackgroundTheme";

const useStyles = makeStyles((theme) => ({
  linksContainer: {
    display: "flex",
    flexWrap: "wrap",
    rowGap: theme.spacing(2),
    columnGap: theme.spacing(4),
    justifyContent: "center",
    margin: theme.spacing(4, 0),
  },
  tabAppearance: {
    position: "relative",
    paddingBottom: theme.spacing(1),
    "&::after": {
      content: '""',
      position: "absolute",
      bottom: 0,
      left: "50%",
      transform: "translateX(-50%)",
      width: 40,
      height: 2,
      background: theme.palette.common.white,
      transition: `opacity ${theme.transitions.duration.short}ms ${theme.transitions.easing.easeInOut}`,
      opacity: 0,
    },
    "&:hover::after": {
      opacity: 1,
    },
  },
  selectedTabAppearance: {
    "&::after": {
      opacity: 1,
    },
  },
}));

export default function HeroLinks() {
  const { t } = useTranslation(DASHBOARD);
  const classes = useStyles();

  // because this component is over an image background, we need to use a theme that overrides some styles
  const imageOverlayTheme = useHeroBackgroundTheme();

  return (
    <>
      <div className={classes.linksContainer}>
        <StyledEngineProvider injectFirst>
          <ThemeProvider theme={imageOverlayTheme}>
            <Typography
              color="textPrimary"
              variant="body1"
              className={classNames(
                classes.tabAppearance,
                classes.selectedTabAppearance,
              )}
            >
              {t("find_a_host")}
            </Typography>

            <StyledLink
              underline="none"
              href={routeToEditProfile("home")}
              className={classes.tabAppearance}
            >
              {t("become_a_host")}
            </StyledLink>

            <StyledLink
              underline="none"
              href="/communities"
              className={classes.tabAppearance}
            >
              {t("browse_communities")}
            </StyledLink>
          </ThemeProvider>
        </StyledEngineProvider>
      </div>
    </>
  );
}
