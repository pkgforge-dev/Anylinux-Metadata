import { readFile, writeFile, copyFile, mkdir, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { appManifestSchema, type AppManifest } from "../schema/schema.ts";

const currentDir = import.meta.dirname ?? dirname(fileURLToPath(import.meta.url));
const plaDir = process.env.PLA_DIR || resolve(process.env.HOME || "", "code/Portable-Linux-Apps.github.io");
const plaAppsDir = resolve(plaDir, "apps");
const plaIconsDir = resolve(plaDir, "icons");
const targetAppsDir = resolve(currentDir, "../apps");
const targetIconsDir = resolve(currentDir, "../icons");
const statusJsonPath = resolve(currentDir, "../status.json");

function stripEmojis(text: string): string {
  return text.replace(/[\u{10000}-\u{10ffff}\u{2600}-\u{27bf}\u{2300}-\u{23ff}\u{2b50}-\u{2b55}\u{203c}\u{2049}\u{2139}\u{2194}-\u{2199}\u{21a9}-\u{21aa}\u{2934}-\u{2935}\u{25aa}-\u{25ab}\u{25b6}\u{25c0}\u{25fb}-\u{25fe}]/gu, "").trim();
}

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
      const parts = line.replace("# SITES:", "").trim().split(/\s+/);
      sites = parts.find((p) => p.startsWith("https://")) || parts.find((p) => p.startsWith("http://")) || parts[0] || "";
    }
    if (line.startsWith("# SOURCES:")) {
      const parts = line.replace("# SOURCES:", "").trim().split(/\s+/);
      sources = parts.find((p) => p.startsWith("https://")) || parts.find((p) => p.startsWith("http://")) || parts[0] || "";
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
      const clean = stripEmojis(p.replace(/\n/g, " ").trim());
      if (clean) paragraphs.push(clean);
    }
  }

  if (sections[1]) {
    const featLines = sections[1].split("\n");
    for (const fl of featLines) {
      const clean = stripEmojis(fl.replace(/^-\s*/, "").trim());
      if (clean) features.push(clean);
    }
  }

  return {
    name: stripEmojis(name),
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
          const appPart = name === normSlug || name.endsWith(`_${normSlug}`) ? name : `${name}_${normSlug}`;
          return `io.github.${owner}.${appPart}`;
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

  let rawPla = "";
  let plaPath = candidates.find((c) => existsSync(c));
  if (plaPath) {
    rawPla = await readFile(plaPath, "utf8");
  } else {
    // Remote fallback to official repository
    const remoteNames = [slug, appEntry.name.toLowerCase(), slug.replace(/-/g, "")];
    for (const rName of remoteNames) {
      try {
        const res = await fetch(`https://raw.githubusercontent.com/Portable-Linux-Apps/Portable-Linux-Apps.github.io/main/apps/${rName}`);
        if (res.ok) {
          rawPla = await res.text();
          break;
        }
      } catch {}
    }
  }

  if (!rawPla) {
    console.warn(`WARN [${slug}]: No match in Portable-Linux-Apps (local or remote)`);
    return false;
  }

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

  // Find icon (local or remote)
  await mkdir(targetIconsDir, { recursive: true });
  const localTargetIcon = resolve(targetIconsDir, `${slug}.png`);
  const iconCandidates = [
    resolve(plaIconsDir, `${slug}.png`),
    resolve(plaIconsDir, `${appEntry.name.toLowerCase()}.png`),
    resolve(plaIconsDir, `${slug.replace(/-/g, "")}.png`),
  ];
  let plaIconPath = iconCandidates.find((c) => existsSync(c));
  if (plaIconPath) {
    await copyFile(plaIconPath, localTargetIcon);
  } else if (!existsSync(localTargetIcon)) {
    const remoteIconNames = [`${slug}.png`, `${appEntry.name.toLowerCase()}.png`];
    for (const rIcon of remoteIconNames) {
      try {
        const res = await fetch(`https://raw.githubusercontent.com/Portable-Linux-Apps/Portable-Linux-Apps.github.io/main/icons/${rIcon}`);
        if (res.ok) {
          const buf = await res.arrayBuffer();
          await writeFile(localTargetIcon, Buffer.from(buf));
          break;
        }
      } catch {}
    }
  }

  // Handle screenshots
  let screenshots = parsed.screenshots;
  if (screenshots.length === 0) {
    // Provide a valid default or fallback screenshot
    screenshots = [
      `https://raw.githubusercontent.com/pkgforge-dev/Anylinux-AppImages/main/assets/banner.png`,
    ];
  }

  function cleanHttpsUrl(candidate: string, fallback: string): string {
    if (!candidate) return fallback;
    const first = candidate.trim().split(/\s+/)[0];
    try {
      const url = new URL(first);
      if (url.protocol === "https:") {
        return url.toString();
      }
      if (url.protocol === "http:") {
        url.protocol = "https:";
        return url.toString();
      }
    } catch {}
    return fallback;
  }

  const fallbackRepoUrl = `https://github.com/${appEntry.repo}`;
  const homepage = cleanHttpsUrl(parsed.sites, fallbackRepoUrl);
  const repository = cleanHttpsUrl(parsed.sources, fallbackRepoUrl);
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
    console.error(`FAIL Validation failed for generated manifest ${slug}:`, validation.error.format());
    return false;
  }

  await mkdir(targetAppsDir, { recursive: true });
  await writeFile(resolve(targetAppsDir, `${slug}.json`), JSON.stringify(manifest, null, 2) + "\n");
  console.log(`OK [${slug}]: apps/${slug}.json`);
  return true;
}

async function main() {
  const args = process.argv.slice(2);
  const isAll = args.includes("--all");
  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : 18; // Default pilot batch: 18 apps

  console.log(`Starting Portable-Linux-Apps Ingestion (Limit: ${isAll ? "ALL" : limit})...\n`);

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

  console.log(`\nIngestion complete: ${successCount} manifest(s) and icons created.`);
}

main().catch((err) => {
  console.error("Fatal importer error:", err);
  process.exit(1);
});
