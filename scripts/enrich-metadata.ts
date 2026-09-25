import { readFile, writeFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { appManifestSchema, type AppManifest } from "../schema/schema.ts";
import { mainCategories, additionalCategories } from "../schema/category-registry.ts";

const currentDir = import.meta.dirname ?? dirname(fileURLToPath(import.meta.url));
const appsDir = resolve(currentDir, "../apps");

function stripEmojis(text: string): string {
  return text.replace(/[\u{10000}-\u{10ffff}\u{2600}-\u{27bf}\u{2300}-\u{23ff}\u{2b50}-\u{2b55}\u{203c}\u{2049}\u{2139}\u{2194}-\u{2199}\u{21a9}-\u{21aa}\u{2934}-\u{2935}\u{25aa}-\u{25ab}\u{25b6}\u{25c0}\u{25fb}-\u{25fe}]/gu, "").trim();
}

// Clean string helper that ensures no trailing period
function cleanSummary(summary: string): string {
  let clean = stripEmojis(summary).trim();
  while (clean.endsWith(".")) {
    clean = clean.slice(0, -1).trim();
  }
  return clean;
}

// Parse upstream GitHub/GitLab repository from manifest
interface UpstreamRepo {
  platform: "github" | "gitlab";
  owner: string;
  repo: string;
}

function findUpstreamRepos(manifest: any): UpstreamRepo[] {
  const urlsToCheck = [
    manifest.appstream?.metadata?.homepage,
    manifest.appstream?.metadata?.developer?.url,
    manifest.appstream?.metadata?.repository,
    manifest.releaseSource?.type === "github" ? `https://github.com/${manifest.releaseSource.repository}` : null,
  ].filter(Boolean) as string[];

  const repos: UpstreamRepo[] = [];
  const seen = new Set<string>();

  for (const url of urlsToCheck) {
    const match = url.match(/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)/);
    if (match) {
      const owner = match[1];
      const repo = match[2].replace(/\.git$/, "");
      const key = `${owner.toLowerCase()}/${repo.toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        if (owner.toLowerCase() !== "pkgforge-dev") {
          repos.unshift({ platform: "github", owner, repo });
        } else {
          repos.push({ platform: "github", owner, repo });
        }
      }
    }
  }

  return repos;
}

function extractTextFromDescription(desc: any): string {
  if (!Array.isArray(desc)) return "";
  const parts: string[] = [];
  for (const block of desc) {
    if (block?.type === "paragraph" && Array.isArray(block.content)) {
      for (const item of block.content) {
        if (item?.value) parts.push(item.value);
      }
    } else if ((block?.type === "unordered-list" || block?.type === "ordered-list") && Array.isArray(block.items)) {
      for (const itemArr of block.items) {
        if (Array.isArray(itemArr)) {
          for (const item of itemArr) {
            if (item?.value) parts.push(item.value);
          }
        }
      }
    }
  }
  return parts.join("\n");
}

// Fetch raw README from upstream repositories
async function fetchUpstreamReadme(repos: UpstreamRepo[]): Promise<{ content: string; branch: string; repo: UpstreamRepo } | null> {
  const branches = ["main", "master", "HEAD"];
  let fallback: { content: string; branch: string; repo: UpstreamRepo } | null = null;

  for (const repo of repos) {
    if (repo.platform === "github") {
      for (const branch of branches) {
        const url = `https://raw.githubusercontent.com/${repo.owner}/${repo.repo}/${branch}/README.md`;
        try {
          const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
          if (res.ok) {
            const content = await res.text();
            if (content && content.trim().length > 50) {
              return { content, branch, repo };
            } else if (content && content.trim().length > 0 && !fallback) {
              fallback = { content, branch, repo };
            }
          }
        } catch {
          // try next branch
        }
      }
    }
  }
  return fallback;
}

// Extract and verify image candidates from README
const IGNORED_IMAGE_PATTERNS = [
  "shields.io",
  "badge",
  "travis-ci",
  "github.com/sponsors",
  "opencollective",
  "paypal",
  "buymeacoffee",
  "wakatime",
  "codecov",
  "coveralls",
  "sonarcloud",
  "license",
  "discord.com/api/guilds",
  "matrix.to",
  "banner.png",
  "itsfoss-logo",
];

async function findRepoImages(upstream: UpstreamRepo, branch: string): Promise<string[]> {
  const commonPaths = ["docs/images", "docs/screenshots", "screenshots", "assets", "media"];
  const found: string[] = [];

  for (const p of commonPaths) {
    const apiUrl = `https://api.github.com/repos/${upstream.owner}/${upstream.repo}/contents/${p}?ref=${branch}`;
    try {
      const res = await fetch(apiUrl, {
        headers: { "User-Agent": "AnyLinux-Metadata-Enricher/1.0" },
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const files: any[] = await res.json();
        if (Array.isArray(files)) {
          for (const file of files) {
            if (file.download_url && /\.(png|jpe?g|webp)$/i.test(file.name)) {
              if (!IGNORED_IMAGE_PATTERNS.some((pat) => file.name.toLowerCase().includes(pat))) {
                found.push(file.download_url);
                if (found.length >= 6) return found;
              }
            }
          }
        }
      }
    } catch {
      // ignore network errors
    }
  }
  return found;
}

async function extractVerifiedImages(readme: string, upstream: UpstreamRepo, branch: string): Promise<string[]> {
  const urls: string[] = [];

  // Match markdown images: ![alt](url)
  const mdRegex = /!\[.*?\]\((https?:\/\/[^\s\)]+|[^\s\)]+)\)/g;
  let match;
  while ((match = mdRegex.exec(readme)) !== null) {
    urls.push(match[1]);
  }

  // Match HTML images: <img ... src="url" ...>
  const htmlRegex = /<img[^>]+src=["'](https?:\/\/[^"'>]+|[^"'>]+)["'][^>]*>/gi;
  while ((match = htmlRegex.exec(readme)) !== null) {
    urls.push(match[1]);
  }

  const candidates: string[] = [];
  for (let rawUrl of urls) {
    rawUrl = rawUrl.trim();
    if (IGNORED_IMAGE_PATTERNS.some((pat) => rawUrl.toLowerCase().includes(pat))) {
      continue;
    }

    let absoluteUrl = rawUrl;
    if (!rawUrl.startsWith("http://") && !rawUrl.startsWith("https://")) {
      const cleanPath = rawUrl.replace(/^\.?\//, "");
      absoluteUrl = `https://raw.githubusercontent.com/${upstream.owner}/${upstream.repo}/${branch}/${cleanPath}`;
    }

    if (!candidates.includes(absoluteUrl)) {
      candidates.push(absoluteUrl);
    }
  }

  // If no candidates from README, search common image folders in repo
  if (candidates.length === 0) {
    const extra = await findRepoImages(upstream, branch);
    candidates.push(...extra);
  }

  // Verify candidate URLs with HTTP HEAD / GET
  const verified: string[] = [];
  for (const url of candidates.slice(0, 10)) {
    try {
      let res = await fetch(url, {
        method: "HEAD",
        signal: AbortSignal.timeout(4000),
        headers: { "User-Agent": "Mozilla/5.0 (X11; Linux x86_64)" },
      });
      // Fallback to GET for S3 / user-attachments that reject HEAD
      if (res.status === 403 || res.status === 405) {
        res = await fetch(url, {
          method: "GET",
          signal: AbortSignal.timeout(4000),
          headers: { "User-Agent": "Mozilla/5.0 (X11; Linux x86_64)" },
        });
      }
      if (res.ok || res.status === 302 || res.status === 301) {
        const contentType = res.headers.get("content-type") || "";
        // If content-type is an image or GitHub asset redirect
        if (contentType.includes("image") || url.includes("/user-attachments/assets/") || url.includes("raw.githubusercontent.com")) {
          verified.push(url);
        }
      }
    } catch {
      // skip broken link
    }
  }

  return verified;
}

// Call agy CLI to run Gemini Flash structured query
async function queryGemini(prompt: string, model: string = "gemini-3.8-flash-low"): Promise<any> {
  return new Promise((resolvePromise, reject) => {
    const proc = spawn("agy", ["--print", prompt, "--model", model]);
    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });
    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error(`agy exited with code ${code}: ${stderr}`));
      }
      try {
        let text = stdout.trim();
        // Remove markdown code fences if wrapped
        if (text.startsWith("```json")) {
          text = text.slice(7);
        } else if (text.startsWith("```")) {
          text = text.slice(3);
        }
        if (text.endsWith("```")) {
          text = text.slice(0, -3);
        }
        text = text.trim();
        const parsed = JSON.parse(text);
        resolvePromise(parsed);
      } catch (err: any) {
        reject(new Error(`Failed to parse agy JSON: ${err.message}\nRaw output:\n${stdout}`));
      }
    });

    proc.on("error", (err) => {
      reject(err);
    });
  });
}

// Build prompt for an application
function buildPrompt(slug: string, manifest: any, readmeContent: string, verifiedImages: string[]): string {
  const currentSummary = manifest.appstream?.metadata?.summary || "";
  const currentName = manifest.appstream?.metadata?.name || slug;

  const validMainList = Array.from(mainCategories).join(", ");
  const validAddList = Array.from(additionalCategories).slice(0, 50).join(", ");

  return `You are an expert Linux AppStream metadata curator. Generate high quality, authentic AppStream metadata for the Linux app described below.

APPLICATION: ${currentName} (slug: ${slug})
CURRENT SUMMARY: ${currentSummary}

UPSTREAM README EXCERPT:
"""
${readmeContent.slice(0, 3500)}
"""

VERIFIED CANDIDATE SCREENSHOT URLS:
${JSON.stringify(verifiedImages, null, 2)}

VALID APPSTREAM CATEGORIES:
Main Categories (must pick 1 or 2): ${validMainList}
Additional Categories: ${validAddList}

RULES:
1. Summary: A single, engaging sentence under 140 characters describing what the application does.
   STRICT RULE: MUST NOT end with a period (AppStream 1.0 specification requirement).
2. Description: High-quality AST block array (type 'paragraph' and 'unordered-list').
   - Paragraph 1: What the application is, its main technology/stack, and core goal.
   - Optional Paragraph 2: Secondary context or highlight if relevant.
   - Unordered list: 4 to 6 specific, tangible features extracted from the README.
   Each paragraph and list item must be structured strictly as:
   { "type": "paragraph", "content": [ { "type": "text", "value": "..." } ] }
   { "type": "unordered-list", "items": [ [ { "type": "text", "value": "..." } ], ... ] }
3. Keywords: 5 to 10 lowercase, descriptive search tags (e.g. technical features, app type, protocols).
   DO NOT include generic boilerplate like 'appimage' or 'anylinux' or the app slug itself.
4. Categories: 1 or 2 Freedesktop Main Categories + 1 to 3 valid additional categories.
5. Screenshots: Select 1 to 4 genuine interface screenshots from the VERIFIED CANDIDATE SCREENSHOT URLS above.
   Write a clean, descriptive caption for each (e.g. '${currentName} main chat interface with server sidebar').
   If no candidates represent real interface screenshots (or candidates list is empty), return an empty array [].
   NEVER invent or hallucinate image URLs. Only use URLs from the verified candidates list.
6. NO EMOJIS: Do not use any emojis in summaries, descriptions, captions, or keywords.

Output MUST be raw JSON with this exact structure:
{
  "summary": "...",
  "description": [ ... ],
  "keywords": [ "...", "..." ],
  "categories": [ "...", "..." ],
  "screenshots": [
    { "caption": "...", "source": "..." }
  ]
}`;
}

export async function enrichApp(file: string, options: { dryRun?: boolean; force?: boolean; model?: string } = {}) {
  const filePath = resolve(appsDir, file);
  const slug = basename(file, ".json");
  const raw = await readFile(filePath, "utf8");
  const manifest = JSON.parse(raw);

  console.log(`\n========================================`);
  console.log(`Processing ${slug} (${file})...`);

  const upstreams = findUpstreamRepos(manifest);
  if (upstreams.length === 0) {
    console.log(`[${slug}] No upstream repository found in manifest. Skipping.`);
    return;
  }
  console.log(`[${slug}] Upstream candidates: ${upstreams.map(u => `${u.owner}/${u.repo}`).join(", ")}`);

  const readmeResult = await fetchUpstreamReadme(upstreams);
  let readmeContent = "";
  let activeRepo = upstreams[0];
  let activeBranch = "HEAD";

  if (readmeResult && readmeResult.content.trim().length > 30) {
    readmeContent = readmeResult.content;
    activeRepo = readmeResult.repo;
    activeBranch = readmeResult.branch;
    console.log(`[${slug}] Fetched README from ${activeRepo.owner}/${activeRepo.repo} (${readmeContent.length} bytes, branch ${activeBranch})`);
  } else {
    const existingDesc = extractTextFromDescription(manifest.appstream?.metadata?.description);
    readmeContent = `Application: ${manifest.appstream?.metadata?.name || slug}\nSummary: ${manifest.appstream?.metadata?.summary || ""}\n${existingDesc}`;
    console.log(`[${slug}] Notice: Upstream README is minimal or missing. Falling back to manifest context and domain knowledge.`);
  }

  // Extract candidate images from README or across candidate repos
  let verifiedImages: string[] = [];
  if (readmeResult?.content) {
    verifiedImages = await extractVerifiedImages(readmeResult.content, activeRepo, activeBranch);
  }
  if (verifiedImages.length === 0) {
    for (const repo of upstreams) {
      const extra = await findRepoImages(repo, "HEAD");
      if (extra.length > 0) {
        verifiedImages = extra;
        break;
      }
    }
  }

  console.log(`[${slug}] Found ${verifiedImages.length} verified image candidate(s):`);
  for (const img of verifiedImages) {
    console.log(`  - ${img}`);
  }

  const prompt = buildPrompt(slug, manifest, readmeContent, verifiedImages);
  console.log(`[${slug}] Querying Gemini Flash via agy...`);
  const enriched = await queryGemini(prompt, options.model || "gemini-3.8-flash-low");

  // Validate and clean results
  const summary = cleanSummary(enriched.summary || manifest.appstream.metadata.summary);
  const description = enriched.description || manifest.appstream.metadata.description;
  const keywords = (enriched.keywords || []).map((k: string) => stripEmojis(k).toLowerCase().trim()).filter(Boolean);
  const categories = enriched.categories || manifest.appstream.metadata.categories;
  const screenshots = (enriched.screenshots || []).map((s: any) => ({
    caption: stripEmojis(s.caption).trim(),
    source: s.source.trim(),
  }));

  console.log(`\n--- Result for ${slug} ---`);
  console.log(`Summary: "${summary}"`);
  console.log(`Keywords (${keywords.length}):`, keywords);
  console.log(`Categories:`, categories);
  console.log(`Screenshots (${screenshots.length}):`);
  for (const s of screenshots) {
    console.log(`  - [${s.caption}] -> ${s.source}`);
  }

  // Update manifest clone
  const updatedManifest = JSON.parse(JSON.stringify(manifest));
  updatedManifest.appstream.metadata.summary = summary;
  updatedManifest.appstream.metadata.description = description;
  updatedManifest.appstream.metadata.keywords = keywords;
  updatedManifest.appstream.metadata.categories = categories;

  // Handle screenshots
  if (screenshots.length > 0) {
    updatedManifest.appstream.media.screenshots = screenshots;
  } else {
    // If no real screenshots were found in upstream repo, preserve existing to satisfy schema's min(1) constraint
    console.log(`[${slug}] Notice: No real screenshot found in upstream repo. Preserving existing screenshot.`);
  }

  // Schema validate
  const check = appManifestSchema.safeParse(updatedManifest);
  if (!check.success) {
    console.error(`[${slug}] Schema validation error on enriched data:`);
    for (const issue of check.error.issues) {
      console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
    }
    return;
  }

  if (options.dryRun) {
    console.log(`[${slug}] Dry-run enabled. Manifest not written.`);
  } else {
    await writeFile(filePath, JSON.stringify(updatedManifest, null, 2) + "\n", "utf8");
    console.log(`[${slug}] Successfully written to ${file}!`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const force = args.includes("--force");
  const modelArg = args.find((a) => a.startsWith("--model="))?.split("=")[1];
  const targetSlug = args.find((a) => !a.startsWith("--"));

  const isBacklog = args.includes("--backlog");

  if (targetSlug) {
    const file = targetSlug.endsWith(".json") ? targetSlug : `${targetSlug}.json`;
    if (!existsSync(resolve(appsDir, file))) {
      console.error(`File apps/${file} not found.`);
      process.exit(1);
    }
    await enrichApp(file, { dryRun, force, model: modelArg });
  } else if (isBacklog) {
    const statusPath = resolve(currentDir, "../status.json");
    const status = JSON.parse(await readFile(statusPath, "utf8"));
    const pendingSlugs = status.pending.map((p: any) => `${p.slug}.json`);
    console.log(`Starting sequential metadata enrichment for ${pendingSlugs.length} backlog apps...`);
    let count = 0;
    for (const file of pendingSlugs) {
      count++;
      console.log(`\n[${count}/${pendingSlugs.length}] Processing backlog app ${file}...`);
      try {
        await enrichApp(file, { dryRun, force, model: modelArg });
      } catch (err: any) {
        console.error(`Error processing ${file}: ${err.message}`);
      }
    }
  } else {
    const files = (await readdir(appsDir)).filter((f) => f.endsWith(".json")).sort();
    console.log(`Starting sequential metadata enrichment for ${files.length} apps...`);
    let count = 0;
    for (const file of files) {
      count++;
      console.log(`\n[${count}/${files.length}] Checking ${file}...`);
      try {
        await enrichApp(file, { dryRun, force, model: modelArg });
      } catch (err: any) {
        console.error(`Error processing ${file}: ${err.message}`);
      }
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error("Enrichment failed:", err);
    process.exit(1);
  });
}
