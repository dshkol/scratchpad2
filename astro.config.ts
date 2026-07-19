import { defineConfig, envField } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import expressiveCode from "astro-expressive-code";
import { pluginCollapsibleSections } from "@expressive-code/plugin-collapsible-sections";
import remarkToc from "remark-toc";
import remarkCollapse from "remark-collapse";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { SITE } from "./src/config";

// https://astro.build/config
export default defineConfig({
  site: SITE.website,
  integrations: [
    expressiveCode({
      plugins: [pluginCollapsibleSections()],
      themes: ["github-light", "github-dark"],
      themeCssSelector: (theme) => `[data-theme="${theme.type}"]`,
      styleOverrides: {
        borderRadius: "0.5rem",
        borderColor: "var(--border)",
        borderWidth: "1px",
        codeFontFamily: '"JetBrains Mono", ui-monospace, monospace',
        codeFontSize: "0.9em",
        codeBackground: "var(--muted)",
        codePaddingBlock: "1rem",
        codePaddingInline: "1.25rem",
        scrollbarThumbColor: "var(--border)",
        scrollbarThumbHoverColor: "var(--accent)",
        frames: {
          frameBoxShadowCssValue: "none",
          editorTabBarBackground: "var(--muted)",
          editorTabBarBorderBottomColor: "var(--border)",
          editorActiveTabBackground: "var(--background)",
          editorActiveTabForeground: "var(--foreground)",
          editorActiveTabBorderColor: "var(--border)",
          terminalBackground: "var(--muted)",
          terminalTitlebarBackground: "var(--muted)",
          terminalTitlebarBorderBottomColor: "var(--border)",
        },
        textMarkers: {
          markBackground: "var(--accent)",
          markBorderColor: "var(--accent)",
        },
      },
    }),
    sitemap({
      filter: page =>
        !page.endsWith("/search/") &&
        (SITE.showArchives || !page.endsWith("/archives/")),
    }),
  ],
  markdown: {
    remarkPlugins: [remarkMath, remarkToc, [remarkCollapse, { test: "Table of contents" }]],
    rehypePlugins: [rehypeKatex],
  },
  vite: {
    // eslint-disable-next-line
    // @ts-ignore
    // This will be fixed in Astro 6 with Vite 7 support
    // See: https://github.com/withastro/astro/issues/14030
    plugins: [tailwindcss()],
    optimizeDeps: {
      exclude: ["@resvg/resvg-js"],
    },
  },
  image: {
    responsiveStyles: true,
    layout: "constrained",
  },
  env: {
    schema: {
      PUBLIC_GOOGLE_SITE_VERIFICATION: envField.string({
        access: "public",
        context: "client",
        optional: true,
      }),
    },
  },
  experimental: {
    preserveScriptOrder: true,
  },
});
