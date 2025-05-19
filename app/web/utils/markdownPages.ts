import { glob } from "glob";

export function getAllMarkdownFiles(): Array<string> {
  return glob.sync("markdown/**/*.md");
}

/*
Turns

markdown/issues/communities-and-trust.md

into

['issues', 'communities-and-trust']
*/
export function filenameToSlug(filename: string) {
  // Normalize path separators for cross-platform compatibility
  const normalized = filename.replace(/\\/g, "/");
  if (!(normalized.startsWith("markdown/") && normalized.endsWith(".md"))) {
    throw Error(`Invalid filename ${filename}`);
  }
  return normalized
    .substring("markdown/".length, normalized.length - ".md".length)
    .split("/");
}

export function getAllMarkdownSlugs(): Array<Array<string>> {
  return getAllMarkdownFiles().map(filenameToSlug);
}
