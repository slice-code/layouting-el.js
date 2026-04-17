(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
      (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.layout = factory());
})(this, (function () {
  'use strict';
  const layout = {};

  // define app
  let app = document.getElementById('app') || null;

  if(!app)
    throw new Error('App element not found');

  if(typeof el === 'undefined')
    throw new Error('el.js not load please load lib https://unpkg.com/@slice-code/el.js@1.0.6/el.js');

  // Routing state
  const pages = {};
  let currentPage = null;
  let sideMenus = [];
  let navbarMenus = [];
  let currentTheme = 'default';
  let openDropdowns = new Set(); // Track which dropdowns are open

  // Notification / confirm state
  let toastContainer = null;
  let dialogContainer = null;
  const toastTimers = new Map();
  let currentConfirmOptions = null;
  let currentModalOptions = null;

  // Desktop hide sidebar state
  let desktopHideMode = false;
  let desktopHoverOpen = false;
  let sidebarTriggerArea = null;
  let sidebarHoverActive = false;
  let sidebarHoverTimeout = null;
  const desktopHideModeStorageKey = 'layoutDesktopHideMode';

  function saveDesktopHideMode() {
    try {
      window.localStorage.setItem(desktopHideModeStorageKey, desktopHideMode ? '1' : '0');
    } catch (error) {
      console.warn('Unable to save desktop hide mode:', error);
    }
  }

  function loadDesktopHideMode() {
    try {
      const stored = window.localStorage.getItem(desktopHideModeStorageKey);
      if (stored !== null) {
        desktopHideMode = stored === '1';
      }
    } catch (error) {
      console.warn('Unable to load desktop hide mode:', error);
    }
  }

  // Theme configurations
  const themes = {
    default: {
      navbar: {
        backgroundColor: 'rgb(15, 23, 42)',
        color: '#fff',
      },
      sidebar: {
        backgroundColor: 'rgb(15, 23, 42)',
        color: '#fff',
      },
    },
    blue: {
      navbar: {
        backgroundColor: 'rgb(30, 64, 175)',
        color: '#fff',
      },
      sidebar: {
        backgroundColor: 'rgb(30, 64, 175)',
        color: '#fff',
      },
    },
    dark: {
      navbar: {
        backgroundColor: '#000',
        color: '#fff',
      },
      sidebar: {
        backgroundColor: '#111',
        color: '#fff',
      },
    },
    light: {
      navbar: {
        backgroundColor: '#fff',
        color: '#333',
      },
      sidebar: {
        backgroundColor: '#f5f5f5',
        color: '#333',
      },
    },
    purple: {
      navbar: {
        backgroundColor: 'rgb(88, 28, 135)',
        color: '#fff',
      },
      sidebar: {
        backgroundColor: 'rgb(88, 28, 135)',
        color: '#fff',
      },
    },
    green: {
      navbar: {
        backgroundColor: 'rgb(22, 101, 52)',
        color: '#fff',
      },
      sidebar: {
        backgroundColor: 'rgb(22, 101, 52)',
        color: '#fff',
      },
    },
    red: {
      navbar: {
        backgroundColor: 'rgb(153, 27, 27)',
        color: '#fff',
      },
      sidebar: {
        backgroundColor: 'rgb(153, 27, 27)',
        color: '#fff',
      },
    },
    orange: {
      navbar: {
        backgroundColor: 'rgb(194, 65, 12)',
        color: '#fff',
      },
      sidebar: {
        backgroundColor: 'rgb(194, 65, 12)',
        color: '#fff',
      },
    },
    teal: {
      navbar: {
        backgroundColor: 'rgb(19, 78, 74)',
        color: '#fff',
      },
      sidebar: {
        backgroundColor: 'rgb(19, 78, 74)',
        color: '#fff',
      },
    },
    pink: {
      navbar: {
        backgroundColor: 'rgb(157, 23, 77)',
        color: '#fff',
      },
      sidebar: {
        backgroundColor: 'rgb(157, 23, 77)',
        color: '#fff',
      },
    },
    gray: {
      navbar: {
        backgroundColor: 'rgb(55, 65, 81)',
        color: '#fff',
      },
      sidebar: {
        backgroundColor: 'rgb(75, 85, 99)',
        color: '#fff',
      },
    },
  };

  function isColorLight(color) {
    const rgb = color.replace(/\s/g, '').match(/^rgba?\((\d+),(\d+),(\d+)/);
    if (rgb) {
      const r = parseInt(rgb[1], 10);
      const g = parseInt(rgb[2], 10);
      const b = parseInt(rgb[3], 10);
      return (r * 0.299 + g * 0.587 + b * 0.114) > 186;
    }

    const hexMatch = color.replace('#', '').match(/^([0-9a-fA-F]{6})$/);
    if (hexMatch) {
      const hex = hexMatch[1];
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return (r * 0.299 + g * 0.587 + b * 0.114) > 186;
    }

    return false;
  }

  // CSS untuk sidebar dropdown
  const sidebarDropdownCSS = `
    .sidebar-dropdown-menu {
      display: none;
      padding-left: 1.5rem;
      margin-top: 4px;
    }
    .sidebar-dropdown-menu.open {
      display: block;
    }
    .sidebar-item {
      display: block;
      padding: 6px 0.5rem;
      color: #fff !important;
      font-size: 14px;
      cursor: pointer;
      text-decoration: none;
      border-radius: 4px;
      transition: background-color 0.2s;
    }
    .sidebar-item:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
    .sidebar-item.active {
      background-color: rgba(255, 255, 255, 0.3) !important;
      font-weight: bold;
      color: #fff !important;
    }
    .sidebar-dropdown-item {
      display: block;
      padding: 4px 0.5rem;
      color: rgba(255, 255, 255, 0.8) !important;
      font-size: 14px;
      cursor: pointer;
      text-decoration: none;
      margin: 2px 0;
      border-radius: 4px;
      transition: all 0.2s;
    }
    .sidebar-dropdown-item:hover {
      background-color: rgba(255, 255, 255, 0.1);
      color: #fff !important;
    }
    .sidebar-dropdown-item.active {
      background-color: rgba(255, 255, 255, 0.3) !important;
      font-weight: bold;
      color: #fff !important;
    }
    .dropdown-item {
      transition: background-color 0.2s;
      color: #333 !important;
      display: block;
      padding: 4px 12px;
      text-decoration: none;
    }
    .dropdown-item.active {
      background-color: rgba(0, 0, 0, 0.1) !important;
      font-weight: bold;
      color: #000 !important;
    }
  `;

  // Routing functions
  layout.addPage = function(config) {
    pages[config.path] = config;
  };

  layout.addSideMenu = function(menus) {
    sideMenus = menus;
    renderSideMenu();
  };

  layout.addNavbar = function(menus) {
    navbarMenus = menus;
    renderNavbar();
  };

  function renderNavbar() {
    if (!connector.navbarActions) return;
    
    const dropdownColor = '#333';

    const switchTrackStyle = {
      display: isMobile ? 'none' : 'inline-flex',
      alignItems: 'center',
      justifyContent: 'flex-start',
      width: '48px',
      height: '26px',
      padding: '3px',
      borderRadius: '999px',
      border: '1px solid rgba(255,255,255,0.35)',
      background: desktopHideMode ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.12)',
      cursor: 'pointer',
      flexShrink: '0',
      transition: 'background 0.2s ease, border-color 0.2s ease',
      boxSizing: 'border-box',
    };
    const switchHandleStyle = {
      width: '18px',
      height: '18px',
      borderRadius: '50%',
      background: '#fff',
      boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
      transition: 'transform 0.2s ease',
      transform: desktopHideMode ? 'translateX(22px)' : 'translateX(0)',
      flexShrink: '0',
    };

    el(connector.navbarActions).empty().child([
      el('div').css(cssLayouting[isMobile ? 'mobile' : 'desktop'].userDropdown).link(connector, 'userDropdown').child([
        el('a').link(connector, 'userIcon').cursor('pointer').padding('0 0.5rem').child(
          el('i').class('fas fa-user').size('18px')
        ).click(() => {
          dropdownVisible = !dropdownVisible;
          const dropdownCss = dropdownVisible ? cssLayouting[isMobile ? 'mobile' : 'desktop'].dropdownMenuOpen : cssLayouting[isMobile ? 'mobile' : 'desktop'].dropdownMenu;
          el(connector.dropdownMenu).css(dropdownCss).get();
        }),
        el('div').link(connector, 'dropdownMenu').css(cssLayouting[isMobile ? 'mobile' : 'desktop'].dropdownMenu).child(
          navbarMenus.map((item) => {
            const isActive = currentPage === item.page;
            return el('a').css({ ...cssLayouting[isMobile ? 'mobile' : 'desktop'].dropdownItem, color: dropdownColor })
              .class('dropdown-item' + (isActive ? ' active' : ''))
              .text(item.name)
              .click(() => {
                // Hide dropdown saat menu di-click
                dropdownVisible = false;
                el(connector.dropdownMenu).css(cssLayouting[isMobile ? 'mobile' : 'desktop'].dropdownMenu).get();
                // Navigate ke page
                layout.navigate(item.page);
              });
          })
        )
      ])
    ]).get();

    // Render switch ke slot di sebelah kanan navbar title (desktop only)
    if (connector.sidebarHideSwitchSlot) {
      connector.sidebarHideSwitchSlot.innerHTML = '';
      if (!isMobile) {
        el(connector.sidebarHideSwitchSlot).child([
          el('div').link(connector, 'sidebarHideToggle').css(switchTrackStyle).attr('title', 'Toggle sidebar hide mode').child([
            el('div').link(connector, 'sidebarHideToggleHandle').css(switchHandleStyle)
          ]).click(() => {
            setDesktopHideMode(!desktopHideMode);
            el(connector.sidebarHideToggle).css({
              background: desktopHideMode ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.12)',
            }).get();
            el(connector.sidebarHideToggleHandle).css({
              transform: desktopHideMode ? 'translateX(22px)' : 'translateX(0)',
            }).get();
          })
        ]).get();
      }
    }
  }

  layout.render = function() {
    loadDesktopHideMode();
    setDesktopHideMode(desktopHideMode);

    // Load initial page
    const initialPath = window.location.hash.slice(1) || '/';
    if (pages[initialPath]) {
      currentPage = initialPath;
      renderPage(initialPath);
    } else if (pages['/']) {
      currentPage = '/';
      renderPage('/');
    }

    syncSidebarDropdowns();
    // Update menu active state after initial render
    renderSideMenu();
    renderNavbar();
    updateSidebarState();
  };

  layout.setTheme = function(themeName) {
    if (!themes[themeName]) {
      console.warn(`Theme '${themeName}' not found, using default`);
      themeName = 'default';
    }
    currentTheme = themeName;
    applyTheme();
  };

  layout.setCustomTheme = function(config) {
    const themeName = 'custom';
    themes[themeName] = {
      navbar: {
        backgroundColor: config.navbarBg || '#333',
        color: config.navbarColor || '#fff',
      },
      sidebar: {
        backgroundColor: config.sidebarBg || '#444',
        color: config.sidebarColor || '#fff',
      },
    };
    currentTheme = themeName;
    applyTheme();
  };

  layout.showLoader = showLoader;
  layout.hideLoader = hideLoader;
  layout.toast = showToast;
  layout.notify = notify;
  layout.confirm = showConfirm;
  layout.closeConfirm = closeConfirm;
  layout.modal = showCustomModal;
  layout.customModal = showCustomModal;
  layout.closeModal = closeModal;
  layout.modal = showCustomModal;
  layout.customModal = showCustomModal;
  layout.closeModal = closeModal;

  function applyTheme() {
    const theme = themes[currentTheme];
    
    // Update navbar
    if (connector.navbar) {
      const navbarCss = cssLayouting[isMobile ? 'mobile' : 'desktop'].navBar;
      navbarCss.backgroundColor = theme.navbar.backgroundColor;
      navbarCss.color = theme.navbar.color;
      el(connector.navbar).css(navbarCss).get();
      
      // Update navbar title color
      if (connector.navbarTitle) {
        el(connector.navbarTitle).css({ color: theme.navbar.color }).get();
      }
    }
    
    // Update sidebar
    if (connector.sidebar) {
      const sidebarCss = cssLayouting[isMobile ? 'mobile' : 'desktop'].sidebar;
      sidebarCss.backgroundColor = theme.sidebar.backgroundColor;
      el(connector.sidebar).css(sidebarCss).get();
      
      // Update sidebar open state for mobile
      const sidebarOpenCss = cssLayouting.mobile.sidebarOpen;
      sidebarOpenCss.backgroundColor = theme.sidebar.backgroundColor;
      
      // Update sidebar text color
      const sidebarItems = connector.sidebar.querySelectorAll('a');
      sidebarItems.forEach(item => {
        el(item).css({ color: theme.sidebar.color }).get();
      });
    }
    
    // Update dropdown item colors consistently for white dropdown background
    const dropdownItems = document.querySelectorAll('.dropdown-item');
    dropdownItems.forEach(item => {
      el(item).css({ color: '#333' }).get();
    });
    const dropdownActiveItems = document.querySelectorAll('.dropdown-item.active');
    dropdownActiveItems.forEach(item => {
      el(item).css({ color: '#000', fontWeight: 'bold' }).get();
    });
    
    // Update hover styles based on navbar theme
    const styleEl = document.querySelector('style[data-theme-style]');
    if (styleEl) {
      styleEl.textContent = `${sidebarDropdownCSS}
${getThemeStyleCSS()}`;
    }
  }

  layout.navigate = function(path) {
    if (pages[path]) {
      currentPage = path;
      renderPage(path);
      window.location.hash = path;
      syncSidebarDropdowns();
      // Re-render sidebar dan navbar to update active state
      renderSideMenu();
      renderNavbar();
      updateSidebarState();
    }
  };

  function showLoader() {
    if (!connector.pagecontent) return;
    
    const loader = el('div').css({
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
      minHeight: '200px',
    }).child(
      el('div').css({
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #3498db',
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        animation: 'spin 1s linear infinite',
      })
    ).id('page-loader');
    
    // Add animation CSS if not exists
    if (!document.querySelector('style[data-loader-style]')) {
      const styleEl = el('style').textContent(`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `).attr('data-loader-style', 'true').get();
      document.head.appendChild(styleEl);
    }
    
    el(connector.pagecontent).empty().child(loader).get();
  }

  function hideLoader() {
    const loader = document.getElementById('page-loader');
    if (loader) {
      loader.remove();
    }
  }

  function renderPage(path) {
    const pageConfig = pages[path];
    if (!pageConfig) return;
    
    // Show loader
    showLoader();
    
    const component = pageConfig.component();
    
    // Check if component is a Promise (for async components)
    if (component && typeof component.then === 'function') {
      component.then((resolvedComponent) => {
        el(connector.pagecontent).empty().child(resolvedComponent).get();
        hideLoader();
      }).catch((error) => {
        console.error('Error loading page:', error);
        el(connector.pagecontent).empty().child(
          el('div').text('Error loading page')
        ).get();
        hideLoader();
      });
    } else {
      el(connector.pagecontent).empty().child(component).get();
      hideLoader();
    }
  }

  function updateSidebarVisibility() {
    if (!connector.sidebar) return;
    if (isMobile) {
      const sidebarCss = sidebarVisible ? cssLayouting.mobile.sidebarOpen : cssLayouting.mobile.sidebar;
      el(connector.sidebar).css(sidebarCss).get();
    } else {
      // Reset to normal desktop sidebar — always in flex flow
      el(connector.sidebar).css({
        position: '',
        zIndex: '',
        top: '',
        left: '',
        height: '',
        boxShadow: '',
        width: '250px',
        padding: '1rem',
        overflow: 'auto',
        display: 'block',
        backgroundColor: cssLayouting.desktop.sidebar.backgroundColor,
        minWidth: '',
        transition: 'width 0.2s ease',
        cursor: '',
      }).get();
    }
  }

  function shouldHideSidebarForPage() {
    const pageConfig = pages[currentPage];
    return !isMobile && pageConfig?.fullWidthDesktop;
  }

  function updateSidebarState() {
    if (shouldHideSidebarForPage()) {
      if (!connector.sidebar) return;
      el(connector.sidebar).css({ display: 'none' }).get();
      el(connector.pagecontent).css(cssLayouting.desktop.pagecontent).get();
      return;
    }

    if (!isMobile && desktopHideMode) {
      updateDesktopSidebar();
    } else {
      updateSidebarVisibility();
    }
  }

  function hideMobileSidebar() {
    if (!isMobile) return;
    sidebarVisible = false;
    updateSidebarVisibility();
  }

  function setDesktopHideMode(value) {
    desktopHideMode = Boolean(value);
    if (!desktopHideMode) {
      desktopHoverOpen = false;
      sidebarHoverActive = false;
      if (sidebarHoverTimeout) {
        clearTimeout(sidebarHoverTimeout);
        sidebarHoverTimeout = null;
      }
      updateDesktopSidebar();
      saveDesktopHideMode();
      return;
    }

    desktopHoverOpen = false;
    updateDesktopSidebar();
    saveDesktopHideMode();
  }

  function updateDesktopSidebar() {
    if (!connector.sidebar) return;
    if (!isMobile && desktopHideMode) {
      if (desktopHoverOpen) {
        // Floating overlay on top of content
        el(connector.sidebar).css({
          position: 'fixed',
          zIndex: '1500',
          top: '50px',
          left: '0',
          width: '250px',
          height: 'calc(100dvh - 50px)',
          minWidth: '',
          padding: '1rem',
          overflow: 'auto',
          display: 'block',
          boxShadow: '4px 0 16px rgba(0,0,0,0.35)',
          backgroundColor: cssLayouting.desktop.sidebar.backgroundColor,
          transition: '',
          cursor: '',
        }).get();
      } else {
        // Collapse to 0 width strip — mouseenter on sidebar triggers hover
        el(connector.sidebar).css({
          position: 'relative',
          zIndex: '1',
          top: '',
          left: '',
          height: '',
          boxShadow: '',
          width: '4px',
          minWidth: '4px',
          padding: '0',
          overflow: 'hidden',
          display: 'block',
          cursor: 'ew-resize',
          transition: '',
          backgroundColor: 'transparent',
        }).get();
      }
      return;
    }

    updateSidebarVisibility();
  }

  function showDesktopSidebarHover() {
    if (!desktopHideMode || isMobile) return;
    sidebarHoverActive = true;
    desktopHoverOpen = true;
    if (sidebarHoverTimeout) {
      clearTimeout(sidebarHoverTimeout);
      sidebarHoverTimeout = null;
    }
    updateDesktopSidebar();
  }

  function hideDesktopSidebarHoverSoon() {
    if (!desktopHideMode || isMobile) return;
    sidebarHoverActive = false;
    if (sidebarHoverTimeout) clearTimeout(sidebarHoverTimeout);
    sidebarHoverTimeout = setTimeout(() => {
      if (!sidebarHoverActive) {
        desktopHoverOpen = false;
        updateDesktopSidebar();
      }
    }, 150);
  }

  function createSidebarHoverArea() {
    // Sidebar itself is now the hover trigger (2px strip in flex flow)
    // No separate trigger area needed
  }

  function updateDesktopHoverArea() {
    // No-op: sidebar handles its own hover trigger area as a 2px flex item
  }

  function updateSidebarVisibility() {
    if (!connector.sidebar) return;
    if (isMobile) {
      const sidebarCss = sidebarVisible ? cssLayouting.mobile.sidebarOpen : cssLayouting.mobile.sidebar;
      el(connector.sidebar).css(sidebarCss).get();
    } else {
      // Wipe ALL inline styles then apply clean desktop base
      connector.sidebar.removeAttribute('style');
      el(connector.sidebar).css(cssLayouting.desktop.sidebar).get();
    }
  }

  function createToastContainer() {
    if (toastContainer) return;
    toastContainer = el('div')
      .id('layout-toast-container')
      .css({
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        zIndex: '1600',
        pointerEvents: 'none',
        maxWidth: '320px',
      })
      .get();
    app.appendChild(toastContainer);
  }

  function createDialogContainer() {
    if (dialogContainer) return;
    dialogContainer = el('div')
      .id('layout-dialog-container')
      .css({
        position: 'fixed',
        inset: '0',
        display: 'none',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.35)',
        zIndex: '1700',
        pointerEvents: 'auto',
      })
      .get();

    dialogContainer.addEventListener('click', (e) => {
      if (e.target === dialogContainer && (currentConfirmOptions?.dismissible !== false || currentModalOptions?.dismissible !== false)) {
        closeModal();
      }
    });

    app.appendChild(dialogContainer);
  }

  function clearToast(toastEl) {
    if (!toastEl) return;
    const timer = toastTimers.get(toastEl);
    if (timer) {
      clearTimeout(timer);
      toastTimers.delete(toastEl);
    }
    el(toastEl).css({ opacity: '0', transform: 'translateX(16px)' }).get();
    setTimeout(() => {
      if (toastEl.parentNode) toastEl.remove();
    }, 200);
  }

  function showToast(message, options = {}) {
    if (!toastContainer) createToastContainer();

    const type = options.type || 'info';
    const title = options.title || '';
    const duration = typeof options.duration === 'number' ? options.duration : 3000;
    const colors = {
      success: '#16a34a',
      error: '#dc2626',
      warning: '#f59e0b',
      info: '#2563eb',
    };
    const backgroundColor = colors[type] || colors.info;

    const toastEl = el('div')
      .css({
        backgroundColor,
        color: '#fff',
        borderRadius: '0.85rem',
        padding: '0.85rem 1rem',
        boxShadow: '0 18px 50px rgba(0,0,0,0.18)',
        pointerEvents: 'auto',
        opacity: '0',
        transform: 'translateX(16px)',
        transition: 'opacity 0.2s ease, transform 0.2s ease',
      })
      .child([
        el('div').css({ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }).child([
          el('div').css({ flex: '1' }).child([
            title
              ? el('div').css({ fontWeight: '700', marginBottom: '0.25rem' }).text(title)
              : el('span'),
            el('div').css({ fontSize: '0.95rem', lineHeight: '1.4' }).text(message),
          ]),
          el('button')
            .text('×')
            .css({
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: '1rem',
              cursor: 'pointer',
              lineHeight: '1',
              padding: '0',
              width: '1.5rem',
              height: '1.5rem',
            })
            .click(() => clearToast(toastEl)),
        ]),
      ])
      .get();

    toastContainer.appendChild(toastEl);
    requestAnimationFrame(() => {
      el(toastEl).css({ opacity: '1', transform: 'translateX(0)' }).get();
    });

    const timer = setTimeout(() => clearToast(toastEl), duration);
    toastTimers.set(toastEl, timer);
    return toastEl;
  }

  function closeModal() {
    if (!dialogContainer) return;
    dialogContainer.style.display = 'none';
    dialogContainer.innerHTML = '';
    currentConfirmOptions = null;
    currentModalOptions = null;
  }

  function closeConfirm() {
    closeModal();
  }

  function showCustomModal(options = {}) {
    if (!dialogContainer) createDialogContainer();

    const title = options.title || '';
    const content = options.content ?? options.message ?? '';
    const buttons = Array.isArray(options.buttons) ? options.buttons : [];
    const dismissible = options.dismissible !== false;

    currentModalOptions = { dismissible };

    const body = el('div').css({ marginBottom: '1rem', color: '#374151' });
    if (typeof content === 'string') {
      body.text(content);
    } else if (content && typeof content.get === 'function') {
      body.child(content);
    } else if (content instanceof Node) {
      body.child(el('div').child([content]));
    } else {
      body.text('');
    }

    const actionButtons = buttons.length
      ? buttons.map((button) => {
          return el('button')
            .text(button.text || 'Action')
            .css({
              padding: '0.7rem 1rem',
              borderRadius: '0.75rem',
              border: button.variant === 'outline' ? '1px solid #d1d5db' : 'none',
              backgroundColor: button.variant === 'secondary' ? '#6b7280' : button.variant === 'outline' ? '#fff' : '#1d4ed8',
              color: button.variant === 'outline' ? '#111' : '#fff',
              cursor: 'pointer',
            })
            .click(() => {
              if (button.onClick) button.onClick();
              if (button.closeOnClick !== false) closeModal();
            });
        })
      : [
          el('button')
            .text('Close')
            .css({
              padding: '0.7rem 1rem',
              borderRadius: '0.75rem',
              border: 'none',
              backgroundColor: '#1d4ed8',
              color: '#fff',
              cursor: 'pointer',
            })
            .click(closeModal),
        ];

    const dialogBox = el('div')
      .css({
        width: 'min(95%, 480px)',
        backgroundColor: '#fff',
        borderRadius: '1rem',
        padding: '1.25rem',
        boxShadow: '0 24px 80px rgba(0,0,0,0.18)',
        color: '#111',
        pointerEvents: 'auto',
      })
      .child([
        el('div').css({ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }).child([
          el('div').child([
            title ? el('h3').css({ margin: '0 0 0.75rem', fontSize: '1.2rem' }).text(title) : el('span'),
          ]),
          el('button')
            .text('×')
            .css({
              background: 'transparent',
              border: 'none',
              color: '#111',
              fontSize: '1.2rem',
              cursor: 'pointer',
              lineHeight: '1',
            })
            .click(closeModal),
        ]),
        body,
        el('div').css({ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', flexWrap: 'wrap' }).child(actionButtons),
      ])
      .get();

    dialogContainer.innerHTML = '';
    dialogContainer.appendChild(dialogBox);
    dialogContainer.style.display = 'flex';
  }

  function showConfirm(options = {}) {
    if (!dialogContainer) createDialogContainer();

    const title = options.title || 'Confirm';
    const message = options.message || '';
    const confirmText = options.confirmText || 'OK';
    const cancelText = options.cancelText || 'Cancel';
    const onConfirm = typeof options.onConfirm === 'function' ? options.onConfirm : () => {};
    const onCancel = typeof options.onCancel === 'function' ? options.onCancel : () => {};
    const dismissible = options.dismissible !== false;

    currentConfirmOptions = { dismissible };

    const dialogBox = el('div')
      .css({
        width: 'min(95%, 420px)',
        backgroundColor: '#fff',
        borderRadius: '1rem',
        padding: '1.25rem',
        boxShadow: '0 24px 80px rgba(0,0,0,0.18)',
        color: '#111',
        pointerEvents: 'auto',
      })
      .child([
        el('h3').css({ margin: '0 0 0.75rem', fontSize: '1.2rem' }).text(title),
        el('p').css({ margin: '0 1px 1.35rem', lineHeight: '1.6', color: '#4b5563' }).text(message),
        el('div').css({ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', flexWrap: 'wrap' }).child([
          el('button')
            .text(cancelText)
            .css({
              padding: '0.7rem 1rem',
              borderRadius: '0.75rem',
              border: '1px solid #d1d5db',
              backgroundColor: '#fff',
              color: '#111',
              cursor: 'pointer',
            })
            .click(() => {
              closeConfirm();
              onCancel();
            }),
          el('button')
            .text(confirmText)
            .css({
              padding: '0.7rem 1rem',
              borderRadius: '0.75rem',
              border: 'none',
              backgroundColor: '#1d4ed8',
              color: '#fff',
              cursor: 'pointer',
            })
            .click(() => {
              closeConfirm();
              onConfirm();
            }),
        ]),
      ])
      .get();

    dialogContainer.innerHTML = '';
    dialogContainer.appendChild(dialogBox);
    dialogContainer.style.display = 'flex';
  }

  function notify(options = {}) {
    if (typeof options === 'string') {
      options = { message: options };
    }
    const title = options.title;
    const message = options.message || options.text || '';
    return showToast(message, options.type ? { ...options } : { ...options, type: 'info', title });
  }

  function syncSidebarDropdowns() {
    openDropdowns.clear();

    const activeDropdown = sideMenus.find((item) =>
      item.children && item.children.some((child) => child.page === currentPage)
    );

    if (activeDropdown) {
      openDropdowns.add('dropdown-' + activeDropdown.name.toLowerCase().replace(/\s+/g, '-'));
    }
  }

  function renderSideMenu() {
    if (!connector.sidebar) return;
    
    el(connector.sidebar).empty().child(
      sideMenus.map((item) => {
        // Check if menu has children (dropdown)
        if (item.children && item.children.length > 0) {
          return createSidebarDropdown(item);
        }
        
        // Regular menu item
        const isActive = currentPage === item.page;
        return el('a')
          .cursor('pointer')
          .class('sidebar-item' + (isActive ? ' active' : ''))
          .click(() => {
            hideMobileSidebar();
            layout.navigate(item.page);
          })
          .child([
            el('i').marginRight(item.icon ? '0.5rem' : '0').class(item.icon || ''),
            el('span').text(item.name),
          ]);
      })
    ).get();

    updateSidebarVisibility();
  }

  function createSidebarDropdown(item) {
    const dropdownId = 'dropdown-' + item.name.toLowerCase().replace(/\s+/g, '-');
    let isOpen = openDropdowns.has(dropdownId);
    
    const container = el('div').class('sidebar-dropdown-container');
    
    // Create menu container — apply initial open/close state
    const menuContainer = el('div')
      .id(dropdownId)
      .class('sidebar-dropdown-menu')
      .css(isOpen
        ? { display: 'block', paddingLeft: '1.5rem', marginTop: '4px' }
        : { display: 'none' })
      .child(
        item.children.map((child) => {
          const isActive = currentPage === child.page;
          return el('a')
            .display('block')
            .cursor('pointer')
            .padding('4px 0.5rem')
            .class('sidebar-dropdown-item' + (isActive ? ' active' : ''))
            .size('14px')
            .text(child.name)
            .click(() => {
              hideMobileSidebar();
              layout.navigate(child.page);
            });
        })
      );
    
    // Create chevron icon — apply initial rotation state
    const chevronIcon = el('i')
      .class('fas fa-chevron-right')
      .css({
        fontSize: '12px',
        transition: 'transform 0.2s',
        transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
      });
    
    // Toggle button with chevron icon
    const toggle = el('a')
      .cursor('pointer')
      .css({ 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      })
      .color('#fff')
      .size('14px')
      .padding('6px 0.5rem')
      .class('sidebar-item')
      .click(() => {
        isOpen = !isOpen;
        if (isOpen) {
          openDropdowns.clear();
          openDropdowns.add(dropdownId);
        } else {
          openDropdowns.delete(dropdownId);
        }
        // Toggle visibility
        menuContainer.css(isOpen
          ? { display: 'block', paddingLeft: '1.5rem', marginTop: '4px' }
          : { display: 'none' });
        // Rotate chevron
        chevronIcon.css({
          transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
        });
      });
    
    // Create left content (icon + text)
    const leftContent = el('div').css({ display: 'flex', alignItems: 'center', gap: '0.5rem' }).child([
      el('i').class(item.icon || ''),
      el('span').text(item.name),
    ]);
    
    toggle.child([leftContent, chevronIcon]);
    
    container.child([toggle, menuContainer]);
    return container;
  }

  function getThemeStyleCSS() {
    const theme = themes[currentTheme] || themes.default;
    const lightTheme = isColorLight(theme.navbar.backgroundColor) || isColorLight(theme.sidebar.backgroundColor);

    if (lightTheme) {
      return `
        .dropdown-item:hover {
          background-color: #e0e0e0;
          color: #333 !important;
        }
        .sidebar-item:hover {
          background-color: rgba(0, 0, 0, 0.05);
        }
        .sidebar-dropdown-item:hover {
          background-color: rgba(0, 0, 0, 0.05);
          color: #333 !important;
        }
      `;
    }

    return `
      .dropdown-item:hover {
        background-color: rgb(216, 195, 195);
        color: #000 !important;
      }
      .sidebar-item:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }
      .sidebar-dropdown-item:hover {
        background-color: rgba(255, 255, 255, 0.1);
        color: #fff !important;
      }
    `;
  }

  const sidebarSwitchCSS = `
    .sidebar-switch {
      display: inline-flex;
      align-items: center;
      justify-content: flex-start;
      width: 48px;
      height: 26px;
      padding: 3px;
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,0.35);
      background: rgba(255,255,255,0.12);
      cursor: pointer;
      transition: background-color 0.2s ease, border-color 0.2s ease;
    }
    .sidebar-switch.active {
      background: rgba(255,255,255,0.3);
      border-color: rgba(255,255,255,0.55);
    }
    .sidebar-switch:hover {
      border-color: rgba(255,255,255,0.65);
    }
    .sidebar-switch-handle {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #fff;
      box-shadow: 0 2px 6px rgba(0,0,0,0.18);
      transition: transform 0.2s ease;
    }
    .sidebar-switch.active .sidebar-switch-handle {
      transform: translateX(22px);
    }
    @media (max-width: 768px) {
      .sidebar-switch { display: none !important; }
    }
  `;

  // Add CSS untuk hover dropdown
  const styleEl = el('style').textContent(`${sidebarDropdownCSS}
${sidebarSwitchCSS}
${getThemeStyleCSS()}`).attr('data-theme-style', 'true').get();
  document.head.appendChild(styleEl);

  let isMobile = window.innerWidth <= 768 ? true : false;
  let sidebarVisible = false;
  let dropdownVisible = false;

  const connector = {};

  let cssLayouting = {
    desktop: {
      container: {
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
        minHeight: '100dvh',
        maxHeight: '100dvh',
      },
      navBar: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 1rem',
        backgroundColor: 'rgb(15, 23, 42)',
        color: '#fff',
        fontSize: '1.2rem',
        fontWeight: 'bold',
        height: '50px',
        verticalAlign: 'middle',
        lineHeight: '50px',
      },
      content: {
        flex: '1',
        display: 'flex',
        flexDirection: 'row',
        overflow: 'auto',
      },
      sidebar: {
        width: '250px',
        backgroundColor: 'rgb(15, 23, 42)',
        padding: '1rem',
        overflow: 'auto',
        display: 'block',
      },
      pagecontent: {
        flex: '1',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
        padding: '10px',
      },
      userDropdown: {
        position: 'relative',
      },
      dropdownMenu: {
        display: 'none',
        position: 'absolute',
        top: '100%',
        right: '0',
        backgroundColor: '#fff',
        color: '#333',
        width: '120px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        borderRadius: '4px',
        zIndex: '1000',
        whiteSpace: 'nowrap',
        padding: '8px 12px',
        margin: '0',
      },
      dropdownMenuOpen: {
        display: 'block',
        position: 'absolute',
        top: '100%',
        right: '0',
        backgroundColor: '#fff',
        color: '#333',
        width: '120px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        borderRadius: '4px',
        zIndex: '1000',
        whiteSpace: 'nowrap',
        padding: '8px 0',
        margin: '0',
      },
      dropdownItem: {
        display: 'block',
        padding: '4px 12px',
        color: '#333',
        cursor: 'pointer',
        fontSize: '14px',
        lineHeight: '1.5',
        textDecoration: 'none',
      },
      dropdownItemHover: {
        backgroundColor: '#f0f0f0',
      },
    },
    mobile: {
      container: {
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
        minHeight: '100dvh',
        maxHeight: '100dvh',
      },
      navBar: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 1rem',
        backgroundColor: 'rgb(15, 23, 42)',
        color: '#fff',
        fontSize: '1.2rem',
        fontWeight: 'bold',
        height: '50px',
        verticalAlign: 'middle',
        lineHeight: '50px',
      },
      content: {
        flex: '1',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
      },
      sidebar: {
        position: 'fixed',
        zIndex: '1000',
        top: '50px',
        left: '0',
        right: '0',
        bottom: '0',
        width: '100%',
        backgroundColor: 'rgb(15, 23, 42)',
        padding: '1rem',
        overflow: 'auto',
        display: 'none',
        boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
      },
      sidebarOpen: {
        position: 'fixed',
        zIndex: '1000',
        top: '50px',
        left: '0',
        right: '0',
        bottom: '0',
        width: '100%',
        backgroundColor: 'rgb(15, 23, 42)',
        padding: '1rem',
        overflow: 'auto',
        display: 'block',
        boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
      },
      pagecontent: {
        flex: '1',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
        padding: '10px',
      },
      userDropdown: {
        position: 'relative',
      },
      dropdownMenu: {
        display: 'none',
        position: 'absolute',
        top: '100%',
        right: '0',
        backgroundColor: '#fff',
        color: '#333',
        width: '120px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        borderRadius: '4px',
        zIndex: '1000',
        whiteSpace: 'nowrap',
        padding: '8px 12px',
        margin: '0',
      },
      dropdownMenuOpen: {
        display: 'block',
        position: 'absolute',
        top: '100%',
        right: '0',
        backgroundColor: '#fff',
        color: '#333',
        width: '120px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        borderRadius: '4px',
        zIndex: '1000',
        whiteSpace: 'nowrap',
        padding: '8px 0',
        margin: '0',
      },
      dropdownItem: {
        display: 'block',
        padding: '4px 12px',
        color: '#333',
        cursor: 'pointer',
        fontSize: '14px',
        lineHeight: '1.5',
        textDecoration: 'none',
      },
      dropdownItemHover: {
        backgroundColor: '#f0f0f0',
      },
    }
  }

  let menuItem = [
    {
      name: 'Menu 1',
      url: '#',
    }
    ,{
      name: 'Menu 2',
      url: '#',
    }
    ,{
      name: 'Menu 3',
      url: '#',
    }
  ];

  let sidemenuItem = [
    {
      name: 'Menu 1',
      icon: 'fas fa-home',
      url: '#',
    }
    ,{
      name: 'Menu 2',
      url: '#',
    }
    ,{
      name: 'Menu 3',
      url: '#',
    }
  ];
  
  let layoutContainer = el('div')
  .link(connector, 'container')
  .id('layout-container')
  .css(cssLayouting[isMobile ? 'mobile' : 'desktop'].container);

  let navBar = el('nav')
  .link(connector, 'navbar')
  .id('nav-bar')
  .css(cssLayouting[isMobile ? 'mobile' : 'desktop'].navBar)
  .child([
    el('div').css({ display: 'flex', alignItems: 'center', gap: '0.75rem' }).child([
      el('a').link(connector, 'menuToggle').css({ display: isMobile ? 'inline' : 'none', paddingRight: '0.5rem', cursor: 'pointer' }).child(
        el('i').class('fas fa-bars')
      ).click(() => {
        sidebarVisible = !sidebarVisible;
        const sidebarCss = sidebarVisible ? cssLayouting.mobile.sidebarOpen : cssLayouting.mobile.sidebar;
        el(connector.sidebar).css(sidebarCss).get();
      }),
      el('a').link(connector, 'navbarTitle').size('16px').css({ color: cssLayouting[isMobile ? 'mobile' : 'desktop'].navBar.color, cursor: 'pointer' }).text("Navbar title").click(() => {
        layout.navigate('/');
      }),
      el('div').link(connector, 'sidebarHideSwitchSlot'),
    ]),
    el('div').link(connector, 'navbarActions').css({ display: 'flex', alignItems: 'center', gap: '0.75rem' }).child([])
  ]);


  layoutContainer.child(navBar);

  layoutContainer.child([
    el('div').link(connector, 'content').css(cssLayouting[isMobile ? 'mobile' : 'desktop'].content)
    .child([
      el('div').css(cssLayouting[isMobile ? 'mobile' : 'desktop'].sidebar).link(connector, 'sidebar')
      .child([]),
      el('div').css(cssLayouting[isMobile ? 'mobile' : 'desktop'].pagecontent).link(connector, 'pagecontent')
    ])
  ]);

  window.addEventListener('resize', () => {
    const wasMobile = isMobile;
    isMobile = window.innerWidth <= 768 ? true : false;
    
    if (wasMobile !== isMobile) {
      el(connector.container).css(cssLayouting[isMobile ? 'mobile' : 'desktop'].container).get();
      el(connector.navbar).css(cssLayouting[isMobile ? 'mobile' : 'desktop'].navBar).get();
      el(connector.content).css(cssLayouting[isMobile ? 'mobile' : 'desktop'].content).get();
      
      // Toggle hamburger menu visibility
      el(connector.menuToggle).css({ display: isMobile ? 'inline' : 'none' }).get();
      
      // Reset sidebar state saat kembali ke desktop
      if (!isMobile) {
        sidebarVisible = false;
        el(connector.sidebar).css(cssLayouting.desktop.sidebar).get();
      } else {
        el(connector.sidebar).css(cssLayouting.mobile.sidebar).get();
      }
      updateDesktopHoverArea();

      if (connector.sidebarHideSwitchSlot) {
        connector.sidebarHideSwitchSlot.style.display = isMobile ? 'none' : 'block';
      }
      renderNavbar();
      updateSidebarState();
      
      el(connector.pagecontent).css(cssLayouting[isMobile ? 'mobile' : 'desktop'].pagecontent).get();
    }
  });

  // Close dropdown saat click di luar area
  document.addEventListener('click', (e) => {
    if (dropdownVisible && !connector.userDropdown?.contains(e.target)) {
      dropdownVisible = false;
      el(connector.dropdownMenu).css(cssLayouting[isMobile ? 'mobile' : 'desktop'].dropdownMenu).get();
    }
  });

  // Handle hash change
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.slice(1) || '/';
    if (pages[hash]) {
      currentPage = hash;
      renderPage(hash);
      syncSidebarDropdowns();
      // Update active state untuk sidebar dan navbar
      renderSideMenu();
      renderNavbar();
      updateSidebarState();
    }
  });

  app.appendChild(layoutContainer.get());
  createToastContainer();
  createDialogContainer();
  createSidebarHoverArea();

  if (connector.sidebar) {
    connector.sidebar.addEventListener('mouseenter', () => {
      showDesktopSidebarHover();
    });
    connector.sidebar.addEventListener('mouseleave', () => {
      hideDesktopSidebarHoverSoon();
    });
  }

  // expose to global
  if (typeof window !== 'undefined') {
    window.addNavbar = layout.addNavbar;
    window.setLayoutTheme = layout.setTheme;
    window.setCustomTheme = layout.setCustomTheme;
  }

  return layout;

}));