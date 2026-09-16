import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

interface AppImageEntry {
  name: string;
  url: string;
  repo: string;
  slug: string;
}

const currentDir = import.meta.dirname ?? dirname(fileURLToPath(import.meta.url));
const localAnylinuxPath = process.env.ANYLINUX_DIR
  ? resolve(process.env.ANYLINUX_DIR, "README.md")
  : resolve(process.env.HOME || "", "code/Anylinux-AppImages/README.md");
const remoteAnylinuxUrl = "https://raw.githubusercontent.com/pkgforge-dev/Anylinux-AppImages/main/README.md";
const cacheDir = resolve(currentDir, "../.cache");
const appsDir = resolve(currentDir, "../apps");
const statusMdPath = resolve(currentDir, "../STATUS.md");
const statusJsonPath = resolve(currentDir, "../status.json");

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function getAnylinuxApps(): Promise<AppImageEntry[]> {
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
  let inAppsList = false;

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

async function getFlathubAppIds(): Promise<Set<string>> {
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

async function checkFlathubPresence(entry: AppImageEntry, flathubIds: Set<string>, knownFlathub: Set<string>): Promise<boolean> {
  const normalized = entry.name.toLowerCase().replace(/[^a-z0-9]/g, "");

  // 1. Check known list
  if (knownFlathub.has(normalized)) return true;

  // 2. Exact match against end segment or reverse-DNS in Flathub IDs
  for (const id of flathubIds) {
    const parts = id.toLowerCase().split(".");
    const lastPart = parts[parts.length - 1];
    if (lastPart === normalized) return true;
  }

  return false;
}

async function main() {
  console.log("Synchronizing AnyLinux-Metadata with upstream and Flathub...\n");

  const apps = await getAnylinuxApps();
  console.log(`Found ${apps.length} applications in pkgforge-dev/Anylinux-AppImages`);

  const flathubIds = await getFlathubAppIds();
  console.log(`Loaded ${flathubIds.size} Flathub application IDs`);

  // Load known flathub apps seed if available from apphub
  const knownFlathub = new Set<string>();
  const apphubFlathubFile = resolve(process.env.HOME || "", "code/apphub/flathub_apps.txt");
  if (existsSync(apphubFlathubFile)) {
    const lines = (await readFile(apphubFlathubFile, "utf8")).split("\n");
    for (const l of lines) {
      if (l.trim()) knownFlathub.add(l.trim().toLowerCase().replace(/[^a-z0-9]/g, ""));
    }
  }

  // Check existing apps in Anylinux-Metadata
  const existingSlugs = new Set<string>();
  if (existsSync(appsDir)) {
    const files = await readFile(appsDir, "utf8").catch(() => "");
  }
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
    const onFlathub = await checkFlathubPresence(app, flathubIds, knownFlathub);
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

main().catch((err) => {
  console.error("Sync error:", err);
  process.exit(1);
});
