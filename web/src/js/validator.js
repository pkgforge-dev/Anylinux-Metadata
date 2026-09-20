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
