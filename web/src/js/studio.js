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
