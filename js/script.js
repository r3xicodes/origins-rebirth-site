/* Background slide logic (kept simple) */
let currentSlide = 0;
const slides = document.querySelectorAll('.background-carousel .slide');
const slideInterval = 7000;

function showNextSlide() {
  if (!slides.length) return;
  slides.forEach(s => s.classList.remove('active'));
  slides[currentSlide].classList.add('active');
  currentSlide = (currentSlide + 1) % slides.length;
}

setInterval(showNextSlide, slideInterval);

window.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('loaded');
  // restore persisted install dismissal if present
  try { if (localStorage && localStorage.getItem && localStorage.getItem('pwaInstallDismissed') === '1') installDismissed = true; } catch (e) {}
  initNavigation();
  // register service worker for PWA
  registerServiceWorker();
});

// Service worker registration and PWA install prompt handling
let deferredInstallPrompt = null;
let installDismissed = false;
function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('/sw.js')
    .then(reg => console.log('Service worker registered', reg))
    .catch(err => console.warn('SW registration failed', err));

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e; // save for later
    if (!installDismissed) showInstallBanner();
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    installDismissed = true;
    try { localStorage.setItem('pwaInstallDismissed','1'); } catch (e) {}
    hideInstallBanner();
    console.log('PWA installed');
  });
}

function showInstallBanner() {
  const el = document.getElementById('pwa-install');
  if (!el) return;
  if (installDismissed || !deferredInstallPrompt) return;
  el.hidden = false;
  try { adjustNavForHeader(); } catch (e) {}
}
function hideInstallBanner() {
  const el = document.getElementById('pwa-install');
  if (!el) return;
  el.hidden = true;
  try { adjustNavForHeader(); } catch (e) {}
}

// install button handler
document.addEventListener('click', (e) => {
  const installBtn = e.target.closest && e.target.closest('#installBtn');
  const dismissBtn = e.target.closest && e.target.closest('#dismissInstall');
  if (installBtn && deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    deferredInstallPrompt.userChoice.then(choice => {
      if (choice.outcome === 'accepted') hideInstallBanner();
      deferredInstallPrompt = null;
    }).catch(() => {});
  }
  if (dismissBtn) {
    installDismissed = true;
    try { localStorage.setItem('pwaInstallDismissed','1'); } catch (e) {}
    hideInstallBanner();
  }
});

/* Navigation & Dropdowns: mobile-first, accessible */
function initNavigation() {
  const nav = document.getElementById('navMenu') || document.querySelector('.nav-links');
  let menuToggle = document.querySelector('.menu-toggle');
  if (!menuToggle) menuToggle = createMenuToggle();
  const backdrop = createBackdrop();

  // ensure toggle lives in header
  const header = document.querySelector('.site-header') || document.body;
  if (header && !header.querySelector('.menu-toggle')) header.insertBefore(menuToggle, nav || header.firstChild);
  else if (header && header.querySelector('.menu-toggle') && menuToggle !== header.querySelector('.menu-toggle')) menuToggle = header.querySelector('.menu-toggle');

  const dropdowns = Array.from(document.querySelectorAll('.dropdown'));

  function updateNavMode() {
    if (!nav) return;
    if (window.matchMedia('(max-width: 420px)').matches) nav.classList.add('drawer');
    else nav.classList.remove('drawer');
    adjustNavForHeader();
  }
  updateNavMode();
  window.addEventListener('resize', () => { updateNavMode(); adjustNavForHeader(); });

  function adjustNavForHeader() {
    try {
      const theNav = (document.getElementById('navMenu') || document.querySelector('.nav-links'));
      if (!theNav) return;
      const headerEl = document.querySelector('.site-header');
      const headerHeight = headerEl ? Math.ceil(headerEl.getBoundingClientRect().height) : 56;
      if (theNav.classList.contains('drawer') || theNav.classList.contains('show')) {
        theNav.style.top = headerHeight + 'px';
        theNav.style.height = `calc(100vh - ${headerHeight}px)`;
        theNav.style.overflowY = 'auto';
      } else {
        theNav.style.top = '';
        theNav.style.height = '';
        theNav.style.overflowY = '';
      }
    } catch (e) { /* ignore */ }
  }

  // Dropdown behavior
  dropdowns.forEach(drop => {
    const trigger = drop.querySelector('.dropbtn') || drop.querySelector('a');
    const menu = drop.querySelector('.dropdown-content');
    if (!trigger || !menu) return;
    trigger.setAttribute('tabindex', '0');
    trigger.setAttribute('aria-haspopup', 'true');
    trigger.setAttribute('aria-expanded', 'false');

    trigger.addEventListener('click', (e) => {
      const href = trigger.getAttribute('href');
      if (nav && nav.classList.contains('drawer')) {
        e.preventDefault();
        const isOpen = drop.classList.toggle('active');
        trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        if (isOpen) {
          document.querySelectorAll('.dropdown.active').forEach(d => { if (d !== drop) { d.classList.remove('active'); const t = d.querySelector('.dropbtn') || d.querySelector('a'); if (t) t.setAttribute('aria-expanded','false'); } });
        }
        return;
      }
      // desktop/hover behavior: allow navigation when already open and has href
      if (drop.classList.contains('active')) {
        if (href && href !== '#') return;
      }
      e.preventDefault();
      closeAllDropdowns();
      const expanded = drop.classList.toggle('active');
      trigger.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    });

    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); trigger.click(); }
      else if (e.key === 'Escape') { drop.classList.remove('active'); trigger.setAttribute('aria-expanded','false'); trigger.focus(); }
    });

    let closeTimer = null;
    drop.addEventListener('pointerenter', () => { clearTimeout(closeTimer); drop.classList.add('active'); trigger.setAttribute('aria-expanded','true'); });
    drop.addEventListener('pointerleave', () => { clearTimeout(closeTimer); closeTimer = setTimeout(()=>{ drop.classList.remove('active'); trigger.setAttribute('aria-expanded','false'); }, 220); });

    menu.addEventListener('click', (ev) => {
      const a = ev.target.closest('a');
      if (a) closeMenu();
    });
  });

  // Outside click closes dropdowns
  document.addEventListener('click', (e) => { if (e.target.closest('.dropdown')) return; closeAllDropdowns(); });

  // Global keyboard
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeMenu(); closeAllDropdowns(); const openToggle = document.querySelector('.menu-toggle.open'); if (openToggle) openToggle.focus(); } });

  // Menu toggle: central toggle function + direct + delegated + defensive handlers
  if (menuToggle) {
    const toggleMenuAction = (ev) => {
      try { ev && ev.stopPropagation && ev.stopPropagation(); } catch (e) {}
      const theNav = (document.getElementById('navMenu') || document.querySelector('.nav-links'));
      if (!theNav) return;
      const shown = theNav.classList.toggle('show');
      try { menuToggle.classList.toggle('open', shown); } catch (e) {}
      try { menuToggle.setAttribute('aria-expanded', shown ? 'true' : 'false'); } catch (e) {}
      try { menuToggle.setAttribute('aria-label', shown ? 'Close menu' : 'Open menu'); } catch (e) {}
      try { backdrop.classList.toggle('show', shown && !theNav.classList.contains('drawer')); } catch (e) {}
      document.body.classList.toggle('nav-open', shown);
      try { menuToggle.style.pointerEvents = 'auto'; } catch (e) {}
      if (shown) {
        try { theNav.style.zIndex = '2147483000'; } catch (e) {}
        try { menuToggle.style.zIndex = '2147483001'; } catch (e) {}
        // ensure the nav starts below whatever header height (includes install banner) and is scrollable
        try { adjustNavForHeader(); } catch (e) {}
        // hide install prompt while nav is open to avoid overlap
        try { hideInstallBanner(); } catch (e) {}
        setTimeout(()=>{ const f = theNav.querySelector('a, button, [tabindex]:not([tabindex="-1"])'); if (f) f.focus(); }, 60);
      } else {
        try { theNav.style.zIndex = ''; } catch (e) {}
        try { menuToggle.style.zIndex = ''; } catch (e) {}
        // restore nav dimensions and banner when closed
        try { adjustNavForHeader(); } catch (e) {}
        try { if (deferredInstallPrompt && !installDismissed) showInstallBanner(); } catch (e) {}
      }
      toggleInertBackdrop(shown);
      if (shown) trapFocus(theNav); else releaseFocusTrap();
    };

    // direct listener on the toggle
    menuToggle.addEventListener('click', toggleMenuAction, {capture:true});

    // delegated document listener as fallback
    document.addEventListener('click', (e) => {
      const mt = e.target.closest && e.target.closest('.menu-toggle');
      if (mt) toggleMenuAction(e);
    }, true);

    // defensive: capture pointerdown as a last resort
    const defensiveToggle = (ev) => {
      try {
        const rect = menuToggle.getBoundingClientRect();
        const x = ev.touches ? ev.touches[0].clientX : ev.clientX;
        const y = ev.touches ? ev.touches[0].clientY : ev.clientY;
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
          toggleMenuAction(ev);
          try { ev.preventDefault(); ev.stopPropagation(); } catch (e) {}
        }
      } catch (e) { /* ignore */ }
    };
    document.addEventListener('pointerdown', defensiveToggle, {passive:false, capture:true});
    document.addEventListener('touchstart', defensiveToggle, {passive:false, capture:true});
  }

  backdrop.addEventListener('click', () => closeMenu());

  function closeMenu() {
    if (nav) nav.classList.remove('show');
    if (menuToggle) { menuToggle.classList.remove('open'); menuToggle.setAttribute('aria-expanded','false'); menuToggle.setAttribute('aria-label','Open menu'); }
    backdrop.classList.remove('show');
    document.body.classList.remove('nav-open');
    try { if (nav) nav.style.zIndex = ''; } catch (e) {}
    try { if (menuToggle) menuToggle.style.zIndex = ''; } catch (e) {}
    toggleInertBackdrop(false);
    releaseFocusTrap();
    try { adjustNavForHeader(); } catch (e) {}
    try { if (deferredInstallPrompt && !installDismissed) showInstallBanner(); } catch (e) {}
  }

  if (nav) nav.addEventListener('click', (e) => { const link = e.target.closest('a'); if (!link) return; if (link.classList.contains('dropbtn')) return; closeMenu(); });

  function closeAllDropdowns() { document.querySelectorAll('.dropdown.active').forEach(d => { d.classList.remove('active'); const t = d.querySelector('.dropbtn') || d.querySelector('a'); if (t) t.setAttribute('aria-expanded','false'); }); }

  function toggleInertBackdrop(open) { const main = document.querySelector('main'); const footer = document.querySelector('footer'); if (main) main.setAttribute('aria-hidden', open ? 'true' : 'false'); if (footer) footer.setAttribute('aria-hidden', open ? 'true' : 'false'); }

  // Focus trap
  let focusTrap = null;
  function trapFocus(container) {
    releaseFocusTrap();
    const focusable = Array.from(container.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])')).filter(el => !el.hasAttribute('disabled'));
    if (!focusable.length) return;
    focusTrap = (e) => {
      if (e.key !== 'Tab') return;
      const first = focusable[0]; const last = focusable[focusable.length-1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', focusTrap);
    setTimeout(()=>{ if (focusable[0]) focusable[0].focus(); }, 50);
  }
  function releaseFocusTrap() { if (focusTrap) document.removeEventListener('keydown', focusTrap); focusTrap = null; }

  // create helpers
  function createMenuToggle() { const btn = document.createElement('button'); btn.className = 'menu-toggle'; btn.type = 'button'; btn.setAttribute('aria-label','Open main menu'); btn.setAttribute('aria-expanded','false'); btn.innerHTML = '<span class="hamburger" aria-hidden="true"></span>'; return btn; }
  function createBackdrop() { let b = document.querySelector('.nav-backdrop'); if (!b) { b = document.createElement('div'); b.className = 'nav-backdrop'; document.body.appendChild(b); } return b; }
}

// Debug helpers removed for production
