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
