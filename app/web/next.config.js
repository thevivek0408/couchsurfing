/** @type {import('next').NextConfig} */
const { i18n } = require("./next-i18next.config"); // eslint-disable-line
const { redirects } = require("./redirects"); // eslint-disable-line

const baseConfig = {
  assetPrefix: process.env.ASSET_PREFIX,
  reactStrictMode: true,
  eslint: {
    dirs: [
      "components",
      "features",
      "i18n",
      "markdown",
      "pages",
      "resources",
      "service",
      "test",
      "types",
      "utils",
    ],
  },
  i18n,
  productionBrowserSourceMaps: true,
  webpack: (config) => {
    config.module.rules.push({
      test: /\.md$/,
      loader: "frontmatter-markdown-loader",
    });
    return config;
  },
  redirects: async () => redirects,
  headers: async () => [
    {
      source: "/:path*",
      headers: [
        {
          key: "x-help-wanted",
          value:
            "Come help build the next generation platform for couch surfers at https://github.com/Couchers-org",
        },
        {
          key: "strict-transport-security",
          value: "max-age=31536000; includeSubdomains; preload",
        },
        {
          key: "referrer-policy",
          value: "origin-when-cross-origin",
        },
        {
          key: "x-content-type-options",
          value: "nosniff",
        },
        {
          key: "x-frame-options",
          value: "DENY",
        },
        {
          key: "x-xss-protection",
          value: "1; mode=block",
        },
        {
          key: "x-fact",
          value: "Kilroy was here.",
        },
      ],
    },
    {
      source: "/static/:path*",
      headers: [
        {
          key: "access-control-allow-origin",
          value: "*",
        },
      ],
    },
    {
      source: "/service-worker.js",
      headers: [
        {
          key: "service-worker-allowed",
          value: "/",
        },
      ],
    },
  ],
  output: "standalone",
  allowedDevOrigins: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://192.168.29.63:3000",
    "http://192.168.29.63",
  ],
};

// Injected content via Sentry wizard below

const { withSentryConfig } = require("@sentry/nextjs");

module.exports = withSentryConfig(baseConfig, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: "couchers",
  project: "frontend",
  release: process.env.NEXT_PUBLIC_VERSION,

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,
});
