<div align="center">

# 🐧 AnyLinux Metadata Database

[![CI Validation](https://github.com/pkgforge-dev/Anylinux-Metadata/actions/workflows/validate-pr.yml/badge.svg)](https://github.com/pkgforge-dev/Anylinux-Metadata/actions)
[![License: CC0-1.0](https://img.shields.io/badge/License-CC0_1.0-blue.svg)](https://creativecommons.org/publicdomain/zero/1.0/)
[![Status Dashboard](https://img.shields.io/badge/Status-Live%20Tracking-emerald.svg)](STATUS.md)
[![Web Editor](https://img.shields.io/badge/Web_Editor-Launch_SPA-sky.svg)](https://pkgforge-dev.github.io/Anylinux-Metadata/)

**The production-grade, community-maintained metadata database for [AnyLinux AppImages](https://github.com/pkgforge-dev/Anylinux-AppImages) not available on Flathub.**

[Live Status Dashboard](STATUS.md) • [Web Editor](https://pkgforge-dev.github.io/Anylinux-Metadata/) • [Contributing Guide](CONTRIBUTING.md) • [JSON Schema](schema/app-manifest.json)

</div>

---

## 🌟 Overview

The [pkgforge-dev/Anylinux-AppImages](https://github.com/pkgforge-dev/Anylinux-AppImages) initiative distributes 460+ high-performance, standalone AppImages powered by `sharun` and `uruntime`. While software also available on Flathub inherits standard AppStream metadata, roughly **180+ AnyLinux applications** (terminal emulators, developer utilities, game engines, emulators, decompilations, and specialized system tools) **do not exist on Flathub**.

**Anylinux-Metadata** solves this gap by providing an open, Flathub-grade metadata repository:
- 🎯 **Flathub Parity**: Full Freedesktop AppStream 1.0 compliance, structured semantic description ASTs, verified SPDX licenses, reverse-DNS IDs, and high-DPI icons.
- 🔄 **Continuous Upstream Synchronization**: Automated daily diffing between `pkgforge-dev/Anylinux-AppImages` and Flathub to track newly added or migrated applications.
- 🤝 **Zero-Friction Contribution**: Multiple paths to contribute—from a visual Web Editor and GitHub Issue Forms for non-technical users, to standard Git PRs with automated visual review bots.
- 📦 **Universal Distribution**: Compiles to `dist/catalog.json` and standard `dist/appstream.xml.gz` consumed directly by [AppHub](https://github.com/pkgforge-dev/apphub), [AppManager (am)](https://github.com/ivan-hc/AM), [Soar](https://github.com/pkgforge/soar), GNOME Software, and KDE Discover.

---

## 🏗️ Architecture

```
                               Upstream Sources
      [pkgforge-dev/Anylinux-AppImages]       [Flathub API v2]
                      │                               │
                      └──────────────┬────────────────┘
                                     ▼
                      Differential Tracker (scripts/sync-upstream.ts)
                                     │
           ┌─────────────────────────┴─────────────────────────┐
           ▼                                                   ▼
   [On Flathub: Skipped]                           [Target Non-Flathub Apps]
                                                               │
                                                               ▼
   [Contribution Channels]                       Portable-Linux-Apps Importer
   • Web Editor (web/)                                         │
   • GitHub Issue Form                                         ▼
   • Direct Pull Requests ────────────────────────► [apps/<slug>.json]
                                                               │
                                                               ▼
                                                  Validation Gate (scripts/validate.ts)
                                                  • Zod Schema Validation
                                                  • SPDX License Verification
                                                  • Local Icon Liveness Checks
                                                               │
                                                               ▼
                                                  Downstream Export (scripts/export-catalog.ts)
                                                  • dist/catalog.json
                                                  • dist/appstream.xml.gz
```

---

## 📋 Manifest Format Example (`apps/ghostty.json`)

```json
{
  "$schema": "https://raw.githubusercontent.com/pkgforge-dev/Anylinux-Metadata/main/schema/app-manifest.json",
  "appstream": {
    "type": "manual",
    "metadata": {
      "id": "io.github.ghostty_org.ghostty",
      "name": "Ghostty",
      "summary": "Fast, feature-rich, GPU-accelerated terminal emulator",
      "description": [
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "value": "Ghostty is a fast, feature-rich, cross-platform terminal emulator designed by Mitchell Hashimoto..."
            }
          ]
        },
        {
          "type": "unordered-list",
          "items": [
            [{ "type": "text", "value": "GPU-accelerated text rendering delivering instant keystroke response" }]
          ]
        }
      ],
      "projectLicense": "MIT",
      "developer": {
        "name": "Ghostty Developers",
        "url": "https://ghostty.org"
      },
      "homepage": "https://ghostty.org",
      "repository": "https://github.com/pkgforge-dev/ghostty-appimage",
      "keywords": ["ghostty", "terminal", "appimage", "anylinux"],
      "categories": ["System", "TerminalEmulator"]
    },
    "media": {
      "icon": "https://raw.githubusercontent.com/pkgforge-dev/Anylinux-Metadata/main/icons/ghostty.png",
      "screenshots": [
        {
          "caption": "Ghostty terminal window",
          "source": "https://example.org/screenshot.png"
        }
      ]
    }
  },
  "addedAt": "2026-09-16",
  "origin": { "type": "third-party" },
  "releaseSource": {
    "type": "github",
    "repository": "pkgforge-dev/ghostty-appimage"
  },
  "sandbox": {
    "network": "full",
    "display": "wayland-or-x11",
    "audio": "none",
    "processes": "isolated",
    "ipc": true,
    "filesystem": [],
    "devices": ["gpu"],
    "sessionBus": { "access": "none", "rules": [] },
    "systemBus": { "access": "none", "rules": [] }
  }
}
```

---

## 🚀 Quick Start (Developers & Maintainers)

### Requirements
- [Bun](https://bun.sh) (v1.1+) or Node.js (v20+)

### Commands

```bash
# 1. Install dependencies
bun install

# 2. Run unit tests
bun test

# 3. Validate all application manifests
bun run validate

# 4. Sync upstream with Anylinux-AppImages and Flathub (updates STATUS.md)
bun run sync

# 5. Scaffold apps from Portable-Linux-Apps
bun run import --limit 18

# 6. Export downstream catalog.json and appstream.xml.gz
bun run export

# 7. Re-generate JSON Schema for IDE autocomplete
bun run generate-schema
```

---

## 🤝 Contributing

We welcome contributions from everyone! You don't need coding knowledge to contribute:

- **Option A (Zero-Code Web Editor)**: Open our [Web Editor](https://pkgforge-dev.github.io/Anylinux-Metadata/), fill in the fields with live previews, and click **Submit to GitHub Issue**!
- **Option B (GitHub Issue Form)**: Submit an app directly using our [Add App Issue Template](../../issues/new?template=add-app.yml). Our automated GitHub Action bot will validate and convert your submission into a Pull Request!
- **Option C (Pull Request)**: Fork the repo, add `apps/<slug>.json` and `icons/<slug>.png`, run `bun run validate`, and open a PR.

Read the complete [CONTRIBUTING.md](CONTRIBUTING.md) for style guidelines and tips.

---

## 📄 License

Catalog metadata and manifests are dedicated to the public domain under [Creative Commons Zero (CC0 1.0 Universal)](https://creativecommons.org/publicdomain/zero/1.0/). Application names, trademarks, and media assets remain the property of their respective upstream owners.
