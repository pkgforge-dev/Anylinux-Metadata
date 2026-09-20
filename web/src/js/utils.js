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
