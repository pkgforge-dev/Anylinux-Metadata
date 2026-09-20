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
