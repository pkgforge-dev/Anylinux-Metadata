# Contributing to AnyLinux Metadata

This document outlines the workflow and quality standards for contributing application metadata to the AnyLinux Metadata database.

---

## Contribution Channels

### 1. Web Metadata Editor

Contributors may use the browser-based [AnyLinux Metadata Editor](https://pkgforge-dev.github.io/Anylinux-Metadata/). The editor provides:
- Client-side validation against the canonical schema.
- Real-time syntax checking (such as trailing period detection on summaries).
- AST generation for descriptions and list items.
- Live asset previews for icons and screenshots.
- Direct export to a pre-filled GitHub issue or downloadable JSON manifest.

### 2. GitHub Issue Forms

For contributions submitted through the web interface without using Git:
1. Open a new issue using the [Application Submission Form](../../issues/new?template=add-app.yml).
2. Complete the required fields (Name, Slug, Reverse-DNS ID, Summary, Description, License, Category, and URLs).
3. Submit the issue. An automated workflow validates the payload and opens a pull request on your behalf.

### 3. Direct Pull Request

For contributors using Git:
1. Fork and clone the repository:
   ```bash
   git clone https://github.com/pkgforge-dev/Anylinux-Metadata.git
   cd Anylinux-Metadata
   bun install   # or npm install
   ```
2. Check [STATUS.md](STATUS.md) to select an application from the pending backlog.
3. Create the manifest file at `apps/<slug>.json`. Reference the schema at the top of the file:
   ```json
   {
     "$schema": "https://raw.githubusercontent.com/pkgforge-dev/Anylinux-Metadata/main/schema/app-manifest.json",
     "appstream": { ... }
   }
   ```
4. Place a clean 128x128 or 256x256 PNG or SVG icon at `icons/<slug>.png`.
5. Validate the manifest locally:
   ```bash
   bun run validate
   ```
6. Commit the changes and open a pull request.

---

## Metadata Standards and Guidelines

Submissions must conform to the Freedesktop AppStream 1.0 standard and project guidelines.

### Application Slug
- The manifest filename must match `apps/<slug>.json`.
- Slugs must be lowercase alphanumeric with hyphens (regex: `^[a-z0-9]+(?:-[a-z0-9]+)*$`).
- Examples: `ghostty`, `12to11`, `daggerfall-unity`.

### Reverse-DNS Application ID (`metadata.id`)
- Must follow Freedesktop reverse-DNS naming conventions.
- GitHub-hosted upstreams: `io.github.<owner>.<repo>` (replace hyphens with underscores).
- Custom domains: `org.<domain>.<app>` or `com.<domain>.<app>`.
- Do not use bare un-namespaced identifiers.

### Summary (`metadata.summary`)
- Single, concise sentence under 200 characters describing the core function of the program.
- **Must not end with a period (`.`)**, per the AppStream specification.
- Capitalize the initial letter. Avoid generic phrases such as "an app that".

### Description (`metadata.description`)
- Descriptions must be structured as semantic AST blocks:
  - Paragraph: `{ "type": "paragraph", "content": [{ "type": "text", "value": "..." }] }`
  - Unordered list: `{ "type": "unordered-list", "items": [ [ { "type": "text", "value": "..." } ] ] }`
- Avoid redundant marketing phrases and avoid repeatedly naming the application.

### License (`metadata.projectLicense`)
- Must be a valid [SPDX 2.0+ license identifier](https://spdx.org/licenses/) (e.g. `MIT`, `GPL-3.0-or-later`, `Apache-2.0`, `BSD-2-Clause`, `LGPL-3.0-only`).
- Proprietary or unlisted licenses must be explicitly declared where applicable.

### Categories (`metadata.categories`)
- Must contain at least one registered Freedesktop Main Category:
  - `AudioVideo`, `Development`, `Education`, `Game`, `Graphics`, `Network`, `Office`, `Science`, `Settings`, `System`, `Utility`.
- Relevant subcategories may be included (e.g. `TerminalEmulator`, `Emulator`, `Chat`, `Viewer`).

### Media Assets
- **Icon**: PNG (minimum 128x128 resolution) or vector SVG. Must be placed in `icons/<slug>.png` and referenced via its canonical repository URL.
- **Screenshots**: Between 1 and 5 screenshots with descriptive captions and direct HTTPS image sources.

---

## Local Verification

Run the test and validation commands prior to committing:

```bash
# Using Make
make test
make validate
make export

# Or using Bun
bun test
bun run validate
bun run export

# Or using npm
npm test
npm run validate
npm run export
```

For detailed architectural guidelines and development documentation, see [DEVELOPMENT.md](DEVELOPMENT.md). For automated agent specifications and invariant guarantees, see [AGENTS.md](AGENTS.md).
