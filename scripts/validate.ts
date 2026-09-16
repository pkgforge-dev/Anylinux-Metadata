import { readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, basename } from "node:path";
import { appManifestSchema, applicationSlugSchema } from "../schema/schema.ts";

const appsDir = resolve(import.meta.dir, "../apps");
const iconsDir = resolve(import.meta.dir, "../icons");

async function validateAll() {
  if (!existsSync(appsDir)) {
    console.log("No apps/ directory found. Run the importer to populate apps.");
    return;
  }

  const files = (await readdir(appsDir)).filter((f) => f.endsWith(".json"));
  console.log(`\nValidating ${files.length} application manifest(s) in apps/...\n`);

  let errorCount = 0;
  const seenSlugs = new Set<string>();
  const seenAppIds = new Map<string, string>();

  for (const file of files) {
    const slug = basename(file, ".json");
    const filePath = resolve(appsDir, file);

    // 1. Slug format validation
    const slugCheck = applicationSlugSchema.safeParse(slug);
    if (!slugCheck.success) {
      console.error(`FAIL [${file}]: Invalid filename slug "${slug}". Must be lowercase alphanumeric with hyphens.`);
      errorCount++;
      continue;
    }

    if (seenSlugs.has(slug)) {
      console.error(`FAIL [${file}]: Duplicate slug "${slug}".`);
      errorCount++;
    }
    seenSlugs.add(slug);

    // 2. Read & JSON parse
    let content: string;
    let json: any;
    try {
      content = await readFile(filePath, "utf8");
      json = JSON.parse(content);
    } catch (err: any) {
      console.error(`FAIL [${file}]: Invalid JSON syntax - ${err.message}`);
      errorCount++;
      continue;
    }

    // 3. Zod schema validation
    const result = appManifestSchema.safeParse(json);
    if (!result.success) {
      console.error(`FAIL [${file}]: Schema validation failed:`);
      for (const issue of result.error.issues) {
        const path = issue.path.join(".");
        console.error(`  - ${path || "root"}: ${issue.message}`);
      }
      errorCount++;
      continue;
    }

    const manifest = result.data;
    const appId = manifest.appstream.metadata.id;

    // 4. Global AppStream ID uniqueness
    if (seenAppIds.has(appId)) {
      console.error(`FAIL [${file}]: Duplicate AppStream ID "${appId}" (already used in ${seenAppIds.get(appId)}).`);
      errorCount++;
    } else {
      seenAppIds.set(appId, file);
    }

    // 5. Check local icon if it points to repo icons/
    const iconUrl = manifest.appstream.media.icon;
    if (iconUrl.includes("Anylinux-Metadata/main/icons/") || iconUrl.includes("Anylinux-Metadata/master/icons/")) {
      const iconFilename = iconUrl.split("/").pop();
      if (iconFilename && !existsSync(resolve(iconsDir, iconFilename))) {
        console.error(`FAIL [${file}]: Referenced icon "${iconFilename}" not found in icons/ directory.`);
        errorCount++;
      }
    }
  }

  if (errorCount > 0) {
    console.error(`\nValidation failed with ${errorCount} error(s).\n`);
    process.exit(1);
  } else {
    console.log(`All ${files.length} application manifests passed validation.\n`);
  }
}

validateAll().catch((err) => {
  console.error("Fatal validation runner error:", err);
  process.exit(1);
});
