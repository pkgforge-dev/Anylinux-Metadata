import { describe, it as test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { appManifestSchema } from "../schema/schema.ts";
import { parseIssueBody, extractField } from "../scripts/parse-issue.ts";

const currentDir = import.meta.dirname ?? dirname(fileURLToPath(import.meta.url));
const rootDir = join(currentDir, "..");
const studioJs = readFileSync(join(rootDir, "web", "src", "js", "studio.js"), "utf-8");
const appJs = readFileSync(join(rootDir, "web", "app.js"), "utf-8");

function createMockElement(id = "") {
  const listeners: Record<string, Array<(...args: any[]) => void>> = {};
  return {
    id,
    value: "",
    dataset: {} as Record<string, string>,
    style: {} as Record<string, string>,
    innerHTML: "",
    innerText: "",
    checked: false,
    addEventListener(event: string, fn: (...args: any[]) => void) {
      listeners[event] = listeners[event] || [];
      listeners[event].push(fn);
    },
    click() {
      (listeners["click"] || []).forEach((fn) => fn());
    },
    trigger(event: string, data?: any) {
      (listeners[event] || []).forEach((fn) => fn(data));
    },
    appendChild() {},
    querySelectorAll() {
      return [];
    },
    querySelector() {
      return createMockElement();
    },
    remove() {},
    insertBefore() {}
  };
}

function setupStudioEnvironment() {
  const elements: Record<string, ReturnType<typeof createMockElement>> = {};
  function getElementById(id: string) {
    if (!elements[id]) {
      elements[id] = createMockElement(id);
    }
    return elements[id];
  }

  let capturedUrl = "";

  const sandbox: Record<string, any> = {
    document: {
      getElementById,
      querySelectorAll: () => [],
      querySelector: () => createMockElement(),
      createElement: () => createMockElement()
    },
    window: {
      open: (url: string) => {
        capturedUrl = url;
      }
    },
    Image: class {
      naturalWidth = 128;
      naturalHeight = 128;
    },
    Blob: class {
      size: number;
      constructor(arr: string[]) {
        this.size = arr.join("").length;
      }
    },
    catalogData: {
      ghostty: JSON.parse(readFileSync(join(rootDir, "apps", "ghostty.json"), "utf8"))
    },
    catalogList: [] as any[],
    currentSlug: "ghostty",
    categoryTags: ["System", "TerminalEmulator"],
    keywordTags: ["ghostty", "terminal"],
    featureBullets: ["Fast GPU rendering"],
    screenshotItems: [],
    MAIN_CATEGORIES: new Set([
      "AudioVideo", "Development", "Education", "Game", "Graphics",
      "Network", "Office", "Science", "Settings", "System", "Utility"
    ]),
    ICONS: { check: "", cross: "", trash: "" },
    escapeHtml: (s: string) => s || "",
    escapeAttr: (s: string) => s || "",
    getCurrentRepo: () => "pkgforge-dev/Anylinux-Metadata",
    getPrimaryIconUrl: () => "",
    handleIconError: () => {},
    showToast: () => {},
    copyTextToClipboard: () => {}
  };

  sandbox.catalogList = [{ slug: "ghostty", ...sandbox.catalogData.ghostty }];

  // Evaluate studio.js within the sandbox environment
  const wrappedCode = `
    with (sandbox) {
      ${studioJs}
      sandbox.initStudio = initStudio;
      sandbox.loadAppIntoStudio = loadAppIntoStudio;
      sandbox.resetStudioForm = resetStudioForm;
    }
  `;
  const fn = new Function("sandbox", wrappedCode);
  fn(sandbox);

  return {
    sandbox,
    getElementById,
    getCapturedUrl: () => capturedUrl
  };
}

describe("Authoring Studio: GitHub Issue Form Submissions", () => {
  test("1. Editing an existing application routes to update-app.yml template with zero data loss", () => {
    const { sandbox, getElementById, getCapturedUrl } = setupStudioEnvironment();

    sandbox.initStudio();
    sandbox.loadAppIntoStudio("ghostty");

    // Click 'Submit Issue Form'
    getElementById("btnSubmitGitHubIssue").click();

    const openedUrl = getCapturedUrl();
    assert.ok(openedUrl, "Expected window.open to be called with a GitHub URL");

    const parsedUrl = new URL(openedUrl);
    assert.equal(parsedUrl.searchParams.get("template"), "update-app.yml", "Existing app must use update-app.yml template");
    assert.equal(parsedUrl.searchParams.get("title"), "fix(app): update metadata for ghostty", "Title must follow fix(app) convention");
    assert.equal(parsedUrl.searchParams.get("slug"), "ghostty", "Slug param must match application slug");

    // Assert 'changes' parameter is populated and contains complete manifest JSON
    const changesParam = parsedUrl.searchParams.get("changes");
    assert.ok(changesParam, "Expected 'changes' query param to be present");

    const parsedManifest = JSON.parse(changesParam);
    const schemaValidation = appManifestSchema.safeParse(parsedManifest);
    assert.ok(schemaValidation.success, "Manifest in 'changes' must conform strictly to schema");

    // Verify critical metadata is NOT lost
    assert.ok(parsedManifest.sandbox, "Sandbox configuration must be preserved");
    assert.equal(parsedManifest.sandbox.network, "full", "Sandbox network permission must be preserved");
    assert.equal(parsedManifest.sandbox.display, "wayland-or-x11", "Sandbox display permission must be preserved");
    assert.equal(parsedManifest.sandbox.ipc, true, "Sandbox IPC permission must be preserved");
    assert.ok(parsedManifest.appstream.metadata.categories.includes("TerminalEmulator"), "Additional categories must be preserved");
    assert.ok(parsedManifest.appstream.metadata.keywords.includes("ghostty"), "Keywords must be preserved");
  });

  test("2. Creating a new application routes to add-app.yml template", () => {
    const { sandbox, getElementById, getCapturedUrl } = setupStudioEnvironment();

    sandbox.initStudio();
    sandbox.resetStudioForm();

    // Populate fields for a brand new application
    getElementById("appName").value = "Neovim";
    getElementById("appSlug").value = "neovim";
    getElementById("appId").value = "io.neovim.nvim";
    getElementById("summary").value = "Vim-fork focused on extensibility and usability";

    getElementById("btnSubmitGitHubIssue").click();

    const openedUrl = getCapturedUrl();
    assert.ok(openedUrl, "Expected window.open to be called with a GitHub URL");

    const parsedUrl = new URL(openedUrl);
    assert.equal(parsedUrl.searchParams.get("template"), "add-app.yml", "New app must use add-app.yml template");
    assert.equal(parsedUrl.searchParams.get("title"), "feat(app): add metadata for Neovim", "Title must follow feat(app) convention");
    assert.equal(parsedUrl.searchParams.get("slug"), "neovim", "Slug param must match new application slug");
    assert.equal(parsedUrl.searchParams.get("name"), "Neovim", "Name param must match new application name");
    assert.equal(parsedUrl.searchParams.get("app_id"), "io.neovim.nvim", "App ID param must match new application ID");
    assert.equal(parsedUrl.searchParams.get("summary"), "Vim-fork focused on extensibility and usability");
    assert.equal(parsedUrl.searchParams.has("changes"), false, "New app submission must not have 'changes' param");
  });

  test("3. Bundled web/app.js stays in sync with studio source implementation", () => {
    assert.ok(appJs.includes("update-app.yml"), "Bundled app.js must include update-app.yml reference");
    assert.ok(appJs.includes("fix(app): update metadata for"), "Bundled app.js must include update title format");
    assert.ok(appJs.includes("template=update-app.yml"), "Bundled app.js must generate update-app.yml query");
  });

  test("4. Issue-to-PR workflow parses update-app issues and preserves all fields", () => {
    const issueBody = `### Application Slug

linuxtoys

### Proposed JSON or Changes

\`\`\`json
{
  "$schema": "https://raw.githubusercontent.com/pkgforge-dev/Anylinux-Metadata/main/schema/app-manifest.json",
  "appstream": {
    "type": "manual",
    "metadata": {
      "id": "io.github.psygreg.linuxtoys",
      "name": "LinuxToys",
      "summary": "A collection of performance tweaks, system configuration tools, and optimization scripts for Linux desktops",
      "description": [
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "value": "LinuxToys is a collection of user-friendly performance tweaks."
            }
          ]
        }
      ],
      "projectLicense": "GPL-3.0-or-later",
      "developer": {
        "name": "LinuxToys Developers",
        "url": "https://github.com/psygreg/linuxtoys"
      },
      "homepage": "https://github.com/psygreg/linuxtoys",
      "repository": "https://github.com/pkgforge-dev/linuxtoys-appimage",
      "keywords": [
        "linuxtoys",
        "appimage",
        "anylinux"
      ],
      "categories": [
        "Utility"
      ]
    },
    "media": {
      "icon": "https://raw.githubusercontent.com/pkgforge-dev/Anylinux-Metadata/main/icons/linuxtoys.png",
      "screenshots": [
        {
          "caption": "LinuxToys interface screenshot 1",
          "source": "https://raw.githubusercontent.com/psygreg/linuxtoys/master/src/screenshot-light.webp"
        }
      ]
    }
  },
  "addedAt": "2026-09-23",
  "origin": {
    "type": "third-party"
  },
  "releaseSource": {
    "type": "github",
    "repository": "pkgforge-dev/LinuxToys-AppImage"
  },
  "sandbox": {
    "network": "full",
    "display": "wayland-or-x11",
    "audio": "none",
    "processes": "isolated",
    "ipc": true,
    "filesystem": [],
    "devices": [],
    "sessionBus": {
      "access": "none",
      "rules": []
    },
    "systemBus": {
      "access": "none",
      "rules": []
    }
  }
}
\`\`\``;

    const { slug, manifest } = parseIssueBody(issueBody);

    assert.equal(slug, "linuxtoys");
    assert.ok(manifest, "Manifest must be returned");
    assert.equal(
      manifest.appstream.metadata.summary,
      "A collection of performance tweaks, system configuration tools, and optimization scripts for Linux desktops"
    );
    assert.equal(manifest.sandbox.network, "full");
  });

  test("5. Issue-to-PR workflow parses add-app submissions and builds valid manifest", () => {
    const addIssueBody = `### Application Name

SuperTerminal

### Application Slug

super-terminal

### Reverse-DNS AppStream ID

org.example.super_terminal

### Summary

Blazingly fast hardware-accelerated terminal for developers

### Description

SuperTerminal is a modern terminal emulator built for speed and flexibility.

Features:
- Hardware acceleration
- Split panes

### License (SPDX Identifier)

MIT

### Main Category

System

### Developer Name

Terminal Team

### Homepage URL

https://example.org/superterminal

### AnyLinux Release Repository

pkgforge-dev/superterminal-AppImage

### Icon URL

https://raw.githubusercontent.com/pkgforge-dev/Anylinux-Metadata/main/icons/super-terminal.png

### Screenshot URLs

https://example.org/shot1.png
https://example.org/shot2.png
`;

    const { slug, manifest } = parseIssueBody(addIssueBody);

    assert.equal(slug, "super-terminal");
    assert.equal(manifest.appstream.metadata.name, "SuperTerminal");
    assert.equal(manifest.appstream.metadata.id, "org.example.super_terminal");
    assert.equal(manifest.appstream.metadata.summary, "Blazingly fast hardware-accelerated terminal for developers");
    assert.equal(manifest.appstream.metadata.projectLicense, "MIT");
    assert.deepEqual(manifest.appstream.metadata.categories, ["System"]);
    assert.equal(manifest.appstream.media.screenshots.length, 2);
    assert.equal(manifest.appstream.metadata.description.length, 2);
    assert.equal(manifest.appstream.metadata.description[0].type, "paragraph");
    assert.equal(manifest.appstream.metadata.description[1].type, "unordered-list");
  });
});

