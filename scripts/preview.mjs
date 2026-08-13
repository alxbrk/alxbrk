#!/usr/bin/env node
// Local preview server that renders README.md with GitHub-flavored Markdown and
// GitHub's rendering styles, approximating how the profile appears on github.com.
// Re-renders on every request so edits are visible on refresh.

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Marked } from "marked";
import { gfmHeadingId } from "marked-gfm-heading-id";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");

const HOST = process.env.HOST ?? "0.0.0.0";
const PORT = Number(process.env.PORT ?? 3000);
const README_PATH = join(repoRoot, process.env.README ?? "README.md");
const GH_CSS_PATH = join(
  repoRoot,
  "node_modules",
  "github-markdown-css",
  "github-markdown.css",
);

const marked = new Marked({ gfm: true, breaks: false });
marked.use(gfmHeadingId());

function page(bodyHtml, css) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>README preview - alxbrk</title>
  <style>${css}</style>
  <style>
    body { margin: 0; background: #f6f8fa; }
    .markdown-body { box-sizing: border-box; min-width: 200px; max-width: 980px;
      margin: 32px auto; padding: 45px; background: #fff; border: 1px solid #d0d7de;
      border-radius: 6px; }
    @media (max-width: 767px) { .markdown-body { padding: 15px; margin: 0; } }
  </style>
</head>
<body>
  <article class="markdown-body">${bodyHtml}</article>
</body>
</html>`;
}

const server = createServer(async (req, res) => {
  try {
    if (req.url === "/healthz") {
      res.writeHead(200, { "content-type": "text/plain" });
      res.end("ok");
      return;
    }
    const [md, css] = await Promise.all([
      readFile(README_PATH, "utf8"),
      readFile(GH_CSS_PATH, "utf8"),
    ]);
    const html = page(await marked.parse(md), css);
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(html);
  } catch (err) {
    res.writeHead(500, { "content-type": "text/plain" });
    res.end(`Preview error: ${err.message}`);
  }
});

server.listen(PORT, HOST, () => {
  console.log(`README preview running at http://${HOST}:${PORT}`);
  console.log(`Rendering: ${README_PATH}`);
});
