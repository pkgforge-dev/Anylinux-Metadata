import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { zodToJsonSchema } from "zod-to-json-schema";
import { appManifestSchema } from "../schema/schema.ts";

const targetPath = resolve(import.meta.dir, "../schema/app-manifest.json");

mkdirSync(dirname(targetPath), { recursive: true });

const jsonSchema = zodToJsonSchema(appManifestSchema, {
  name: "AnylinuxAppManifest",
  $refStrategy: "none",
});

writeFileSync(targetPath, JSON.stringify(jsonSchema, null, 2) + "\n");
console.log(`Generated JSON Schema at ${targetPath}`);
