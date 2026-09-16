# Contributing to AnyLinux-Metadata

Thank you for helping build the definitive metadata database for AnyLinux AppImages!
Our goal is to make contributing effortless for everyone—including non-technical users.

---

## 🎯 Contribution Options

### Option 1: Web-Based Metadata Editor (Easiest)
1. Open the [AnyLinux Metadata Editor](https://pkgforge-dev.github.io/Anylinux-Metadata/).
2. Fill in the app details. You'll get real-time feedback, preview the app card, and see the rendered description.
3. Click **"Submit to GitHub Issue"** to open a pre-filled submission form, or **"Copy JSON"** to submit a PR.

### Option 2: GitHub Issue Form (No Git Required)
1. Go to [New Issue](../../issues/new/choose).
2. Choose **✨ Add New App Metadata**.
3. Fill in the form fields.
4. Submit the issue! Our automated GitHub Action bot will parse your form, validate the data, and automatically create a Pull Request on your behalf.

### Option 3: Direct Pull Request (For Developers)
1. Clone the repository:
   ```bash
   git clone https://github.com/pkgforge-dev/Anylinux-Metadata.git
   cd Anylinux-Metadata
   bun install
   ```
2. Check [STATUS.md](STATUS.md) to pick an unassigned app from the pending backlog.
3. Create your manifest in `apps/<slug>.json`. Add `$schema` at the top for instant autocompletion in VS Code / Neovim / Cursor:
   ```json
   {
     "$schema": "https://raw.githubusercontent.com/pkgforge-dev/Anylinux-Metadata/main/schema/app-manifest.json",
     "appstream": { ... }
   }
   ```
4. Place a 128x128 or 256x256 PNG or SVG icon in `icons/<slug>.png`.
5. Run the validator:
   ```bash
   bun run validate
   ```
6. Commit and open a Pull Request.

---

## 📐 Metadata Style Guidelines

To keep our metadata equal to or exceeding Flathub standards, please observe the following conventions:

### 1. Reverse-DNS Application ID (`metadata.id`)
- Use a valid reverse-DNS ID following the Freedesktop AppStream specification:
  - If upstream is on GitHub: `io.github.<owner>.<repo>` (e.g. `io.github.ghostty_org.ghostty`).
  - If upstream has its own domain: `org.<domain>.<app>` (e.g. `org.ladybird.ladybird`).
- Never use simple un-namespaced IDs like `ghostty` or `myapp`.

### 2. Summary (`metadata.summary`)
- Single, short sentence (under 200 characters).
- **Must NOT end with a period (`.`)** per AppStream guidelines.
- Capitalize properly (e.g. *"Fast, feature-rich terminal emulator"*).

### 3. Description AST (`metadata.description`)
- Descriptions are stored as structured semantic blocks:
  - Paragraph: `{ "type": "paragraph", "content": [{ "type": "text", "value": "..." }] }`
  - Unordered list: `{ "type": "unordered-list", "items": [ [ { "type": "text", "value": "Feature 1" } ] ] }`
- Avoid redundant marketing fluff or repeating the app name excessively.

### 4. License Expression (`metadata.projectLicense`)
- Must be a valid [SPDX license expression](https://spdx.org/licenses/) (e.g. `MIT`, `GPL-3.0-or-later`, `Apache-2.0`, `BSD-2-Clause`, `LGPL-3.0-only`).

### 5. Categories (`metadata.categories`)
- Must contain at least one registered Freedesktop Main Category:
  - `AudioVideo`, `Development`, `Education`, `Game`, `Graphics`, `Network`, `Office`, `Science`, `Settings`, `System`, `Utility`.
- Optional subcategories can be appended (e.g. `TerminalEmulator`, `Emulator`, `Chat`, `Viewer`).

### 6. Media Assets
- **Icon**: High-resolution PNG (>= 128x128) or vector SVG.
- **Screenshots**: 1 to 5 screenshots with clear captions and direct HTTPS image URLs.

---

## 🧪 Testing Your Changes

Before submitting, always verify your changes locally:

```bash
# Run unit tests
bun test

# Run manifest validation
bun run validate

# Test downstream export
bun run export
```
