// Accessible Tab Navigation & Roving Tabindex

const navTabs = document.querySelectorAll('.nav-tab');
const tabPanels = document.querySelectorAll('.tab-panel');

function switchTab(tabId, updateUrl = true) {
  navTabs.forEach((t) => {
    const isActive = t.dataset.tab === tabId;
    t.classList.toggle('active', isActive);
    t.setAttribute('aria-selected', isActive ? 'true' : 'false');
    t.setAttribute('tabindex', isActive ? '0' : '-1');
  });
  tabPanels.forEach((p) => {
    const isActive = p.id === `panel-${tabId}`;
    p.classList.toggle('active', isActive);
    p.hidden = !isActive;
  });
  if (updateUrl) {
    const url = new URL(window.location.href);
    url.searchParams.delete('app');
    if (tabId === 'catalog') {
      url.searchParams.delete('tab');
      url.hash = '';
    } else {
      url.searchParams.set('tab', tabId);
      url.hash = tabId;
    }
    window.history.pushState({ tab: tabId }, '', url.toString());
  }
  const titles = {
    catalog: 'AnyLinux Metadata Portal',
    backlog: 'Pending Backlog - AnyLinux Metadata Portal',
    studio: 'Authoring Studio - AnyLinux Metadata Portal',
    validator: 'Manifest Validator - AnyLinux Metadata Portal'
  };
  document.title = titles[tabId] || 'AnyLinux Metadata Portal';
}

function initTabs() {
  navTabs.forEach((tab) => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab, true));
  });

  const navTabsContainer = document.querySelector('.nav-tabs');
  if (navTabsContainer) {
    navTabsContainer.addEventListener('keydown', (e) => {
      const tabs = Array.from(navTabs);
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
        switchTab(tabs[nextIndex].dataset.tab, true);
      }
    });
  }
}
