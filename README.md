# AnyLinux Metadata Database

[![CI Validation](https://github.com/pkgforge-dev/Anylinux-Metadata/actions/workflows/validate-pr.yml/badge.svg)](https://github.com/pkgforge-dev/Anylinux-Metadata/actions)
[![License: CC0-1.0](https://img.shields.io/badge/License-CC0_1.0-blue.svg)](https://creativecommons.org/publicdomain/zero/1.0/)
[![Catalog Status](https://img.shields.io/badge/Catalog-Status-blue.svg)](STATUS.md)

A community-maintained, Freedesktop AppStream-compliant metadata database for [AnyLinux AppImages](https://github.com/pkgforge-dev/Anylinux-AppImages) that are not distributed via Flathub.

[Catalog Status](STATUS.md) | [Contributing Guide](CONTRIBUTING.md) | [JSON Schema](schema/app-manifest.json) | [Web Editor](https://pkgforge-dev.github.io/Anylinux-Metadata/)

---

## Overview

The [AnyLinux AppImages](https://github.com/pkgforge-dev/Anylinux-AppImages) repository packages hundreds of standalone, dependency-free portable Linux applications using `sharun` and `uruntime`. While applications published on Flathub already provide standardized AppStream metadata (descriptions, categories, licensing, screenshots, and icons), numerous specialized utilities, terminal emulators, emulators, game engines, and native tools packaged for AnyLinux do not exist on Flathub.

This repository provides a dedicated, version-controlled metadata database for those non-Flathub applications. It serves as an upstream catalog for software storefronts, application managers, and desktop environments.

### Core Objectives

- **AppStream Specification Compliance**: Strict adherence to the Freedesktop AppStream 1.0 standard, reverse-DNS naming conventions, abstract syntax tree (AST) descriptions, verified SPDX 2.0+ licensing, and standardized category taxonomy.
- **Continuous Upstream Synchronization**: Automated daily differential tracking between `pkgforge-dev/Anylinux-AppImages` and the Flathub catalog to detect newly added, retired, or migrated packages.
- **Multi-Tier Contribution Model**: Support for contributions via web form interfaces, automated GitHub issue templates, and direct Git pull requests with automated validation.
- **Multi-Format Downstream Export**: Compilation into unified JSON catalogs (`dist/catalog.json`) and standard AppStream XML collections (`dist/appstream.xml.gz`) for consumption by downstream tools such as [AppHub](https://github.com/pkgforge-dev/apphub), [AppManager (`am`)](https://github.com/ivan-hc/AM), and [Soar](https://github.com/pkgforge/soar).

---

## Architecture

```
                             Upstream Sources
    pkgforge-dev/Anylinux-AppImages              Flathub Catalog API
           (445+ Packages)                           (3,300+ Apps)
                  │                                        │
                  └──────────────────┬─────────────────────┘
                                     │
                                     ▼
                      Differential Tracker (sync-upstream.ts)
                                     │
            ┌────────────────────────┴────────────────────────┐
            ▼                                                 ▼
   Present on Flathub                             Target Non-Flathub Set
   (Skipped / Flathub Managed)                                │
                                                              ▼
   Contribution Channels                         Portable-Linux-Apps Ingestion
   - Web Editor (web/)                                        │
   - GitHub Issue Forms                                       ▼
   - Git Pull Requests ──────────────────────────────► apps/<slug>.json
                                                              │
                                                              ▼
                                                 Validation Suite (validate.ts)
                                                 - Zod Schema Check
                                                 - SPDX License Check
                                                 - Media and Icon Check
                                                              │
                                                              ▼
                                                 Distribution Export (export-catalog.ts)
                                                 - dist/catalog.json
                                                 - dist/appstream.xml.gz
```

---

## Specification and Manifest Example

Every application manifest is stored in `apps/<slug>.json` and must validate against the schema defined in [`schema/schema.ts`](schema/schema.ts).

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
              "value": "Ghostty is a fast, feature-rich, cross-platform terminal emulator designed by Mitchell Hashimoto. Built from the ground up in Zig, it leverages GPU hardware acceleration to deliver ultra-low latency and high rendering throughput."
            }
          ]
        },
        {
          "type": "unordered-list",
          "items": [
            [
              {
                "type": "text",
                "value": "GPU-accelerated text rendering delivering instant keystroke response"
              }
            ],
            [
              {
                "type": "text",
                "value": "Native desktop integration with tabs, splits, and custom fonts"
              }
            ]
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
      "keywords": ["ghostty", "terminal", "emulator", "cli"],
      "categories": ["System", "TerminalEmulator"]
    },
    "media": {
      "icon": "https://raw.githubusercontent.com/pkgforge-dev/Anylinux-Metadata/main/icons/ghostty.png",
      "screenshots": [
        {
          "caption": "Ghostty terminal window",
          "source": "https://raw.githubusercontent.com/pkgforge-dev/Anylinux-AppImages/main/assets/banner.png"
        }
      ]
    }
  },
  "addedAt": "2026-09-16",
  "origin": {
    "type": "third-party"
  },
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

## Project Structure

```
Anylinux-Metadata/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── add-app.yml            # Structured issue template for new submissions
│   │   └── update-app.yml         # Structured issue template for manifest updates
│   └── workflows/
│       ├── deploy-pages.yml       # Deploys catalog and web editor to GitHub Pages
│       ├── issue-to-pr.yml        # Automatically converts issue forms to pull requests
│       ├── sync-upstream.yml      # Scheduled daily synchronization workflow
│       └── validate-pr.yml        # Pull request schema validation and preview generator
├── apps/                          # Canonical application manifests (apps/<slug>.json)
├── icons/                         # Curated 128x128 / 256x256 PNG and SVG icons
├── schema/
│   ├── app-manifest.json          # Compiled JSON Schema for IDE validation
│   ├── category-registry.ts       # Freedesktop main and additional category registry
│   ├── sandbox-v1.ts              # Sandbox permissions specification
│   └── schema.ts                  # Zod schema definitions
├── scripts/
│   ├── export-catalog.ts          # Compiles dist/catalog.json and dist/appstream.xml.gz
│   ├── generate-schema.ts         # Generates schema/app-manifest.json from Zod definitions
│   ├── import-pla.ts              # Batch importer for Portable-Linux-Apps data
│   ├── sync-upstream.ts           # Evaluates coverage against Anylinux-AppImages and Flathub
│   └── validate.ts                # Strict CLI validator for all manifests
├── tests/
│   └── schema.test.ts             # Test suite
├── web/                           # Browser-based visual editor SPA
├── CONTRIBUTING.md                # Contributor guidelines
├── README.md                      # Project documentation
├── STATUS.md                      # Live coverage status and pending backlog
├── package.json                   # Project configuration
└── tsconfig.json                  # TypeScript compiler configuration
```

---

## Tooling and Usage

### Prerequisites

- [Bun](https://bun.sh) (v1.1 or later) or Node.js (v20 or later)

### Common Commands

Install dependencies:
```bash
bun install
```

Execute unit test suite:
```bash
bun test
```

Validate all application manifests against the schema:
```bash
bun run validate
```

Synchronize tracking data against upstream AnyLinux AppImages and Flathub:
```bash
bun run sync
```

Import application metadata from Portable-Linux-Apps:
```bash
# Import default batch (18 applications)
bun run import

# Import all matchable applications
bun run import --all
```

Export downstream distribution artifacts:
```bash
bun run export
```

Regenerate IDE JSON Schema:
```bash
bun run generate-schema
```

---

## Contributing

Contributions are welcome. Submissions can be made through several channels depending on technical preference:

1. **Web Editor**: Use the [AnyLinux Metadata Editor](https://pkgforge-dev.github.io/Anylinux-Metadata/) to enter information with real-time schema validation, description formatting, and asset testing.
2. **Issue Forms**: Submit an application using the [Application Submission Form](../../issues/new?template=add-app.yml). An automated workflow will parse the submission, run validation, and generate a pull request.
3. **Pull Requests**: Submit manifests directly to `apps/<slug>.json` and corresponding icons to `icons/<slug>.png`.

Detailed metadata standards, validation rules, and naming requirements are available in [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Downstream Integration

Downstream package managers, application storefronts, and desktop environments can integrate with this database through two standardized formats:

- **JSON Catalog**: Compiled to `dist/catalog.json`, containing an index of all applications, their AppStream metadata, sandboxing profiles, and release repositories.
- **AppStream Collection XML**: Compiled to `dist/appstream.xml` and compressed as `dist/appstream.xml.gz` in standard Freedesktop XML format for integration with tools like GNOME Software, KDE Discover, and `appstreamcli`.

---

## License

All catalog metadata, manifests, and documentation in this repository are dedicated to the public domain under the [Creative Commons Zero (CC0 1.0 Universal)](https://creativecommons.org/publicdomain/zero/1.0/) public domain dedication.

Application names, logos, trademarks, and media assets remain the property of their respective upstream copyright holders.
