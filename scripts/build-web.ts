import { readFile, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = import.meta.dirname ?? dirname(fileURLToPath(import.meta.url));
const webSrcJsDir = resolve(currentDir, "../web/src/js");
const webSrcCssDir = resolve(currentDir, "../web/src/css");
const webAppJsPath = resolve(currentDir, "../web/app.js");
const webStyleCssPath = resolve(currentDir, "../web/style.css");

const JS_FILES = [
  "config.js",
  "utils.js",
  "state.js",
  "theme.js",
  "tabs.js",
  "router.js",
  "lightbox.js",
  "modal.js",
  "app-detail.js",
  "catalog.js",
  "backlog.js",
  "studio.js",
  "validator.js",
  "init.js"
];

const CSS_FILES = [
  "tokens.css",
  "base.css",
  "components.css",
  "layout.css",
  "catalog.css",
  "backlog.css",
  "studio.css",
  "app-detail.css",
  "modals.css",
  "responsive.css"
];

export async function buildWebJs(): Promise<void> {
  const contents: string[] = [];

  for (const filename of JS_FILES) {
    const filePath = resolve(webSrcJsDir, filename);
    const content = await readFile(filePath, "utf-8");
    contents.push(`  // --- ${filename} ---\n` + content.split("\n").map(line => `  ${line}`).join("\n"));
  }

  const bundledJs = `(function () {\n  'use strict';\n\n${contents.join("\n\n")}\n})();\n`;
  await writeFile(webAppJsPath, bundledJs, "utf-8");
}

export async function buildWebCss(): Promise<void> {
  // If CSS modules exist, bundle them; otherwise preserve web/style.css
  try {
    const contents: string[] = [];
    for (const filename of CSS_FILES) {
      const filePath = resolve(webSrcCssDir, filename);
      const content = await readFile(filePath, "utf-8");
      contents.push(`/* --- ${filename} --- */\n` + content);
    }
    const bundledCss = contents.join("\n\n") + "\n";
    await writeFile(webStyleCssPath, bundledCss, "utf-8");
  } catch (err: any) {
    if (err.code !== "ENOENT") {
      throw err;
    }
  }
}

async function main() {
  await buildWebJs();
  await buildWebCss();
}

if (process.argv[1] && (process.argv[1].endsWith("build-web.ts") || process.argv[1].endsWith("build-web.js"))) {
  main().catch((err) => {
    console.error("Web build error:", err);
    process.exit(1);
  });
}
