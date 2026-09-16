# Agent Operation Specification

This document defines the operational protocol, architectural invariants, and verification procedures for autonomous AI agents (such as Antigravity, Claude Code, Cursor, GitHub Copilot Workspace, and custom LLM agents) working on the AnyLinux Metadata repository.

---

## 1. Operating Rules and Non-Negotiable Constraints

All automated agents modifying this repository must adhere to the following rules:

1. **Zero Emojis**: Do not use emojis in commit messages, documentation, code comments, manifest content, terminal log output, web UI text, or pull request descriptions. Maintain a clean, professional, engineering-grade standard.
2. **Zero ASCII Box-Drawing Diagrams**: Do not use ASCII or unicode box-drawing glyphs. Use Mermaid diagrams or standard Markdown tables for visual or structural representations.
3. **Dual Runtime Compatibility**: All scripts, tests, and workflows must run without modification on both **Bun** (v1.1+) and **Node.js** (v20+ with TypeScript execution via `tsx`). Never assume Bun is available; always use `import.meta.dirname ?? dirname(fileURLToPath(import.meta.url))` rather than Bun-specific `import.meta.dir`.
4. **No Unhandled Local Paths**: Never hardcode developer-specific filesystem paths without environment variable overrides and remote HTTPS fallbacks.
5. **Strict Schema Gate**: Never commit or submit an application manifest without executing and passing the automated validation suite (`npm run validate` or `bun run validate`).

---

## 2. Repository Purpose and Scope

- **Upstream Source**: Applications packaged as AppImages in [pkgforge-dev/Anylinux-AppImages](https://github.com/pkgforge-dev/Anylinux-AppImages).
- **Target Inclusion Policy**: Only include applications that are **not available on Flathub**. Applications already distributed via Flathub provide their own standardized AppStream metadata and are intentionally excluded.
- **Differential Tracking**: The synchronization engine (`scripts/sync-upstream.ts`) continuously diffs AnyLinux AppImages against the Flathub API (`GET https://flathub.org/api/v2/appstream`) to determine the active backlog in `status.json` and `STATUS.md`.

---

## 3. Schema Invariants

Every manifest in `apps/<slug>.json` must conform strictly to `schema/schema.ts`.

### 3.1 Filename and Slug
- **Filename**: Must be exactly `apps/<slug>.json`.
- **Slug Format**: Lowercase alphanumeric characters separated by single hyphens (`^[a-z0-9]+(?:-[a-z0-9]+)*$`).
- **Forbidden**: Uppercase characters, underscores, spaces, or duplicate hyphens.

### 3.2 Freedesktop Reverse-DNS Application ID (`appstream.metadata.id`)
- Must follow Freedesktop reverse-DNS naming conventions (`^[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$`).
- For GitHub-hosted projects: `io.github.<owner>.<repository_or_app>` (e.g. `io.github.ghostty_org.ghostty`).
- For custom domains: `org.<domain>.<app>` or `com.<domain>.<app>` (e.g. `org.descent2.d2x_rebirth`).
- Hyphens in owner or repository names should be converted to underscores in the ID segments.
- Duplicate App IDs across different manifests are strictly forbidden. If an upstream repository provides multiple distinct applications (e.g. `d1x-rebirth` and `d2x-rebirth`), suffix the App ID with the application slug.

### 3.3 Summary (`appstream.metadata.summary`)
- A concise sentence under 200 characters describing the application.
- **Trailing Period Prohibited**: Per the Freedesktop AppStream 1.0 specification, summaries **must not** end with a period (`.`).

### 3.4 Description (`appstream.metadata.description`)
- Must be structured as an Abstract Syntax Tree (AST) array consisting of `paragraph` and `unordered-list` / `ordered-list` blocks.
- Bare strings or HTML markup in the manifest description are invalid.
- Format:
  ```json
  [
    {
      "type": "paragraph",
      "content": [
        {
          "type": "text",
          "value": "Paragraph text explaining the application."
        }
      ]
    },
    {
      "type": "unordered-list",
      "items": [
        [
          {
            "type": "text",
            "value": "First feature highlight"
          }
        ]
      ]
    }
  ]
  ```

### 3.5 License (`appstream.metadata.projectLicense`)
- Must parse as a valid SPDX 2.0+ license expression (e.g. `MIT`, `GPL-3.0-or-later`, `Apache-2.0`, `BSD-3-Clause`, `CC0-1.0`).
- Multi-license expressions with `AND` / `OR` (e.g. `MIT OR Apache-2.0`) are valid.
- Proprietary or unlisted licenses must use identifiers like `Proprietary` or refer to specific upstream license terms.

### 3.6 Categories (`appstream.metadata.categories`)
- Must include at least one registered Freedesktop Main Category:
  - `AudioVideo`, `Development`, `Education`, `Game`, `Graphics`, `Network`, `Office`, `Science`, `Settings`, `System`, `Utility`.
- May include valid Additional Categories (e.g. `TerminalEmulator`, `Emulator`, `TextEditor`, `WebBrowser`, `Archiving`).

### 3.7 Media Assets
- **Local Icon Asset**: Every manifest must have a corresponding icon at `icons/<slug>.png`. The manifest `appstream.media.icon` field must reference its canonical raw URL:
  `https://raw.githubusercontent.com/pkgforge-dev/Anylinux-Metadata/main/icons/<slug>.png`
- **Icon Quality**: Minimum resolution of 128x128 pixels, PNG format.
- **Screenshots**: Optional but recommended. If specified, must contain an array of objects with valid `caption` and `source` (HTTPS URL).

### 3.8 Sandbox Configuration (`sandbox`)
- Every manifest must include a valid sandbox configuration conforming to `schema/sandbox-v1.ts`.
- Declare minimal permissions required by the application:
  - `network`: `"none"` | `"loopback"` | `"outbound"` | `"full"`
  - `display`: `"none"` | `"wayland-only"` | `"x11-only"` | `"wayland-or-x11"`
  - `audio`: `"none"` | `"playback"` | `"full"`
  - `processes`: `"isolated"` | `"host"`
  - `ipc`: `boolean`
  - `filesystem`: Array of `{ path: string, access: "ro" | "rw" }`
  - `devices`: Array of `"gpu"` | `"input"` | `"usb"` | `"kvm"` | `"camera"` | `"microphone"`
  - `sessionBus` and `systemBus`: `{ access: "none" | "filtered" | "unrestricted", rules?: [...] }`

---

## 4. Deterministic Commands Reference

Agents should execute commands using standard `npm` or `bun` invocations:

| Task | Bun Command | Node.js / npm Command |
| :--- | :--- | :--- |
| **Run Unit Tests** | `bun test` | `npm test` or `npm run test:node` |
| **Validate Manifests** | `bun run validate` | `npm run validate` or `npm run validate:node` |
| **Export Catalog Artifacts** | `bun run export` | `npm run export` or `npm run export:node` |
| **Regenerate JSON Schema** | `bun run generate-schema` | `npm run generate-schema` |
| **Sync Upstream Backlog** | `bun run sync` | `npm run sync` |
| **Import from PLA** | `bun run import` | `npm run import` |

Alternatively, using the repository `Makefile`:
```bash
make test
make validate
make export
make sync
```

---

## 5. Workflow for Adding a New Application

When tasked with adding an application to the database, follow this exact sequence:

1. **Verify Backlog Eligibility**:
   - Check `STATUS.md` or `status.json` to verify the application is listed under `pending`.
   - Confirm the application is packaged in `pkgforge-dev/Anylinux-AppImages` and is **not** on Flathub.

2. **Acquire Upstream Metadata**:
   - Upstream repository URL is found in `status.json` or `STATUS.md`.
   - Check if an entry exists in `Portable-Linux-Apps.github.io` (can be run via `bun run import` or retrieved via HTTPS).
   - Alternatively, inspect the upstream repository README, releases, and metadata.

3. **Obtain Icon Asset**:
   - Source a clean, high-resolution PNG icon (128x128 or larger).
   - Save the icon to `icons/<slug>.png`.
   - Ensure the image file is valid PNG format.

4. **Construct Manifest**:
   - Create `apps/<slug>.json` using the schema template.
   - Set `$schema` to `"https://raw.githubusercontent.com/pkgforge-dev/Anylinux-Metadata/main/schema/app-manifest.json"`.
   - Ensure the summary has no trailing period.
   - Convert descriptions into semantic paragraph and list items.
   - Verify license string against SPDX standard.

5. **Run Verification Gate**:
   ```bash
   npm run validate
   npm test
   npm run export
   ```
   All three checks must pass with exit code 0.

6. **Update Tracking**:
   - Re-run `npm run sync` to update `STATUS.md` and `status.json` coverage metrics.

---

## 6. Troubleshooting Common Validation Failures

| Error Message | Root Cause | Remediation |
| :--- | :--- | :--- |
| `Summary must not end with a period` | `appstream.metadata.summary` contains a trailing `.` | Remove the period from the summary string. |
| `Invalid SPDX license expression` | License identifier is non-standard or misspelled | Check https://spdx.org/licenses/ for exact identifier (e.g. use `GPL-3.0-or-later` instead of `GPLv3`). |
| `Missing local icon asset` | `icons/<slug>.png` does not exist on disk | Place a valid PNG icon at `icons/<slug>.png` matching the slug. |
| `Duplicate application ID` | Two manifests share the same `appstream.metadata.id` | Suffix one of the IDs with `_<slug>` to ensure reverse-DNS uniqueness. |
| `Icon URL must follow canonical repository format` | Manifest `appstream.media.icon` does not match standard URL pattern | Set to `https://raw.githubusercontent.com/pkgforge-dev/Anylinux-Metadata/main/icons/<slug>.png`. |
| `Cannot find module ... from import.meta.dir` | Bun-specific runtime variable used in Node.js | Use `const currentDir = import.meta.dirname ?? dirname(fileURLToPath(import.meta.url));`. |
