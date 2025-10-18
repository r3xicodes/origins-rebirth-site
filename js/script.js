/* Background slide logic (kept simple) */
// Quick load/debug indicator so we know the file executed on the device
try {
  console && console.log && console.log('js/script.js loaded');
} catch (e) {}

// small global error handler to surface JS errors on-screen when testing mobile
window.addEventListener('error', function (ev) {
  try {
    console && console.error && console.error('JS error captured:', ev.message, ev.error);
    const msg = ev.message + (ev.error && ev.error.stack ? '\n' + ev.error.stack.split('\n')[0] : '');
    const existing = document.getElementById('js-debug-panel');
    if (existing) existing.textContent = 'JS ERROR: ' + msg;
    else {
      window.addEventListener('DOMContentLoaded', function () {
        const p = document.createElement('div');
        p.id = 'js-debug-panel';
        p.textContent = 'JS ERROR: ' + msg;
        document.body.appendChild(p);
      });
    }
  } catch (e) {}
});

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
  try {
    let p = document.getElementById('js-debug-panel');
    if (!p) {
      p = document.createElement('div');
      p.id = 'js-debug-panel';
      document.body.appendChild(p);
    }
    p.textContent = 'js/script.js: script ok';
  } catch (e) { /* ignore */ }
  initNavigation();
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
  }
  updateNavMode();
  window.addEventListener('resize', updateNavMode);

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
      try { console && console.log && console.log('toggleMenuAction fired'); } catch (e) {}
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
        setTimeout(()=>{ const f = theNav.querySelector('a, button, [tabindex]:not([tabindex="-1"])'); if (f) f.focus(); }, 60);
      } else {
        try { theNav.style.zIndex = ''; } catch (e) {}
        try { menuToggle.style.zIndex = ''; } catch (e) {}
      }
      toggleInertBackdrop(shown);
      if (shown) trapFocus(theNav); else releaseFocusTrap();
    };

    // direct listener on the toggle (capture to increase chance of firing)
    menuToggle.addEventListener('click', toggleMenuAction, {capture:true});

    // delegated document listener for edge cases where direct click is swallowed
    document.addEventListener('click', (e) => {
      const mt = e.target.closest && e.target.closest('.menu-toggle');
      if (mt) toggleMenuAction(e);
    }, true);

    // defensive: if pointer events are swallowed by overlays, listen at document level too
    const defensiveToggle = (ev) => {
      try { console && console.log && console.log('defensiveToggle fired'); } catch (e) {}
      try {
        const rect = menuToggle.getBoundingClientRect();
        const x = ev.touches ? ev.touches[0].clientX : ev.clientX;
        const y = ev.touches ? ev.touches[0].clientY : ev.clientY;
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
          // brief visual pulse to show we caught the touch (temporary debug)
          try { menuToggle.classList.add('debug-pulse'); setTimeout(()=>menuToggle.classList.remove('debug-pulse'), 220); } catch (e) {}
          toggleMenuAction(ev);
          ev.preventDefault();
          ev.stopPropagation();
        }
      } catch (e) { /* ignore */ }
    };
    document.addEventListener('pointerdown', defensiveToggle, {passive:false, capture:true});
    document.addEventListener('touchstart', defensiveToggle, {passive:false, capture:true});

    // add a small persistent debug toggle in the viewport so you can test reliably
    try {
      const dbg = document.createElement('button');
      dbg.className = 'debug-toggle';
      dbg.type = 'button';
      dbg.innerText = 'Menu (dbg)';
      dbg.setAttribute('aria-hidden','false');
      dbg.style.position = 'fixed';
      dbg.style.right = '12px';
      dbg.style.bottom = '12px';
      dbg.style.zIndex = '2147484000';
      dbg.style.padding = '8px 10px';
      dbg.style.background = 'rgba(0,0,0,0.7)';
      dbg.style.color = '#fff';
      dbg.style.border = '1px solid rgba(255,255,255,0.06)';
      dbg.style.borderRadius = '8px';
      dbg.style.fontSize = '13px';
      dbg.style.boxShadow = '0 6px 18px rgba(0,0,0,0.6)';
      dbg.addEventListener('click', (e) => { e.stopPropagation(); toggleMenuAction(e); });
      document.body.appendChild(dbg);
    } catch (e) { /* ignore */ }
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

// ---------------------------
// Debug helpers: overlay detector & tap visualizer
// ---------------------------
(function () {
  try {
    // small helper to create highlight overlays for elements that overlap the header
    function detectOverlays() {
      const header = document.querySelector('.site-header');
      if (!header) { console.warn('detectOverlays: .site-header not found'); return; }
      const hdr = header.getBoundingClientRect();
      const excludes = ['.nav-links', '.nav-backdrop', '.menu-toggle', '#js-debug-panel', '.debug-toggle', '.overlay-highlight', '.tap-indicator'];
      const els = Array.from(document.body.querySelectorAll('*')).filter(el => {
        try {
          if (!el.getBoundingClientRect) return false;
          if (excludes.some(sel => el.matches && el.matches(sel))) return false;
          if (el === header) return false;
          if (!el.offsetParent && getComputedStyle(el).position !== 'fixed') return false; // hidden
          return true;
        } catch (e) { return false; }
      });
      const overlaps = [];
      els.forEach(el => {
        try {
          const r = el.getBoundingClientRect();
          const intersects = !(r.right < hdr.left || r.left > hdr.right || r.bottom < hdr.top || r.top > hdr.bottom);
          if (intersects) overlaps.push({el, r});
        } catch (e) {}
      });
      // remove existing highlights
      document.querySelectorAll('.overlay-highlight').forEach(n => n.remove());
      if (!overlaps.length) { console.log('detectOverlays: no overlapping elements found'); alert('No overlapping elements found over header'); return; }
      console.log('detectOverlays: found', overlaps.length, 'overlapping elements');
      overlaps.forEach((o, i) => {
        const hi = document.createElement('div');
        hi.className = 'overlay-highlight';
        hi.dataset.idx = i;
        hi.style.left = (o.r.left < 0 ? 0 : o.r.left) + 'px';
        hi.style.top = (o.r.top < 0 ? 0 : o.r.top) + 'px';
        hi.style.width = Math.max(2, o.r.width) + 'px';
        hi.style.height = Math.max(2, o.r.height) + 'px';
        const label = document.createElement('div');
        label.className = 'overlay-label';
        label.textContent = (o.el.tagName.toLowerCase()) + (o.el.id ? '#' + o.el.id : '') + (o.el.className ? ' .' + o.el.className.split(' ').slice(0,2).join('.') : '');
        hi.appendChild(label);
        document.body.appendChild(hi);
      });
      // auto-remove after 6s
      setTimeout(()=>{ document.querySelectorAll('.overlay-highlight').forEach(n => n.remove()); }, 6000);
    }

    // tap visualizer: briefly show an indicator at the touch point (useful to see if touches are reaching the page)
    let tapVisTimeout = null;
    function enableTapVisualizer(durationMs = 6000) {
      function showTap(x, y) {
        const t = document.createElement('div');
        t.className = 'tap-indicator';
        t.style.left = (x - 18) + 'px';
        t.style.top = (y - 18) + 'px';
        document.body.appendChild(t);
        setTimeout(()=>{ t.classList.add('fade'); setTimeout(()=>t.remove(), 220); }, 120);
      }
      function touchHandler(ev) {
        try {
          const x = ev.touches ? ev.touches[0].clientX : ev.clientX;
          const y = ev.touches ? ev.touches[0].clientY : ev.clientY;
          showTap(x, y);
        } catch (e) {}
      }
      document.addEventListener('touchstart', touchHandler, {passive:true});
      document.addEventListener('click', touchHandler, {capture:true});
      if (tapVisTimeout) clearTimeout(tapVisTimeout);
      tapVisTimeout = setTimeout(()=>{
        document.removeEventListener('touchstart', touchHandler, {passive:true});
        document.removeEventListener('click', touchHandler, {capture:true});
      }, durationMs);
    }

    // create a small detect button near the debug UI so you can run these tools on the phone
    function createDetectButton() {
      try {
        if (document.querySelector('.detect-overlays')) return;
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'detect-overlays';
        b.textContent = 'Detect overlays';
        b.style.position = 'fixed';
        b.style.right = '12px';
        b.style.bottom = '56px';
        b.style.zIndex = '2147483647';
        b.style.padding = '8px 10px';
        b.style.background = 'rgba(255,80,80,0.9)';
        b.style.color = '#fff';
        b.style.border = 'none';
        b.style.borderRadius = '8px';
        b.style.fontSize = '13px';
        b.style.boxShadow = '0 6px 18px rgba(0,0,0,0.45)';
        b.addEventListener('click', (e) => { e.stopPropagation(); detectOverlays(); enableTapVisualizer(8000); });
        document.body.appendChild(b);
      } catch (e) { console.warn('createDetectButton failed', e); }
    }

    // create on DOM ready so the user can run it
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', createDetectButton);
    else createDetectButton();
  } catch (e) { console.warn('overlay debug init failed', e); }
})();
