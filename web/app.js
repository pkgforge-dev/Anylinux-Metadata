(function () {
  'use strict';

  // --- config.js ---
  // Configuration and Constants
  
  const MAIN_CATEGORIES = new Set([
    'AudioVideo',
    'Audio',
    'Video',
    'Development',
    'Education',
    'Game',
    'Graphics',
    'Network',
    'Office',
    'Science',
    'Settings',
    'System',
    'Utility'
  ]);
  
  // Category Colors Palette for SVG Avatars
  const CATEGORY_COLORS = {
    Utility: '#467d21',
    System: '#2e6b30',
    Development: '#3b6978',
    Game: '#b45309',
    ActionGame: '#b95000',
    Emulator: '#5b5ea6',
    AudioVideo: '#8e4a68',
    Graphics: '#2a7e72',
    Network: '#2563a6',
    Office: '#4a5568',
    Science: '#1e7b68',
    Education: '#a16207',
    Settings: '#525b68'
  };
  
  // SVG Icons Dictionary
  const ICONS = {
    check: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    cross: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
    warn: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>',
    trash: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>',
    edit: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>',
    copy: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>',
    eye: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>'
  };
  
  // Active repository detection (adapts between forks, upstream, and local)
  function getCurrentRepo() {
    if (window.location.hostname.endsWith('github.io')) {
      const user = window.location.hostname.split('.')[0];
      const pathParts = window.location.pathname.split('/').filter(Boolean);
      const repo = pathParts[0] || 'Anylinux-Metadata';
      return `${user}/${repo}`;
    }
    return 'ArqamQazi/Anylinux-Metadata';
  }
  

  // --- utils.js ---
  // Pure Utility Helpers
  
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  
  function escapeAttr(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/'/g, "\\'")
      .replace(/"/g, '&quot;');
  }
  
  // Multi-Tier Icon Fallback Engine
  window.handleIconError = function (img, slug, name, category) {
    if (!slug) slug = 'app';
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '');
  
    // Tier 1: Try Portable-Linux-Apps raw GitHub CDN (verified live HTTP 200)
    if (!img.dataset.triedPla) {
      img.dataset.triedPla = 'true';
      img.src = `https://raw.githubusercontent.com/Portable-Linux-Apps/Portable-Linux-Apps.github.io/main/icons/${cleanSlug}.png`;
      return;
    }
  
    // Tier 2: Try active repository raw GitHub CDN
    if (!img.dataset.triedRepo) {
      img.dataset.triedRepo = 'true';
      const repo = getCurrentRepo();
      img.src = `https://raw.githubusercontent.com/${repo}/main/icons/${cleanSlug}.png`;
      return;
    }
  
    // Tier 3: Try upstream AnyLinux raw GitHub CDN
    if (!img.dataset.triedAnylinux) {
      img.dataset.triedAnylinux = 'true';
      img.src = `https://raw.githubusercontent.com/pkgforge-dev/Anylinux-Metadata/main/icons/${cleanSlug}.png`;
      return;
    }
  
    // Tier 4: Try parent relative path if served from subfolder
    if (!img.dataset.triedParent) {
      img.dataset.triedParent = 'true';
      img.src = `../icons/${cleanSlug}.png`;
      return;
    }
  
    // Final Tier: Generate deterministic high-contrast SVG Avatar with app initial
    img.onerror = null;
    const initial = (name || slug || '?').trim().charAt(0).toUpperCase();
    const bg = CATEGORY_COLORS[category] || '#467d21';
    img.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" rx="12" fill="${encodeURIComponent(bg)}"/><text x="32" y="41" fill="white" font-family="system-ui,-apple-system,sans-serif" font-size="28" font-weight="bold" text-anchor="middle">${encodeURIComponent(initial)}</text></svg>`;
  };
  
  function getPrimaryIconUrl(slug) {
    const cleanSlug = (slug || 'app').toLowerCase().replace(/[^a-z0-9-]/g, '');
    return `icons/${cleanSlug}.png`;
  }
  
  function isPlaceholderScreenshot(url) {
    if (!url) return true;
    return url.includes('pkgforge-dev/Anylinux-AppImages/main/assets/banner.png');
  }
  
  // Clipboard Helper with Insecure / File Protocol Fallback
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
  
  // Notification Toast System
  function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;
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
  
  // Safe scroll respecting user reduced-motion preference
  function safeScrollToTop() {
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  }
  

  // --- state.js ---
  // Central Application State
  
  let catalogData = {};
  let catalogList = [];
  let statusData = { completed: [], pending: [], targetCount: 181, completedCount: 147, pendingCount: 34 };
  let currentSlug = 'ghostty';
  let categoryTags = ['System', 'TerminalEmulator'];
  let keywordTags = ['ghostty', 'terminal', 'emulator', 'cli'];
  let featureBullets = [
    'GPU-accelerated text rendering delivering instant keystroke response',
    'Native desktop integration with tabs, splits, and custom fonts',
    'Low memory footprint and clean cross-platform configuration'
  ];
  let screenshotItems = [];
  

  // --- theme.js ---
  // Theme Management (Light / Dark Mode)
  
  const btnThemeToggle = document.getElementById('btnThemeToggle');
  
  function getPreferredTheme() {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlTheme = params.get('theme');
      if (urlTheme === 'dark' || urlTheme === 'light') return urlTheme;
    } catch (e) {}
    try {
      const saved = localStorage.getItem('anylinux-theme');
      if (saved === 'dark' || saved === 'light') return saved;
    } catch (e) {}
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  
  function applyTheme(theme, save) {
    document.documentElement.setAttribute('data-theme', theme);
    if (btnThemeToggle) {
      const isDark = theme === 'dark';
      const label = isDark ? 'Switch to light theme' : 'Switch to dark theme';
      btnThemeToggle.setAttribute('aria-label', label);
      btnThemeToggle.setAttribute('title', label);
    }
    if (save) {
      try {
        localStorage.setItem('anylinux-theme', theme);
      } catch (e) {}
    }
  }
  
  function initTheme() {
    if (btnThemeToggle) {
      btnThemeToggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') || getPreferredTheme();
        const nextTheme = current === 'dark' ? 'light' : 'dark';
        applyTheme(nextTheme, true);
      });
    }
  
    try {
      const schemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
      schemeQuery.addEventListener('change', (e) => {
        const saved = localStorage.getItem('anylinux-theme');
        if (!saved) {
          applyTheme(e.matches ? 'dark' : 'light', false);
        }
      });
    } catch (e) {}
  
    applyTheme(document.documentElement.getAttribute('data-theme') || getPreferredTheme(), false);
  }
  

  // --- tabs.js ---
  // Accessible Tab Navigation & Roving Tabindex
  
  const navTabs = document.querySelectorAll('.nav-tab');
  const tabPanels = document.querySelectorAll('.tab-panel');
  
  function switchTab(tabId, updateUrl = true) {
    navTabs.forEach((t) => {
      const isActive = t.dataset.tab === tabId;
      t.classList.toggle('active', isActive);
      t.setAttribute('aria-selected', isActive ? 'true' : 'false');
      t.setAttribute('tabindex', isActive ? '0' : '-1');
    });
    tabPanels.forEach((p) => {
      const isActive = p.id === `panel-${tabId}`;
      p.classList.toggle('active', isActive);
      p.hidden = !isActive;
    });
    if (updateUrl) {
      const url = new URL(window.location.href);
      url.searchParams.delete('app');
      if (tabId === 'catalog') {
        url.searchParams.delete('tab');
        url.hash = '';
      } else {
        url.searchParams.set('tab', tabId);
        url.hash = tabId;
      }
      window.history.pushState({ tab: tabId }, '', url.toString());
    }
    const titles = {
      catalog: 'AnyLinux Metadata Portal',
      backlog: 'Pending Backlog - AnyLinux Metadata Portal',
      studio: 'Authoring Studio - AnyLinux Metadata Portal',
      validator: 'Manifest Validator - AnyLinux Metadata Portal'
    };
    document.title = titles[tabId] || 'AnyLinux Metadata Portal';
  }
  
  function initTabs() {
    navTabs.forEach((tab) => {
      tab.addEventListener('click', () => switchTab(tab.dataset.tab, true));
    });
  
    const navTabsContainer = document.querySelector('.nav-tabs');
    if (navTabsContainer) {
      navTabsContainer.addEventListener('keydown', (e) => {
        const tabs = Array.from(navTabs);
        const currentIndex = tabs.findIndex((t) => t === document.activeElement);
        if (currentIndex === -1) return;
  
        let nextIndex = -1;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          nextIndex = (currentIndex + 1) % tabs.length;
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        } else if (e.key === 'Home') {
          e.preventDefault();
          nextIndex = 0;
        } else if (e.key === 'End') {
          e.preventDefault();
          nextIndex = tabs.length - 1;
        }
  
        if (nextIndex !== -1) {
          tabs[nextIndex].focus();
          switchTab(tabs[nextIndex].dataset.tab, true);
        }
      });
    }
  }
  

  // --- router.js ---
  // URL Routing and History State Synchronization
  
  function navigateToApp(slug, updateUrl = true) {
    const app = catalogData[slug];
    if (!app) {
      showToast(`Application '${slug}' not found in catalog`, 'error');
      navigateToCatalog(true);
      return;
    }
  
    renderAppDetailPage(slug);
  
    tabPanels.forEach((p) => {
      const isActive = p.id === 'panel-app-detail';
      p.classList.toggle('active', isActive);
      p.hidden = !isActive;
    });
    navTabs.forEach((t) => {
      const isActive = t.dataset.tab === 'catalog';
      t.classList.toggle('active', isActive);
      t.setAttribute('aria-selected', isActive ? 'true' : 'false');
      t.setAttribute('tabindex', isActive ? '0' : '-1');
    });
  
    if (updateUrl) {
      const url = new URL(window.location.href);
      url.searchParams.set('app', slug);
      url.searchParams.delete('tab');
      if (url.hash && (url.hash.startsWith('#app/') || url.hash === '#catalog')) {
        url.hash = '';
      }
      window.history.pushState({ app: slug }, '', url.toString());
    }
  
    const appName = app.appstream?.metadata?.name || slug;
    document.title = `${appName} - AnyLinux Metadata Portal`;
    safeScrollToTop();
  }
  
  function navigateToCatalog(updateUrl = true) {
    tabPanels.forEach((p) => {
      const isActive = p.id === 'panel-catalog';
      p.classList.toggle('active', isActive);
      p.hidden = !isActive;
    });
    navTabs.forEach((t) => {
      const isActive = t.dataset.tab === 'catalog';
      t.classList.toggle('active', isActive);
      t.setAttribute('aria-selected', isActive ? 'true' : 'false');
      t.setAttribute('tabindex', isActive ? '0' : '-1');
    });
  
    if (updateUrl) {
      const url = new URL(window.location.href);
      url.searchParams.delete('app');
      url.searchParams.delete('tab');
      if (url.hash && (url.hash.startsWith('#app/') || url.hash === '#catalog')) {
        url.hash = '';
      }
      window.history.pushState({ tab: 'catalog' }, '', url.toString());
    }
  
    document.title = 'AnyLinux Metadata Portal';
    safeScrollToTop();
  }
  
  function handleRouting(isInitial = false) {
    const params = new URLSearchParams(window.location.search);
    const queryApp = params.get('app');
    const queryTab = params.get('tab');
    const rawHash = (window.location.hash || '').replace('#', '');
  
    if (queryApp) {
      if (catalogData && catalogData[queryApp]) {
        navigateToApp(queryApp, false);
        return;
      }
    }
  
    if (rawHash.startsWith('app/')) {
      const slug = rawHash.replace('app/', '');
      if (catalogData && catalogData[slug]) {
        navigateToApp(slug, true);
        return;
      }
    }
  
    if (queryTab && ['catalog', 'backlog', 'studio', 'validator'].includes(queryTab)) {
      switchTab(queryTab, false);
      return;
    }
  
    if (rawHash && ['catalog', 'backlog', 'studio', 'validator'].includes(rawHash)) {
      switchTab(rawHash, false);
      return;
    }
  
    if (isInitial && !queryApp && !queryTab && !rawHash) {
      switchTab('catalog', false);
    }
  }
  
  function initRouter() {
    window.addEventListener('popstate', () => handleRouting(false));
    window.addEventListener('hashchange', () => handleRouting(false));
  }
  

  // --- lightbox.js ---
  // Screenshot Lightbox Modal Dialog & Fullscreen Viewer
  
  const screenshotLightboxModal = document.getElementById('screenshotLightboxModal');
  const lightboxCounter = document.getElementById('lightboxCounter');
  const lightboxOpenNewTab = document.getElementById('lightboxOpenNewTab');
  const lightboxCloseBtn = document.getElementById('lightboxCloseBtn');
  const lightboxPrevBtn = document.getElementById('lightboxPrevBtn');
  const lightboxNextBtn = document.getElementById('lightboxNextBtn');
  const lightboxImage = document.getElementById('lightboxImage');
  const lightboxCaption = document.getElementById('lightboxCaption');
  
  let activeLightboxScreenshots = [];
  let currentLightboxIndex = 0;
  let lastFocusedElementBeforeLightbox = null;
  
  function openScreenshotLightbox(screenshots, initialIndex = 0) {
    if (!screenshots || screenshots.length === 0) return;
    lastFocusedElementBeforeLightbox = document.activeElement;
    activeLightboxScreenshots = screenshots;
    currentLightboxIndex = Math.max(0, Math.min(initialIndex, screenshots.length - 1));
    updateLightboxView();
    if (screenshotLightboxModal) {
      screenshotLightboxModal.classList.add('active');
      screenshotLightboxModal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      if (lightboxCloseBtn) lightboxCloseBtn.focus();
    }
  }
  
  function closeScreenshotLightbox() {
    if (screenshotLightboxModal) {
      screenshotLightboxModal.classList.remove('active');
      screenshotLightboxModal.style.display = 'none';
      document.body.style.overflow = '';
      if (lastFocusedElementBeforeLightbox && typeof lastFocusedElementBeforeLightbox.focus === 'function') {
        lastFocusedElementBeforeLightbox.focus();
        lastFocusedElementBeforeLightbox = null;
      }
    }
  }
  
  function updateLightboxView() {
    if (!activeLightboxScreenshots || activeLightboxScreenshots.length === 0) return;
    const current = activeLightboxScreenshots[currentLightboxIndex];
    if (!current) return;
  
    if (lightboxImage) {
      lightboxImage.src = current.source;
      lightboxImage.alt = current.caption || 'Screenshot preview';
    }
    if (lightboxCaption) {
      lightboxCaption.innerText = current.caption || '';
    }
    if (lightboxOpenNewTab) {
      lightboxOpenNewTab.href = current.source;
    }
    if (lightboxCounter) {
      lightboxCounter.innerText = `${currentLightboxIndex + 1} / ${activeLightboxScreenshots.length}`;
      lightboxCounter.style.display = activeLightboxScreenshots.length > 1 ? 'block' : 'none';
    }
    if (lightboxPrevBtn && lightboxNextBtn) {
      const showNav = activeLightboxScreenshots.length > 1;
      lightboxPrevBtn.style.display = showNav ? 'flex' : 'none';
      lightboxNextBtn.style.display = showNav ? 'flex' : 'none';
    }
  }
  
  function stepLightbox(delta) {
    if (!activeLightboxScreenshots || activeLightboxScreenshots.length <= 1) return;
    currentLightboxIndex = (currentLightboxIndex + delta + activeLightboxScreenshots.length) % activeLightboxScreenshots.length;
    updateLightboxView();
  }
  
  function initLightbox() {
    if (lightboxCloseBtn) {
      lightboxCloseBtn.addEventListener('click', closeScreenshotLightbox);
    }
    if (lightboxPrevBtn) {
      lightboxPrevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        stepLightbox(-1);
      });
    }
    if (lightboxNextBtn) {
      lightboxNextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        stepLightbox(1);
      });
    }
    if (screenshotLightboxModal) {
      screenshotLightboxModal.addEventListener('click', (e) => {
        if (e.target === screenshotLightboxModal || e.target.classList.contains('lightbox-viewport') || e.target.classList.contains('lightbox-img-container')) {
          closeScreenshotLightbox();
        }
      });
    }
    window.addEventListener('keydown', (e) => {
      if (!screenshotLightboxModal || !screenshotLightboxModal.classList.contains('active')) return;
      if (e.key === 'Escape') {
        closeScreenshotLightbox();
      } else if (e.key === 'ArrowLeft') {
        stepLightbox(-1);
      } else if (e.key === 'ArrowRight') {
        stepLightbox(1);
      } else if (e.key === 'Tab') {
        const focusable = Array.from(screenshotLightboxModal.querySelectorAll('button:not([disabled]):not([style*="display: none"]), [href]:not([style*="display: none"])')).filter((el) => el.offsetParent !== null);
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    });
  }
  

  // --- modal.js ---
  // Application Detail Modal Dialog (Legacy / Quick Inspect)
  
  const appDetailModal = document.getElementById('appDetailModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalDetailContent = document.getElementById('modalDetailContent');
  
  let lastFocusedElementBeforeModal = null;
  
  function closeAppDetailModal() {
    if (!appDetailModal) return;
    appDetailModal.classList.remove('active');
    document.body.style.overflow = '';
    if (lastFocusedElementBeforeModal && typeof lastFocusedElementBeforeModal.focus === 'function') {
      lastFocusedElementBeforeModal.focus();
      lastFocusedElementBeforeModal = null;
    }
  }
  
  function openAppDetailModal(slug) {
    const app = catalogData[slug];
    if (!app) return;
  
    lastFocusedElementBeforeModal = document.activeElement;
  
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
      ? media.screenshots.filter((s) => s && s.source && s.source.startsWith('http') && !isPlaceholderScreenshot(s.source))
      : [];
  
    if (validScreenshots.length > 0) {
      screenshotsHtml = `
        <div class="modal-gallery-section">
          <h4 class="modal-section-heading">Screenshots</h4>
          <div class="modal-gallery-scroll">
            ${validScreenshots
              .map(
                (ss, idx) => `
              <div class="modal-screenshot-item" data-index="${idx}" role="button" tabindex="0" title="Click to expand screenshot full size" style="cursor: zoom-in;">
                <img class="modal-screenshot-img" src="${escapeHtml(ss.source)}" alt="${escapeHtml(ss.caption || '')}" width="260" height="140" loading="lazy" onerror="this.parentElement.style.display='none'">
                <div class="modal-screenshot-caption">${escapeHtml(ss.caption || '')}</div>
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      `;
    }
  
    modalDetailContent.innerHTML = `
      <div class="modal-header-block">
        <img class="modal-header-icon" src="${escapeHtml(iconSrc)}" alt="${escapeHtml(meta.name || slug)}" width="64" height="64" onerror="handleIconError(this, '${escapeHtml(slug)}', '${escapeAttr(meta.name || slug)}', '${escapeAttr(mainCategory)}')">
        <div class="modal-header-info">
          <h2 class="modal-header-title" id="modalDetailTitle">${escapeHtml(meta.name || slug)}</h2>
          <div class="modal-header-id">${escapeHtml(meta.id || slug)}</div>
          <p class="modal-header-summary">${escapeHtml(meta.summary || '')}</p>
        </div>
      </div>
  
      <div class="modal-chips-row">
        ${(Array.isArray(meta.categories) && meta.categories.length > 0 ? meta.categories : [mainCategory])
          .map((cat) => `<span class="chip chip-category">${escapeHtml(cat)}</span>`)
          .join('')}
        <span class="chip chip-license">${escapeHtml(meta.projectLicense || 'Unknown')}</span>
        ${meta.developer?.name ? `<span class="chip">${meta.developer.url ? `<a href="${escapeHtml(meta.developer.url)}" target="_blank" rel="noopener noreferrer" style="color:inherit; text-decoration:underline;">Dev: ${escapeHtml(meta.developer.name)}</a>` : `Dev: ${escapeHtml(meta.developer.name)}`}</span>` : ''}
        ${app.addedAt ? `<span class="chip">Added: ${escapeHtml(app.addedAt)}</span>` : ''}
      </div>
  
      ${Array.isArray(meta.keywords) && meta.keywords.length > 0 ? `
        <div class="modal-keywords-row" style="display: flex; flex-wrap: wrap; gap: 0.35rem; align-items: center; margin: 0.5rem 0 1rem 0;">
          <span style="font-size: 0.72rem; font-weight: 600; color: var(--text-dim); text-transform: uppercase; margin-right: 0.2rem;">Keywords:</span>
          ${meta.keywords.map((kw) => `<span class="chip" style="font-size: 0.72rem; padding: 0.15rem 0.45rem; background: var(--bg-hover);">${escapeHtml(kw)}</span>`).join('')}
        </div>
      ` : ''}
  
      <div class="modal-desc-section">
        <h4 class="modal-section-heading">Description</h4>
        ${descHtml || '<p style="color: var(--text-dim);">No detailed description available.</p>'}
      </div>
  
      ${screenshotsHtml}
  
      <div class="modal-sandbox-section">
        <h4 class="modal-section-heading">Sandbox Permissions</h4>
        <div class="modal-sandbox-grid">
          <div class="modal-sandbox-item"><span class="sec-label">Network:</span> <strong>${escapeHtml(sandbox.network || 'none')}</strong></div>
          <div class="modal-sandbox-item"><span class="sec-label">Display:</span> <strong>${escapeHtml(sandbox.display || 'none')}</strong></div>
          <div class="modal-sandbox-item"><span class="sec-label">Audio:</span> <strong>${escapeHtml(sandbox.audio || 'none')}</strong></div>
          <div class="modal-sandbox-item"><span class="sec-label">Processes:</span> <strong>${escapeHtml(sandbox.processes || 'isolated')}</strong></div>
          <div class="modal-sandbox-item"><span class="sec-label">IPC:</span> <strong>${sandbox.ipc ? 'enabled' : 'disabled'}</strong></div>
          <div class="modal-sandbox-item"><span class="sec-label">GPU:</span> <strong>${sandbox.devices?.includes('gpu') ? 'enabled' : 'none'}</strong></div>
        </div>
      </div>
  
      <div class="modal-footer-bar">
        <div class="modal-footer-links">
          ${meta.homepage ? `<a href="${escapeHtml(meta.homepage)}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline">Homepage</a>` : ''}
          ${meta.repository ? `<a href="${escapeHtml(meta.repository)}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline">Source Code</a>` : ''}
          ${release.repository ? `<a href="https://github.com/${escapeHtml(release.repository)}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline">Release Repo</a>` : ''}
        </div>
        <div class="modal-footer-buttons">
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
      closeAppDetailModal();
      loadAppIntoStudio(slug);
      switchTab('studio');
      safeScrollToTop();
    });
  
    const modalItems = modalDetailContent.querySelectorAll('.modal-screenshot-item');
    modalItems.forEach((mi) => {
      mi.addEventListener('click', () => {
        const idx = parseInt(mi.dataset.index, 10) || 0;
        openScreenshotLightbox(validScreenshots, idx);
      });
    });
  
    appDetailModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    if (modalCloseBtn) modalCloseBtn.focus();
  }
  
  function initModal() {
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeAppDetailModal);
    if (appDetailModal) {
      appDetailModal.addEventListener('click', (e) => {
        if (e.target === appDetailModal) closeAppDetailModal();
      });
      appDetailModal.addEventListener('keydown', (e) => {
        if (!appDetailModal.classList.contains('active')) return;
        if (e.key === 'Escape') {
          e.stopPropagation();
          closeAppDetailModal();
        } else if (e.key === 'Tab') {
          const focusable = Array.from(appDetailModal.querySelectorAll('button:not([disabled]):not([style*="display: none"]), [href]:not([style*="display: none"]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter((el) => el.offsetParent !== null);
          if (focusable.length === 0) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (e.shiftKey) {
            if (document.activeElement === first) {
              e.preventDefault();
              last.focus();
            }
          } else {
            if (document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        }
      });
    }
  }
  

  // --- app-detail.js ---
  // Dedicated Application Detail Page View
  
  const panelAppDetail = document.getElementById('panel-app-detail');
  const btnAppPageBack = document.getElementById('btnAppPageBack');
  const appPageCategory = document.getElementById('appPageCategory');
  const appPageBreadcrumbName = document.getElementById('appPageBreadcrumbName');
  const btnAppPageShare = document.getElementById('btnAppPageShare');
  const btnAppPageCopyJson = document.getElementById('btnAppPageCopyJson');
  const btnAppPageEditStudio = document.getElementById('btnAppPageEditStudio');
  const appPageIcon = document.getElementById('appPageIcon');
  const appPageHeroCategory = document.getElementById('appPageHeroCategory');
  const appPageHeroLicense = document.getElementById('appPageHeroLicense');
  const appPageHeroRelease = document.getElementById('appPageHeroRelease');
  const appPageHeroAdded = document.getElementById('appPageHeroAdded');
  const appPageTitle = document.getElementById('appPageTitle');
  const appPageId = document.getElementById('appPageId');
  const appPageSummary = document.getElementById('appPageSummary');
  const appPageExternalLinks = document.getElementById('appPageExternalLinks');
  const appPageDescription = document.getElementById('appPageDescription');
  const appPageScreenshotsCard = document.getElementById('appPageScreenshotsCard');
  const appPageGallery = document.getElementById('appPageGallery');
  const appPageDownloadJsonLink = document.getElementById('appPageDownloadJsonLink');
  const btnAppPageCopyJsonSnippet = document.getElementById('btnAppPageCopyJsonSnippet');
  const appPageJsonDisplay = document.getElementById('appPageJsonDisplay');
  const appPageMetaList = document.getElementById('appPageMetaList');
  const appPageSandboxList = document.getElementById('appPageSandboxList');
  
  function renderAppDetailPage(slug) {
    const app = catalogData[slug];
    if (!app) return;
  
    const meta = app.appstream?.metadata || {};
    const media = app.appstream?.media || {};
    const sandbox = app.sandbox || {};
    const release = app.releaseSource || {};
    const mainCategory = meta.categories?.[0] || 'Utility';
    const iconSrc = getPrimaryIconUrl(slug);
    const appName = meta.name || slug;
  
    // 1. Breadcrumb
    if (appPageCategory) {
      appPageCategory.innerText = mainCategory;
      appPageCategory.title = `Filter catalog by ${mainCategory}`;
    }
    if (appPageBreadcrumbName) {
      appPageBreadcrumbName.innerText = appName;
    }
  
    // 2. Hero Card Info
    if (appPageIcon) {
      appPageIcon.src = iconSrc;
      appPageIcon.alt = appName;
      appPageIcon.onerror = function () {
        handleIconError(this, slug, appName, mainCategory);
      };
    }
    if (appPageHeroCategory) appPageHeroCategory.innerText = mainCategory;
    if (appPageHeroLicense) appPageHeroLicense.innerText = meta.projectLicense || 'Unknown';
    if (appPageHeroRelease) appPageHeroRelease.innerText = release.repository || 'pkgforge-dev';
    if (appPageHeroAdded) appPageHeroAdded.innerText = app.addedAt ? `Added: ${app.addedAt}` : 'Added: 2026-09-16';
    if (appPageTitle) appPageTitle.innerText = appName;
    if (appPageId) appPageId.innerText = meta.id || slug;
    if (appPageSummary) appPageSummary.innerText = meta.summary || 'No summary available.';
  
    // External Links in Hero
    if (appPageExternalLinks) {
      let linksHtml = '';
      if (meta.homepage) {
        linksHtml += `<a href="${escapeHtml(meta.homepage)}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg> Homepage</a>`;
      }
      if (meta.repository) {
        linksHtml += `<a href="${escapeHtml(meta.repository)}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg> Source Code</a>`;
      }
      if (release.repository) {
        linksHtml += `<a href="https://github.com/${escapeHtml(release.repository)}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg> Release Package</a>`;
      }
      appPageExternalLinks.innerHTML = linksHtml;
    }
  
    // 3. Description AST
    if (appPageDescription) {
      let descHtml = '';
      if (Array.isArray(meta.description)) {
        for (const block of meta.description) {
          if (block.type === 'paragraph' && Array.isArray(block.content)) {
            descHtml += `<p>${block.content.map((c) => escapeHtml(c.value || '')).join('')}</p>`;
          } else if (block.type === 'unordered-list' && Array.isArray(block.items)) {
            descHtml += `<ul class="app-page-features">`;
            for (const item of block.items) {
              descHtml += `<li>${item.map((c) => escapeHtml(c.value || '')).join('')}</li>`;
            }
            descHtml += `</ul>`;
          } else if (block.type === 'ordered-list' && Array.isArray(block.items)) {
            descHtml += `<ol class="app-page-features">`;
            for (const item of block.items) {
              descHtml += `<li>${item.map((c) => escapeHtml(c.value || '')).join('')}</li>`;
            }
            descHtml += `</ol>`;
          }
        }
      }
      appPageDescription.innerHTML = descHtml || '<p style="color: var(--text-dim);">No detailed description available.</p>';
    }
  
    // 4. Screenshots Gallery & Interactive Carousel
    const validScreenshots = Array.isArray(media.screenshots)
      ? media.screenshots.filter((s) => s && s.source && s.source.startsWith('http') && !isPlaceholderScreenshot(s.source))
      : [];
  
    if (appPageScreenshotsCard && appPageGallery) {
      if (validScreenshots.length > 0) {
        appPageScreenshotsCard.style.display = 'block';
        let activeIdx = 0;
  
        function renderCarousel() {
          const current = validScreenshots[activeIdx] || validScreenshots[0];
          const hasMultiple = validScreenshots.length > 1;
  
          appPageGallery.innerHTML = `
            <div class="screenshot-carousel">
              <div class="screenshot-stage">
                <div class="screenshot-stage-img-wrapper" id="screenshotStageImgWrapper" role="button" tabindex="0" title="Click to expand full resolution">
                  <img class="screenshot-stage-img" id="screenshotStageImg" src="${escapeHtml(current.source)}" alt="${escapeHtml(current.caption || '')}" width="800" height="450">
                  <div class="screenshot-stage-zoom-badge">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
                    <span>Click to expand</span>
                  </div>
                </div>
                ${hasMultiple ? `
                  <button type="button" class="carousel-nav-btn carousel-prev" id="carouselPrevBtn" title="Previous screenshot">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                  </button>
                  <button type="button" class="carousel-nav-btn carousel-next" id="carouselNextBtn" title="Next screenshot">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                  </button>
                ` : ''}
              </div>
              <div class="screenshot-caption-bar">
                <span class="screenshot-caption-text" id="screenshotCaptionText">${escapeHtml(current.caption || '')}</span>
                ${hasMultiple ? `<span class="screenshot-stage-counter" id="screenshotStageCounter">${activeIdx + 1} / ${validScreenshots.length}</span>` : ''}
              </div>
              ${hasMultiple ? `
                <div class="screenshot-thumb-strip">
                  ${validScreenshots.map((ss, idx) => `
                    <button type="button" class="screenshot-thumb ${idx === activeIdx ? 'active' : ''}" data-index="${idx}" title="${escapeAttr(ss.caption || `Screenshot ${idx + 1}`)}">
                      <img src="${escapeHtml(ss.source)}" alt="" width="80" height="45" loading="lazy">
                    </button>
                  `).join('')}
                </div>
              ` : ''}
            </div>
          `;
  
          const stageWrapper = document.getElementById('screenshotStageImgWrapper');
          if (stageWrapper) {
            stageWrapper.addEventListener('click', () => {
              openScreenshotLightbox(validScreenshots, activeIdx);
            });
            stageWrapper.addEventListener('keydown', (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openScreenshotLightbox(validScreenshots, activeIdx);
              }
            });
          }
  
          const prevBtn = document.getElementById('carouselPrevBtn');
          if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              activeIdx = (activeIdx - 1 + validScreenshots.length) % validScreenshots.length;
              renderCarousel();
            });
          }
  
          const nextBtn = document.getElementById('carouselNextBtn');
          if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              activeIdx = (activeIdx + 1) % validScreenshots.length;
              renderCarousel();
            });
          }
  
          const thumbs = appPageGallery.querySelectorAll('.screenshot-thumb');
          thumbs.forEach((th) => {
            th.addEventListener('click', (e) => {
              e.stopPropagation();
              const idx = parseInt(th.dataset.index, 10);
              if (!isNaN(idx) && idx !== activeIdx) {
                activeIdx = idx;
                renderCarousel();
              }
            });
          });
        }
  
        renderCarousel();
      } else {
        appPageScreenshotsCard.style.display = 'none';
        appPageGallery.innerHTML = '';
      }
    }
  
    // 5. Raw Manifest JSON
    const jsonStr = JSON.stringify(app, null, 2);
    if (appPageJsonDisplay) {
      appPageJsonDisplay.innerHTML = `<code>${escapeHtml(jsonStr)}</code>`;
    }
    if (appPageDownloadJsonLink) {
      appPageDownloadJsonLink.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(jsonStr);
      appPageDownloadJsonLink.download = `${slug}.json`;
    }
  
    // 6. Metadata Definition List
    if (appPageMetaList) {
      const allCategories = Array.isArray(meta.categories) && meta.categories.length > 0
        ? meta.categories
        : [mainCategory];
  
      appPageMetaList.innerHTML = `
        <div class="meta-row">
          <dt class="meta-label">Developer</dt>
          <dd class="meta-val">${meta.developer?.name ? (meta.developer.url ? `<a href="${escapeHtml(meta.developer.url)}" target="_blank" rel="noopener noreferrer" style="color:var(--green-deep); text-decoration:underline;">${escapeHtml(meta.developer.name)}</a>` : escapeHtml(meta.developer.name)) : '<span style="color:var(--text-dim);">Community / Upstream</span>'}</dd>
        </div>
        <div class="meta-row">
          <dt class="meta-label">Freedesktop ID</dt>
          <dd class="meta-val"><span class="slug-code" style="font-size: 0.775rem;">${escapeHtml(meta.id || slug)}</span></dd>
        </div>
        <div class="meta-row">
          <dt class="meta-label">Project License</dt>
          <dd class="meta-val"><span class="chip chip-license">${escapeHtml(meta.projectLicense || 'Unknown')}</span></dd>
        </div>
        <div class="meta-row">
          <dt class="meta-label">Categories</dt>
          <dd class="meta-val" style="display: flex; flex-wrap: wrap; gap: 0.35rem;">
            ${allCategories.map((c) => `<span class="chip chip-category">${escapeHtml(c)}</span>`).join('')}
          </dd>
        </div>
        <div class="meta-row">
          <dt class="meta-label">Release Repository</dt>
          <dd class="meta-val">${release.repository ? `<a href="https://github.com/${escapeHtml(release.repository)}" target="_blank" rel="noopener noreferrer" style="color:var(--green-deep); font-weight:600;">${escapeHtml(release.repository)}</a>` : 'pkgforge-dev/Anylinux-AppImages'}</dd>
        </div>
        <div class="meta-row">
          <dt class="meta-label">Added Date</dt>
          <dd class="meta-val">${escapeHtml(app.addedAt || '2026-09-16')}</dd>
        </div>
        ${Array.isArray(meta.keywords) && meta.keywords.length > 0 ? `
          <div class="meta-row">
            <dt class="meta-label">Search Keywords</dt>
            <dd class="meta-val" style="display: flex; flex-wrap: wrap; gap: 0.3rem;">
              ${meta.keywords.map((kw) => `<span class="chip" style="font-size: 0.72rem; padding: 0.15rem 0.45rem; background: var(--surface-inset);">${escapeHtml(kw)}</span>`).join('')}
            </dd>
          </div>
        ` : ''}
      `;
    }
  
    // 7. Sandbox Security Profile
    if (appPageSandboxList) {
      const perms = [
        { label: 'Network Access', value: sandbox.network || 'none', active: sandbox.network && sandbox.network !== 'none' },
        { label: 'Display Server', value: sandbox.display || 'none', active: sandbox.display && sandbox.display !== 'none' },
        { label: 'Audio System', value: sandbox.audio || 'none', active: sandbox.audio && sandbox.audio !== 'none' },
        { label: 'Process Isolation', value: sandbox.processes || 'isolated', active: sandbox.processes === 'isolated' },
        { label: 'Inter-Process Comm (IPC)', value: sandbox.ipc ? 'enabled' : 'disabled', active: !!sandbox.ipc },
        { label: 'GPU Acceleration', value: sandbox.devices?.includes('gpu') ? 'enabled' : 'none', active: sandbox.devices?.includes('gpu') },
        {
          label: 'Filesystem Access',
          value: sandbox.filesystem && sandbox.filesystem.length > 0
            ? sandbox.filesystem.map((f) => `${f.path} (${f.access})`).join(', ')
            : 'Strict Isolation (none)',
          active: false
        },
        { label: 'Session D-Bus', value: sandbox.sessionBus?.access || 'none', active: sandbox.sessionBus?.access && sandbox.sessionBus.access !== 'none' },
        { label: 'System D-Bus', value: sandbox.systemBus?.access || 'none', active: sandbox.systemBus?.access && sandbox.systemBus.access !== 'none' }
      ];
  
      appPageSandboxList.innerHTML = perms
        .map(
          (p) => `
        <div class="sandbox-perm-row">
          <span class="sandbox-perm-name">${escapeHtml(p.label)}</span>
          <span class="sandbox-perm-value ${p.active ? 'active' : ''}">${escapeHtml(p.value)}</span>
        </div>
      `
        )
        .join('');
    }
  
    // 8. Wire action buttons for this app
    if (btnAppPageShare) {
      btnAppPageShare.onclick = () => {
        const shareUrl = new URL(window.location.href);
        shareUrl.searchParams.set('app', slug);
        shareUrl.searchParams.delete('tab');
        shareUrl.hash = '';
        copyTextToClipboard(shareUrl.toString());
        showToast(`Copied share link for ${appName} to clipboard`, 'success');
      };
    }
  
    if (btnAppPageCopyJson) {
      btnAppPageCopyJson.onclick = () => {
        copyTextToClipboard(jsonStr);
        showToast(`Copied ${appName} manifest JSON to clipboard`, 'success');
      };
    }
  
    if (btnAppPageCopyJsonSnippet) {
      btnAppPageCopyJsonSnippet.onclick = () => {
        copyTextToClipboard(jsonStr);
        showToast(`Copied ${appName} manifest JSON to clipboard`, 'success');
      };
    }
  
    if (btnAppPageEditStudio) {
      btnAppPageEditStudio.onclick = () => {
        loadAppIntoStudio(slug);
        switchTab('studio');
        safeScrollToTop();
      };
    }
  }
  
  function initAppDetailPage() {
    if (btnAppPageBack) {
      btnAppPageBack.addEventListener('click', () => {
        navigateToCatalog(true);
      });
    }
  
    if (appPageCategory) {
      appPageCategory.addEventListener('click', () => {
        const cat = appPageCategory.innerText.trim();
        if (cat && cat !== 'Utility') {
          const catalogCategoryFilterEl = document.getElementById('catalogCategoryFilter');
          if (catalogCategoryFilterEl) {
            catalogCategoryFilterEl.value = cat;
            renderCatalogGrid();
          }
        }
        navigateToCatalog(true);
      });
    }
  }
  

  // --- catalog.js ---
  // Catalog Explorer View & Search Filtering
  
  const catalogSearchEl = document.getElementById('catalogSearch');
  const catalogCategoryFilterEl = document.getElementById('catalogCategoryFilter');
  const catalogSortFilterEl = document.getElementById('catalogSortFilter');
  const catalogSearchClearEl = document.getElementById('catalogSearchClear');
  const catalogGridEl = document.getElementById('catalogGrid');
  const catalogResultsCountEl = document.getElementById('catalogResultsCount');
  
  function populateCategoryFilter() {
    if (!catalogCategoryFilterEl) return;
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
  
  function renderCatalogGrid() {
    if (!catalogGridEl || !catalogResultsCountEl) return;
    const query = (catalogSearchEl?.value || '').toLowerCase().trim();
    const catFilter = catalogCategoryFilterEl?.value || 'all';
    const sortVal = catalogSortFilterEl?.value || 'name-asc';
  
    let filtered = catalogList.filter((item) => {
      const meta = item.appstream?.metadata || {};
      const name = (meta.name || '').toLowerCase();
      const slug = item.slug.toLowerCase();
      const id = (meta.id || '').toLowerCase();
      const summary = (meta.summary || '').toLowerCase();
      const keywords = (meta.keywords || []).map((k) => k.toLowerCase()).join(' ');
      const categories = (meta.categories || []).map((c) => c.toLowerCase()).join(' ');
  
      const matchesSearch =
        !query ||
        name.includes(query) ||
        slug.includes(query) ||
        id.includes(query) ||
        summary.includes(query) ||
        keywords.includes(query) ||
        categories.includes(query);
  
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
    if (catalogSearchClearEl) {
      catalogSearchClearEl.style.display = query ? 'flex' : 'none';
    }
  
    catalogGridEl.innerHTML = '';
  
    if (filtered.length === 0) {
      catalogResultsCountEl.innerText = 'No applications found matching your criteria';
      catalogGridEl.innerHTML = `
        <div class="empty-state" role="status" style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem; color: var(--text-dim);">
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
  
      const card = document.createElement('article');
      card.className = 'app-card';
      card.setAttribute('role', 'article');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-labelledby', `card-title-${item.slug}`);
      card.dataset.slug = item.slug;
  
      card.innerHTML = `
        <div class="app-card-head">
          <img class="app-card-icon" src="${escapeHtml(iconSrc)}" alt="${escapeHtml(meta.name || item.slug)}" width="48" height="48" loading="lazy" onerror="handleIconError(this, '${escapeHtml(item.slug)}', '${escapeAttr(meta.name || item.slug)}', '${escapeAttr(mainCategory)}')">
          <div class="app-card-info">
            <a class="app-card-title-link" href="?app=${encodeURIComponent(item.slug)}" title="View ${escapeAttr(meta.name || item.slug)} details">
              <div class="app-card-title" id="card-title-${escapeAttr(item.slug)}">${escapeHtml(meta.name || item.slug)}</div>
            </a>
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
            <a href="?app=${encodeURIComponent(item.slug)}" class="btn btn-xs btn-outline btn-card-inspect" title="View details">${ICONS.eye} View</a>
            <button class="btn btn-xs btn-outline btn-card-edit" title="Edit in Studio">${ICONS.edit} Edit</button>
            <button class="btn btn-xs btn-outline btn-card-copy" title="Copy JSON">${ICONS.copy}</button>
          </div>
        </div>
      `;
  
      const inspectBtn = card.querySelector('.btn-card-inspect');
      inspectBtn.addEventListener('click', (e) => {
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        navigateToApp(item.slug, true);
      });
  
      const titleLink = card.querySelector('.app-card-title-link');
      if (titleLink) {
        titleLink.addEventListener('click', (e) => {
          if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
          e.preventDefault();
          e.stopPropagation();
          navigateToApp(item.slug, true);
        });
      }
  
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
  
      card.addEventListener('keydown', (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && e.target === card) {
          e.preventDefault();
          navigateToApp(item.slug, true);
        }
      });
  
      card.addEventListener('click', (e) => {
        if (e.target.closest('button') || e.target.closest('a')) return;
        navigateToApp(item.slug, true);
      });
  
      catalogGridEl.appendChild(card);
    });
  }
  
  function initCatalog() {
    if (catalogSearchEl) catalogSearchEl.addEventListener('input', renderCatalogGrid);
    if (catalogCategoryFilterEl) catalogCategoryFilterEl.addEventListener('change', renderCatalogGrid);
    if (catalogSortFilterEl) catalogSortFilterEl.addEventListener('change', renderCatalogGrid);
    if (catalogSearchClearEl) {
      catalogSearchClearEl.addEventListener('click', () => {
        if (catalogSearchEl) {
          catalogSearchEl.value = '';
          renderCatalogGrid();
        }
      });
    }
  
    // Global search shortcut (press "/" to search catalog)
    window.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        switchTab('catalog');
        if (catalogSearchEl) catalogSearchEl.focus();
      }
    });
  }
  

  // --- backlog.js ---
  // Backlog Queue View & Studio Claiming
  
  const backlogSearchEl = document.getElementById('backlogSearch');
  const backlogTableBodyEl = document.getElementById('backlogTableBody');
  const backlogResultsCountEl = document.getElementById('backlogResultsCount');
  
  function renderBacklogTable() {
    if (!backlogTableBodyEl) return;
    const query = (backlogSearchEl?.value || '').toLowerCase().trim();
    const pendingList = statusData.pending || [];
  
    const filtered = pendingList.filter((item) => {
      return (
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.slug.toLowerCase().includes(query) ||
        item.repo.toLowerCase().includes(query)
      );
    });
  
    if (backlogResultsCountEl) {
      backlogResultsCountEl.innerText = filtered.length === 0
        ? 'No pending applications match your search query'
        : `Showing ${filtered.length} of ${pendingList.length} pending applications`;
    }
  
    backlogTableBodyEl.innerHTML = '';
  
    if (filtered.length === 0) {
      backlogTableBodyEl.innerHTML = `
        <tr role="status">
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
    safeScrollToTop();
    summaryEl.focus();
    showToast(`Loaded ${item.name} into Studio. Complete the details to submit.`, 'info');
  }
  
  function initBacklog() {
    if (backlogSearchEl) {
      backlogSearchEl.addEventListener('input', renderBacklogTable);
    }
  }
  

  // --- studio.js ---
  // Authoring Studio: Form Logic, AST Generation, Live Validation, and Exporting
  
  const templateSelectEl = document.getElementById('templateSelect');
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
  const categoryChipsContainerEl = document.getElementById('categoryChipsContainer');
  const categorySelectPickerEl = document.getElementById('categorySelectPicker');
  const btnAddCategoryBtnEl = document.getElementById('btnAddCategoryBtn');
  const keywordsTagContainerEl = document.getElementById('keywordsTagContainer');
  const keywordsInputEl = document.getElementById('keywordsInput');
  const licenseSelectEl = document.getElementById('licenseSelect');
  const customLicenseInputEl = document.getElementById('customLicenseInput');
  const devNameEl = document.getElementById('devName');
  const devUrlEl = document.getElementById('devUrl');
  const homepageEl = document.getElementById('homepage');
  const sourceRepoUrlEl = document.getElementById('sourceRepoUrl');
  const releaseRepoEl = document.getElementById('releaseRepo');
  const iconUrlEl = document.getElementById('iconUrl');
  const iconTestImgEl = document.getElementById('iconTestImg');
  const iconTestLabelEl = document.getElementById('iconTestLabel');
  const screenshotsContainerEl = document.getElementById('screenshotsContainer');
  const btnAddScreenshotEl = document.getElementById('btnAddScreenshot');
  const sbNetworkEl = document.getElementById('sbNetwork');
  const sbDisplayEl = document.getElementById('sbDisplay');
  const sbAudioEl = document.getElementById('sbAudio');
  const sbProcessesEl = document.getElementById('sbProcesses');
  const sbIpcEl = document.getElementById('sbIpc');
  const devGpuEl = document.getElementById('devGpu');
  const devInputEl = document.getElementById('devInput');
  const devKvmEl = document.getElementById('devKvm');
  const devCameraEl = document.getElementById('devCamera');
  const subTabs = document.querySelectorAll('.sub-tab');
  const storeMockNameEl = document.getElementById('storeMockName');
  const storeMockIdEl = document.getElementById('storeMockId');
  const storeMockSummaryEl = document.getElementById('storeMockSummary');
  const storeMockCategoryEl = document.getElementById('storeMockCategory');
  const storeMockLicenseEl = document.getElementById('storeMockLicense');
  const storeMockRepoEl = document.getElementById('storeMockRepo');
  const storeMockIconEl = document.getElementById('storeMockIcon');
  const storeMockDescEl = document.getElementById('storeMockDesc');
  const storeMockGalleryEl = document.getElementById('storeMockGallery');
  const storeMockNetworkEl = document.getElementById('storeMockNetwork');
  const storeMockDisplayEl = document.getElementById('storeMockDisplay');
  const storeMockGpuEl = document.getElementById('storeMockGpu');
  const studioJsonDisplayEl = document.getElementById('studioJsonDisplay');
  const jsonStatsEl = document.getElementById('jsonStats');
  const diagMasterStatusEl = document.getElementById('diagMasterStatus');
  const diagChecklistEl = document.getElementById('diagChecklist');
  const btnDownloadManifest = document.getElementById('btnDownloadManifest');
  const btnCopyJsonFull = document.getElementById('btnCopyJsonFull');
  const btnCopyJsonSnippet = document.getElementById('btnCopyJsonSnippet');
  const btnSubmitGitHubIssue = document.getElementById('btnSubmitGitHubIssue');
  const btnUploadJson = document.getElementById('btnUploadJson');
  const fileInput = document.getElementById('fileInput');
  
  function populateTemplateDropdown() {
    if (!templateSelectEl) return;
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
  
  function resetStudioForm() {
    if (!appNameEl) return;
    currentSlug = '';
    if (templateSelectEl) templateSelectEl.value = '';
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
    devUrlEl.value = '';
    homepageEl.value = '';
    sourceRepoUrlEl.value = '';
    licenseSelectEl.value = 'MIT';
    customLicenseInputEl.style.display = 'none';
    customLicenseInputEl.value = '';
    categoryTags = ['Utility'];
    iconUrlEl.value = '';
    screenshotItems = [];
    releaseRepoEl.value = '';
  
    renderBulletInputs();
    renderCategoryTags();
    renderKeywordTags();
    renderScreenshotInputs();
    updateStudioManifest();
    testIconDimension();
  }
  
  function loadAppIntoStudio(slug) {
    const app = catalogData[slug];
    if (!app) return;
  
    currentSlug = slug;
    if (templateSelectEl) templateSelectEl.value = slug;
  
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
  
    // Categories
    categoryTags = Array.isArray(meta.categories) && meta.categories.length > 0
      ? [...meta.categories]
      : ['Utility'];
    renderCategoryTags();
  
    // Dev, Homepage & VCS
    devNameEl.value = meta.developer?.name || '';
    devUrlEl.value = meta.developer?.url || '';
    homepageEl.value = meta.homepage || '';
    sourceRepoUrlEl.value = meta.repository || '';
  
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
  
  function renderBulletInputs() {
    if (!bulletListContainerEl) return;
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
  
  function renderCategoryTags() {
    if (!categoryChipsContainerEl) return;
    categoryChipsContainerEl.innerHTML = '';
    if (categoryTags.length === 0) {
      categoryChipsContainerEl.innerHTML = '<span class="hint" style="color: var(--danger); font-size: 0.8rem;">No categories selected. At least one Main Category (e.g. Utility, System) is required.</span>';
      return;
    }
  
    categoryTags.forEach((cat, idx) => {
      const isMain = MAIN_CATEGORIES.has(cat);
      const pill = document.createElement('span');
      pill.className = `category-pill ${isMain ? 'is-main' : ''}`;
      pill.innerHTML = `
        <span>${escapeHtml(cat)}</span>
        ${isMain ? '<span class="cat-badge">Main</span>' : ''}
        <button type="button" class="tag-del" title="Remove ${escapeAttr(cat)}">&times;</button>
      `;
  
      pill.querySelector('.tag-del').addEventListener('click', (e) => {
        e.stopPropagation();
        categoryTags.splice(idx, 1);
        renderCategoryTags();
        updateStudioManifest();
      });
  
      categoryChipsContainerEl.appendChild(pill);
    });
  }
  
  function addCategory(cat) {
    const trimmed = (cat || '').trim();
    if (!trimmed) return;
    if (!categoryTags.includes(trimmed)) {
      categoryTags.push(trimmed);
      renderCategoryTags();
      updateStudioManifest();
    }
  }
  
  function renderKeywordTags() {
    if (!keywordsTagContainerEl || !keywordsInputEl) return;
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
  
  function renderScreenshotInputs() {
    if (!screenshotsContainerEl) return;
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
  
  function testIconDimension() {
    if (!iconUrlEl || !iconTestImgEl || !iconTestLabelEl) return;
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
  
  function updateStudioManifest() {
    if (!appNameEl) return { manifest: {}, isValid: false };
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
    const devName = devNameEl.value.trim() || `${name} Developers`;
    const devUrl = devUrlEl.value.trim();
    const homepage = homepageEl.value.trim() || 'https://example.org';
    const sourceRepo = sourceRepoUrlEl.value.trim();
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
  
    const devObj = { name: devName };
    if (devUrl) devObj.url = devUrl;
  
    const primaryCategory = categoryTags[0] || 'Utility';
  
    const metadataObj = {
      id: appId,
      name,
      summary,
      description: descAst.length > 0 ? descAst : [{ type: 'paragraph', content: [{ type: 'text', value: summary }] }],
      projectLicense: license,
      developer: devObj,
      homepage,
      ...(sourceRepo ? { repository: sourceRepo } : {}),
      keywords: keywordTags.length > 0 ? keywordTags : [slug, 'appimage', 'anylinux'],
      categories: categoryTags.length > 0 ? categoryTags : ['Utility']
    };
  
    const manifest = {
      $schema: 'https://raw.githubusercontent.com/pkgforge-dev/Anylinux-Metadata/main/schema/app-manifest.json',
      appstream: {
        type: 'manual',
        metadata: metadataObj,
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
    const hasMainCategory = categoryTags.some((cat) => MAIN_CATEGORIES.has(cat));
    const isCategoryValid = categoryTags.length > 0 && hasMainCategory;
    const isIconValid = iconUrl.startsWith('https://');
  
    const checks = [
      { name: `Valid Slug format: "${slug}"`, passed: isSlugValid, err: 'Must be lowercase alphanumeric + single hyphens' },
      { name: `Reverse-DNS App ID: "${appId}"`, passed: isAppIdValid, err: 'Must follow reverse-DNS convention (e.g. io.github.user.repo)' },
      { name: 'Summary length <= 200 chars and no trailing period', passed: isSummaryValid, err: 'Must not end with a period per AppStream spec' },
      { name: 'Description AST structured blocks', passed: isDescValid, err: 'Requires lead paragraph or feature list' },
      { name: `SPDX License: "${license}"`, passed: isLicenseValid, err: 'Valid SPDX license expression required' },
      { name: `Categories (${categoryTags.length}): ${categoryTags.join(', ')}`, passed: isCategoryValid, err: 'At least one registered Freedesktop main category is required' },
      { name: 'Canonical HTTPS Icon Asset URL', passed: isIconValid, err: 'Icon must use HTTPS canonical repository URL' }
    ];
  
    const failedCount = checks.filter((c) => !c.passed).length;
    if (diagMasterStatusEl) {
      diagMasterStatusEl.className = `diag-status-pill ${failedCount === 0 ? 'pass' : 'fail'}`;
      diagMasterStatusEl.innerText = failedCount === 0 ? 'All Checks Passed' : `${failedCount} Validation Issue(s)`;
    }
  
    if (diagChecklistEl) {
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
    }
  
    // Store Card Preview Update
    if (storeMockNameEl) storeMockNameEl.innerText = name;
    if (storeMockIdEl) storeMockIdEl.innerText = appId;
    if (storeMockSummaryEl) storeMockSummaryEl.innerText = summary;
    if (storeMockCategoryEl) storeMockCategoryEl.innerText = primaryCategory;
    if (storeMockLicenseEl) storeMockLicenseEl.innerText = license;
    if (storeMockRepoEl) storeMockRepoEl.innerText = releaseRepo;
  
    if (storeMockIconEl) {
      storeMockIconEl.src = getPrimaryIconUrl(slug);
      storeMockIconEl.onerror = function () {
        handleIconError(storeMockIconEl, slug, name, primaryCategory);
      };
    }
  
    let previewDescHtml = '';
    for (const b of descAst) {
      if (b.type === 'paragraph') {
        previewDescHtml += `<p style="margin-bottom: 0.5rem;">${b.content.map((c) => escapeHtml(c.value)).join('')}</p>`;
      } else if (b.type === 'unordered-list') {
        previewDescHtml += `<ul style="margin-left: 1.2rem; margin-bottom: 0.5rem;">${b.items.map((it) => `<li>${it.map((c) => escapeHtml(c.value)).join('')}</li>`).join('')}</ul>`;
      }
    }
    if (storeMockDescEl) storeMockDescEl.innerHTML = previewDescHtml;
  
    if (storeMockGalleryEl) {
      if (screenshots.length > 0) {
        storeMockGalleryEl.style.display = 'flex';
        storeMockGalleryEl.innerHTML = screenshots
          .map((s) => `<img class="mock-thumb" src="${escapeHtml(s.source)}" alt="${escapeHtml(s.caption)}" title="${escapeHtml(s.caption)}" onerror="this.style.display='none'">`)
          .join('');
      } else {
        storeMockGalleryEl.style.display = 'none';
        storeMockGalleryEl.innerHTML = '';
      }
    }
  
    if (storeMockNetworkEl) storeMockNetworkEl.innerText = `Network: ${sbNetworkEl.value}`;
    if (storeMockDisplayEl) storeMockDisplayEl.innerText = `Display: ${sbDisplayEl.value}`;
    if (storeMockGpuEl) storeMockGpuEl.innerText = `GPU: ${devGpuEl.checked ? 'enabled' : 'none'}`;
  
    // JSON Output
    const jsonStr = JSON.stringify(manifest, null, 2);
    if (studioJsonDisplayEl) studioJsonDisplayEl.innerHTML = `<code>${escapeHtml(jsonStr)}</code>`;
    const lines = jsonStr.split('\n').length;
    const bytes = new Blob([jsonStr]).size;
    if (jsonStatsEl) jsonStatsEl.innerText = `${lines} lines · ${(bytes / 1024).toFixed(1)} KB`;
  
    return { manifest, isValid: failedCount === 0 };
  }
  
  function initStudio() {
    if (templateSelectEl) {
      templateSelectEl.addEventListener('change', () => {
        if (templateSelectEl.value) {
          loadAppIntoStudio(templateSelectEl.value);
          showToast(`Loaded ${templateSelectEl.value} template`, 'info');
        }
      });
    }
  
    if (btnResetForm) {
      btnResetForm.addEventListener('click', () => {
        if (confirm('Reset form fields to blank template?')) {
          resetStudioForm();
        }
      });
    }
  
    if (appNameEl) {
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
    }
  
    if (appSlugEl) {
      appSlugEl.addEventListener('input', () => {
        appSlugEl.dataset.customized = 'true';
        appSlugEl.value = appSlugEl.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/--+/g, '-');
        updateStudioManifest();
        testIconDimension();
      });
    }
  
    if (appIdEl) {
      appIdEl.addEventListener('input', () => {
        appIdEl.dataset.customized = 'true';
        updateStudioManifest();
      });
    }
  
    if (summaryEl) {
      summaryEl.addEventListener('input', () => {
        const len = summaryEl.value.length;
        if (summaryCharCounterEl) summaryCharCounterEl.innerText = `${len} / 200 characters`;
        const endsWithPeriod = summaryEl.value.trim().endsWith('.');
        if (summaryPeriodWarningEl) summaryPeriodWarningEl.style.display = endsWithPeriod ? 'inline' : 'none';
        updateStudioManifest();
      });
    }
  
    if (btnAddBulletEl) {
      btnAddBulletEl.addEventListener('click', () => {
        featureBullets.push('');
        renderBulletInputs();
        const inputs = bulletListContainerEl.querySelectorAll('input');
        if (inputs.length > 0) inputs[inputs.length - 1].focus();
      });
    }
  
    if (categorySelectPickerEl) {
      categorySelectPickerEl.addEventListener('change', () => {
        if (categorySelectPickerEl.value) {
          addCategory(categorySelectPickerEl.value);
          categorySelectPickerEl.value = '';
        }
      });
    }
  
    if (btnAddCategoryBtnEl) {
      btnAddCategoryBtnEl.addEventListener('click', () => {
        if (categorySelectPickerEl && categorySelectPickerEl.value) {
          addCategory(categorySelectPickerEl.value);
          categorySelectPickerEl.value = '';
        }
      });
    }
  
    document.querySelectorAll('.btn-cat-suggest').forEach((btn) => {
      btn.addEventListener('click', () => {
        const cat = btn.dataset.cat;
        if (cat) addCategory(cat);
      });
    });
  
    if (keywordsInputEl) {
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
    }
  
    if (btnAddScreenshotEl) {
      btnAddScreenshotEl.addEventListener('click', () => {
        screenshotItems.push({ source: '', caption: 'Application window' });
        renderScreenshotInputs();
      });
    }
  
    if (iconUrlEl) {
      iconUrlEl.addEventListener('input', () => {
        iconUrlEl.dataset.customized = 'true';
        testIconDimension();
        updateStudioManifest();
      });
    }
  
    if (licenseSelectEl) {
      licenseSelectEl.addEventListener('change', () => {
        if (licenseSelectEl.value === 'custom') {
          customLicenseInputEl.style.display = 'block';
          customLicenseInputEl.focus();
        } else {
          customLicenseInputEl.style.display = 'none';
        }
        updateStudioManifest();
      });
    }
  
    if (customLicenseInputEl) {
      customLicenseInputEl.addEventListener('input', updateStudioManifest);
    }
  
    [
      leadParagraphEl,
      devNameEl,
      devUrlEl,
      homepageEl,
      sourceRepoUrlEl,
      releaseRepoEl,
      sbNetworkEl,
      sbDisplayEl,
      sbAudioEl,
      sbProcessesEl,
      devGpuEl,
      devInputEl,
      devKvmEl,
      devCameraEl,
      sbIpcEl
    ].forEach((el) => {
      if (el) {
        el.addEventListener('input', updateStudioManifest);
        el.addEventListener('change', updateStudioManifest);
      }
    });
  
    // Sub tabs (AppHub Preview vs Raw JSON)
    const previewTabsContainer = document.querySelector('.preview-tabs');
    subTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        subTabs.forEach((t) => {
          const isActive = t === tab;
          t.classList.toggle('active', isActive);
          t.setAttribute('aria-selected', isActive ? 'true' : 'false');
          t.setAttribute('tabindex', isActive ? '0' : '-1');
        });
        document.querySelectorAll('.sub-panel').forEach((p) => {
          const isActive = p.id === `subpanel-${tab.dataset.subtab}`;
          p.classList.toggle('active', isActive);
          p.hidden = !isActive;
        });
      });
    });
  
    if (previewTabsContainer) {
      previewTabsContainer.addEventListener('keydown', (e) => {
        const tabs = Array.from(subTabs);
        const currentIndex = tabs.findIndex((t) => t === document.activeElement);
        if (currentIndex === -1) return;
  
        let nextIndex = -1;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          nextIndex = (currentIndex + 1) % tabs.length;
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        } else if (e.key === 'Home') {
          e.preventDefault();
          nextIndex = 0;
        } else if (e.key === 'End') {
          e.preventDefault();
          nextIndex = tabs.length - 1;
        }
  
        if (nextIndex !== -1) {
          tabs[nextIndex].focus();
          tabs[nextIndex].click();
        }
      });
    }
  
    // Action Buttons
    if (btnDownloadManifest) {
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
    }
  
    if (btnCopyJsonFull) {
      btnCopyJsonFull.addEventListener('click', () => {
        const { manifest } = updateStudioManifest();
        copyTextToClipboard(JSON.stringify(manifest, null, 2));
        showToast('Manifest copied to clipboard', 'success');
      });
    }
  
    if (btnCopyJsonSnippet) {
      btnCopyJsonSnippet.addEventListener('click', () => {
        const { manifest } = updateStudioManifest();
        copyTextToClipboard(JSON.stringify(manifest, null, 2));
        showToast('Code copied to clipboard', 'success');
      });
    }
  
    if (btnSubmitGitHubIssue) {
      btnSubmitGitHubIssue.addEventListener('click', () => {
        const { manifest } = updateStudioManifest();
        const meta = manifest.appstream?.metadata || {};
        const rawSlug = (appSlugEl.value.trim() || currentSlug || '').toLowerCase();
        const activeRepo = getCurrentRepo();
  
        const isExistingApp = Boolean(catalogData && catalogData[rawSlug]) || catalogList.some((item) => item.slug === rawSlug);
  
        let issueUrl = '';
        if (isExistingApp) {
          const title = encodeURIComponent(`fix(app): update metadata for ${rawSlug}`);
          const slug = encodeURIComponent(rawSlug);
          const changes = encodeURIComponent(JSON.stringify(manifest, null, 2));
          issueUrl = `https://github.com/${activeRepo}/issues/new?template=update-app.yml&title=${title}&slug=${slug}&changes=${changes}`;
        } else {
          const name = encodeURIComponent(meta.name || rawSlug);
          const slug = encodeURIComponent(rawSlug);
          const appId = encodeURIComponent(meta.id || '');
          const summary = encodeURIComponent(meta.summary || '');
  
          let descText = leadParagraphEl.value.trim();
          if (featureBullets.length > 0) {
            descText += '\n\nFeatures:\n' + featureBullets.map((b) => `- ${b}`).join('\n');
          }
          const desc = encodeURIComponent(descText);
  
          const license = encodeURIComponent(meta.projectLicense || 'MIT');
          const category = encodeURIComponent(meta.categories?.[0] || 'Utility');
          const dev = encodeURIComponent(meta.developer?.name || '');
          const homepage = encodeURIComponent(meta.homepage || '');
          const repo = encodeURIComponent(manifest.releaseSource?.repository || '');
          const icon = encodeURIComponent(manifest.appstream?.media?.icon || '');
          const screenshots = encodeURIComponent(
            (manifest.appstream?.media?.screenshots || []).map((s) => s.source).join('\n')
          );
          const title = encodeURIComponent(`feat(app): add metadata for ${meta.name || rawSlug}`);
  
          issueUrl = `https://github.com/${activeRepo}/issues/new?template=add-app.yml&title=${title}&name=${name}&slug=${slug}&app_id=${appId}&summary=${summary}&description=${desc}&license=${license}&main_category=${category}&developer_name=${dev}&homepage=${homepage}&release_repo=${repo}&icon_url=${icon}&screenshots=${screenshots}`;
        }
  
        window.open(issueUrl, '_blank');
      });
    }
  
    // Import JSON File
    if (btnUploadJson && fileInput) {
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
    }
  }
  

  // --- validator.js ---
  // Schema Validator View & Verification Diagnostics
  
  const validatorInputEl = document.getElementById('validatorInput');
  const validatorReportEl = document.getElementById('validatorReport');
  const btnRunValidation = document.getElementById('btnRunValidation');
  const btnFormatValidatorJson = document.getElementById('btnFormatValidatorJson');
  const btnClearValidatorJson = document.getElementById('btnClearValidatorJson');
  const btnLoadValidToStudio = document.getElementById('btnLoadValidToStudio');
  
  function runValidator() {
    if (!validatorInputEl || !validatorReportEl) return;
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
      if (btnLoadValidToStudio) btnLoadValidToStudio.style.display = 'none';
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
      if (btnLoadValidToStudio) {
        btnLoadValidToStudio.style.display = 'inline-flex';
        btnLoadValidToStudio.onclick = () => {
          const slug = meta.id.split('.').pop().toLowerCase();
          catalogData[slug] = parsed;
          loadAppIntoStudio(slug);
          switchTab('studio');
        };
      }
    } else {
      if (btnLoadValidToStudio) btnLoadValidToStudio.style.display = 'none';
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
  
  function initValidator() {
    if (btnRunValidation) btnRunValidation.addEventListener('click', runValidator);
    if (btnFormatValidatorJson) {
      btnFormatValidatorJson.addEventListener('click', () => {
        if (!validatorInputEl) return;
        try {
          const parsed = JSON.parse(validatorInputEl.value);
          validatorInputEl.value = JSON.stringify(parsed, null, 2);
        } catch {}
      });
    }
    if (btnClearValidatorJson) {
      btnClearValidatorJson.addEventListener('click', () => {
        if (!validatorInputEl || !validatorReportEl) return;
        validatorInputEl.value = '';
        validatorReportEl.innerHTML = '<p class="hint">Paste a JSON manifest and click "Validate Manifest" to inspect compliance.</p>';
        if (btnLoadValidToStudio) btnLoadValidToStudio.style.display = 'none';
      });
    }
  }
  

  // --- init.js ---
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
  
  
})();
