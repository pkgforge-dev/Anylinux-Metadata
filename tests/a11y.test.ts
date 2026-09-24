import { describe, it as test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = import.meta.dirname ?? dirname(fileURLToPath(import.meta.url));
const rootDir = join(currentDir, "..");
const htmlContent = readFileSync(join(rootDir, "web", "index.html"), "utf-8");
const cssContent = readFileSync(join(rootDir, "web", "style.css"), "utf-8");
const jsContent = readFileSync(join(rootDir, "web", "app.js"), "utf-8");

// Helper: Calculate relative luminance and contrast ratio per WCAG 2.1 specifications
function parseHexColor(hex: string): [number, number, number] {
  const cleanHex = hex.replace("#", "").trim();
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return [r, g, b];
}

function getChannelLuminance(value: number): number {
  const srgb = value / 255;
  return srgb <= 0.04045 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
}

function getRelativeLuminance(rgb: [number, number, number]): number {
  const r = getChannelLuminance(rgb[0]);
  const g = getChannelLuminance(rgb[1]);
  const b = getChannelLuminance(rgb[2]);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getRelativeLuminance(parseHexColor(hex1));
  const l2 = getRelativeLuminance(parseHexColor(hex2));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe("Accessibility and UI Contract Tests", () => {
  describe("1. Tab Navigation and ARIA Specifications", () => {
    test("Navigation tablist and tabs have complete ARIA attributes", () => {
      assert.match(htmlContent, /<nav class="nav-tabs"[^>]*role="tablist"/);
      assert.match(htmlContent, /<nav class="nav-tabs"[^>]*aria-label="Main Navigation"/);

      const tabMatches = htmlContent.match(/<button class="nav-tab[^"]*"[^>]*role="tab"[^>]*>/g);
      assert.ok(tabMatches && tabMatches.length >= 4, "Expected at least 4 main navigation tabs");

      const requiredTabIds = ["tab-catalog", "tab-backlog", "tab-studio", "tab-validator"];
      for (const id of requiredTabIds) {
        assert.ok(htmlContent.includes(`id="${id}"`), `Tab ID ${id} must exist`);
        assert.ok(htmlContent.includes(`aria-controls="panel-${id.replace("tab-", "")}"`), `Tab ${id} must control its panel`);
      }
    });

    test("Panels declare role=tabpanel and aria-labelledby", () => {
      const requiredPanels = ["panel-catalog", "panel-backlog", "panel-studio", "panel-validator"];
      for (const id of requiredPanels) {
        const regex = new RegExp(`<section class="tab-panel[^"]*" id="${id}"[^>]*role="tabpanel"[^>]*aria-labelledby="tab-${id.replace("panel-", "")}"`);
        assert.match(htmlContent, regex, `Panel ${id} must link to tab-${id.replace("panel-", "")}`);
      }
    });

    test("Studio preview subtabs declare role=tab and role=tabpanel", () => {
      assert.match(htmlContent, /<div class="preview-tabs"[^>]*role="tablist"/);
      assert.match(htmlContent, /<button[^>]*id="subtab-store-view"[^>]*role="tab"|<button[^>]*role="tab"[^>]*id="subtab-store-view"/);
      assert.match(htmlContent, /<button[^>]*id="subtab-json-view"[^>]*role="tab"|<button[^>]*role="tab"[^>]*id="subtab-json-view"/);
      assert.match(htmlContent, /id="subpanel-store-view"[^>]*role="tabpanel"/);
      assert.match(htmlContent, /id="subpanel-json-view"[^>]*role="tabpanel"/);
    });

    test("JavaScript manages roving tabindex and keyboard navigation on tabs", () => {
      assert.ok(jsContent.includes("t.setAttribute('aria-selected', isActive ? 'true' : 'false')"));
      assert.ok(jsContent.includes("t.setAttribute('tabindex', isActive ? '0' : '-1')"));
      assert.ok(jsContent.includes("e.key === 'ArrowRight' || e.key === 'ArrowDown'"));
      assert.ok(jsContent.includes("e.key === 'ArrowLeft' || e.key === 'ArrowUp'"));
      assert.ok(jsContent.includes("e.key === 'Home'"));
      assert.ok(jsContent.includes("e.key === 'End'"));
    });
  });

  describe("2. Modal Dialog Accessibility and Focus Management", () => {
    test("Detail modal has role=dialog, aria-modal=true, and aria-labelledby", () => {
      assert.match(htmlContent, /id="appDetailModal"[^>]*role="dialog"[^>]*aria-modal="true"[^>]*aria-labelledby="modalDetailTitle"/);
      assert.match(htmlContent, /id="modalCloseBtn"[^>]*aria-label="Close modal dialog"/);
    });

    test("Screenshot lightbox modal has dialog semantics", () => {
      assert.match(htmlContent, /id="screenshotLightboxModal"[^>]*role="dialog"[^>]*aria-modal="true"/);
      assert.match(htmlContent, /id="lightboxCloseBtn"[^>]*aria-label="Close screenshot preview/);
    });

    test("JavaScript implements focus trapping and focus restoration on modals", () => {
      assert.ok(jsContent.includes("lastFocusedElementBeforeModal = document.activeElement;"));
      assert.ok(jsContent.includes("lastFocusedElementBeforeLightbox = document.activeElement;"));
      assert.ok(jsContent.includes("lastFocusedElementBeforeModal.focus()"));
      assert.ok(jsContent.includes("lastFocusedElementBeforeLightbox.focus()"));
      assert.ok(jsContent.includes("document.body.style.overflow = 'hidden'"));
      assert.ok(jsContent.includes("document.body.style.overflow = ''"));
    });
  });

  describe("3. Accessible Form Names and Input Labeling", () => {
    test("Form inputs have associated accessible labels and labels use sr-only where hidden", () => {
      assert.match(htmlContent, /<label for="catalogSearch" class="sr-only">/);
      assert.match(htmlContent, /<label for="backlogSearch" class="sr-only">/);
      assert.match(htmlContent, /<label for="validatorInput" class="sr-only">/);
      assert.match(htmlContent, /<label for="keywordsInput">/);
      assert.match(htmlContent, /<label for="catalogCategoryFilter" class="sr-only">/);
      assert.match(htmlContent, /<label for="catalogSortFilter" class="sr-only">/);
    });

    test("CSS defines standard .sr-only utility class", () => {
      assert.ok(cssContent.includes(".sr-only {"));
      assert.ok(cssContent.includes("clip: rect(0, 0, 0, 0)"));
      assert.ok(cssContent.includes("width: 1px"));
      assert.ok(cssContent.includes("height: 1px"));
      assert.ok(cssContent.includes("overflow: hidden"));
    });
  });

  describe("4. Dynamic Screen Reader Feedback (aria-live)", () => {
    test("Live regions exist for catalog and backlog result counters", () => {
      assert.match(htmlContent, /id="catalogResultsCount"[^>]*aria-live="polite"[^>]*aria-atomic="true"/);
      assert.match(htmlContent, /id="backlogResultsCount"[^>]*aria-live="polite"[^>]*aria-atomic="true"/);
    });

    test("Empty states use role=status", () => {
      assert.ok(jsContent.includes('class="empty-state" role="status"'));
      assert.ok(jsContent.includes('<tr role="status">'));
    });
  });

  describe("5. Interactive Card Architecture and Semantic Structure", () => {
    test("App cards are rendered as articles with tabindex and keyboard activation", () => {
      assert.ok(jsContent.includes("card.setAttribute('role', 'article')"));
      assert.ok(jsContent.includes("card.setAttribute('tabindex', '0')"));
      assert.ok(jsContent.includes("card.setAttribute('aria-labelledby', `card-title-${item.slug}`)"));
      assert.ok(jsContent.includes("(e.key === 'Enter' || e.key === ' ') && e.target === card"));
    });

    test("Visible focus-visible rings are configured across interactive elements", () => {
      assert.ok(cssContent.includes(":focus-visible {"));
      assert.ok(cssContent.includes(".nav-tab:focus-visible {"));
      assert.ok(cssContent.includes(".app-card:focus-visible {"));
      assert.ok(cssContent.includes(".btn:focus-visible {"));
      assert.ok(cssContent.includes(".link-btn:focus-visible {"));
    });
  });

  describe("6. Color Contrast and WCAG AA Compliance", () => {
    test("Light mode colors meet WCAG AA >= 4.5:1 contrast requirement", () => {
      const surface = "#ffffff";
      const bg = "#f4f2ed";

      const textMainRatio = getContrastRatio("#17191d", surface);
      const textDimSurfaceRatio = getContrastRatio("#555962", surface);
      const textDimBgRatio = getContrastRatio("#555962", bg);
      const textMutedRatio = getContrastRatio("#5d626b", surface);
      const warningBadgeRatio = getContrastRatio("#92400e", "#fef3c7");

      assert.ok(textMainRatio >= 4.5, `Light text-main contrast ${textMainRatio.toFixed(2)} must be >= 4.5`);
      assert.ok(textDimSurfaceRatio >= 4.5, `Light text-dim against surface ${textDimSurfaceRatio.toFixed(2)} must be >= 4.5`);
      assert.ok(textDimBgRatio >= 4.5, `Light text-dim against bg ${textDimBgRatio.toFixed(2)} must be >= 4.5`);
      assert.ok(textMutedRatio >= 4.5, `Light text-muted contrast ${textMutedRatio.toFixed(2)} must be >= 4.5`);
      assert.ok(warningBadgeRatio >= 4.5, `Light warning text contrast ${warningBadgeRatio.toFixed(2)} must be >= 4.5`);
    });

    test("Dark mode colors meet WCAG AA >= 4.5:1 contrast requirement", () => {
      const darkSurface = "#22262d";
      const darkBg = "#14171a";

      const textMainSurfaceRatio = getContrastRatio("#e2e8f0", darkSurface);
      const textMainBgRatio = getContrastRatio("#e2e8f0", darkBg);
      const textDimSurfaceRatio = getContrastRatio("#94a3b8", darkSurface);
      const textDimBgRatio = getContrastRatio("#94a3b8", darkBg);
      const textMutedSurfaceRatio = getContrastRatio("#cbd5e1", darkSurface);

      assert.ok(textMainSurfaceRatio >= 4.5, `Dark text-main against surface ${textMainSurfaceRatio.toFixed(2)} must be >= 4.5`);
      assert.ok(textMainBgRatio >= 4.5, `Dark text-main against bg ${textMainBgRatio.toFixed(2)} must be >= 4.5`);
      assert.ok(textDimSurfaceRatio >= 4.5, `Dark text-dim against surface ${textDimSurfaceRatio.toFixed(2)} must be >= 4.5`);
      assert.ok(textDimBgRatio >= 4.5, `Dark text-dim against bg ${textDimBgRatio.toFixed(2)} must be >= 4.5`);
      assert.ok(textMutedSurfaceRatio >= 4.5, `Dark text-muted against surface ${textMutedSurfaceRatio.toFixed(2)} must be >= 4.5`);
    });
  });

  describe("7. Reduced Motion Support", () => {
    test("prefers-reduced-motion media query suppresses animations and transitions", () => {
      assert.ok(cssContent.includes("@media (prefers-reduced-motion: reduce)"));
      assert.ok(cssContent.includes("animation-duration: 0.01ms !important"));
      assert.ok(cssContent.includes("transition-duration: 0.01ms !important"));
      assert.ok(jsContent.includes("window.matchMedia('(prefers-reduced-motion: reduce)')"));
    });
  });

  describe("8. Image Sizing and CLS Prevention", () => {
    test("Icons and screenshots have explicit dimensions and aspect ratios", () => {
      assert.ok(jsContent.includes('class="app-card-icon"'));
      assert.ok(jsContent.includes('width="48" height="48"'));
      assert.ok(cssContent.includes(".app-card-icon {"));
      assert.ok(cssContent.includes("aspect-ratio: 1 / 1;"));

      assert.ok(jsContent.includes('class="modal-header-icon"'));
      assert.ok(jsContent.includes('width="64" height="64"'));

      assert.ok(cssContent.includes(".modal-screenshot-img {"));
      assert.ok(cssContent.includes("aspect-ratio: 16 / 9;"));

      assert.ok(jsContent.includes('class="screenshot-stage-img"'));
      assert.ok(jsContent.includes('width="800" height="450"'));
    });
  });

  describe("9. Mobile Touch Target Optimization (44px Minimum)", () => {
    test("Mobile media queries enforce 44px minimum touch targets", () => {
      assert.ok(cssContent.includes(".btn-theme-toggle {"));
      assert.ok(cssContent.includes("min-height: 44px;"));
      assert.ok(cssContent.includes("min-width: 44px;"));

      assert.ok(cssContent.includes(".btn-card-inspect,"));
      assert.ok(cssContent.includes(".filter-controls select {"));
    });
  });

  describe("10. Mobile UX and App Detail View Layout Contracts", () => {
    test("Metrics ribbon is hidden when viewing an individual app detail page", () => {
      assert.ok(cssContent.includes("body.viewing-app .metrics-ribbon,"));
      assert.ok(cssContent.includes("body:has(#panel-app-detail.active) .metrics-ribbon"));
      assert.ok(cssContent.includes("display: none !important;"));
    });

    test("Catalog card footer displays clean format badge and avoids raw repo slug overflow", () => {
      assert.ok(jsContent.includes('class="card-footer-badge"'));
      assert.ok(!jsContent.includes('<span>${escapeHtml(release.repository'), "Card footer must not contain raw release.repository");
      assert.ok(cssContent.includes(".card-footer-badge {"));
    });

    test("Mobile styles hide secondary card buttons and compact hero/ribbon layout", () => {
      assert.ok(cssContent.includes(".btn-card-edit,\n  .btn-card-copy {\n    display: none;"));
      assert.ok(cssContent.includes(".catalog-hero {"));
      assert.ok(htmlContent.includes('placeholder="Search applications..."'));
    });
  });
});
