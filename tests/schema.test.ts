import { describe, it as test } from "node:test";
import assert from "node:assert/strict";
import { appManifestSchema, applicationSlugSchema } from "../schema/schema.ts";

describe("Schema Validation Tests", () => {
  test("Validates a compliant app manifest", () => {
    const validManifest = {
      $schema: "https://raw.githubusercontent.com/pkgforge-dev/Anylinux-Metadata/main/schema/app-manifest.json",
      appstream: {
        type: "manual",
        metadata: {
          id: "io.github.htop_dev.htop",
          name: "htop",
          summary: "Interactive process viewer",
          description: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  value: "htop is an interactive process viewer for Unix systems. It shows system resource use and lets users inspect, filter, sort, and manage running processes from a terminal.",
                },
              ],
            },
          ],
          projectLicense: "GPL-2.0-or-later",
          developer: {
            name: "htop developers",
            url: "https://github.com/htop-dev",
          },
          homepage: "https://htop.dev/",
          repository: "https://github.com/htop-dev/htop",
          keywords: ["processes", "monitor", "terminal", "system"],
          categories: ["System", "Monitor", "ConsoleOnly"],
        },
        media: {
          icon: "https://raw.githubusercontent.com/htop-dev/htop/main/htop.png",
          screenshots: [
            {
              caption: "Process list and system meters",
              source: "https://raw.githubusercontent.com/htop-dev/htop/main/docs/images/screenshot.png",
            },
          ],
        },
      },
      addedAt: "2026-08-20",
      origin: {
        type: "third-party",
      },
      releaseSource: {
        type: "github",
        repository: "pkgforge-dev/htop-AppImage",
      },
      sandbox: {
        network: "none",
        display: "none",
        audio: "none",
        processes: "full",
        ipc: false,
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

    const parsed = appManifestSchema.safeParse(validManifest);
    assert.equal(parsed.success, true);
  });

  test("Rejects summary with trailing period", () => {
    const invalidSummary = {
      appstream: {
        type: "manual",
        metadata: {
          id: "io.github.example.app",
          name: "Example",
          summary: "This ends with a period.",
          description: [
            {
              type: "paragraph",
              content: [{ type: "text", value: "Valid description." }],
            },
          ],
          projectLicense: "MIT",
          developer: { name: "Dev" },
          homepage: "https://example.com",
          categories: ["Utility"],
        },
        media: {
          icon: "https://example.com/icon.png",
          screenshots: [{ caption: "SS", source: "https://example.com/ss.png" }],
        },
      },
      addedAt: "2026-09-16",
      origin: { type: "third-party" },
      releaseSource: { type: "github", repository: "user/repo" },
      sandbox: {
        network: "none",
        display: "none",
        audio: "none",
        processes: "isolated",
        ipc: false,
        filesystem: [],
        devices: [],
        sessionBus: { access: "none", rules: [] },
        systemBus: { access: "none", rules: [] },
      },
    };

    const result = appManifestSchema.safeParse(invalidSummary);
    assert.equal(result.success, false);
  });

  test("Rejects invalid SPDX license expression", () => {
    const invalidLicense = {
      appstream: {
        type: "manual",
        metadata: {
          id: "io.github.example.app",
          name: "Example",
          summary: "Valid summary",
          description: [
            {
              type: "paragraph",
              content: [{ type: "text", value: "Valid description." }],
            },
          ],
          projectLicense: "NOT-A-REAL-SPDX-LICENSE-12345",
          developer: { name: "Dev" },
          homepage: "https://example.com",
          categories: ["Utility"],
        },
        media: {
          icon: "https://example.com/icon.png",
          screenshots: [{ caption: "SS", source: "https://example.com/ss.png" }],
        },
      },
      addedAt: "2026-09-16",
      origin: { type: "third-party" },
      releaseSource: { type: "github", repository: "user/repo" },
      sandbox: {
        network: "none",
        display: "none",
        audio: "none",
        processes: "isolated",
        ipc: false,
        filesystem: [],
        devices: [],
        sessionBus: { access: "none", rules: [] },
        systemBus: { access: "none", rules: [] },
      },
    };

    const result = appManifestSchema.safeParse(invalidLicense);
    assert.equal(result.success, false);
  });

  test("Validates application slugs", () => {
    assert.equal(applicationSlugSchema.safeParse("htop").success, true);
    assert.equal(applicationSlugSchema.safeParse("ghostty-ide").success, true);
    assert.equal(applicationSlugSchema.safeParse("12to11").success, true);
    assert.equal(applicationSlugSchema.safeParse("App_Name").success, false);
    assert.equal(applicationSlugSchema.safeParse("invalid slug").success, false);
  });
});
