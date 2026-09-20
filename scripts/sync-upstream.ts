import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export interface AppImageEntry {
  name: string;
  url: string;
  repo: string;
  slug: string;
}

export interface FlathubIndex {
  exactNormalizedIds: Set<string>;
  segmentMap: Map<string, Set<string>>;
  aliases: Record<string, string>;
}

export const FLATHUB_ALIASES: Record<string, string> = {
  "86box": "net._86box._86Box",
  "ares-emu": "dev.ares.ares",
  "c-dogs-sdl": "io.github.cxong.cdogs-sdl",
  "collaboraoffice": "com.collaboraoffice.Office",
  "cpu-x": "io.github.thetumultuousunicornofdarkness.cpu-x",
  "dolphin-emu": "org.DolphinEmu.dolphin-emu",
  "dosbox-x": "com.dosbox_x.DOSBox-X",
  "dr-robotnik-s-ring-racers": "org.kartkrew.RingRacers",
  "element-desktop": "im.riot.Riot",
  "gnome-calculator": "org.gnome.Calculator",
  "gnome-text-editor": "org.gnome.TextEditor",
  "gnome-web": "org.gnome.Epiphany",
  "gnu-octave": "org.octave.Octave",
  "goldendict-ng": "io.github.xiaoyifang.goldendict_ng",
  "gpu-screen-recorder": "com.dec05eba.gpu_screen_recorder",
  "joplin-desktop": "net.cozic.joplin_desktop",
  "kpatience": "org.kde.kpat",
  "librewolf": "io.gitlab.librewolf-community",
  "localsend": "org.localsend.localsend_app",
  "mpv": "io.mpv.Mpv",
  "nomacs": "org.nomacs.ImageLounge",
  "obs-studio": "com.obsproject.Studio",
  "parabolic": "org.nickvision.tubeconverter",
  "pavucontrol-qt": "org.pulseaudio.pavucontrol",
  "pinta-gtk3": "com.github.PintaProject.Pinta",
  "rmg": "com.github.Rosalie241.RMG",
  "sayonara-player": "com.sayonara_player.Sayonara",
  "simplex-chat": "chat.simplex.simplex",
  "super-zsnes": "io.github.xyproto.zsnes",
  "system-monitoring-center": "io.github.hakandundar34coding.system-monitoring-center",
  "taisei-project": "org.taisei_project.Taisei",
  "tauon": "com.github.taiko2k.tauonmb",
  "telegram": "org.telegram.desktop",
  "transmission-qt": "com.transmissionbt.Transmission",
  "tutanota-desktop": "com.tutanota.Tutanota",
  "ungoogled-chromium": "io.github.ungoogled_software.ungoogled_chromium",
  "unnamed-sdvx-clone": "me.drewol.Unnamed-SDVX-Clone",
  "visual-studio-code": "com.visualstudio.code",
  "visualboyadvance-m": "com.vba_m.visualboyadvance-m",
  "vscode": "com.visualstudio.code",
  "vscodium": "com.vscodium.codium",
  "zed": "dev.zed.Zed",
  "zen-browser": "app.zen_browser.zen",
};

const currentDir = import.meta.dirname ?? dirname(fileURLToPath(import.meta.url));
const localAnylinuxPath = process.env.ANYLINUX_DIR
  ? resolve(process.env.ANYLINUX_DIR, "README.md")
  : resolve(process.env.HOME || "", "code/Anylinux-AppImages/README.md");
const remoteAnylinuxUrl = "https://raw.githubusercontent.com/pkgforge-dev/Anylinux-AppImages/main/README.md";
const cacheDir = resolve(currentDir, "../.cache");
const appsDir = resolve(currentDir, "../apps");
const statusMdPath = resolve(currentDir, "../STATUS.md");
const statusJsonPath = resolve(currentDir, "../status.json");

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function getAnylinuxApps(): Promise<AppImageEntry[]> {
  let content = "";
  if (existsSync(localAnylinuxPath)) {
    content = await readFile(localAnylinuxPath, "utf8");
  } else {
    console.log("Fetching Anylinux-AppImages README from GitHub...");
    const res = await fetch(remoteAnylinuxUrl);
    if (!res.ok) throw new Error(`Failed to fetch Anylinux README: ${res.status}`);
    content = await res.text();
  }

  const entries: AppImageEntry[] = [];
  const lines = content.split("\n");

  for (const line of lines) {
    // Match any markdown table row link: | [App](url) |
    const match = line.match(/^\|\s*\[([^\]]+)\]\((https?:\/\/[^)]+)\)\s*\|/);
    if (match) {
      const name = match[1].trim();
      const url = match[2].trim();
      if (name === "..." || name.toLowerCase().includes("projects with") || name === "---") continue;

      const repo = url.replace(/^https?:\/\/github\.com\//, "").replace(/\/$/, "");
      entries.push({
        name,
        url,
        repo,
        slug: slugify(name),
      });
    }
  }

  return entries;
}

export async function getFlathubAppIds(): Promise<Set<string>> {
  await mkdir(cacheDir, { recursive: true });
  const cacheFile = resolve(cacheDir, "flathub-appstream-ids.json");

  // Check 24h cache
  if (existsSync(cacheFile)) {
    try {
      const cached = JSON.parse(await readFile(cacheFile, "utf8"));
      if (Date.now() - cached.timestamp < 24 * 60 * 60 * 1000 && Array.isArray(cached.ids)) {
        return new Set(cached.ids);
      }
    } catch {}
  }

  console.log("Fetching Flathub app IDs from Flathub API...");
  try {
    const res = await fetch("https://flathub.org/api/v2/appstream");
    if (res.ok) {
      const ids: string[] = await res.json();
      await writeFile(cacheFile, JSON.stringify({ timestamp: Date.now(), ids }, null, 2));
      return new Set(ids);
    }
  } catch (err) {
    console.warn("Could not reach Flathub API, falling back to local seed lists if present.");
  }

  return new Set();
}

export function buildFlathubIndex(flathubIds: Set<string>, aliases: Record<string, string> = FLATHUB_ALIASES): FlathubIndex {
  const exactNormalizedIds = new Set<string>();
  const segmentMap = new Map<string, Set<string>>();

  for (const id of flathubIds) {
    const idLower = id.toLowerCase();
    const idNorm = idLower.replace(/[^a-z0-9]/g, "");
    exactNormalizedIds.add(idNorm);

    const parts = idLower.split(".");
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const partNorm = part.replace(/[^a-z0-9]/g, "");
      if (!partNorm || partNorm.length < 3) continue;

      if (!segmentMap.has(partNorm)) segmentMap.set(partNorm, new Set());
      segmentMap.get(partNorm)!.add(id);

      // Strip common component suffixes
      const stripped = partNorm.replace(/(app|desktop|gui|bin|client|launcher|community)$/, "");
      if (stripped && stripped !== partNorm && stripped.length >= 3) {
        if (!segmentMap.has(stripped)) segmentMap.set(stripped, new Set());
        segmentMap.get(stripped)!.add(id);
      }
    }

    // Index combined last two segments (e.g. zen_browser.zen, gnome.texteditor)
    if (parts.length >= 2) {
      const lastTwo = (parts[parts.length - 2] + parts[parts.length - 1]).replace(/[^a-z0-9]/g, "");
      if (lastTwo.length >= 4) {
        if (!segmentMap.has(lastTwo)) segmentMap.set(lastTwo, new Set());
        segmentMap.get(lastTwo)!.add(id);
      }
    }
  }

  return {
    exactNormalizedIds,
    segmentMap,
    aliases,
  };
}

export function checkFlathubPresence(
  entry: AppImageEntry,
  index: FlathubIndex,
  knownFlathub: Set<string>
): boolean {
  const slug = entry.slug.toLowerCase();
  const name = entry.name.toLowerCase();

  // 1. Curated alias match
  if (index.aliases[slug] || index.aliases[name]) return true;

  const slugNorm = slug.replace(/[^a-z0-9]/g, "");
  const nameNorm = name.replace(/[^a-z0-9]/g, "");

  // 2. Known seed list match
  if (knownFlathub.has(slugNorm) || knownFlathub.has(nameNorm)) return true;

  // 3. Exact full normalized ID match
  if (index.exactNormalizedIds.has(slugNorm) || index.exactNormalizedIds.has(nameNorm)) return true;

  // 4. Direct segment match (slug or name)
  if (slugNorm.length >= 3 && index.segmentMap.has(slugNorm)) return true;
  if (nameNorm.length >= 3 && index.segmentMap.has(nameNorm)) return true;

  // 5. Candidate matching with common prefixes/suffixes stripped
  const candidates: string[] = [];

  const strippedPrefix = slug.replace(/^(gnu|super|gnome)-/, "");
  if (strippedPrefix !== slug) {
    candidates.push(strippedPrefix.replace(/[^a-z0-9]/g, ""));
  }

  const strippedSuffix = slug.replace(/-(qt|gtk|gtk3|gui|desktop|cli|browser|player|app|ng|clone|project)$/, "");
  if (strippedSuffix !== slug) {
    candidates.push(strippedSuffix.replace(/[^a-z0-9]/g, ""));
  }

  for (const cand of candidates) {
    if (cand.length >= 4 && index.segmentMap.has(cand)) return true;
  }

  return false;
}

async function main() {
  console.log("Synchronizing AnyLinux-Metadata with upstream and Flathub...\n");

  const apps = await getAnylinuxApps();
  console.log(`Found ${apps.length} applications in pkgforge-dev/Anylinux-AppImages`);

  const flathubIds = await getFlathubAppIds();
  console.log(`Loaded ${flathubIds.size} Flathub application IDs`);

  const index = buildFlathubIndex(flathubIds);

  // Load known flathub apps seed only if explicitly provided via environment variable
  const knownFlathub = new Set<string>();
  const apphubFlathubFile = process.env.FLATHUB_APPS_FILE
    ? resolve(process.env.FLATHUB_APPS_FILE)
    : process.env.APPHUB_DIR
      ? resolve(process.env.APPHUB_DIR, "flathub_apps.txt")
      : undefined;

  if (apphubFlathubFile && existsSync(apphubFlathubFile)) {
    try {
      const lines = (await readFile(apphubFlathubFile, "utf8")).split("\n");
      for (const l of lines) {
        if (l.trim()) knownFlathub.add(l.trim().toLowerCase().replace(/[^a-z0-9]/g, ""));
      }
    } catch {}
  }

  // Check existing apps in Anylinux-Metadata
  const existingSlugs = new Set<string>();
  const existingFiles = existsSync(appsDir)
    ? (await import("node:fs/promises")).readdir(appsDir).then((f) => f.filter((x) => x.endsWith(".json")))
    : Promise.resolve([]);
  for (const f of await existingFiles) {
    existingSlugs.add(f.replace(".json", ""));
  }

  const flathubCovered: AppImageEntry[] = [];
  const targetCompleted: AppImageEntry[] = [];
  const targetPending: AppImageEntry[] = [];

  for (const app of apps) {
    const onFlathub = checkFlathubPresence(app, index, knownFlathub);
    if (onFlathub) {
      flathubCovered.push(app);
    } else if (existingSlugs.has(app.slug)) {
      targetCompleted.push(app);
    } else {
      targetPending.push(app);
    }
  }

  const targetTotal = targetCompleted.length + targetPending.length;
  const progressPercent = targetTotal > 0 ? Math.round((targetCompleted.length / targetTotal) * 100) : 0;

  console.log(`\nStatus Summary:`);
  console.log(`  Total AnyLinux AppImages: ${apps.length}`);
  console.log(`  Flathub Covered: ${flathubCovered.length}`);
  console.log(`  Target Non-Flathub Apps: ${targetTotal}`);
  console.log(`  Completed in AnyLinux-Metadata: ${targetCompleted.length} (${progressPercent}%)`);
  console.log(`  Pending Backlog: ${targetPending.length}\n`);

  // Write status.json
  const statusData = {
    updatedAt: new Date().toISOString(),
    totalAnylinuxApps: apps.length,
    flathubCoveredCount: flathubCovered.length,
    targetCount: targetTotal,
    completedCount: targetCompleted.length,
    pendingCount: targetPending.length,
    progressPercent,
    completed: targetCompleted,
    pending: targetPending,
    flathubCovered: flathubCovered.map((a) => a.name),
  };
  await writeFile(statusJsonPath, JSON.stringify(statusData, null, 2) + "\n");

  // Write STATUS.md
  let md = `# Catalog Coverage and Status Dashboard\n\n`;
  md += `*Last synchronized: ${new Date().toISOString().split("T")[0]}*\n\n`;
  md += `| Metric | Count | Details |\n`;
  md += `| :--- | :--- | :--- |\n`;
  md += `| **Total AnyLinux AppImages** | \`${apps.length}\` | [pkgforge-dev/Anylinux-AppImages](https://github.com/pkgforge-dev/Anylinux-AppImages) |\n`;
  md += `| **Flathub Covered** | \`${flathubCovered.length}\` | Handled directly by Flathub AppStream |\n`;
  md += `| **Target Database Apps** | \`${targetTotal}\` | Exclusive non-Flathub apps requiring metadata |\n`;
  md += `| **Completed Manifests** | \`${targetCompleted.length}\` (\`${progressPercent}%\`) | Fully validated and ready |\n`;
  md += `| **Pending Backlog** | \`${targetPending.length}\` | Pending manifest creation or verification |\n\n`;

  md += `## Completed Applications (${targetCompleted.length})\n\n`;
  if (targetCompleted.length === 0) {
    md += `*No applications completed yet. Run \`bun run import\` to scaffold from Portable-Linux-Apps.*\n\n`;
  } else {
    md += `| Application | Manifest | Release Source |\n`;
    md += `| :--- | :--- | :--- |\n`;
    for (const a of targetCompleted) {
      md += `| **${a.name}** | [\`apps/${a.slug}.json\`](apps/${a.slug}.json) | [\`${a.repo}\`](${a.url}) |\n`;
    }
    md += `\n`;
  }

  md += `## Pending Backlog (${targetPending.length})\n\n`;
  md += `To submit an application, use the [Application Submission Form](../../issues/new?template=add-app.yml) or the [Web Editor](https://pkgforge-dev.github.io/Anylinux-Metadata/).\n\n`;
  md += `| Application | Slug | Release Source |\n`;
  md += `| :--- | :--- | :--- |\n`;
  for (const a of targetPending.slice(0, 100)) {
    md += `| **${a.name}** | \`${a.slug}\` | [\`${a.repo}\`](${a.url}) |\n`;
  }
  if (targetPending.length > 100) {
    md += `\n*... and ${targetPending.length - 100} more applications.*\n`;
  }

  await writeFile(statusMdPath, md);
  console.log(`Updated STATUS.md and status.json`);
}

// Only execute when run directly
const isDirectRun = process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
if (isDirectRun) {
  main().catch((err) => {
    console.error("Sync error:", err);
    process.exit(1);
  });
}
