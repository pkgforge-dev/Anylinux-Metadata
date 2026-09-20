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
