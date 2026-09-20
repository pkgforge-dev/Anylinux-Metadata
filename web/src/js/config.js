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
