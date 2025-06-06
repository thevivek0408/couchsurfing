import {
  Breadcrumbs,
  Container,
  Link,
  styled,
  Typography,
  TypographyProps,
} from "@mui/material";
import HtmlMeta from "components/HtmlMeta";
import markdown from "markdown-it";
import { theme } from "theme";

const mkd = new markdown();

export interface MarkdownPageFrontmatter {
  title: string;
  hide_title?: boolean;
  subtitle?: string;
  bustitle?: string;
  crumb?: string;
  description?: string;
  date?: string;
  author?: string;
  share_image?: string;
}

export interface MarkdownPageProps {
  slug: Array<string>;
  frontmatter: MarkdownPageFrontmatter;
  content: string;
}

const StyledBreadcrumbs = styled(Breadcrumbs)(({ theme }) => ({
  marginTop: theme.spacing(3),
  marginBottom: theme.spacing(3),

  "& a": {
    color: theme.palette.primary.main,
  },
}));

const StyledBusTitle = styled(Typography)<TypographyProps>(({ theme }) => ({
  marginTop: theme.spacing(3),
  "& > *": {
    fontSize: "1.5rem",
    fontWeight: "bold",
  },
  "& a": {
    color: theme.palette.primary.main,
  },
}));

const StyledMarkdown = styled("div")(({ theme }) => ({
  fontSize: theme.typography.fontSize,
  fontFamily: theme.typography.fontFamily,
  "& h1, & h2, & h3, & h4, & h5, & h6, & p": {
    borderBottom: "none",
    paddingBottom: 0,
    marginBottom: 0,
    marginTop: theme.spacing(2),
    overflowWrap: "break-word",
    whiteSpace: "pre-wrap",
  },
  "& h1": { ...theme.typography.h1, fontSize: "2.5rem", lineHeight: "1.125" },
  "& h2": { ...theme.typography.h2, fontSize: "1.75em !important" },
  "& h3": { ...theme.typography.h3, fontSize: "1.5em !important" },
  "& h4": theme.typography.h4,
  "& h5": theme.typography.h5,
  "& h6": theme.typography.h6,
  "& p": theme.typography.body1,
  "& ol": theme.typography.body1,
  "& ul": theme.typography.body1,
  "& blockquote": theme.typography.body1,
  "& a": {
    color: theme.palette.primary.main,
  },
  "& img": {
    width: "100%",
    maxWidth: "400px",
    height: "auto",
  },
  "& .tag": {
    color: "#fff",
    borderRadius: "4px",
    display: "inline-block",
    fontSize: "0.75rem",
    padding: "0.3rem 0.75rem",
  },
  "& .tag-large": {
    fontSize: "1.25rem",
  },
  "& .tag-governance": {
    backgroundColor: "#82bb42",
  },
  "& .tag-design": {
    backgroundColor: "#3da4ab",
  },
  "& .tag-tech": {
    backgroundColor: "#f46d50",
  },
}));

const StyledTitle = styled(Typography)(({ theme }) => ({
  fontSize: "2.5rem",
  lineHeight: "1.125",
}));

function createBreadcrumbs({
  slug,
  frontmatter,
}: {
  slug: Array<string>;
  frontmatter: MarkdownPageFrontmatter;
}) {
  const crumbs = [{ key: "root", value: "Couchers.org", path: "/" }];
  if (slug.length > 2 && slug[0] == "blog") {
    // this is fragile, but basically hides the date from the blog crumbs
    crumbs.push({
      key: "blog",
      value: "Blog",
      path: "/blog/",
    });
    crumbs.push({
      key: slug[-1],
      value: frontmatter.title,
      path: "/" + slug.join("/") + "/",
    });
  } else {
    for (let i = 0; i < slug.length; i++) {
      const item = slug[i];
      crumbs.push({
        key: item,
        value:
          i == slug.length - 1
            ? frontmatter.crumb
              ? frontmatter.crumb
              : frontmatter.title
            : item.substring(0, 1).toUpperCase() +
              item.substring(1, item.length),
        path: (i == 0 ? "/" : crumbs[i - 1].path) + item + "/",
      });
    }
  }
  return crumbs;
}

export default function MarkdownPage({
  slug,
  frontmatter,
  content,
}: MarkdownPageProps) {
  const subtitle = !!frontmatter.subtitle
    ? mkd.renderInline(frontmatter.subtitle)
    : null;
  const bustitle = !!frontmatter.bustitle
    ? mkd.renderInline(frontmatter.bustitle)
    : null;

  const crumbs = createBreadcrumbs({ slug, frontmatter });

  return (
    <>
      <HtmlMeta
        title={frontmatter.title}
        description={frontmatter.description}
        shareImage={frontmatter.share_image}
      />
      <Container
        disableGutters
        maxWidth="md"
        sx={{ marginTop: theme.spacing(3) }}
      >
        <StyledBreadcrumbs aria-label="breadcrumb">
          {crumbs.map((crumb) => (
            <Link
              key={crumb.key}
              underline="hover"
              color="inherit"
              href={crumb.path}
            >
              {crumb.value}
            </Link>
          ))}
        </StyledBreadcrumbs>
        {!frontmatter.hide_title && (
          <StyledTitle>{frontmatter.title}</StyledTitle>
        )}
        {subtitle && (
          <Typography component="h2">
            <div dangerouslySetInnerHTML={{ __html: subtitle }}></div>
          </Typography>
        )}
        <StyledMarkdown
          dangerouslySetInnerHTML={{ __html: content }}
        ></StyledMarkdown>
        {bustitle && (
          <StyledBusTitle component="h2">
            <div dangerouslySetInnerHTML={{ __html: bustitle }}></div>
          </StyledBusTitle>
        )}
      </Container>
    </>
  );
}
