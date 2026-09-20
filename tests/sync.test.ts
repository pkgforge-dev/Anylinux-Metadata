import { describe, it as test } from "node:test";
import assert from "node:assert/strict";
import {
  buildFlathubIndex,
  checkFlathubPresence,
  FLATHUB_ALIASES,
  type AppImageEntry,
} from "../scripts/sync-upstream.ts";

describe("Flathub Detection Tests", () => {
  const sampleFlathubIds = new Set([
    "org.localsend.localsend_app",
    "org.telegram.desktop",
    "com.visualstudio.code",
    "com.obsproject.Studio",
    "org.gnome.TextEditor",
    "com.dec05eba.gpu_screen_recorder",
    "io.github.hakandundar34coding.system-monitoring-center",
    "io.github.ungoogled_software.ungoogled_chromium",
    "com.vscodium.codium",
    "app.zen_browser.zen",
    "org.octave.Octave",
    "com.transmissionbt.Transmission",
    "org.pulseaudio.pavucontrol",
    "io.gitlab.librewolf-community",
    "io.github.thetumultuousunicornofdarkness.cpu-x",
  ]);

  const index = buildFlathubIndex(sampleFlathubIds, FLATHUB_ALIASES);
  const emptyKnown = new Set<string>();

  test("Identifies LocalSend as covered by Flathub", () => {
    const entry: AppImageEntry = {
      name: "LocalSend",
      url: "https://github.com/pkgforge-dev/localsend-AppImage",
      repo: "pkgforge-dev/localsend-AppImage",
      slug: "localsend",
    };
    assert.equal(checkFlathubPresence(entry, index, emptyKnown), true);
  });

  test("Identifies Telegram as covered by Flathub", () => {
    const entry: AppImageEntry = {
      name: "Telegram",
      url: "https://github.com/pkgforge-dev/telegram-AppImage",
      repo: "pkgforge-dev/telegram-AppImage",
      slug: "telegram",
    };
    assert.equal(checkFlathubPresence(entry, index, emptyKnown), true);
  });

  test("Identifies Visual Studio Code as covered by Flathub", () => {
    const entry: AppImageEntry = {
      name: "Visual Studio Code",
      url: "https://github.com/pkgforge-dev/visual-studio-code-AppImage",
      repo: "pkgforge-dev/visual-studio-code-AppImage",
      slug: "visual-studio-code",
    };
    assert.equal(checkFlathubPresence(entry, index, emptyKnown), true);
  });

  test("Identifies hyphenated and underscored AppStream IDs", () => {
    const entries: AppImageEntry[] = [
      {
        name: "gpu-screen-recorder",
        url: "https://github.com/pkgforge-dev/gpu-screen-recorder-AppImage",
        repo: "pkgforge-dev/gpu-screen-recorder-AppImage",
        slug: "gpu-screen-recorder",
      },
      {
        name: "system-monitoring-center",
        url: "https://github.com/pkgforge-dev/system-monitoring-center-AppImage",
        repo: "pkgforge-dev/system-monitoring-center-AppImage",
        slug: "system-monitoring-center",
      },
      {
        name: "Ungoogled-chromium",
        url: "https://github.com/pkgforge-dev/Ungoogled-Chromium-AppImage",
        repo: "pkgforge-dev/Ungoogled-Chromium-AppImage",
        slug: "ungoogled-chromium",
      },
      {
        name: "CPU-X",
        url: "https://github.com/pkgforge-dev/CPU-X-AppImage",
        repo: "pkgforge-dev/CPU-X-AppImage",
        slug: "cpu-x",
      },
    ];

    for (const entry of entries) {
      assert.equal(
        checkFlathubPresence(entry, index, emptyKnown),
        true,
        `Expected ${entry.name} to be detected as Flathub covered`
      );
    }
  });

  test("Does not flag genuine non-Flathub apps as Flathub covered", () => {
    const nonFlathubApps: AppImageEntry[] = [
      {
        name: "alacritty",
        url: "https://github.com/pkgforge-dev/alacritty-AppImage",
        repo: "pkgforge-dev/alacritty-AppImage",
        slug: "alacritty",
      },
      {
        name: "DeaDBeeF",
        url: "https://github.com/pkgforge-dev/DeaDBeeF-AppImage",
        repo: "pkgforge-dev/DeaDBeeF-AppImage",
        slug: "deadbeef",
      },
      {
        name: "Catfish",
        url: "https://github.com/pkgforge-dev/Catfish-AppImage",
        repo: "pkgforge-dev/Catfish-AppImage",
        slug: "catfish",
      },
      {
        name: "Zenity",
        url: "https://github.com/pkgforge-dev/Zenity-GTK3-AppImage",
        repo: "pkgforge-dev/Zenity-GTK3-AppImage",
        slug: "zenity",
      },
      {
        name: "OpenBoardView",
        url: "https://github.com/pkgforge-dev/OpenBoardView-AppImage",
        repo: "pkgforge-dev/OpenBoardView-AppImage",
        slug: "openboardview",
      },
      {
        name: "st",
        url: "https://github.com/pkgforge-dev/st-AppImage",
        repo: "pkgforge-dev/st-AppImage",
        slug: "st",
      },
    ];

    for (const entry of nonFlathubApps) {
      assert.equal(
        checkFlathubPresence(entry, index, emptyKnown),
        false,
        `Expected ${entry.name} to be non-Flathub`
      );
    }
  });
});
