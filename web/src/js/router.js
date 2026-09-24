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
  if (typeof closeScreenshotLightbox === 'function') closeScreenshotLightbox();
  if (typeof closeAppDetailModal === 'function') closeAppDetailModal();

  const params = new URLSearchParams(window.location.search);
  const queryApp = params.get('app');
  const queryTab = params.get('tab');
  const rawHash = (window.location.hash || '').replace('#', '');

  if (queryApp) {
    if (catalogData && catalogData[queryApp]) {
      navigateToApp(queryApp, false);
      return;
    }
    if (!catalogData || Object.keys(catalogData).length === 0) {
      return;
    }
  }

  if (rawHash.startsWith('app/')) {
    const slug = rawHash.replace('app/', '');
    if (catalogData && catalogData[slug]) {
      navigateToApp(slug, false);
      return;
    }
    if (!catalogData || Object.keys(catalogData).length === 0) {
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

  // Fallback when returning to root URL (e.g. browser back button from app view):
  switchTab('catalog', false);
}

function initRouter() {
  window.addEventListener('popstate', () => handleRouting(false));
  window.addEventListener('hashchange', () => handleRouting(false));
}
