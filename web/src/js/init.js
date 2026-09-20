// Application Bootstrap & Data Loading Orchestration

const metricTargetEl = document.getElementById('metricTarget');
const metricCompletedEl = document.getElementById('metricCompleted');
const metricPendingEl = document.getElementById('metricPending');
const metricFlathubEl = document.getElementById('metricFlathub');
const metricProgressBar = document.getElementById('metricProgressBar');
const metricProgressText = document.getElementById('metricProgressText');
const catalogCountBadge = document.getElementById('catalogCountBadge');
const backlogCountBadge = document.getElementById('backlogCountBadge');

function updateMetricsUI() {
  const totalTarget = statusData.targetCount || (catalogList.length + (statusData.pending ? statusData.pending.length : 34));
  const completedCount = catalogList.length || statusData.completedCount || 147;
  const pendingCount = statusData.pending ? statusData.pending.length : (statusData.pendingCount || 34);
  const flathubCount = statusData.flathubCoveredCount || 264;
  const percent = Math.round((completedCount / totalTarget) * 100) || 81;

  if (metricTargetEl) metricTargetEl.innerText = totalTarget;
  if (metricCompletedEl) metricCompletedEl.innerText = completedCount;
  if (metricPendingEl) metricPendingEl.innerText = pendingCount;
  if (metricFlathubEl) metricFlathubEl.innerText = flathubCount;
  if (metricProgressBar) metricProgressBar.style.width = `${percent}%`;
  if (metricProgressText) metricProgressText.innerText = `${percent}%`;

  if (catalogCountBadge) catalogCountBadge.innerText = completedCount;
  if (backlogCountBadge) backlogCountBadge.innerText = pendingCount;
}

function refreshAllViews() {
  const repoGithubLink = document.getElementById('repoGithubLink');
  if (repoGithubLink) {
    repoGithubLink.href = `https://github.com/${getCurrentRepo()}`;
  }
  updateMetricsUI();
  populateCategoryFilter();
  renderCatalogGrid();
  renderBacklogTable();
  populateTemplateDropdown();

  if (catalogData[currentSlug]) {
    loadAppIntoStudio(currentSlug);
  } else if (catalogList.length > 0) {
    loadAppIntoStudio(catalogList[0].slug);
  }

  handleRouting(true);
}

async function loadData() {
  // 1. Check synchronous offline bundle first (instant execution, zero network wait)
  if (window.__ANYLINUX_CATALOG__ && window.__ANYLINUX_CATALOG__.apps) {
    catalogData = window.__ANYLINUX_CATALOG__.apps;
    catalogList = Object.entries(catalogData).map(([slug, app]) => ({ slug, ...app }));
  }

  if (window.__ANYLINUX_STATUS__ && Array.isArray(window.__ANYLINUX_STATUS__.pending)) {
    statusData = window.__ANYLINUX_STATUS__;
  }

  // Refresh UI immediately from bundle
  if (catalogList.length > 0) {
    refreshAllViews();
  }

  // 2. Asynchronous fetch if running on HTTP / HTTPS to catch any live updates
  if (window.location.protocol.startsWith('http')) {
    const catalogUrls = ['catalog.json', '../dist/catalog.json'];
    for (const url of catalogUrls) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          if (json.apps && Object.keys(json.apps).length > 0) {
            catalogData = json.apps;
            catalogList = Object.entries(catalogData).map(([slug, app]) => ({ slug, ...app }));
            break;
          }
        }
      } catch {}
    }

    const statusUrls = ['status.json', '../status.json'];
    for (const url of statusUrls) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          statusData = await res.json();
          break;
        }
      } catch {}
    }

    refreshAllViews();
  }
}

// Bootstrap all submodules
initTheme();
initTabs();
initRouter();
initModal();
initLightbox();
initAppDetailPage();
initCatalog();
initBacklog();
initStudio();
initValidator();

handleRouting(true);
loadData();

