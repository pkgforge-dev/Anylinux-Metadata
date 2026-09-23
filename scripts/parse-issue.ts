import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { appManifestSchema } from "../schema/schema.ts";

const currentDir = import.meta.dirname ?? dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(currentDir, "..");

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function extractField(label: string, text: string): string {
  const regex = new RegExp(`### ${escapeRegex(label)}\\s*\\n\\n([\\s\\S]*?)(?=\\n### |$)`);
  const match = text.match(regex);
  return match ? match[1].trim() : "";
}

export function parseIssueBody(body: string) {
  const slug = extractField("Application Slug", body);
  const proposedChanges = extractField("Proposed JSON or Changes", body);

  let manifest: any;

  if (proposedChanges) {
    if (!slug) {
      throw new Error("Missing critical field 'Application Slug' in update issue form");
    }
    const cleanJson = proposedChanges.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    try {
      manifest = JSON.parse(cleanJson);
    } catch (err: any) {
      throw new Error(`Failed to parse JSON in Proposed JSON or Changes: ${err.message}`);
    }
  } else {
    const name = extractField("Application Name", body);
    const appId = extractField("Reverse-DNS AppStream ID", body);
    const summary = extractField("Summary", body).replace(/\.+$/, "");
    const descRaw = extractField("Description", body);
    const license = extractField("License (SPDX Identifier)", body);
    const category = extractField("Main Category", body) || "Utility";
    const devName = extractField("Developer Name", body);
    const homepage = extractField("Homepage URL", body);
    const releaseRepo = extractField("AnyLinux Release Repository", body);
    const iconUrl = extractField("Icon URL", body);
    const screenshotsRaw = extractField("Screenshot URLs", body);

    if (!slug || !name) {
      throw new Error("Missing critical fields (slug or name) in issue form");
    }

    const screenshots = screenshotsRaw
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.startsWith("https://"))
      .slice(0, 5)
      .map((s, idx) => ({ caption: `${name} screenshot ${idx + 1}`, source: s }));

    const lines = descRaw.split("\n");
    const descBullets: string[] = [];
    const paragraphBlocks: string[] = [];
    let currentParagraph: string[] = [];

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (line.startsWith("- ") || line.startsWith("* ")) {
        if (currentParagraph.length > 0) {
          paragraphBlocks.push(currentParagraph.join(" "));
          currentParagraph = [];
        }
        const bulletText = line.replace(/^[-*]\s+/, "").trim();
        if (bulletText) {
          descBullets.push(bulletText);
        }
      } else if (!line) {
        if (currentParagraph.length > 0) {
          paragraphBlocks.push(currentParagraph.join(" "));
          currentParagraph = [];
        }
      } else if (/^features:?$/i.test(line)) {
        if (currentParagraph.length > 0) {
          paragraphBlocks.push(currentParagraph.join(" "));
          currentParagraph = [];
        }
      } else {
        currentParagraph.push(line);
      }
    }
    if (currentParagraph.length > 0) {
      paragraphBlocks.push(currentParagraph.join(" "));
    }

    const descriptionAst: any[] = paragraphBlocks.map((p) => ({
      type: "paragraph",
      content: [{ type: "text", value: p }]
    }));

    if (descBullets.length > 0) {
      descriptionAst.push({
        type: "unordered-list",
        items: descBullets.map((b) => [{ type: "text", value: b }])
      });
    }

    manifest = {
      $schema: "https://raw.githubusercontent.com/pkgforge-dev/Anylinux-Metadata/main/schema/app-manifest.json",
      appstream: {
        type: "manual",
        metadata: {
          id: appId,
          name,
          summary,
          description: descriptionAst.length > 0 ? descriptionAst : [{ type: "paragraph", content: [{ type: "text", value: summary }] }],
          projectLicense: license,
          developer: { name: devName, url: homepage },
          homepage,
          repository: homepage,
          keywords: [slug, "appimage", "anylinux"],
          categories: [category],
        },
        media: {
          icon: iconUrl,
          screenshots: screenshots.length > 0 ? screenshots : [{ caption: `${name} screenshot`, source: iconUrl }]
        }
      },
      addedAt: new Date().toISOString().split("T")[0],
      origin: { type: "third-party" },
      releaseSource: { type: "github", repository: releaseRepo },
      sandbox: {
        network: "full",
        display: "wayland-or-x11",
        audio: "none",
        processes: "isolated",
        ipc: true,
        filesystem: [],
        devices: [],
        sessionBus: { access: "none", rules: [] },
        systemBus: { access: "none", rules: [] }
      }
    };
  }

  const check = appManifestSchema.safeParse(manifest);
  if (!check.success) {
    throw new Error(`Parsed manifest failed schema validation: ${JSON.stringify(check.error.format())}`);
  }

  return { slug, manifest };
}

function main() {
  const body = process.env.ISSUE_BODY || "";
  if (!body.trim()) {
    console.error("ISSUE_BODY environment variable is empty");
    process.exit(1);
  }

  try {
    const { slug, manifest } = parseIssueBody(body);
    const targetFile = resolve(rootDir, "apps", `${slug}.json`);
    writeFileSync(targetFile, JSON.stringify(manifest, null, 2) + "\n");
    console.log(`Successfully wrote apps/${slug}.json`);
  } catch (err: any) {
    console.error("Error processing issue:", err.message);
    process.exit(1);
  }
}

if (process.argv[1] && (process.argv[1].endsWith("parse-issue.ts") || process.argv[1].endsWith("parse-issue.js"))) {
  main();
}
