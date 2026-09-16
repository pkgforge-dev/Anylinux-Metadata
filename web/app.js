// State
let currentManifest = null;
let isValid = false;

// DOM Elements
const appNameEl = document.getElementById("appName");
const appSlugEl = document.getElementById("appSlug");
const appIdEl = document.getElementById("appId");
const summaryEl = document.getElementById("summary");
const summaryCounterEl = document.getElementById("summaryCounter");
const summaryWarningEl = document.getElementById("summaryWarning");
const descriptionEl = document.getElementById("description");
const licenseEl = document.getElementById("license");
const customLicenseEl = document.getElementById("customLicense");
const categoryEl = document.getElementById("category");
const devNameEl = document.getElementById("devName");
const homepageEl = document.getElementById("homepage");
const releaseRepoEl = document.getElementById("releaseRepo");
const iconUrlEl = document.getElementById("iconUrl");
const screenshotUrlsEl = document.getElementById("screenshotUrls");

const sbNetworkEl = document.getElementById("sbNetwork");
const sbAudioEl = document.getElementById("sbAudio");
const sbGpuEl = document.getElementById("sbGpu");
const sbIpcEl = document.getElementById("sbIpc");

// Preview Elements
const previewIconEl = document.getElementById("previewIcon");
const previewNameEl = document.getElementById("previewName");
const previewIdEl = document.getElementById("previewId");
const previewSummaryEl = document.getElementById("previewSummary");
const previewCategoryEl = document.getElementById("previewCategory");
const previewLicenseEl = document.getElementById("previewLicense");
const previewReleaseEl = document.getElementById("previewRelease");
const previewDescEl = document.getElementById("previewDesc");
const previewScreenshotsEl = document.getElementById("previewScreenshots");
const jsonOutputEl = document.getElementById("jsonOutput");
const validationBadgeEl = document.getElementById("validationBadge");

// Buttons
const btnCopyJson = document.getElementById("btnCopyJson");
const btnDownloadJson = document.getElementById("btnDownloadJson");
const btnOpenIssue = document.getElementById("btnOpenIssue");

// Helper: slugify
function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

// Auto-fill slug and ID when app name is typed
appNameEl.addEventListener("input", () => {
  const name = appNameEl.value.trim();
  if (name && !appSlugEl.dataset.userEdited) {
    const slug = slugify(name);
    appSlugEl.value = slug;
    if (!appIdEl.dataset.userEdited) {
      appIdEl.value = `io.github.pkgforge_dev.${slug.replace(/-/g, "_")}`;
    }
    if (!devNameEl.dataset.userEdited) {
      devNameEl.value = `${name} Developers`;
    }
    if (!releaseRepoEl.dataset.userEdited) {
      releaseRepoEl.value = `pkgforge-dev/${slug}-AppImage`;
    }
    if (!iconUrlEl.dataset.userEdited) {
      iconUrlEl.value = `https://raw.githubusercontent.com/pkgforge-dev/Anylinux-Metadata/main/icons/${slug}.png`;
    }
  }
  updateManifest();
});

appSlugEl.addEventListener("input", () => {
  appSlugEl.dataset.userEdited = "true";
  updateManifest();
});

appIdEl.addEventListener("input", () => {
  appIdEl.dataset.userEdited = "true";
  updateManifest();
});

devNameEl.addEventListener("input", () => { devNameEl.dataset.userEdited = "true"; updateManifest(); });
releaseRepoEl.addEventListener("input", () => { releaseRepoEl.dataset.userEdited = "true"; updateManifest(); });
iconUrlEl.addEventListener("input", () => { iconUrlEl.dataset.userEdited = "true"; updateManifest(); });

licenseEl.addEventListener("change", () => {
  if (licenseEl.value === "custom") {
    customLicenseEl.style.display = "block";
  } else {
    customLicenseEl.style.display = "none";
  }
  updateManifest();
});

customLicenseEl.addEventListener("input", updateManifest);

summaryEl.addEventListener("input", () => {
  const text = summaryEl.value;
  summaryCounterEl.innerText = `${text.length} / 200 chars`;
  if (text.trim().endsWith(".")) {
    summaryWarningEl.style.display = "inline";
  } else {
    summaryWarningEl.style.display = "none";
  }
  updateManifest();
});

[descriptionEl, categoryEl, homepageEl, screenshotUrlsEl, sbNetworkEl, sbAudioEl, sbGpuEl, sbIpcEl].forEach(el => {
  el.addEventListener("input", updateManifest);
  el.addEventListener("change", updateManifest);
});

function parseDescriptionAst(rawText) {
  if (!rawText.trim()) return [];
  const sections = rawText.split(/\n\s*Features:\s*\n/i);
  const ast = [];

  const mainParas = sections[0].split(/\n\n+/).map(p => p.replace(/\n/g, " ").trim()).filter(Boolean);
  for (const p of mainParas) {
    ast.push({
      type: "paragraph",
      content: [{ type: "text", value: p }]
    });
  }

  if (sections[1]) {
    const bullets = sections[1].split("\n").map(l => l.replace(/^-\s*/, "").trim()).filter(Boolean);
    if (bullets.length > 0) {
      ast.push({
        type: "unordered-list",
        items: bullets.map(b => [{ type: "text", value: b }])
      });
    }
  }

  return ast;
}

function updateManifest() {
  const name = appNameEl.value.trim() || "Application Name";
  const slug = appSlugEl.value.trim() || "app-slug";
  const appId = appIdEl.value.trim() || "io.github.example.app";
  let summary = summaryEl.value.trim() || "Short application summary";
  const hasTrailingPeriod = summary.endsWith(".");
  if (hasTrailingPeriod) {
    summary = summary.replace(/\.+$/, "");
  }

  const descRaw = descriptionEl.value.trim();
  const descAst = parseDescriptionAst(descRaw);

  const license = licenseEl.value === "custom" ? (customLicenseEl.value.trim() || "MIT") : licenseEl.value;
  const category = categoryEl.value;
  const devName = devNameEl.value.trim() || `${name} Developers`;
  const homepage = homepageEl.value.trim() || "https://example.org";
  const releaseRepo = releaseRepoEl.value.trim() || `pkgforge-dev/${slug}-AppImage`;
  const iconUrl = iconUrlEl.value.trim() || "https://raw.githubusercontent.com/pkgforge-dev/Anylinux-AppImages/main/assets/banner.png";

  const rawScreenshots = screenshotUrlsEl.value.split("\n").map(s => s.trim()).filter(s => s.startsWith("https://"));
  const screenshots = rawScreenshots.length > 0
    ? rawScreenshots.map((s, idx) => ({ caption: `${name} screenshot ${idx + 1}`, source: s }))
    : [{ caption: `${name} screenshot 1`, source: iconUrl }];

  // Sandbox
  const devices = [];
  if (sbGpuEl.checked) devices.push("gpu");

  currentManifest = {
    $schema: "https://raw.githubusercontent.com/pkgforge-dev/Anylinux-Metadata/main/schema/app-manifest.json",
    appstream: {
      type: "manual",
      metadata: {
        id: appId,
        name,
        summary,
        description: descAst.length > 0 ? descAst : [{ type: "paragraph", content: [{ type: "text", value: summary }] }],
        projectLicense: license,
        developer: {
          name: devName,
          url: homepage
        },
        homepage,
        repository: homepage,
        keywords: [slug, "appimage", "anylinux"],
        categories: [category]
      },
      media: {
        icon: iconUrl,
        screenshots
      }
    },
    addedAt: new Date().toISOString().split("T")[0],
    origin: {
      type: "third-party"
    },
    releaseSource: {
      type: "github",
      repository: releaseRepo
    },
    sandbox: {
      network: sbNetworkEl.checked ? "full" : "none",
      display: "wayland-or-x11",
      audio: sbAudioEl.checked ? "full" : "none",
      processes: "isolated",
      ipc: sbIpcEl.checked,
      filesystem: [],
      devices,
      sessionBus: { access: "none", rules: [] },
      systemBus: { access: "none", rules: [] }
    }
  };

  // Update UI Previews
  previewNameEl.innerText = name;
  previewIdEl.innerText = appId;
  previewSummaryEl.innerText = summary;
  previewCategoryEl.innerText = category;
  previewLicenseEl.innerText = license;
  previewReleaseEl.innerText = releaseRepo;
  previewIconEl.src = iconUrl;

  // Render Description HTML
  let descHtml = "";
  for (const block of descAst) {
    if (block.type === "paragraph") {
      descHtml += `<p>${block.content.map(c => c.value).join("")}</p>`;
    } else if (block.type === "unordered-list") {
      descHtml += `<ul>${block.items.map(item => `<li>${item.map(c => c.value).join("")}</li>`).join("")}</ul>`;
    }
  }
  previewDescEl.innerHTML = descHtml || "<p>Description will appear here...</p>";

  // Render screenshots
  previewScreenshotsEl.innerHTML = "";
  screenshots.forEach(ss => {
    const img = document.createElement("img");
    img.src = ss.source;
    img.className = "screenshot-thumb";
    img.alt = ss.caption;
    previewScreenshotsEl.appendChild(img);
  });

  // Render JSON
  const jsonString = JSON.stringify(currentManifest, null, 2);
  jsonOutputEl.innerHTML = `<code>${escapeHtml(jsonString)}</code>`;

  // Validation state
  isValid = name && slug && appId && summary && !hasTrailingPeriod && descAst.length > 0;
  if (isValid) {
    validationBadgeEl.innerHTML = `<span class="status-indicator pass"></span> Ready to Submit`;
  } else {
    validationBadgeEl.innerHTML = `<span class="status-indicator fail"></span> Missing required fields`;
  }
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Copy JSON
btnCopyJson.addEventListener("click", () => {
  if (!currentManifest) return;
  navigator.clipboard.writeText(JSON.stringify(currentManifest, null, 2));
  btnCopyJson.innerText = "Copied to Clipboard";
  setTimeout(() => { btnCopyJson.innerText = "Copy JSON"; }, 2000);
});

// Download JSON
btnDownloadJson.addEventListener("click", () => {
  if (!currentManifest) return;
  const slug = appSlugEl.value.trim() || "app";
  const blob = new Blob([JSON.stringify(currentManifest, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slug}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

// Submit via GitHub Issue
btnOpenIssue.addEventListener("click", () => {
  const name = encodeURIComponent(appNameEl.value.trim());
  const slug = encodeURIComponent(appSlugEl.value.trim());
  const appId = encodeURIComponent(appIdEl.value.trim());
  const summary = encodeURIComponent(summaryEl.value.trim());
  const desc = encodeURIComponent(descriptionEl.value.trim());
  const license = encodeURIComponent(licenseEl.value === "custom" ? customLicenseEl.value.trim() : licenseEl.value);
  const category = encodeURIComponent(categoryEl.value);
  const devName = encodeURIComponent(devNameEl.value.trim());
  const homepage = encodeURIComponent(homepageEl.value.trim());
  const releaseRepo = encodeURIComponent(releaseRepoEl.value.trim());
  const iconUrl = encodeURIComponent(iconUrlEl.value.trim());
  const screenshots = encodeURIComponent(screenshotUrlsEl.value.trim());

  const issueUrl = `https://github.com/pkgforge-dev/Anylinux-Metadata/issues/new?template=add-app.yml&name=${name}&slug=${slug}&app_id=${appId}&summary=${summary}&description=${desc}&license=${license}&main_category=${category}&developer_name=${devName}&homepage=${homepage}&release_repo=${releaseRepo}&icon_url=${iconUrl}&screenshots=${screenshots}`;
  window.open(issueUrl, "_blank");
});

// Initialize with Ghostty as sample template
appNameEl.value = "Ghostty";
appSlugEl.value = "ghostty";
appIdEl.value = "io.github.ghostty_org.ghostty";
summaryEl.value = "Fast, feature-rich, GPU-accelerated terminal emulator";
descriptionEl.value = "Ghostty is a fast, feature-rich, cross-platform terminal emulator designed by Mitchell Hashimoto. Built from the ground up in Zig, it leverages GPU hardware acceleration to deliver ultra-low latency and high rendering throughput.\n\nFeatures:\n- GPU-accelerated text rendering delivering instant keystroke response\n- True native desktop integration with tabs, splits, and custom fonts\n- Advanced terminal standards support including Kitty graphics protocol and 24-bit truecolor\n- Low memory usage and clean configuration system";
licenseEl.value = "MIT";
categoryEl.value = "System";
devNameEl.value = "Mitchell Hashimoto";
homepageEl.value = "https://ghostty.org";
releaseRepoEl.value = "pkgforge-dev/ghostty-appimage";
iconUrlEl.value = "https://raw.githubusercontent.com/pkgforge-dev/Anylinux-Metadata/main/icons/ghostty.png";
screenshotUrlsEl.value = "https://raw.githubusercontent.com/pkgforge-dev/Anylinux-AppImages/main/assets/banner.png";

updateManifest();
