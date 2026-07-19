import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";

const outputDir = "dist";
const siteOrigin = "https://dshkol.com";
const ignoredPathPrefixes = ["/cmt", "/thedaily"];

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function routeFor(file) {
  const path = relative(outputDir, file).split(sep).join("/");
  if (path === "index.html") return "/";
  if (path.endsWith("/index.html")) return `/${path.slice(0, -10)}`;
  return `/${path}`;
}

function resolvesToOutput(pathname) {
  const relativePath = decodeURIComponent(pathname)
    .replace(/^\//, "")
    .replace(/\/$/, "");
  const candidates = [
    join(outputDir, relativePath),
    join(outputDir, relativePath, "index.html"),
    join(outputDir, `${relativePath}.html`),
  ];

  if (candidates.some(existsSync)) return true;

  // Netlify permanently redirects legacy post permalinks, while preserving
  // the old /post/... asset tree when a static file exists there.
  if (pathname.startsWith("/post/")) {
    return resolvesToOutput(pathname.replace(/^\/post\//, "/posts/"));
  }

  return false;
}

if (!existsSync(outputDir)) {
  process.stderr.write(`Missing ${outputDir}/. Run the site build first.\n`);
  process.exit(1);
}

const brokenLinks = new Set();
const htmlFiles = walk(outputDir).filter(file => file.endsWith(".html"));

for (const file of htmlFiles) {
  const html = readFileSync(file, "utf8");
  const pageURL = new URL(routeFor(file), siteOrigin);

  for (const match of html.matchAll(/(?:href|src)=["']([^"']+)["']/g)) {
    const value = match[1];
    if (/^(?:#|%23|mailto:|tel:|javascript:|data:|blob:)/i.test(value)) continue;

    let target;
    try {
      target = new URL(value, pageURL);
    } catch {
      brokenLinks.add(`${routeFor(file)} -> ${value}`);
      continue;
    }

    if (!["dshkol.com", "www.dshkol.com"].includes(target.hostname)) continue;
    if (ignoredPathPrefixes.some(prefix => target.pathname === prefix || target.pathname.startsWith(`${prefix}/`))) continue;

    if (!resolvesToOutput(target.pathname)) {
      brokenLinks.add(`${routeFor(file)} -> ${value}`);
    }
  }
}

if (brokenLinks.size > 0) {
  process.stderr.write("Broken internal links:\n\n");
  process.stderr.write(`${[...brokenLinks].sort().join("\n")}\n`);
  process.exit(1);
}

process.stdout.write(
  `Checked ${htmlFiles.length} HTML files; no broken internal links found.\n`
);
