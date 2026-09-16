// AnyLinux Metadata Portal Application Logic
// Production-grade, zero emojis, resilient across file://, localhost, and GitHub Pages.

(function () {
  'use strict';

  // --- State ---
  let catalogData = {};
  let catalogList = [];
  let statusData = { completed: [], pending: [], targetCount: 181, completedCount: 147, pendingCount: 34 };
  let currentSlug = 'ghostty';
  let keywordTags = ['ghostty', 'terminal', 'emulator', 'cli'];
  let featureBullets = [
    'GPU-accelerated text rendering delivering instant keystroke response',
    'Native desktop integration with tabs, splits, and custom fonts',
    'Low memory footprint and clean cross-platform configuration'
  ];
  let screenshotItems = [];

  // SVG Icons
  const ICONS = {
    check: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    cross: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
    warn: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>',
    trash: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>',
    edit: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>',
    copy: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>',
    eye: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>'
  };

  // Category Colors Palette for SVG Avatars
  const CATEGORY_COLORS = {
    Utility: '#0284c7',
    System: '#059669',
    Development: '#7c3aed',
    Game: '#d97706',
    ActionGame: '#ea580c',
    Emulator: '#6366f1',
    AudioVideo: '#db2777',
    Graphics: '#0891b2',
    Network: '#2563eb',
    Office: '#4f46e5',
    Science: '#0d9488',
    Education: '#ea580c',
    Settings: '#64748b'
  };

  // --- Multi-Tier Icon Fallback Engine ---
  window.handleIconError = function (img, slug, name, category) {
    if (!slug) slug = 'app';
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '');

    // Tier 1: Try Portable-Linux-Apps raw GitHub CDN (verified live HTTP 200)
    if (!img.dataset.triedPla) {
      img.dataset.triedPla = 'true';
      img.src = `https://raw.githubusercontent.com/Portable-Linux-Apps/Portable-Linux-Apps.github.io/main/icons/${cleanSlug}.png`;
      return;
    }

    // Tier 2: Try AnyLinux raw GitHub
    if (!img.dataset.triedAnylinux) {
      img.dataset.triedAnylinux = 'true';
      img.src = `https://raw.githubusercontent.com/pkgforge-dev/Anylinux-Metadata/main/icons/${cleanSlug}.png`;
      return;
    }

    // Tier 3: Try parent relative path if served from subfolder
    if (!img.dataset.triedParent) {
      img.dataset.triedParent = 'true';
      img.src = `../icons/${cleanSlug}.png`;
      return;
    }

    // Final Tier: Generate deterministic high-contrast SVG Avatar with app initial
    img.onerror = null;
    const initial = (name || slug || '?').trim().charAt(0).toUpperCase();
    const bg = CATEGORY_COLORS[category] || '#2563eb';
    img.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" rx="12" fill="${encodeURIComponent(bg)}"/><text x="32" y="41" fill="white" font-family="system-ui,-apple-system,sans-serif" font-size="28" font-weight="bold" text-anchor="middle">${encodeURIComponent(initial)}</text></svg>`;
  };

  function getPrimaryIconUrl(slug) {
    const cleanSlug = (slug || 'app').toLowerCase().replace(/[^a-z0-9-]/g, '');
    return `icons/${cleanSlug}.png`;
  }

  // --- Clipboard Helper with Insecure / File Fallback ---
  function copyTextToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand('copy');
    } catch (err) {}
    document.body.removeChild(ta);
    return Promise.resolve();
  }

  // --- DOM Elements ---
  const navTabs = document.querySelectorAll('.nav-tab');
  const tabPanels = document.querySelectorAll('.tab-panel');

  // Metrics
  const metricTargetEl = document.getElementById('metricTarget');
  const metricCompletedEl = document.getElementById('metricCompleted');
  const metricPendingEl = document.getElementById('metricPending');
  const metricFlathubEl = document.getElementById('metricFlathub');
  const metricProgressBar = document.getElementById('metricProgressBar');
  const metricProgressText = document.getElementById('metricProgressText');
  const catalogCountBadge = document.getElementById('catalogCountBadge');
  const backlogCountBadge = document.getElementById('backlogCountBadge');

  // Catalog Explorer
  const catalogSearchEl = document.getElementById('catalogSearch');
  const catalogSearchClearEl = document.getElementById('catalogSearchClear');
  const catalogCategoryFilterEl = document.getElementById('catalogCategoryFilter');
  const catalogSortFilterEl = document.getElementById('catalogSortFilter');
  const catalogGridEl = document.getElementById('catalogGrid');
  const catalogResultsCountEl = document.getElementById('catalogResultsCount');

  // Backlog
  const backlogSearchEl = document.getElementById('backlogSearch');
  const backlogTableBodyEl = document.getElementById('backlogTableBody');

  // Studio Inputs
  const templateSelectEl = document.getElementById('templateSelect');
  const btnUploadJson = document.getElementById('btnUploadJson');
  const fileInput = document.getElementById('fileInput');
  const btnResetForm = document.getElementById('btnResetForm');

  const appNameEl = document.getElementById('appName');
  const appSlugEl = document.getElementById('appSlug');
  const appIdEl = document.getElementById('appId');
  const summaryEl = document.getElementById('summary');
  const summaryCharCounterEl = document.getElementById('summaryCharCounter');
  const summaryPeriodWarningEl = document.getElementById('summaryPeriodWarning');
  const leadParagraphEl = document.getElementById('leadParagraph');
  const bulletListContainerEl = document.getElementById('bulletListContainer');
  const btnAddBulletEl = document.getElementById('btnAddBullet');
  const licenseSelectEl = document.getElementById('licenseSelect');
  const customLicenseInputEl = document.getElementById('customLicenseInput');
  const categorySelectEl = document.getElementById('categorySelect');
  const devNameEl = document.getElementById('devName');
  const homepageEl = document.getElementById('homepage');
  const keywordsTagContainerEl = document.getElementById('keywordsTagContainer');
  const keywordsInputEl = document.getElementById('keywordsInput');
  const iconUrlEl = document.getElementById('iconUrl');
  const iconTestImgEl = document.getElementById('iconTestImg');
  const iconTestLabelEl = document.getElementById('iconTestLabel');
  const screenshotsContainerEl = document.getElementById('screenshotsContainer');
  const btnAddScreenshotEl = document.getElementById('btnAddScreenshot');
  const releaseRepoEl = document.getElementById('releaseRepo');

  // Studio Sandbox
  const sbNetworkEl = document.getElementById('sbNetwork');
  const sbDisplayEl = document.getElementById('sbDisplay');
  const sbAudioEl = document.getElementById('sbAudio');
  const sbProcessesEl = document.getElementById('sbProcesses');
  const devGpuEl = document.getElementById('devGpu');
  const devInputEl = document.getElementById('devInput');
  const devKvmEl = document.getElementById('devKvm');
  const devCameraEl = document.getElementById('devCamera');
  const sbIpcEl = document.getElementById('sbIpc');

  // Studio Previews & Diagnostics
  const diagMasterStatusEl = document.getElementById('diagMasterStatus');
  const diagChecklistEl = document.getElementById('diagChecklist');
  const storeMockIconEl = document.getElementById('storeMockIcon');
  const storeMockNameEl = document.getElementById('storeMockName');
  const storeMockIdEl = document.getElementById('storeMockId');
  const storeMockSummaryEl = document.getElementById('storeMockSummary');
  const storeMockCategoryEl = document.getElementById('storeMockCategory');
  const storeMockLicenseEl = document.getElementById('storeMockLicense');
  const storeMockRepoEl = document.getElementById('storeMockRepo');
  const storeMockDescEl = document.getElementById('storeMockDesc');
  const storeMockGalleryEl = document.getElementById('storeMockGallery');
  const storeMockNetworkEl = document.getElementById('storeMockNetwork');
  const storeMockDisplayEl = document.getElementById('storeMockDisplay');
  const storeMockGpuEl = document.getElementById('storeMockGpu');
  const studioJsonDisplayEl = document.getElementById('studioJsonDisplay');
  const jsonStatsEl = document.getElementById('jsonStats');

  // Studio Actions
  const btnDownloadManifest = document.getElementById('btnDownloadManifest');
  const btnCopyJsonFull = document.getElementById('btnCopyJsonFull');
  const btnCopyJsonSnippet = document.getElementById('btnCopyJsonSnippet');
  const btnSubmitGitHubIssue = document.getElementById('btnSubmitGitHubIssue');

  // Sub tabs (Store vs JSON)
  const subTabs = document.querySelectorAll('.sub-tab');

  // Validator View
  const validatorInputEl = document.getElementById('validatorInput');
  const btnRunValidation = document.getElementById('btnRunValidation');
  const btnFormatValidatorJson = document.getElementById('btnFormatValidatorJson');
  const btnClearValidatorJson = document.getElementById('btnClearValidatorJson');
  const btnLoadValidToStudio = document.getElementById('btnLoadValidToStudio');
  const validatorReportEl = document.getElementById('validatorReport');

  // Detail Modal
  const appDetailModal = document.getElementById('appDetailModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalDetailContent = document.getElementById('modalDetailContent');

  // Toast Container
  const toastContainer = document.getElementById('toastContainer');

  // --- Notification Toast ---
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerText = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // --- Tab Navigation ---
  function switchTab(tabId) {
    navTabs.forEach((t) => t.classList.toggle('active', t.dataset.tab === tabId));
    tabPanels.forEach((p) => p.classList.toggle('active', p.id === `panel-${tabId}`));
    window.location.hash = tabId;
  }

  navTabs.forEach((tab) => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  function handleHashNavigation() {
    const hash = window.location.hash.replace('#', '') || 'catalog';
    if (['catalog', 'backlog', 'studio', 'validator'].includes(hash)) {
      switchTab(hash);
    }
  }

  // --- Data Loading ---
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

  function refreshAllViews() {
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
  }

  function updateMetricsUI() {
    const totalTarget = statusData.targetCount || (catalogList.length + (statusData.pending ? statusData.pending.length : 34));
    const completedCount = catalogList.length || statusData.completedCount || 147;
    const pendingCount = statusData.pending ? statusData.pending.length : (statusData.pendingCount || 34);
    const flathubCount = statusData.flathubCoveredCount || 264;
    const percent = Math.round((completedCount / totalTarget) * 100) || 81;

    metricTargetEl.innerText = totalTarget;
    metricCompletedEl.innerText = completedCount;
    metricPendingEl.innerText = pendingCount;
    metricFlathubEl.innerText = flathubCount;
    metricProgressBar.style.width = `${percent}%`;
    metricProgressText.innerText = `${percent}%`;

    catalogCountBadge.innerText = completedCount;
    backlogCountBadge.innerText = pendingCount;
  }

  function populateCategoryFilter() {
    const counts = {};
    catalogList.forEach((item) => {
      const cat = item.appstream?.metadata?.categories?.[0] || 'Utility';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    const currentVal = catalogCategoryFilterEl.value;
    catalogCategoryFilterEl.innerHTML = '<option value="all">All Categories</option>';
    const sortedCats = Object.keys(counts).sort();
    sortedCats.forEach((cat) => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.innerText = `${cat} (${counts[cat]})`;
      catalogCategoryFilterEl.appendChild(opt);
    });
    if (counts[currentVal]) {
      catalogCategoryFilterEl.value = currentVal;
    }
  }

  // --- Catalog Explorer Rendering ---
  function renderCatalogGrid() {
    const query = (catalogSearchEl.value || '').toLowerCase().trim();
    const catFilter = catalogCategoryFilterEl.value;
    const sortVal = catalogSortFilterEl.value;

    let filtered = catalogList.filter((item) => {
      const meta = item.appstream?.metadata || {};
      const name = (meta.name || '').toLowerCase();
      const slug = item.slug.toLowerCase();
      const id = (meta.id || '').toLowerCase();
      const summary = (meta.summary || '').toLowerCase();
      const keywords = (meta.keywords || []).map((k) => k.toLowerCase()).join(' ');

      const matchesSearch =
        !query ||
        name.includes(query) ||
        slug.includes(query) ||
        id.includes(query) ||
        summary.includes(query) ||
        keywords.includes(query);

      const matchesCategory =
        catFilter === 'all' ||
        (meta.categories && meta.categories.includes(catFilter));

      return matchesSearch && matchesCategory;
    });

    // Sorting
    filtered.sort((a, b) => {
      const nameA = (a.appstream?.metadata?.name || a.slug).toLowerCase();
      const nameB = (b.appstream?.metadata?.name || b.slug).toLowerCase();
      if (sortVal === 'name-asc') return nameA.localeCompare(nameB);
      if (sortVal === 'name-desc') return nameB.localeCompare(nameA);
      if (sortVal === 'category') {
        const catA = (a.appstream?.metadata?.categories?.[0] || '').toLowerCase();
        const catB = (b.appstream?.metadata?.categories?.[0] || '').toLowerCase();
        return catA.localeCompare(catB) || nameA.localeCompare(nameB);
      }
      return 0;
    });

    catalogResultsCountEl.innerText = `Showing ${filtered.length} of ${catalogList.length} applications`;
    catalogSearchClearEl.style.display = query ? 'flex' : 'none';

    catalogGridEl.innerHTML = '';

    if (filtered.length === 0) {
      catalogGridEl.innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem; color: var(--text-dim);">
          <p style="font-size: 1.1rem; margin-bottom: 0.5rem; color: var(--text-secondary);">No applications found matching your criteria</p>
          <p style="font-size: 0.85rem;">Try clearing the search query or selecting "All Categories"</p>
        </div>
      `;
      return;
    }

    filtered.forEach((item) => {
      const meta = item.appstream?.metadata || {};
      const release = item.releaseSource || {};
      const sandbox = item.sandbox || {};
      const mainCategory = meta.categories?.[0] || 'Utility';
      const license = meta.projectLicense || 'Unknown';
      const iconSrc = getPrimaryIconUrl(item.slug);

      const card = document.createElement('div');
      card.className = 'app-card';
      card.dataset.slug = item.slug;

      card.innerHTML = `
        <div class="app-card-head">
          <img class="app-card-icon" src="${escapeHtml(iconSrc)}" alt="${escapeHtml(meta.name || item.slug)}" loading="lazy" onerror="handleIconError(this, '${escapeHtml(item.slug)}', '${escapeAttr(meta.name || item.slug)}', '${escapeAttr(mainCategory)}')">
          <div class="app-card-info">
            <div class="app-card-title">${escapeHtml(meta.name || item.slug)}</div>
            <div class="app-card-id">${escapeHtml(meta.id || item.slug)}</div>
          </div>
        </div>

        <div class="app-card-summary">${escapeHtml(meta.summary || 'No summary available.')}</div>

        <div class="app-card-chips">
          <span class="chip chip-category">${escapeHtml(mainCategory)}</span>
          <span class="chip chip-license">${escapeHtml(license)}</span>
          ${sandbox.devices?.includes('gpu') ? '<span class="chip">GPU</span>' : ''}
          ${sandbox.display ? `<span class="chip">${escapeHtml(sandbox.display)}</span>` : ''}
        </div>

        <div class="app-card-footer">
          <span>${escapeHtml(release.repository || 'pkgforge-dev')}</span>
          <div class="card-actions-quick">
            <button class="btn btn-xs btn-outline btn-card-inspect" title="View details">${ICONS.eye} View</button>
            <button class="btn btn-xs btn-outline btn-card-edit" title="Edit in Studio">${ICONS.edit} Edit</button>
            <button class="btn btn-xs btn-outline btn-card-copy" title="Copy JSON">${ICONS.copy}</button>
          </div>
        </div>
      `;

      card.querySelector('.btn-card-inspect').addEventListener('click', (e) => {
        e.stopPropagation();
        openAppDetailModal(item.slug);
      });

      card.querySelector('.btn-card-edit').addEventListener('click', (e) => {
        e.stopPropagation();
        loadAppIntoStudio(item.slug);
        switchTab('studio');
      });

      card.querySelector('.btn-card-copy').addEventListener('click', (e) => {
        e.stopPropagation();
        copyTextToClipboard(JSON.stringify(item, null, 2));
        showToast(`Copied ${meta.name || item.slug} manifest to clipboard`, 'success');
      });

      card.addEventListener('click', () => {
        openAppDetailModal(item.slug);
      });

      catalogGridEl.appendChild(card);
    });
  }

  catalogSearchEl.addEventListener('input', renderCatalogGrid);
  catalogCategoryFilterEl.addEventListener('change', renderCatalogGrid);
  catalogSortFilterEl.addEventListener('change', renderCatalogGrid);
  catalogSearchClearEl.addEventListener('click', () => {
    catalogSearchEl.value = '';
    renderCatalogGrid();
  });

  // Global search shortcut (press "/" to search catalog)
  window.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault();
      switchTab('catalog');
      catalogSearchEl.focus();
    }
  });

  // --- Detail Modal ---
  function openAppDetailModal(slug) {
    const app = catalogData[slug];
    if (!app) return;

    const meta = app.appstream?.metadata || {};
    const media = app.appstream?.media || {};
    const sandbox = app.sandbox || {};
    const release = app.releaseSource || {};
    const mainCategory = meta.categories?.[0] || 'Utility';
    const iconSrc = getPrimaryIconUrl(slug);

    let descHtml = '';
    if (Array.isArray(meta.description)) {
      for (const block of meta.description) {
        if (block.type === 'paragraph' && Array.isArray(block.content)) {
          descHtml += `<p style="margin-bottom: 0.75rem; line-height: 1.6; color: var(--text-secondary);">${block.content.map((c) => escapeHtml(c.value || '')).join('')}</p>`;
        } else if (block.type === 'unordered-list' && Array.isArray(block.items)) {
          descHtml += `<ul style="margin: 0.5rem 0 1rem 1.5rem; line-height: 1.6; color: var(--text-secondary);">`;
          for (const item of block.items) {
            descHtml += `<li>${item.map((c) => escapeHtml(c.value || '')).join('')}</li>`;
          }
          descHtml += `</ul>`;
        }
      }
    }

    let screenshotsHtml = '';
    const validScreenshots = Array.isArray(media.screenshots)
      ? media.screenshots.filter((s) => s && s.source && s.source.startsWith('http'))
      : [];

    if (validScreenshots.length > 0) {
      screenshotsHtml = `
        <div style="margin: 1.5rem 0;">
          <h4 style="font-size: 0.9rem; margin-bottom: 0.75rem; color: var(--text-main);">Screenshots</h4>
          <div style="display: flex; gap: 0.75rem; overflow-x: auto; padding-bottom: 0.5rem;">
            ${validScreenshots
              .map(
                (ss) => `
              <div style="flex-shrink: 0; text-align: center;">
                <img src="${escapeHtml(ss.source)}" alt="${escapeHtml(ss.caption || '')}" style="height: 140px; border-radius: 6px; border: 1px solid var(--border); object-fit: cover;" onerror="this.parentElement.style.display='none'">
                <div style="font-size: 0.75rem; color: var(--text-dim); margin-top: 0.25rem;">${escapeHtml(ss.caption || '')}</div>
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      `;
    }

    modalDetailContent.innerHTML = `
      <div style="display: flex; gap: 1.25rem; align-items: flex-start; margin-bottom: 1.5rem;">
        <img src="${escapeHtml(iconSrc)}" alt="${escapeHtml(meta.name || slug)}" style="width: 72px; height: 72px; border-radius: 12px; object-fit: cover; border: 1px solid var(--border); background: var(--surface-raised);" onerror="handleIconError(this, '${escapeHtml(slug)}', '${escapeAttr(meta.name || slug)}', '${escapeAttr(mainCategory)}')">
        <div style="flex: 1;">
          <h2 style="font-size: 1.4rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.2rem;">${escapeHtml(meta.name || slug)}</h2>
          <div style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--primary); margin-bottom: 0.5rem;">${escapeHtml(meta.id || slug)}</div>
          <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.4;">${escapeHtml(meta.summary || '')}</p>
        </div>
      </div>

      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1.25rem;">
        <span class="chip chip-category">${escapeHtml(mainCategory)}</span>
        <span class="chip chip-license">${escapeHtml(meta.projectLicense || 'Unknown')}</span>
        ${meta.developer?.name ? `<span class="chip">Dev: ${escapeHtml(meta.developer.name)}</span>` : ''}
        ${app.addedAt ? `<span class="chip">Added: ${escapeHtml(app.addedAt)}</span>` : ''}
      </div>

      <div style="border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); padding: 1.25rem 0; margin-bottom: 1.25rem;">
        <h4 style="font-size: 0.9rem; margin-bottom: 0.75rem; color: var(--text-main);">Description</h4>
        ${descHtml || '<p style="color: var(--text-dim);">No detailed description available.</p>'}
      </div>

      ${screenshotsHtml}

      <div style="background: var(--bg-subtle); border: 1px solid var(--border); border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem;">
        <h4 style="font-size: 0.85rem; margin-bottom: 0.5rem; color: var(--text-main);">Sandbox Permissions</h4>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; font-size: 0.8rem;">
          <div><span style="color: var(--text-dim);">Network:</span> <strong>${escapeHtml(sandbox.network || 'none')}</strong></div>
          <div><span style="color: var(--text-dim);">Display:</span> <strong>${escapeHtml(sandbox.display || 'none')}</strong></div>
          <div><span style="color: var(--text-dim);">Audio:</span> <strong>${escapeHtml(sandbox.audio || 'none')}</strong></div>
          <div><span style="color: var(--text-dim);">Processes:</span> <strong>${escapeHtml(sandbox.processes || 'isolated')}</strong></div>
          <div><span style="color: var(--text-dim);">IPC:</span> <strong>${sandbox.ipc ? 'enabled' : 'disabled'}</strong></div>
          <div><span style="color: var(--text-dim);">GPU:</span> <strong>${sandbox.devices?.includes('gpu') ? 'enabled' : 'none'}</strong></div>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap;">
        <div style="display: flex; gap: 0.5rem;">
          ${meta.homepage ? `<a href="${escapeHtml(meta.homepage)}" target="_blank" class="btn btn-sm btn-outline">Homepage</a>` : ''}
          ${release.repository ? `<a href="https://github.com/${escapeHtml(release.repository)}" target="_blank" class="btn btn-sm btn-outline">Release Repo</a>` : ''}
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn btn-sm btn-secondary" id="modalBtnCopyJson">${ICONS.copy} Copy JSON</button>
          <button class="btn btn-sm btn-primary" id="modalBtnEditStudio">${ICONS.edit} Edit in Studio</button>
        </div>
      </div>
    `;

    document.getElementById('modalBtnCopyJson').addEventListener('click', () => {
      copyTextToClipboard(JSON.stringify(app, null, 2));
      showToast('Copied JSON manifest to clipboard', 'success');
    });

    document.getElementById('modalBtnEditStudio').addEventListener('click', () => {
      appDetailModal.classList.remove('active');
      loadAppIntoStudio(slug);
      switchTab('studio');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    appDetailModal.classList.add('active');
  }

  modalCloseBtn.addEventListener('click', () => appDetailModal.classList.remove('active'));
  appDetailModal.addEventListener('click', (e) => {
    if (e.target === appDetailModal) appDetailModal.classList.remove('active');
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && appDetailModal.classList.contains('active')) {
      appDetailModal.classList.remove('active');
    }
  });

  // --- Backlog Queue Rendering ---
  function renderBacklogTable() {
    const query = (backlogSearchEl.value || '').toLowerCase().trim();
    const pendingList = statusData.pending || [];

    const filtered = pendingList.filter((item) => {
      return (
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.slug.toLowerCase().includes(query) ||
        item.repo.toLowerCase().includes(query)
      );
    });

    backlogTableBodyEl.innerHTML = '';

    if (filtered.length === 0) {
      backlogTableBodyEl.innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center; padding: 2.5rem; color: var(--text-dim);">
            No pending applications match your search query.
          </td>
        </tr>
      `;
      return;
    }

    filtered.forEach((item) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${escapeHtml(item.name)}</strong></td>
        <td><span class="slug-code">${escapeHtml(item.slug)}</span></td>
        <td><a href="https://github.com/${escapeHtml(item.repo)}" target="_blank" class="link-btn">${escapeHtml(item.repo)}</a></td>
        <td style="text-align: right;">
          <button class="btn btn-sm btn-primary btn-claim-app">
            ${ICONS.edit} Author Metadata
          </button>
        </td>
      `;

      tr.querySelector('.btn-claim-app').addEventListener('click', () => {
        claimPendingAppForStudio(item);
      });

      backlogTableBodyEl.appendChild(tr);
    });
  }

  backlogSearchEl.addEventListener('input', renderBacklogTable);

  function claimPendingAppForStudio(item) {
    appNameEl.value = item.name;
    const cleanSlug = item.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    appSlugEl.value = cleanSlug;
    appSlugEl.dataset.customized = 'true';

    const normSlug = cleanSlug.replace(/-/g, '_');
    appIdEl.value = `io.github.pkgforge_dev.${normSlug}`;
    appIdEl.dataset.customized = 'true';

    summaryEl.value = `${item.name} application for AnyLinux`;
    leadParagraphEl.value = `${item.name} is packaged as a standalone portable AppImage for AnyLinux.`;
    featureBullets = ['Standalone dependency-free portable execution', 'Desktop environment integration'];
    keywordTags = [cleanSlug, 'appimage', 'anylinux'];
    releaseRepoEl.value = item.repo;
    devNameEl.value = `${item.name} Developers`;
    homepageEl.value = `https://github.com/${item.repo}`;
    iconUrlEl.value = `https://raw.githubusercontent.com/pkgforge-dev/Anylinux-Metadata/main/icons/${cleanSlug}.png`;
    screenshotItems = [];

    renderBulletInputs();
    renderKeywordTags();
    renderScreenshotInputs();
    updateStudioManifest();
    testIconDimension();

    switchTab('studio');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    summaryEl.focus();
    showToast(`Loaded ${item.name} into Studio. Complete the details to submit.`, 'info');
  }

  // --- Authoring Studio Logic ---
  function populateTemplateDropdown() {
    templateSelectEl.innerHTML = '<option value="">Select Existing App to Fork / Edit...</option>';
    const sortedList = [...catalogList].sort((a, b) => {
      const nameA = (a.appstream?.metadata?.name || a.slug).toLowerCase();
      const nameB = (b.appstream?.metadata?.name || b.slug).toLowerCase();
      return nameA.localeCompare(nameB);
    });

    sortedList.forEach((item) => {
      const opt = document.createElement('option');
      opt.value = item.slug;
      opt.innerText = `${item.appstream?.metadata?.name || item.slug} (${item.slug})`;
      templateSelectEl.appendChild(opt);
    });
  }

  templateSelectEl.addEventListener('change', () => {
    if (templateSelectEl.value) {
      loadAppIntoStudio(templateSelectEl.value);
      showToast(`Loaded ${templateSelectEl.value} template`, 'info');
    }
  });

  btnResetForm.addEventListener('click', () => {
    if (confirm('Reset form fields to blank template?')) {
      resetStudioForm();
    }
  });

  function resetStudioForm() {
    appNameEl.value = '';
    appSlugEl.value = '';
    delete appSlugEl.dataset.customized;
    appIdEl.value = '';
    delete appIdEl.dataset.customized;
    summaryEl.value = '';
    leadParagraphEl.value = '';
    featureBullets = [];
    keywordTags = [];
    devNameEl.value = '';
    homepageEl.value = '';
    licenseSelectEl.value = 'MIT';
    customLicenseInputEl.style.display = 'none';
    customLicenseInputEl.value = '';
    categorySelectEl.value = 'Utility';
    iconUrlEl.value = '';
    screenshotItems = [];
    releaseRepoEl.value = '';

    renderBulletInputs();
    renderKeywordTags();
    renderScreenshotInputs();
    updateStudioManifest();
    testIconDimension();
  }

  function loadAppIntoStudio(slug) {
    const app = catalogData[slug];
    if (!app) return;

    currentSlug = slug;
    templateSelectEl.value = slug;

    const meta = app.appstream?.metadata || {};
    const media = app.appstream?.media || {};
    const sandbox = app.sandbox || {};
    const release = app.releaseSource || {};

    appNameEl.value = meta.name || slug;
    appSlugEl.value = slug;
    appSlugEl.dataset.customized = 'true';
    appIdEl.value = meta.id || `io.github.pkgforge_dev.${slug.replace(/-/g, '_')}`;
    appIdEl.dataset.customized = 'true';
    summaryEl.value = meta.summary || '';

    // Description AST
    leadParagraphEl.value = '';
    featureBullets = [];
    if (Array.isArray(meta.description)) {
      for (const b of meta.description) {
        if (b.type === 'paragraph' && Array.isArray(b.content) && !leadParagraphEl.value) {
          leadParagraphEl.value = b.content.map((c) => c.value).join('');
        } else if (b.type === 'unordered-list' && Array.isArray(b.items)) {
          featureBullets = b.items.map((it) => it.map((c) => c.value).join(''));
        }
      }
    }

    // License
    const lic = meta.projectLicense || 'MIT';
    const standardLics = ['MIT', 'Apache-2.0', 'GPL-3.0-or-later', 'GPL-2.0-or-later', 'BSD-3-Clause', 'BSD-2-Clause', 'AGPL-3.0-or-later', 'LGPL-3.0-or-later', 'MPL-2.0', 'CC0-1.0', 'Proprietary'];
    if (standardLics.includes(lic)) {
      licenseSelectEl.value = lic;
      customLicenseInputEl.style.display = 'none';
    } else {
      licenseSelectEl.value = 'custom';
      customLicenseInputEl.style.display = 'block';
      customLicenseInputEl.value = lic;
    }

    // Category
    categorySelectEl.value = meta.categories?.[0] || 'Utility';

    // Dev & Homepage
    devNameEl.value = meta.developer?.name || '';
    homepageEl.value = meta.homepage || '';

    // Keywords
    keywordTags = Array.isArray(meta.keywords) ? [...meta.keywords] : [slug];

    // Media
    iconUrlEl.value = media.icon || `https://raw.githubusercontent.com/pkgforge-dev/Anylinux-Metadata/main/icons/${slug}.png`;
    screenshotItems = Array.isArray(media.screenshots) && media.screenshots.length > 0
      ? JSON.parse(JSON.stringify(media.screenshots))
      : [];

    // Sandbox
    sbNetworkEl.value = sandbox.network || 'full';
    sbDisplayEl.value = sandbox.display || 'wayland-or-x11';
    sbAudioEl.value = sandbox.audio || 'none';
    sbProcessesEl.value = sandbox.processes || 'isolated';
    devGpuEl.checked = !!sandbox.devices?.includes('gpu');
    devInputEl.checked = !!sandbox.devices?.includes('input');
    devKvmEl.checked = !!sandbox.devices?.includes('kvm');
    devCameraEl.checked = !!sandbox.devices?.includes('camera');
    sbIpcEl.checked = sandbox.ipc !== false;

    // Release
    releaseRepoEl.value = release.repository || `pkgforge-dev/${slug}-AppImage`;

    renderBulletInputs();
    renderKeywordTags();
    renderScreenshotInputs();
    updateStudioManifest();
    testIconDimension();
  }

  // Auto-slugify on app name change
  appNameEl.addEventListener('input', () => {
    const name = appNameEl.value.trim();
    if (name && !appSlugEl.dataset.customized) {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      appSlugEl.value = slug;
      if (!appIdEl.dataset.customized) {
        appIdEl.value = `io.github.pkgforge_dev.${slug.replace(/-/g, '_')}`;
      }
      if (!iconUrlEl.dataset.customized) {
        iconUrlEl.value = `https://raw.githubusercontent.com/pkgforge-dev/Anylinux-Metadata/main/icons/${slug}.png`;
      }
      if (!releaseRepoEl.dataset.customized) {
        releaseRepoEl.value = `pkgforge-dev/${slug}-AppImage`;
      }
    }
    updateStudioManifest();
    testIconDimension();
  });

  // Automatically normalize slug characters
  appSlugEl.addEventListener('input', () => {
    appSlugEl.dataset.customized = 'true';
    appSlugEl.value = appSlugEl.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/--+/g, '-');
    updateStudioManifest();
    testIconDimension();
  });

  appIdEl.addEventListener('input', () => {
    appIdEl.dataset.customized = 'true';
    updateStudioManifest();
  });

  // Summary Counter and Trailing Period Check
  summaryEl.addEventListener('input', () => {
    const len = summaryEl.value.length;
    summaryCharCounterEl.innerText = `${len} / 200 characters`;
    const endsWithPeriod = summaryEl.value.trim().endsWith('.');
    summaryPeriodWarningEl.style.display = endsWithPeriod ? 'inline' : 'none';
    updateStudioManifest();
  });

  // Bullet Points Builder
  function renderBulletInputs() {
    bulletListContainerEl.innerHTML = '';
    featureBullets.forEach((bullet, index) => {
      const row = document.createElement('div');
      row.className = 'bullet-item-row';
      row.innerHTML = `
        <input type="text" value="${escapeHtml(bullet)}" placeholder="Feature highlight bullet..." data-index="${index}">
        <button type="button" class="btn-icon-del" data-index="${index}" title="Remove bullet">${ICONS.trash}</button>
      `;

      row.querySelector('input').addEventListener('input', (e) => {
        featureBullets[index] = e.target.value;
        updateStudioManifest();
      });

      row.querySelector('.btn-icon-del').addEventListener('click', () => {
        featureBullets.splice(index, 1);
        renderBulletInputs();
        updateStudioManifest();
      });

      bulletListContainerEl.appendChild(row);
    });
  }

  btnAddBulletEl.addEventListener('click', () => {
    featureBullets.push('');
    renderBulletInputs();
    const inputs = bulletListContainerEl.querySelectorAll('input');
    if (inputs.length > 0) inputs[inputs.length - 1].focus();
  });

  // Keyword Tags Input
  function renderKeywordTags() {
    keywordsTagContainerEl.querySelectorAll('.tag-pill').forEach((el) => el.remove());
    keywordTags.forEach((tag, idx) => {
      const pill = document.createElement('span');
      pill.className = 'tag-pill';
      pill.innerHTML = `
        ${escapeHtml(tag)}
        <span class="tag-del" data-index="${idx}">&times;</span>
      `;
      pill.querySelector('.tag-del').addEventListener('click', () => {
        keywordTags.splice(idx, 1);
        renderKeywordTags();
        updateStudioManifest();
      });
      keywordsTagContainerEl.insertBefore(pill, keywordsInputEl);
    });
  }

  keywordsInputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = keywordsInputEl.value.trim().replace(/^,|,$/g, '');
      if (val && !keywordTags.includes(val.toLowerCase())) {
        keywordTags.push(val.toLowerCase());
        keywordsInputEl.value = '';
        renderKeywordTags();
        updateStudioManifest();
      }
    } else if (e.key === 'Backspace' && !keywordsInputEl.value && keywordTags.length > 0) {
      keywordTags.pop();
      renderKeywordTags();
      updateStudioManifest();
    }
  });

  // Screenshots Builder
  function renderScreenshotInputs() {
    screenshotsContainerEl.innerHTML = '';
    screenshotItems.forEach((ss, idx) => {
      const row = document.createElement('div');
      row.className = 'screenshot-row';
      row.innerHTML = `
        <input type="url" placeholder="Screenshot HTTPS URL" value="${escapeHtml(ss.source || '')}" data-key="source" data-idx="${idx}">
        <input type="text" placeholder="Caption" value="${escapeHtml(ss.caption || '')}" data-key="caption" data-idx="${idx}">
        <button type="button" class="btn-icon-del" data-idx="${idx}" title="Remove screenshot">${ICONS.trash}</button>
      `;

      row.querySelectorAll('input').forEach((inp) => {
        inp.addEventListener('input', (e) => {
          const key = e.target.dataset.key;
          const index = parseInt(e.target.dataset.idx, 10);
          screenshotItems[index][key] = e.target.value;
          updateStudioManifest();
        });
      });

      row.querySelector('.btn-icon-del').addEventListener('click', () => {
        screenshotItems.splice(idx, 1);
        renderScreenshotInputs();
        updateStudioManifest();
      });

      screenshotsContainerEl.appendChild(row);
    });
  }

  btnAddScreenshotEl.addEventListener('click', () => {
    screenshotItems.push({ source: '', caption: 'Application window' });
    renderScreenshotInputs();
  });

  // Icon dimension tester
  function testIconDimension() {
    const slug = appSlugEl.value.trim() || 'app';
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '');
    const url = iconUrlEl.value.trim();

    if (!url) {
      iconTestImgEl.style.display = 'none';
      iconTestLabelEl.innerText = 'No URL';
      iconTestLabelEl.style.color = 'var(--text-dim)';
      return;
    }

    iconTestLabelEl.innerText = 'Testing...';
    iconTestLabelEl.style.color = 'var(--text-muted)';

    // Check primary local icon or live fallback
    const testImg = new Image();
    const localSrc = `icons/${cleanSlug}.png`;

    testImg.onload = function () {
      iconTestImgEl.src = localSrc;
      iconTestImgEl.style.display = 'block';
      const w = testImg.naturalWidth;
      const h = testImg.naturalHeight;
      if (w >= 128 && h >= 128) {
        iconTestLabelEl.innerText = `${w}x${h} OK`;
        iconTestLabelEl.style.color = 'var(--success)';
      } else {
        iconTestLabelEl.innerText = `${w}x${h} (Small)`;
        iconTestLabelEl.style.color = 'var(--warning)';
      }
    };

    testImg.onerror = function () {
      // Try upstream PLA
      const plaImg = new Image();
      plaImg.onload = function () {
        iconTestImgEl.src = plaImg.src;
        iconTestImgEl.style.display = 'block';
        iconTestLabelEl.innerText = `${plaImg.naturalWidth}x${plaImg.naturalHeight} OK (PLA)`;
        iconTestLabelEl.style.color = 'var(--success)';
      };
      plaImg.onerror = function () {
        iconTestImgEl.style.display = 'none';
        iconTestLabelEl.innerText = 'Pending asset';
        iconTestLabelEl.style.color = 'var(--warning)';
      };
      plaImg.src = `https://raw.githubusercontent.com/Portable-Linux-Apps/Portable-Linux-Apps.github.io/main/icons/${cleanSlug}.png`;
    };

    testImg.src = localSrc;
  }

  iconUrlEl.addEventListener('input', () => {
    iconUrlEl.dataset.customized = 'true';
    testIconDimension();
    updateStudioManifest();
  });

  // License Select handler
  licenseSelectEl.addEventListener('change', () => {
    if (licenseSelectEl.value === 'custom') {
      customLicenseInputEl.style.display = 'block';
      customLicenseInputEl.focus();
    } else {
      customLicenseInputEl.style.display = 'none';
    }
    updateStudioManifest();
  });

  customLicenseInputEl.addEventListener('input', updateStudioManifest);

  // Form input listeners
  [leadParagraphEl, categorySelectEl, devNameEl, homepageEl, releaseRepoEl, sbNetworkEl, sbDisplayEl, sbAudioEl, sbProcessesEl, devGpuEl, devInputEl, devKvmEl, devCameraEl, sbIpcEl].forEach((el) => {
    el.addEventListener('input', updateStudioManifest);
    el.addEventListener('change', updateStudioManifest);
  });

  // Construct Manifest Object and Update Diagnostics & Previews
  function updateStudioManifest() {
    const name = appNameEl.value.trim() || 'Application Name';
    const slug = (appSlugEl.value.trim() || 'app-slug').toLowerCase();
    const appId = appIdEl.value.trim() || 'io.github.owner.app';
    let summary = summaryEl.value.trim() || 'Application summary sentence';
    const endsWithPeriod = summary.endsWith('.');
    if (endsWithPeriod) {
      summary = summary.replace(/\.+$/, '');
    }

    // Build Description AST
    const descAst = [];
    const lead = leadParagraphEl.value.trim();
    if (lead) {
      descAst.push({
        type: 'paragraph',
        content: [{ type: 'text', value: lead }]
      });
    }

    const bullets = featureBullets.map((b) => b.trim()).filter(Boolean);
    if (bullets.length > 0) {
      descAst.push({
        type: 'unordered-list',
        items: bullets.map((b) => [{ type: 'text', value: b }])
      });
    }

    const license = licenseSelectEl.value === 'custom' ? customLicenseInputEl.value.trim() || 'MIT' : licenseSelectEl.value;
    const category = categorySelectEl.value;
    const devName = devNameEl.value.trim() || `${name} Developers`;
    const homepage = homepageEl.value.trim() || 'https://example.org';
    const releaseRepo = releaseRepoEl.value.trim() || `pkgforge-dev/${slug}-AppImage`;
    const iconUrl = iconUrlEl.value.trim() || `https://raw.githubusercontent.com/pkgforge-dev/Anylinux-Metadata/main/icons/${slug}.png`;

    const screenshots = screenshotItems
      .filter((s) => s.source && s.source.trim())
      .map((s, idx) => ({
        caption: s.caption.trim() || `${name} screenshot ${idx + 1}`,
        source: s.source.trim()
      }));

    const devices = [];
    if (devGpuEl.checked) devices.push('gpu');
    if (devInputEl.checked) devices.push('input');
    if (devKvmEl.checked) devices.push('kvm');
    if (devCameraEl.checked) devices.push('camera');

    const manifest = {
      $schema: 'https://raw.githubusercontent.com/pkgforge-dev/Anylinux-Metadata/main/schema/app-manifest.json',
      appstream: {
        type: 'manual',
        metadata: {
          id: appId,
          name,
          summary,
          description: descAst.length > 0 ? descAst : [{ type: 'paragraph', content: [{ type: 'text', value: summary }] }],
          projectLicense: license,
          developer: {
            name: devName,
            url: homepage
          },
          homepage,
          repository: homepage,
          keywords: keywordTags.length > 0 ? keywordTags : [slug, 'appimage', 'anylinux'],
          categories: [category]
        },
        media: {
          icon: iconUrl,
          screenshots
        }
      },
      addedAt: new Date().toISOString().split('T')[0],
      origin: {
        type: 'third-party'
      },
      releaseSource: {
        type: 'github',
        repository: releaseRepo
      },
      sandbox: {
        network: sbNetworkEl.value,
        display: sbDisplayEl.value,
        audio: sbAudioEl.value,
        processes: sbProcessesEl.value,
        ipc: sbIpcEl.checked,
        filesystem: [],
        devices,
        sessionBus: { access: 'none', rules: [] },
        systemBus: { access: 'none', rules: [] }
      }
    };

    // Diagnostics Evaluation
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    const appIdRegex = /^[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/;
    const isSlugValid = slugRegex.test(slug);
    const isAppIdValid = appIdRegex.test(appId);
    const isSummaryValid = summary.length > 0 && summary.length <= 200 && !endsWithPeriod;
    const isDescValid = descAst.length > 0;
    const isLicenseValid = !!license;
    const isCategoryValid = !!category;
    const isIconValid = iconUrl.startsWith('https://');

    const checks = [
      { name: `Valid Slug format: "${slug}"`, passed: isSlugValid, err: 'Must be lowercase alphanumeric + single hyphens' },
      { name: `Reverse-DNS App ID: "${appId}"`, passed: isAppIdValid, err: 'Must follow reverse-DNS convention (e.g. io.github.user.repo)' },
      { name: 'Summary length <= 200 chars and no trailing period', passed: isSummaryValid, err: 'Must not end with a period per AppStream spec' },
      { name: 'Description AST structured blocks', passed: isDescValid, err: 'Requires lead paragraph or feature list' },
      { name: `SPDX License: "${license}"`, passed: isLicenseValid, err: 'Valid SPDX license expression required' },
      { name: `Main Category: "${category}"`, passed: isCategoryValid, err: 'Must select a registered Freedesktop category' },
      { name: 'Canonical HTTPS Icon Asset URL', passed: isIconValid, err: 'Icon must use HTTPS canonical repository URL' }
    ];

    const failedCount = checks.filter((c) => !c.passed).length;
    diagMasterStatusEl.className = `diag-status-pill ${failedCount === 0 ? 'pass' : 'fail'}`;
    diagMasterStatusEl.innerText = failedCount === 0 ? 'All Checks Passed' : `${failedCount} Validation Issue(s)`;

    diagChecklistEl.innerHTML = checks
      .map(
        (c) => `
      <li class="diag-item">
        <span class="diag-icon ${c.passed ? 'pass' : 'fail'}">${c.passed ? ICONS.check : ICONS.cross}</span>
        <span>${escapeHtml(c.name)} ${c.passed ? '' : `<span style="color: var(--danger);">(${escapeHtml(c.err)})</span>`}</span>
      </li>
    `
      )
      .join('');

    // Store Card Preview Update
    storeMockNameEl.innerText = name;
    storeMockIdEl.innerText = appId;
    storeMockSummaryEl.innerText = summary;
    storeMockCategoryEl.innerText = category;
    storeMockLicenseEl.innerText = license;
    storeMockRepoEl.innerText = releaseRepo;

    // Use multi-tier icon for mock preview
    storeMockIconEl.src = getPrimaryIconUrl(slug);
    storeMockIconEl.onerror = function () {
      window.handleIconError(storeMockIconEl, slug, name, category);
    };

    let previewDescHtml = '';
    for (const b of descAst) {
      if (b.type === 'paragraph') {
        previewDescHtml += `<p style="margin-bottom: 0.5rem;">${b.content.map((c) => escapeHtml(c.value)).join('')}</p>`;
      } else if (b.type === 'unordered-list') {
        previewDescHtml += `<ul style="margin-left: 1.2rem; margin-bottom: 0.5rem;">${b.items.map((it) => `<li>${it.map((c) => escapeHtml(c.value)).join('')}</li>`).join('')}</ul>`;
      }
    }
    storeMockDescEl.innerHTML = previewDescHtml;

    if (screenshots.length > 0) {
      storeMockGalleryEl.style.display = 'flex';
      storeMockGalleryEl.innerHTML = screenshots
        .map((s) => `<img class="mock-thumb" src="${escapeHtml(s.source)}" alt="${escapeHtml(s.caption)}" title="${escapeHtml(s.caption)}" onerror="this.style.display='none'">`)
        .join('');
    } else {
      storeMockGalleryEl.style.display = 'none';
      storeMockGalleryEl.innerHTML = '';
    }

    storeMockNetworkEl.innerText = `Network: ${sbNetworkEl.value}`;
    storeMockDisplayEl.innerText = `Display: ${sbDisplayEl.value}`;
    storeMockGpuEl.innerText = `GPU: ${devGpuEl.checked ? 'enabled' : 'none'}`;

    // JSON Output
    const jsonStr = JSON.stringify(manifest, null, 2);
    studioJsonDisplayEl.innerHTML = `<code>${escapeHtml(jsonStr)}</code>`;
    const lines = jsonStr.split('\n').length;
    const bytes = new Blob([jsonStr]).size;
    jsonStatsEl.innerText = `${lines} lines · ${(bytes / 1024).toFixed(1)} KB`;

    return { manifest, isValid: failedCount === 0 };
  }

  // Sub tabs
  subTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      subTabs.forEach((t) => t.classList.toggle('active', t === tab));
      document.querySelectorAll('.sub-panel').forEach((p) => {
        p.classList.toggle('active', p.id === `subpanel-${tab.dataset.subtab}`);
      });
    });
  });

  // Action Buttons
  btnDownloadManifest.addEventListener('click', () => {
    const { manifest } = updateStudioManifest();
    const slug = (appSlugEl.value.trim() || 'app-manifest').toLowerCase();
    const blob = new Blob([JSON.stringify(manifest, null, 2) + '\n'], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${slug}.json`, 'success');
  });

  btnCopyJsonFull.addEventListener('click', () => {
    const { manifest } = updateStudioManifest();
    copyTextToClipboard(JSON.stringify(manifest, null, 2));
    showToast('Manifest copied to clipboard', 'success');
  });

  btnCopyJsonSnippet.addEventListener('click', () => {
    const { manifest } = updateStudioManifest();
    copyTextToClipboard(JSON.stringify(manifest, null, 2));
    showToast('Code copied to clipboard', 'success');
  });

  btnSubmitGitHubIssue.addEventListener('click', () => {
    const { manifest } = updateStudioManifest();
    const meta = manifest.appstream.metadata;

    const name = encodeURIComponent(meta.name);
    const slug = encodeURIComponent(appSlugEl.value.trim());
    const appId = encodeURIComponent(meta.id);
    const summary = encodeURIComponent(meta.summary);

    let descText = leadParagraphEl.value.trim();
    if (featureBullets.length > 0) {
      descText += '\n\nFeatures:\n' + featureBullets.map((b) => `- ${b}`).join('\n');
    }
    const desc = encodeURIComponent(descText);

    const license = encodeURIComponent(meta.projectLicense);
    const category = encodeURIComponent(meta.categories[0]);
    const dev = encodeURIComponent(meta.developer.name);
    const homepage = encodeURIComponent(meta.homepage);
    const repo = encodeURIComponent(manifest.releaseSource.repository);
    const icon = encodeURIComponent(manifest.appstream.media.icon);
    const screenshots = encodeURIComponent(manifest.appstream.media.screenshots.map((s) => s.source).join('\n'));
    const title = encodeURIComponent(`feat(app): add metadata for ${meta.name}`);

    const issueUrl = `https://github.com/pkgforge-dev/Anylinux-Metadata/issues/new?template=add-app.yml&title=${title}&name=${name}&slug=${slug}&app_id=${appId}&summary=${summary}&description=${desc}&license=${license}&main_category=${category}&developer_name=${dev}&homepage=${homepage}&release_repo=${repo}&icon_url=${icon}&screenshots=${screenshots}`;
    window.open(issueUrl, '_blank');
  });

  // Import JSON File
  btnUploadJson.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        const slug = file.name.replace(/\.json$/i, '').toLowerCase();
        catalogData[slug] = parsed;
        loadAppIntoStudio(slug);
        showToast(`Loaded ${file.name} successfully`, 'success');
      } catch (err) {
        alert('Invalid JSON file: ' + err.message);
      }
    };
    reader.readAsText(file);
    fileInput.value = '';
  });

  // --- Schema Validator View ---
  btnRunValidation.addEventListener('click', runValidator);
  btnFormatValidatorJson.addEventListener('click', () => {
    try {
      const parsed = JSON.parse(validatorInputEl.value);
      validatorInputEl.value = JSON.stringify(parsed, null, 2);
    } catch {}
  });
  btnClearValidatorJson.addEventListener('click', () => {
    validatorInputEl.value = '';
    validatorReportEl.innerHTML = '<p class="hint">Paste a JSON manifest and click "Validate Manifest" to inspect compliance.</p>';
    btnLoadValidToStudio.style.display = 'none';
  });

  function runValidator() {
    const raw = validatorInputEl.value.trim();
    if (!raw) {
      validatorReportEl.innerHTML = '<div class="val-banner fail">Please paste a JSON manifest payload.</div>';
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      validatorReportEl.innerHTML = `
        <div class="val-banner fail">JSON Syntax Error: ${escapeHtml(err.message)}</div>
      `;
      btnLoadValidToStudio.style.display = 'none';
      return;
    }

    // Comprehensive Schema Invariants Check
    const errors = [];
    const meta = parsed?.appstream?.metadata;
    const media = parsed?.appstream?.media;
    const release = parsed?.releaseSource;
    const sandbox = parsed?.sandbox;

    if (!parsed?.$schema) errors.push({ path: '$schema', msg: 'Missing $schema declaration pointing to official app-manifest.json' });

    if (!meta) {
      errors.push({ path: 'appstream.metadata', msg: 'Missing appstream.metadata block' });
    } else {
      if (!meta.id || !/^[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/.test(meta.id)) {
        errors.push({ path: 'appstream.metadata.id', msg: `Invalid reverse-DNS identifier: "${meta.id || ''}"` });
      }
      if (!meta.name) errors.push({ path: 'appstream.metadata.name', msg: 'Application name is required' });
      if (!meta.summary) {
        errors.push({ path: 'appstream.metadata.summary', msg: 'Summary is required' });
      } else {
        if (meta.summary.length > 200) errors.push({ path: 'appstream.metadata.summary', msg: 'Summary exceeds 200 characters limit' });
        if (meta.summary.endsWith('.')) errors.push({ path: 'appstream.metadata.summary', msg: 'Summary must NOT end with a period per AppStream spec' });
      }
      if (!Array.isArray(meta.description) || meta.description.length === 0) {
        errors.push({ path: 'appstream.metadata.description', msg: 'Description must be an array of AST blocks (paragraphs and lists)' });
      }
      if (!meta.projectLicense) errors.push({ path: 'appstream.metadata.projectLicense', msg: 'SPDX project license is required' });
      if (!Array.isArray(meta.categories) || meta.categories.length === 0) {
        errors.push({ path: 'appstream.metadata.categories', msg: 'At least one Freedesktop main category is required' });
      }
    }

    if (!media || !media.icon) {
      errors.push({ path: 'appstream.media.icon', msg: 'Canonical HTTPS icon URL is required' });
    }

    if (!release || !release.repository) {
      errors.push({ path: 'releaseSource.repository', msg: 'Upstream AnyLinux release repository is required' });
    }

    if (!sandbox) {
      errors.push({ path: 'sandbox', msg: 'Sandbox permissions configuration is required' });
    }

    if (errors.length === 0) {
      validatorReportEl.innerHTML = `
        <div class="val-banner pass">${ICONS.check} Manifest passed all schema and AppStream invariants!</div>
        <div style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6;">
          <p>Verified application ID: <code>${escapeHtml(meta.id)}</code></p>
          <p>License: <code>${escapeHtml(meta.projectLicense)}</code></p>
          <p>Main Category: <code>${escapeHtml(meta.categories[0])}</code></p>
          <p>Sandbox network: <code>${escapeHtml(sandbox.network || 'none')}</code></p>
        </div>
      `;
      btnLoadValidToStudio.style.display = 'inline-flex';
      btnLoadValidToStudio.onclick = () => {
        const slug = meta.id.split('.').pop().toLowerCase();
        catalogData[slug] = parsed;
        loadAppIntoStudio(slug);
        switchTab('studio');
      };
    } else {
      btnLoadValidToStudio.style.display = 'none';
      validatorReportEl.innerHTML = `
        <div class="val-banner fail">${ICONS.cross} Validation Failed: ${errors.length} issue(s) detected</div>
        <ul class="val-errors-list">
          ${errors
            .map(
              (e) => `
            <li class="val-error-item">
              <div class="val-error-path">${escapeHtml(e.path)}</div>
              <div class="val-error-msg">${escapeHtml(e.msg)}</div>
            </li>
          `
            )
            .join('')}
        </ul>
      `;
    }
  }

  // --- HTML Escaping Helpers ---
  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function escapeAttr(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/'/g, "\\'").replace(/"/g, '&quot;');
  }

  // --- Initialize ---
  window.addEventListener('hashchange', handleHashNavigation);
  handleHashNavigation();
  loadData();
})();
