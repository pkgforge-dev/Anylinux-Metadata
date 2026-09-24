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
        <span class="card-footer-badge">AppImage</span>
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
