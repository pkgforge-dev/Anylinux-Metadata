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
