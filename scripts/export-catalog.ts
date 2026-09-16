import { readdir, readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { resolve, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { appManifestSchema, type AppManifest } from "../schema/schema.ts";

const currentDir = import.meta.dirname ?? dirname(fileURLToPath(import.meta.url));
const appsDir = resolve(currentDir, "../apps");
const distDir = resolve(currentDir, "../dist");

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function astToXml(blocks: AppManifest["appstream"]["metadata"]["description"]): string {
  let xml = "";
  for (const block of blocks) {
    if (block.type === "paragraph") {
      const text = block.content.map((c) => escapeXml(c.value)).join("");
      xml += `      <p>${text}</p>\n`;
    } else if (block.type === "unordered-list" || block.type === "ordered-list") {
      const tag = block.type === "unordered-list" ? "ul" : "ol";
      xml += `      <${tag}>\n`;
      for (const item of block.items) {
        const text = item.map((c) => escapeXml(c.value)).join("");
        xml += `        <li>${text}</li>\n`;
      }
      xml += `      </${tag}>\n`;
    }
  }
  return xml;
}

async function exportCatalog() {
  await mkdir(distDir, { recursive: true });

  const files = (await readdir(appsDir)).filter((f) => f.endsWith(".json")).sort();
  console.log(`Compiling catalog from ${files.length} application manifests...\n`);

  const apps: Record<string, AppManifest> = {};
  let xmlComponents = "";

  for (const file of files) {
    const slug = basename(file, ".json");
    const raw = await readFile(resolve(appsDir, file), "utf8");
    const manifest: AppManifest = JSON.parse(raw);

    const validation = appManifestSchema.safeParse(manifest);
    if (!validation.success) {
      throw new Error(`Invalid manifest ${file}: ${validation.error.message}`);
    }

    apps[slug] = manifest;

    // Build AppStream XML component
    const meta = manifest.appstream.metadata;
    const media = manifest.appstream.media;

    xmlComponents += `  <component type="desktop">\n`;
    xmlComponents += `    <id>${escapeXml(meta.id)}</id>\n`;
    xmlComponents += `    <name>${escapeXml(meta.name)}</name>\n`;
    xmlComponents += `    <summary>${escapeXml(meta.summary)}</summary>\n`;
    xmlComponents += `    <project_license>${escapeXml(meta.projectLicense)}</project_license>\n`;
    xmlComponents += `    <developer_name>${escapeXml(meta.developer.name)}</developer_name>\n`;
    xmlComponents += `    <description>\n${astToXml(meta.description)}    </description>\n`;
    xmlComponents += `    <url type="homepage">${escapeXml(meta.homepage)}</url>\n`;
    if (meta.repository) {
      xmlComponents += `    <url type="vcs-browser">${escapeXml(meta.repository)}</url>\n`;
    }
    if (meta.links) {
      for (const [linkType, linkUrl] of Object.entries(meta.links)) {
        xmlComponents += `    <url type="${escapeXml(linkType)}">${escapeXml(linkUrl)}</url>\n`;
      }
    }
    xmlComponents += `    <categories>\n`;
    for (const cat of meta.categories) {
      xmlComponents += `      <category>${escapeXml(cat)}</category>\n`;
    }
    xmlComponents += `    </categories>\n`;
    if (meta.keywords && meta.keywords.length > 0) {
      xmlComponents += `    <keywords>\n`;
      for (const kw of meta.keywords) {
        xmlComponents += `      <keyword>${escapeXml(kw)}</keyword>\n`;
      }
      xmlComponents += `    </keywords>\n`;
    }
    if (meta.mimeTypes && meta.mimeTypes.length > 0) {
      xmlComponents += `    <mimetypes>\n`;
      for (const mime of meta.mimeTypes) {
        xmlComponents += `      <mimetype>${escapeXml(mime)}</mimetype>\n`;
      }
      xmlComponents += `    </mimetypes>\n`;
    }
    xmlComponents += `    <icon type="remote">${escapeXml(media.icon)}</icon>\n`;
    if (media.screenshots && media.screenshots.length > 0) {
      xmlComponents += `    <screenshots>\n`;
      media.screenshots.forEach((ss, idx) => {
        const defaultAttr = idx === 0 ? ` type="default"` : "";
        xmlComponents += `      <screenshot${defaultAttr}>\n`;
        xmlComponents += `        <caption>${escapeXml(ss.caption)}</caption>\n`;
        xmlComponents += `        <image>${escapeXml(ss.source)}</image>\n`;
        xmlComponents += `      </screenshot>\n`;
      });
      xmlComponents += `    </screenshots>\n`;
    }
    xmlComponents += `    <metadata>\n`;
    xmlComponents += `      <value key="anylinux:slug">${escapeXml(slug)}</value>\n`;
    xmlComponents += `      <value key="anylinux:release_source_type">${escapeXml(manifest.releaseSource.type)}</value>\n`;
    if ("repository" in manifest.releaseSource) {
      xmlComponents += `      <value key="anylinux:release_source_repo">${escapeXml(manifest.releaseSource.repository)}</value>\n`;
    }
    xmlComponents += `    </metadata>\n`;
    xmlComponents += `  </component>\n\n`;
  }

  // 1. Write dist/catalog.json and web/catalog.json
  const catalogJson = {
    version: "1.0.0",
    generatedAt: new Date().toISOString(),
    count: files.length,
    apps,
  };
  const catalogStr = JSON.stringify(catalogJson, null, 2) + "\n";
  await writeFile(resolve(distDir, "catalog.json"), catalogStr);
  const webDir = resolve(currentDir, "../web");
  await writeFile(resolve(webDir, "catalog.json"), catalogStr);
  console.log(`Generated dist/catalog.json and web/catalog.json (${(Buffer.byteLength(catalogStr) / 1024).toFixed(1)} KB)`);

  let statusContent = "{}";
  const statusPath = resolve(currentDir, "../status.json");
  try {
    statusContent = await readFile(statusPath, "utf8");
    await writeFile(resolve(distDir, "status.json"), statusContent);
    await writeFile(resolve(webDir, "status.json"), statusContent);
  } catch {}

  const catalogDataJs = `// Auto-generated offline data bundle for AnyLinux Metadata Portal
window.__ANYLINUX_CATALOG__ = ${JSON.stringify(catalogJson)};
window.__ANYLINUX_STATUS__ = ${statusContent};
`;
  await writeFile(resolve(distDir, "catalog-data.js"), catalogDataJs);
  await writeFile(resolve(webDir, "catalog-data.js"), catalogDataJs);
  console.log(`Generated dist/catalog-data.js and web/catalog-data.js`);

  // 2. Write dist/appstream.xml & dist/appstream.xml.gz
  const appstreamXml = `<?xml version="1.0" encoding="UTF-8"?>
<components version="0.14" origin="anylinux-metadata">
${xmlComponents}</components>
`;
  await writeFile(resolve(distDir, "appstream.xml"), appstreamXml);
  const compressed = gzipSync(Buffer.from(appstreamXml, "utf8"));
  await writeFile(resolve(distDir, "appstream.xml.gz"), compressed);
  console.log(`Generated dist/appstream.xml and dist/appstream.xml.gz (${(compressed.length / 1024).toFixed(1)} KB compressed)`);

  // 3. Copy icon assets to dist/icons and web/icons
  const iconsSrcDir = resolve(currentDir, "../icons");
  const distIconsDir = resolve(distDir, "icons");
  const webIconsDir = resolve(webDir, "icons");
  await mkdir(distIconsDir, { recursive: true });
  await mkdir(webIconsDir, { recursive: true });
  const iconFiles = await readdir(iconsSrcDir);
  let iconCount = 0;
  for (const ic of iconFiles) {
    if (ic.endsWith(".png") || ic.endsWith(".svg")) {
      await copyFile(resolve(iconsSrcDir, ic), resolve(distIconsDir, ic));
      await copyFile(resolve(iconsSrcDir, ic), resolve(webIconsDir, ic));
      iconCount++;
    }
  }
  console.log(`Copied ${iconCount} icons to dist/icons and web/icons`);
}

exportCatalog().catch((err) => {
  console.error("Export error:", err);
  process.exit(1);
});
