import { z } from "zod";
import parseSpdxExpression from "spdx-expression-parse";
import { mainCategories, registeredCategories } from "./category-registry.ts";
import { sandboxV1Schema } from "./sandbox-v1.ts";

export const httpsUrlSchema = z.string().url().refine((value) => new URL(value).protocol === "https:", {
  message: "Must be a valid HTTPS URL",
});

export const applicationSlugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens (e.g. 'htop', 'ghostty-ide')");

export const architectureSchema = z
  .string()
  .regex(/^[a-z0-9][a-z0-9_+-]*$/)
  .describe("Linux architecture name (e.g. x86_64, aarch64)");

const assetPattern = z
  .string()
  .min(1)
  .refine(
    (pattern) => !pattern.includes("/") && pattern.endsWith(".AppImage"),
    "Must be a filename pattern ending in .AppImage"
  );

export const releaseSourceSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("github"),
      repository: z.string().regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/, "Must be owner/repo"),
    })
    .strict(),
  z
    .object({
      type: z.literal("gitlab"),
      repository: z.string().regex(/^[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)+$/),
    })
    .strict(),
  z
    .object({
      type: z.literal("codeberg"),
      repository: z.string().regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/),
    })
    .strict(),
  z
    .object({
      type: z.literal("feed"),
      url: httpsUrlSchema,
    })
    .strict(),
]);

export const originSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("third-party") }).strict(),
  z
    .object({
      type: z.literal("upstream"),
      evidence: z
        .object({
          method: z.enum(["upstream-repository", "upstream-link"]),
          url: httpsUrlSchema,
        })
        .strict(),
    })
    .strict(),
]);

const categorySchema = z
  .string()
  .refine((cat) => registeredCategories.has(cat), "Must be a registered Freedesktop category");

function isSpdxExpression(value: string) {
  try {
    parseSpdxExpression(value);
    return true;
  } catch {
    return false;
  }
}

export const descriptionTextSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("text"), value: z.string().min(1).max(10_000) }).strict(),
  z.object({ type: z.literal("emphasis"), value: z.string().min(1).max(10_000) }).strict(),
  z.object({ type: z.literal("code"), value: z.string().min(1).max(10_000) }).strict(),
]);

export const descriptionBlockSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("paragraph"),
      content: z.array(descriptionTextSchema).min(1).max(100),
    })
    .strict(),
  z
    .object({
      type: z.enum(["ordered-list", "unordered-list"]),
      items: z.array(z.array(descriptionTextSchema).min(1).max(100)).min(1).max(100),
    })
    .strict(),
]);

export const developerSchema = z
  .object({
    name: z.string().min(1).max(100),
    url: httpsUrlSchema.optional(),
  })
  .strict();

export const projectLinkTypeSchema = z.enum([
  "bugtracker",
  "help",
  "contact",
  "donation",
  "translate",
  "contribute",
  "faq",
]);

export const contentRatingSchema = z
  .object({
    scheme: z.string().min(1).max(50).optional(),
    label: z.string().min(1).max(100).optional(),
    minimumAge: z.number().int().min(0).max(21).optional(),
    warnings: z.array(z.string().min(1).max(500)).max(50).optional(),
  })
  .strict()
  .refine((rating) => Object.values(rating).some((val) => val !== undefined), {
    message: "Content rating must not be empty",
  });

export const mimeTypeSchema = z
  .string()
  .regex(/^[a-z0-9][a-z0-9!#$&^_.+-]*\/[a-z0-9][a-z0-9!#$&^_.+-]*$/i, "Must be a valid MIME type");

export const appstreamMetadataSchema = z
  .object({
    id: z
      .string()
      .min(2)
      .max(255)
      .regex(/^[A-Za-z0-9][A-Za-z0-9._-]+$/, "Must be a reverse-DNS identifier (e.g. io.github.user.app)"),
    name: z.string().min(1).max(100),
    summary: z
      .string()
      .min(1)
      .max(200)
      .refine((s) => !s.endsWith("."), "Summary must not end with a period per AppStream spec"),
    description: z
      .array(descriptionBlockSchema)
      .min(1)
      .max(100)
      .refine((blocks) => JSON.stringify(blocks).length <= 100_000, "Description is too large"),
    projectLicense: z
      .string()
      .min(1)
      .max(100)
      .refine(isSpdxExpression, "Must be a valid SPDX license expression (e.g. MIT, GPL-3.0-or-later, Apache-2.0)"),
    developer: developerSchema,
    homepage: httpsUrlSchema,
    repository: httpsUrlSchema.optional(),
    links: z.record(projectLinkTypeSchema, httpsUrlSchema).optional(),
    contentRating: contentRatingSchema.optional(),
    keywords: z
      .array(z.string().min(1).max(100))
      .max(50)
      .refine(
        (keywords) => new Set(keywords.map((k) => k.toLowerCase())).size === keywords.length,
        "Keywords must be unique"
      )
      .optional(),
    categories: z
      .array(categorySchema)
      .min(1)
      .max(20)
      .refine((cats) => new Set(cats).size === cats.length, "Categories must be unique")
      .refine(
        (cats) => cats.some((cat) => mainCategories.has(cat)),
        "At least one registered main category is required (e.g. System, Utility, AudioVideo, Game, Development)"
      ),
    mimeTypes: z
      .array(mimeTypeSchema)
      .max(100)
      .refine(
        (mimes) => new Set(mimes.map((m) => m.toLowerCase())).size === mimes.length,
        "MIME types must be unique"
      )
      .optional(),
  })
  .strict();

export const upstreamMediaSchema = z
  .object({
    icon: httpsUrlSchema,
    screenshots: z
      .array(
        z
          .object({
            caption: z.string().min(1).max(200),
            source: httpsUrlSchema,
          })
          .strict()
      )
      .min(1, "At least 1 screenshot is required")
      .max(5, "Maximum 5 screenshots allowed"),
  })
  .strict();

export const appManifestSchema = z
  .object({
    $schema: z.string().optional(),
    appstream: z
      .object({
        type: z.literal("manual"),
        metadata: appstreamMetadataSchema,
        media: upstreamMediaSchema,
      })
      .strict(),
    addedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be ISO date YYYY-MM-DD"),
    origin: originSchema,
    releaseSource: releaseSourceSchema,
    sandbox: sandboxV1Schema,
    assets: z
      .record(architectureSchema, assetPattern)
      .refine((assets) => Object.keys(assets).length > 0, "At least one asset is required")
      .optional(),
  })
  .strict()
  .describe("Anylinux Application Metadata Manifest");

export type AppManifest = z.infer<typeof appManifestSchema>;
export type AppstreamMetadata = z.infer<typeof appstreamMetadataSchema>;
