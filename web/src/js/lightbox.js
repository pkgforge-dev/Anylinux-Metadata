// Screenshot Lightbox Modal Dialog & Fullscreen Viewer

const screenshotLightboxModal = document.getElementById('screenshotLightboxModal');
const lightboxCounter = document.getElementById('lightboxCounter');
const lightboxOpenNewTab = document.getElementById('lightboxOpenNewTab');
const lightboxCloseBtn = document.getElementById('lightboxCloseBtn');
const lightboxPrevBtn = document.getElementById('lightboxPrevBtn');
const lightboxNextBtn = document.getElementById('lightboxNextBtn');
const lightboxImage = document.getElementById('lightboxImage');
const lightboxCaption = document.getElementById('lightboxCaption');

let activeLightboxScreenshots = [];
let currentLightboxIndex = 0;
let lastFocusedElementBeforeLightbox = null;

function openScreenshotLightbox(screenshots, initialIndex = 0) {
  if (!screenshots || screenshots.length === 0) return;
  lastFocusedElementBeforeLightbox = document.activeElement;
  activeLightboxScreenshots = screenshots;
  currentLightboxIndex = Math.max(0, Math.min(initialIndex, screenshots.length - 1));
  updateLightboxView();
  if (screenshotLightboxModal) {
    screenshotLightboxModal.classList.add('active');
    screenshotLightboxModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    if (lightboxCloseBtn) lightboxCloseBtn.focus();
  }
}

function closeScreenshotLightbox() {
  if (screenshotLightboxModal) {
    screenshotLightboxModal.classList.remove('active');
    screenshotLightboxModal.style.display = 'none';
    document.body.style.overflow = '';
    if (lastFocusedElementBeforeLightbox && typeof lastFocusedElementBeforeLightbox.focus === 'function') {
      lastFocusedElementBeforeLightbox.focus();
      lastFocusedElementBeforeLightbox = null;
    }
  }
}

function updateLightboxView() {
  if (!activeLightboxScreenshots || activeLightboxScreenshots.length === 0) return;
  const current = activeLightboxScreenshots[currentLightboxIndex];
  if (!current) return;

  if (lightboxImage) {
    lightboxImage.src = current.source;
    lightboxImage.alt = current.caption || 'Screenshot preview';
  }
  if (lightboxCaption) {
    lightboxCaption.innerText = current.caption || '';
  }
  if (lightboxOpenNewTab) {
    lightboxOpenNewTab.href = current.source;
  }
  if (lightboxCounter) {
    lightboxCounter.innerText = `${currentLightboxIndex + 1} / ${activeLightboxScreenshots.length}`;
    lightboxCounter.style.display = activeLightboxScreenshots.length > 1 ? 'block' : 'none';
  }
  if (lightboxPrevBtn && lightboxNextBtn) {
    const showNav = activeLightboxScreenshots.length > 1;
    lightboxPrevBtn.style.display = showNav ? 'flex' : 'none';
    lightboxNextBtn.style.display = showNav ? 'flex' : 'none';
  }
}

function stepLightbox(delta) {
  if (!activeLightboxScreenshots || activeLightboxScreenshots.length <= 1) return;
  currentLightboxIndex = (currentLightboxIndex + delta + activeLightboxScreenshots.length) % activeLightboxScreenshots.length;
  updateLightboxView();
}

function initLightbox() {
  if (lightboxCloseBtn) {
    lightboxCloseBtn.addEventListener('click', closeScreenshotLightbox);
  }
  if (lightboxPrevBtn) {
    lightboxPrevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      stepLightbox(-1);
    });
  }
  if (lightboxNextBtn) {
    lightboxNextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      stepLightbox(1);
    });
  }
  if (screenshotLightboxModal) {
    screenshotLightboxModal.addEventListener('click', (e) => {
      if (e.target === screenshotLightboxModal || e.target.classList.contains('lightbox-viewport') || e.target.classList.contains('lightbox-img-container')) {
        closeScreenshotLightbox();
      }
    });
  }
  window.addEventListener('keydown', (e) => {
    if (!screenshotLightboxModal || !screenshotLightboxModal.classList.contains('active')) return;
    if (e.key === 'Escape') {
      closeScreenshotLightbox();
    } else if (e.key === 'ArrowLeft') {
      stepLightbox(-1);
    } else if (e.key === 'ArrowRight') {
      stepLightbox(1);
    } else if (e.key === 'Tab') {
      const focusable = Array.from(screenshotLightboxModal.querySelectorAll('button:not([disabled]):not([style*="display: none"]), [href]:not([style*="display: none"])')).filter((el) => el.offsetParent !== null);
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
