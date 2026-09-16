import { readFile, writeFile, copyFile, mkdir, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, basename } from "node:path";
import { appManifestSchema, type AppManifest } from "../schema/schema.ts";

const plaDir = resolve(process.env.HOME || "", "code/Portable-Linux-Apps.github.io");
const plaAppsDir = resolve(plaDir, "apps");
const plaIconsDir = resolve(plaDir, "icons");
const targetAppsDir = resolve(import.meta.dir, "../apps");
const targetIconsDir = resolve(import.meta.dir, "../icons");
const statusJsonPath = resolve(import.meta.dir, "../status.json");

// Known license overrides for popular non-Flathub apps
const knownLicenses: Record<string, string> = {
  "12to11": "GPL-3.0-or-later",
  "2ship2harkinian": "CC0-1.0",
  "86box": "GPL-2.0-or-later",
  "86box-enhanced": "GPL-2.0-or-later",
  "aaaaxy": "Apache-2.0",
  "abaddon": "GPL-3.0-or-later",
  "aerofoil": "GPL-3.0-only",
  "akhenaten": "GPL-3.0-or-later",
  "alacritty": "Apache-2.0",
  "amiberry": "GPL-3.0-or-later",
  "ares-emu": "ISC",
  "arx-libertatis": "GPL-3.0-or-later",
  "catacombgl": "GPL-2.0-only",
  "ghostty": "MIT",
  "ladybird": "BSD-2-Clause",
  "torzu": "GPL-3.0-or-later",
  "scrcpy": "Apache-2.0",
  "qimgv": "GPL-3.0-only",
  "quickshell": "LGPL-3.0-or-later",
  "skyemu": "MIT",
  "xash3d-fwgs": "GPL-3.0-only",
  "sound-space-plus": "GPL-3.0-or-later",
  "soh": "CC0-1.0",
};

// Known category mappings
const knownCategories: Record<string, string[]> = {
  "12to11": ["System", "Utility"],
  "2ship2harkinian": ["Game", "Emulator"],
  "86box": ["System", "Emulator"],
  "86box-enhanced": ["System", "Emulator"],
  "aaaaxy": ["Game", "ActionGame"],
  "abaddon": ["Network", "InstantMessaging", "Chat"],
  "aerofoil": ["Utility", "System"],
  "akhenaten": ["Game", "Simulation", "StrategyGame"],
  "alacritty": ["System", "TerminalEmulator"],
  "amiberry": ["Game", "Emulator"],
  "ares-emu": ["Game", "Emulator"],
  "arx-libertatis": ["Game", "RolePlaying"],
  "catacombgl": ["Game", "ActionGame"],
  "ghostty": ["System", "TerminalEmulator"],
  "ladybird": ["Network", "WebBrowser"],
  "torzu": ["Game", "Emulator"],
  "scrcpy": ["Utility", "RemoteAccess"],
  "qimgv": ["Graphics", "Viewer"],
  "quickshell": ["Development", "Utility"],
  "skyemu": ["Game", "Emulator"],
  "xash3d-fwgs": ["Game", "ActionGame"],
  "sound-space-plus": ["AudioVideo", "Player"],
  "soh": ["Game", "ActionGame"],
};

function parsePlaFile(content: string) {
  const lines = content.split("\n");
  let name = "";
  let insideDesc = false;
  const descLines: string[] = [];
  let screenshots: string[] = [];
  let sites = "";
  let sources = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("# ") && !insideDesc && !name) {
      name = line.replace("# ", "").trim();
      continue;
    }
    if (line.trim() === "===") {
      insideDesc = !insideDesc;
      continue;
    }
    if (insideDesc) {
      descLines.push(line);
      continue;
    }
    if (line.startsWith("# SCREENSHOTS:")) {
      const urls = line.replace("# SCREENSHOTS:", "").trim().split(/\s+/);
      screenshots = urls.filter((u) => u.startsWith("https://") && !u.includes("/contribute_ss.webp"));
    }
    if (line.startsWith("# SITES:")) {
      sites = line.replace("# SITES:", "").trim();
    }
    if (line.startsWith("# SOURCES:")) {
      sources = line.replace("# SOURCES:", "").trim();
    }
  }

  // Parse description and features
  const fullDesc = descLines.join("\n").trim();
  const paragraphs: string[] = [];
  const features: string[] = [];

  const sections = fullDesc.split(/\n\s*Features:\s*\n/i);
  const mainText = sections[0].trim();
  if (mainText) {
    const rawParas = mainText.split(/\n\n+/);
    for (const p of rawParas) {
      const clean = p.replace(/\n/g, " ").trim();
      if (clean) paragraphs.push(clean);
    }
  }

  if (sections[1]) {
    const featLines = sections[1].split("\n");
    for (const fl of featLines) {
      const clean = fl.replace(/^-\s*/, "").trim();
      if (clean) features.push(clean);
    }
  }

  return {
    name,
    paragraphs,
    features,
    screenshots,
    sites,
    sources,
  };
}

function cleanSummary(leadParagraph: string, fallbackName: string): string {
  if (!leadParagraph) return `${fallbackName} application`;
  const firstSentence = leadParagraph.split(". ")[0].trim();
  let summary = firstSentence;
  // If summary is too long, truncate cleanly
  if (summary.length > 150) {
    summary = summary.substring(0, 147) + "...";
  }
  // Strip trailing period per AppStream spec!
  return summary.replace(/\.+$/, "").trim();
}

function inferAppId(slug: string, repo: string, homepage: string): string {
  const normSlug = slug.replace(/[^a-z0-9]/g, "_");
  if (homepage && homepage.startsWith("https://")) {
    try {
      const url = new URL(homepage);
      const hostname = url.hostname.toLowerCase();
      if (hostname === "github.com") {
        const parts = url.pathname.split("/").filter(Boolean);
        if (parts.length >= 2) {
          const owner = parts[0].toLowerCase().replace(/[^a-z0-9]/g, "_");
          const name = parts[1].toLowerCase().replace(/[^a-z0-9]/g, "_");
          return `io.github.${owner}.${name}`;
        }
      }
      const hostParts = hostname.split(".").reverse().filter((p) => p !== "www");
      if (hostParts.length >= 2) {
        return `${hostParts.join(".")}.${normSlug}`;
      }
    } catch {}
  }

  if (repo && repo.includes("/")) {
    const [owner, name] = repo.split("/");
    const cleanOwner = owner.toLowerCase().replace(/[^a-z0-9]/g, "_");
    const cleanName = name.replace(/-appimage.*$/i, "").toLowerCase().replace(/[^a-z0-9]/g, "_");
    return `io.github.${cleanOwner}.${cleanName || normSlug}`;
  }

  return `io.github.pkgforge_dev.${normSlug}`;
}

async function importApp(appEntry: { name: string; slug: string; repo: string; url: string }) {
  const slug = appEntry.slug;
  const candidates = [
    resolve(plaAppsDir, slug),
    resolve(plaAppsDir, appEntry.name.toLowerCase()),
    resolve(plaAppsDir, slug.replace(/-/g, "")),
  ];

  let plaPath = candidates.find((c) => existsSync(c));
  if (!plaPath) {
    console.warn(`⚠️ [${slug}]: No match in Portable-Linux-Apps apps/`);
    return false;
  }

  const rawPla = await readFile(plaPath, "utf8");
  const parsed = parsePlaFile(rawPla);

  const appName = parsed.name || appEntry.name;
  const leadPara = parsed.paragraphs[0] || `${appName} packaged as an AnyLinux AppImage.`;
  const summary = cleanSummary(leadPara, appName);

  // Build Description AST
  const descriptionAst: any[] = [];
  for (const p of parsed.paragraphs) {
    descriptionAst.push({
      type: "paragraph",
      content: [{ type: "text", value: p }],
    });
  }
  if (parsed.features.length > 0) {
    descriptionAst.push({
      type: "unordered-list",
      items: parsed.features.map((f) => [{ type: "text", value: f }]),
    });
  }

  // Find icon
  const iconCandidates = [
    resolve(plaIconsDir, `${slug}.png`),
    resolve(plaIconsDir, `${appEntry.name.toLowerCase()}.png`),
    resolve(plaIconsDir, `${slug.replace(/-/g, "")}.png`),
  ];
  let plaIconPath = iconCandidates.find((c) => existsSync(c));
  if (plaIconPath) {
    await mkdir(targetIconsDir, { recursive: true });
    await copyFile(plaIconPath, resolve(targetIconsDir, `${slug}.png`));
  }

  // Handle screenshots
  let screenshots = parsed.screenshots;
  if (screenshots.length === 0) {
    // Provide a valid default or fallback screenshot
    screenshots = [
      `https://raw.githubusercontent.com/pkgforge-dev/Anylinux-AppImages/main/assets/banner.png`,
    ];
  }

  const homepage = parsed.sites && parsed.sites.startsWith("https://") ? parsed.sites : `https://github.com/${appEntry.repo}`;
  const repository = parsed.sources && parsed.sources.startsWith("https://") ? parsed.sources : `https://github.com/${appEntry.repo}`;
  const license = knownLicenses[slug] || "GPL-3.0-or-later";
  const categories = knownCategories[slug] || ["Utility"];
  const appId = inferAppId(slug, appEntry.repo, homepage);

  const manifest: AppManifest = {
    $schema: "https://raw.githubusercontent.com/pkgforge-dev/Anylinux-Metadata/main/schema/app-manifest.json",
    appstream: {
      type: "manual",
      metadata: {
        id: appId,
        name: appName,
        summary,
        description: descriptionAst,
        projectLicense: license,
        developer: {
          name: `${appName} Developers`,
          url: homepage,
        },
        homepage,
        repository,
        keywords: [slug, "appimage", "anylinux"],
        categories,
      },
      media: {
        icon: `https://raw.githubusercontent.com/pkgforge-dev/Anylinux-Metadata/main/icons/${slug}.png`,
        screenshots: screenshots.slice(0, 5).map((src, idx) => ({
          caption: `${appName} interface screenshot ${idx + 1}`,
          source: src,
        })),
      },
    },
    addedAt: new Date().toISOString().split("T")[0],
    origin: {
      type: "third-party",
    },
    releaseSource: {
      type: "github",
      repository: appEntry.repo,
    },
    sandbox: {
      network: "full",
      display: "wayland-or-x11",
      audio: "none",
      processes: "isolated",
      ipc: true,
      filesystem: [],
      devices: [],
      sessionBus: {
        access: "none",
        rules: [],
      },
      systemBus: {
        access: "none",
        rules: [],
      },
    },
  };

  const validation = appManifestSchema.safeParse(manifest);
  if (!validation.success) {
    console.error(`❌ Validation failed for generated manifest ${slug}:`, validation.error.format());
    return false;
  }

  await mkdir(targetAppsDir, { recursive: true });
  await writeFile(resolve(targetAppsDir, `${slug}.json`), JSON.stringify(manifest, null, 2) + "\n");
  console.log(`✅ [${slug}]: Successfully imported -> apps/${slug}.json`);
  return true;
}

async function main() {
  const args = process.argv.slice(2);
  const isAll = args.includes("--all");
  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : 18; // Default pilot batch: 18 apps

  console.log(`📥 Starting Portable-Linux-Apps Ingestion (Limit: ${isAll ? "ALL" : limit})...\n`);

  if (!existsSync(statusJsonPath)) {
    console.error("status.json not found. Run `bun run sync` first.");
    process.exit(1);
  }

  const status = JSON.parse(await readFile(statusJsonPath, "utf8"));
  const pending = status.pending as Array<{ name: string; slug: string; repo: string; url: string }>;

  // Prioritize pilot apps with verified high-quality profiles in PLA
  const prioritySlugs = [
    "abaddon",
    "12to11",
    "akhenaten",
    "aerofoil",
    "ares-emu",
    "catacombgl",
    "ghostty",
    "ladybird",
    "torzu",
    "qimgv",
    "quickshell",
    "skyemu",
    "sound-space-plus",
    "xash3d-fwgs",
    "aaaaxy",
    "86box",
    "amiberry",
    "arx-libertatis",
  ];

  const toProcess: typeof pending = [];

  // Add priority pilot apps first
  for (const ps of prioritySlugs) {
    const found = pending.find((p) => p.slug === ps);
    if (found && !toProcess.some((p) => p.slug === ps)) {
      toProcess.push(found);
    }
  }

  // Fill remaining up to limit
  for (const p of pending) {
    if (toProcess.length >= limit && !isAll) break;
    if (!toProcess.some((item) => item.slug === p.slug)) {
      toProcess.push(p);
    }
  }

  console.log(`Processing ${toProcess.length} application(s)...`);
  let successCount = 0;
  for (const app of toProcess) {
    const ok = await importApp(app);
    if (ok) successCount++;
  }

  console.log(`\n🎉 Ingestion complete! Successfully created ${successCount} manifest(s) and icons.`);
}

main().catch((err) => {
  console.error("Fatal importer error:", err);
  process.exit(1);
});
