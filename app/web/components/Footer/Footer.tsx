import {
  Button,
  ButtonProps,
  Link as MuiLink,
  styled,
  Typography,
} from "@mui/material";
import { GithubIcon } from "components/Icons";
import StyledLink from "components/StyledLink";
import { Trans, useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";
import Link from "next/link";
import { ReactNode } from "react";
import {
  blogRoute,
  builtWithRoute,
  contactRoute,
  donationsRoute,
  eventsRoute,
  faqRoute,
  foundationRoute,
  githubUpdatesURL,
  githubURL,
  helpCenterURL,
  missionRoute,
  planRoute,
  roadmapRoute,
  teamRoute,
  tosRoute,
  volunteerRoute,
} from "routes";
import { theme } from "theme";
import { timeAgoI18n } from "utils/timeAgo";

const StyledFooter = styled("footer")({
  display: "flex",
  flexDirection: "column",
  width: "100%",
});

const StyledUpperOuterContainer = styled("div")(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  marginBlockStart: theme.spacing(2),
  paddingBlockStart: theme.spacing(3),
  paddingBlockEnd: theme.spacing(3),
  borderTop: `solid 1px ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
}));

const StyledUpperContainer = styled("div")(({ theme }) => ({
  width: "100%",
  display: "grid",
  rowGap: theme.spacing(1),
  columnGap: theme.spacing(1),
  gridTemplateColumns: "auto auto",
  maxWidth: theme.breakpoints.values.md,
  paddingInlineStart: theme.spacing(4),
  paddingInlineEnd: theme.spacing(4),

  [theme.breakpoints.up("sm")]: {
    gridTemplateColumns: "repeat(4, auto)",
    justifyItems: "center",
  },
  [theme.breakpoints.up("md")]: {
    gridTemplateColumns: "repeat(4, auto)",
    justifyContent: "center",
    columnGap: theme.spacing(8),
  },
}));

const StyledMiddleOuterContainer = styled("div")(({ theme }) => ({
  paddingBlockEnd: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
}));

const StyledMiddleContainer = styled("div")(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  margin: "0 auto",
  justifyContent: "center",
  fontStyle: "italic",
  color: theme.palette.grey[500],
  maxWidth: theme.breakpoints.values.md,
  paddingInlineStart: theme.spacing(4),
  paddingInlineEnd: theme.spacing(4),
}));

const StyledLowerOuterContainer = styled("div")(({ theme }) => ({
  paddingBlockStart: theme.spacing(2),
  paddingBlockEnd: theme.spacing(2),
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.getContrastText(theme.palette.primary.main),
}));

const StyledLowerContainer = styled("div")(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  margin: "0 auto",
  justifyContent: "center",
  maxWidth: theme.breakpoints.values.md,
  paddingInlineStart: theme.spacing(4),
  paddingInlineEnd: theme.spacing(4),

  "& > * + *": {
    marginInlineStart: theme.spacing(2),
  },
  "& > * + *::before": {
    content: "'|'",
    marginInlineEnd: theme.spacing(2),
  },
}));

const StyledButtonContainer = styled("div")({
  display: "flex",
  flexDirection: "column",
  justifySelf: "flex-start",
});

const StyledButton = styled(Button)<ButtonProps>(({ theme }) => ({
  minWidth: "8rem",
  textAlign: "center",
  marginBlockEnd: theme.spacing(2),
  [theme.breakpoints.up("sm")]: {
    minWidth: "12rem",
  },
  "& .MuiButton-label > * + *": {
    marginInlineStart: theme.spacing(1),
  },
}));

const VersionLink = styled(Link)(({ theme }) => ({
  fontWeight: 700,
}));

export default function Footer() {
  const { t } = useTranslation(GLOBAL);

  const version_text = process.env.NEXT_PUBLIC_DISPLAY_VERSION || "dev";
  const version_link = roadmapRoute;
  const updated_ago_text = process.env.NEXT_PUBLIC_COMMIT_TIMESTAMP
    ? timeAgoI18n({
        input: new Date(process.env.NEXT_PUBLIC_COMMIT_TIMESTAMP),
        t: t,
      })
    : "unknown";
  const updated_ago_link = githubUpdatesURL;

  return (
    <StyledFooter>
      <StyledLowerOuterContainer>
        <StyledLowerContainer>
          <Typography variant="body1">© 2025 Couchsurifing</Typography>
        </StyledLowerContainer>
      </StyledLowerOuterContainer>
    </StyledFooter>
  );
}

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  if (href.startsWith("http")) {
    return (
      <Typography variant="body1">
        <MuiLink
          href={href}
          color="textSecondary"
          target="_blank"
          rel="noopener"
          underline="hover"
        >
          {children}
        </MuiLink>
      </Typography>
    );
  }
  return (
    <Typography variant="body1">
      <StyledLink href={href} color="textSecondary">
        {children}
      </StyledLink>
    </Typography>
  );
}
