# UI/UX and Accessibility Remediation Plan

This document outlines the front-end remediation tasks identified during the UI/UX and accessibility audit of the AnyLinux Metadata Web Portal (`web/index.html`, `web/style.css`, and `web/app.js`).

---

## 1. Tab Navigation and ARIA Specification

- [ ] **State Attributes**: Update tab buttons in `web/index.html` and `web/app.js` to manage `aria-selected="true"` for the active tab and `aria-selected="false"` for inactive tabs.
- [ ] **Panel Relationships**: Add `role="tabpanel"` to each `.tab-panel` section and link each panel to its corresponding tab using `id`, `aria-controls`, and `aria-labelledby`.
- [ ] **Keyboard Roving Tabindex**: Implement standard WAI-ARIA tab pattern where only the active tab has `tabindex="0"`, inactive tabs have `tabindex="-1"`, and Left/Right Arrow keys navigate between tabs.

---

## 2. Modal Dialog Accessibility and Focus Management

- [ ] **Semantic Structure / Dialog Role**: Upgrade the modal container (`#appDetailModal`) to either the HTML5 `<dialog>` element or add `role="dialog"`, `aria-modal="true"`, and `aria-labelledby="modalDetailTitle"`.
- [ ] **Keyboard Focus Trap**: Implement a focus trap within `openAppDetailModal()` so pressing `Tab` or `Shift+Tab` cycles only through interactive elements inside the modal window.
- [ ] **Focus Restoration**: Store the element that triggered the modal opening (`document.activeElement`) and return focus to it when the modal is closed via Escape key, close button, or backdrop click.
- [ ] **Background Scroll Lock**: Prevent page scroll bleed by toggling `overflow: hidden` on `document.body` while the modal is active.

---

## 3. Accessible Form Names and Input Labeling

- [ ] **Catalog Search**: Add an explicit `<label for="catalogSearch" class="sr-only">` or `aria-label="Search catalog applications"` to `#catalogSearch`.
- [ ] **Backlog Search**: Add an explicit `<label for="backlogSearch" class="sr-only">` or `aria-label="Search pending applications"` to `#backlogSearch`.
- [ ] **Validator Input**: Add an accessible label or `aria-label="Application manifest JSON payload"` to `#validatorInput`.
- [ ] **Keywords Tag Input**: Associate the keywords label with `#keywordsInput` via `for="keywordsInput"` or `aria-label`.
- [ ] **Screen Reader Utility Class**: Define a `.sr-only` CSS class in `web/style.css` to visually hide labels while keeping them accessible to assistive tech.

---

## 4. Dynamic Screen Reader Feedback (`aria-live`)

- [ ] **Catalog Results Count**: Add `aria-live="polite"` and `aria-atomic="true"` to `#catalogResultsCount` so screen readers announce filtered result totals.
- [ ] **Empty States**: Ensure empty state messages ("No applications found matching your criteria") are announced when filters yield 0 results.
- [ ] **Backlog Table Live Feedback**: Provide `aria-live="polite"` updates when `#backlogSearch` filters the table rows.

---

## 5. Interactive Card Architecture and Semantic Structure

- [ ] **Card Container Semantics**: Remove direct click handlers from `.app-card` `div` containers or give cards semantic keyboard activation (`tabindex="0"`, `role="article"`, Enter/Space key listeners).
- [ ] **Primary Action Demarcation**: Clarify the primary card action vs secondary buttons (`View`, `Edit`, `Copy`) to prevent event collision and ambiguous focus states.
- [ ] **Focus Rings**: Add visible, high-contrast `:focus-visible` outline rings to `.app-card`, `.btn`, `.nav-tab`, and `.link-btn`.

---

## 6. Color Contrast and WCAG 2.1/2.2 AA Compliance

- [ ] **Light Mode `--text-dim`**: Darken `--text-dim` from `#92969f` to `#595d66` or darker to achieve at least 4.5:1 contrast against `#ffffff` and `#f4f2ed`.
- [ ] **Dark Mode `--text-dim`**: Brighten `--text-dim` from `#475569` to `#94a3b8` or lighter to achieve at least 4.5:1 contrast against `#22262d` and `#14171a`.
- [ ] **Muted Badge and Hint Contrast**: Verify and adjust contrast for `.tab-badge`, `.field-meta .hint`, and `.slug-code` in both light and dark themes.

---

## 7. Reduced Motion Support (`prefers-reduced-motion`)

- [ ] **Media Query**: Add `@media (prefers-reduced-motion: reduce)` in `web/style.css`.
- [ ] **Animation Suppression**: Set `transition-duration: 0.01ms !important`, `animation-duration: 0.01ms !important`, and disable transform animations (`translateY`, scale) when reduced motion is requested.

---

## 8. Image Sizing and Cumulative Layout Shift (CLS) Prevention

- [ ] **Catalog Grid Icons**: Add explicit `width="48" height="48"` attributes and CSS aspect ratios to `.app-card-icon`.
- [ ] **Modal Icons**: Add explicit `width="64" height="64"` to `.modal-header-icon`.
- [ ] **Screenshot Thumbnails**: Provide explicit aspect ratios (`aspect-ratio: 16 / 9`) or min-height placeholders to `.modal-screenshot-img` containers to eliminate layout shift during loading.

---

## 9. Mobile Touch Target Optimization (44px Minimum)

- [ ] **Card Action Buttons**: Add mobile media query (`@media (max-width: 640px)`) ensuring `.btn-xs`, `.btn-card-inspect`, `.btn-card-edit`, and `.btn-card-copy` meet minimum 44px touch target heights.
- [ ] **Header Controls**: Ensure `.btn-theme-toggle` and `.nav-tab` meet or exceed 44x44px touch targets on handheld devices.
- [ ] **Filter Selects**: Increase tap height for `#catalogCategoryFilter` and `#catalogSortFilter` on mobile viewports.

---

## 10. Verification and Testing

- [ ] **Automated Accessibility Testing**: Run automated checks (e.g. Lighthouse, Axe-core, or Pa11y) to verify zero WCAG AA violations.
- [ ] **Keyboard-Only Navigation Audit**: Verify full keyboard navigation through Tab navigation, catalog filtering, card interaction, modal opening/trapping/closing, and form authoring without mouse input.
- [ ] **Dual Theme Audit**: Verify contrast compliance in both light and dark themes across all components.
