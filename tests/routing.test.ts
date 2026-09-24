import { describe, it as test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = import.meta.dirname ?? dirname(fileURLToPath(import.meta.url));
const rootDir = join(currentDir, "..");
const appJs = readFileSync(join(rootDir, "web", "app.js"), "utf8");

function setupRoutingSandbox(initialUrl: string) {
  const panels: Record<string, { id: string; active: boolean; hidden: boolean; classList: any }> = {
    "panel-catalog": { id: "panel-catalog", active: false, hidden: true, classList: null },
    "panel-app-detail": { id: "panel-app-detail", active: false, hidden: true, classList: null },
    "panel-backlog": { id: "panel-backlog", active: false, hidden: true, classList: null },
    "panel-studio": { id: "panel-studio", active: false, hidden: true, classList: null },
    "panel-validator": { id: "panel-validator", active: false, hidden: true, classList: null }
  };

  const tabPanels = Object.values(panels);
  tabPanels.forEach((p) => {
    p.classList = {
      toggle(cls: string, on: boolean) {
        if (cls === "active") p.active = on;
      }
    };
  });

  const navTabs = ["catalog", "backlog", "studio", "validator"].map((tab) => ({
    dataset: { tab },
    active: false,
    classList: {
      toggle(cls: string, on: boolean) {
        if (cls === "active") this.active = on;
      }
    },
    setAttribute() {}
  }));

  const sandbox: Record<string, any> = {
    window: {
      location: new URL(initialUrl),
      history: { pushState() {}, replaceState() {} },
      addEventListener() {},
      matchMedia: () => ({ matches: false }),
      scrollTo() {}
    },
    document: {
      documentElement: { setAttribute() {}, getAttribute() {} },
      title: "",
      head: { appendChild() {} },
      querySelector: () => ({ setAttribute() {}, remove() {} }),
      querySelectorAll: (sel: string) => {
        if (sel === ".tab-panel") return tabPanels;
        if (sel === ".nav-tab") return navTabs;
        return [];
      },
      getElementById: (id: string) => panels[id] || null,
      createElement: () => ({ setAttribute() {}, remove() {} })
    },
    URLSearchParams,
    URL,
    catalogData: {
      "2ship2harkinian": {
        appstream: { metadata: { name: "2 Ship 2 Harkinian", summary: "Zelda port" } }
      }
    },
    tabPanels,
    navTabs,
    renderAppDetailPage: () => {},
    safeScrollToTop: () => {},
    showToast: () => {},
    getPrimaryIconUrl: () => "",
    closeScreenshotLightbox: () => {},
    closeAppDetailModal: () => {}
  };

  const routerSnippet = appJs.slice(appJs.indexOf("function switchTab"), appJs.indexOf("function initRouter"));
  const wrappedCode = `
    const {
      window,
      document,
      URLSearchParams,
      URL,
      catalogData,
      tabPanels,
      navTabs,
      renderAppDetailPage,
      safeScrollToTop,
      showToast,
      getPrimaryIconUrl,
      closeScreenshotLightbox,
      closeAppDetailModal
    } = sandbox;

    ${routerSnippet}

    return { navigateToApp, navigateToCatalog, switchTab, handleRouting };
  `;
  const fn = new Function("sandbox", wrappedCode);
  Object.assign(sandbox, fn(sandbox));

  return { sandbox, panels };
}

describe("Browser History and Routing Navigation Tests", () => {
  test("1. Navigating to an application activates panel-app-detail and deactivates panel-catalog", () => {
    const { sandbox, panels } = setupRoutingSandbox("http://localhost:3000/");
    sandbox.navigateToApp("2ship2harkinian", false);

    assert.equal(panels["panel-app-detail"].active, true, "panel-app-detail must be active");
    assert.equal(panels["panel-app-detail"].hidden, false, "panel-app-detail must not be hidden");
    assert.equal(panels["panel-catalog"].active, false, "panel-catalog must be inactive");
  });

  test("2. Browser back button (popstate returning to /) restores catalog view and hides app detail", () => {
    const { sandbox, panels } = setupRoutingSandbox("http://localhost:3000/?app=2ship2harkinian");
    sandbox.navigateToApp("2ship2harkinian", false);

    // Simulate browser back button: URL changes to root with no query parameters
    sandbox.window.location = new URL("http://localhost:3000/");
    sandbox.handleRouting(false);

    assert.equal(panels["panel-catalog"].active, true, "panel-catalog must become active after back button");
    assert.equal(panels["panel-catalog"].hidden, false, "panel-catalog must be visible");
    assert.equal(panels["panel-app-detail"].active, false, "panel-app-detail must become inactive");
    assert.equal(panels["panel-app-detail"].hidden, true, "panel-app-detail must be hidden");
  });

  test("3. Browser forward button (popstate to ?app=slug) restores application detail view", () => {
    const { sandbox, panels } = setupRoutingSandbox("http://localhost:3000/");
    sandbox.handleRouting(false);

    // Simulate browser forward button: URL changes to ?app=2ship2harkinian
    sandbox.window.location = new URL("http://localhost:3000/?app=2ship2harkinian");
    sandbox.handleRouting(false);

    assert.equal(panels["panel-app-detail"].active, true, "panel-app-detail must become active after forward button");
    assert.equal(panels["panel-catalog"].hidden, true, "panel-catalog must be hidden");
  });

  test("4. Browser back button returning to a tab view (?tab=backlog) activates the correct tab", () => {
    const { sandbox, panels } = setupRoutingSandbox("http://localhost:3000/?app=2ship2harkinian");
    sandbox.navigateToApp("2ship2harkinian", false);

    // Simulate browser back button to ?tab=backlog
    sandbox.window.location = new URL("http://localhost:3000/?tab=backlog");
    sandbox.handleRouting(false);

    assert.equal(panels["panel-backlog"].active, true, "panel-backlog must be active");
    assert.equal(panels["panel-app-detail"].hidden, true, "panel-app-detail must be hidden");
  });
});
