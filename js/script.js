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
  initNavigation();
});

/* Navigation & Dropdowns: mobile-first, accessible */
function initNavigation() {
  const nav = document.getElementById('navMenu') || document.querySelector('.nav-links');
  // Prefer existing button in markup to avoid duplicates
  let menuToggle = document.querySelector('.menu-toggle');
  if (!menuToggle) menuToggle = createMenuToggle();
  const backdrop = createBackdrop();

  // place toggle near nav (if not present in markup)
  const header = document.querySelector('.site-header') || document.body;
  if (header && !header.querySelector('.menu-toggle')) {
    header.insertBefore(menuToggle, nav || header.firstChild);
  } else if (header && header.querySelector('.menu-toggle') && menuToggle !== header.querySelector('.menu-toggle')) {
    // ensure menuToggle references the actual DOM element
    menuToggle = header.querySelector('.menu-toggle');
  }

  const dropdowns = Array.from(document.querySelectorAll('.dropdown'));

  // Mark nav as drawer on small screens so behavior (backdrop vs full-drawer) adapts
  function updateNavMode() {
    if (!nav) return;
    if (window.matchMedia('(max-width: 420px)').matches) {
      nav.classList.add('drawer');
    } else {
      nav.classList.remove('drawer');
    }
  }
  updateNavMode();
  window.addEventListener('resize', updateNavMode);

  // Make dropdowns keyboard and touch friendly
  dropdowns.forEach(drop => {
    const trigger = drop.querySelector('.dropbtn') || drop.querySelector('a');
    const menu = drop.querySelector('.dropdown-content');
    if (!trigger || !menu) return;

    // Ensure trigger is focusable
    trigger.setAttribute('tabindex', '0');
    trigger.setAttribute('aria-haspopup', 'true');
    trigger.setAttribute('aria-expanded', 'false');

    // Click behavior: first click opens, second click navigates if href
    trigger.addEventListener('click', (e) => {
      const href = trigger.getAttribute('href');
      if (drop.classList.contains('active')) {
        // already open - if it's a normal link navigate
        if (href && href !== '#') {
          return; // allow navigation
        }
      }
      e.preventDefault();
      closeAllDropdowns();
      drop.classList.toggle('active');
      const expanded = drop.classList.contains('active');
      trigger.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    });

    // keyboard: Enter/Space toggles
    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        trigger.click();
      } else if (e.key === 'Escape') {
        drop.classList.remove('active');
        trigger.setAttribute('aria-expanded', 'false');
        trigger.focus();
      }
    });

    // pointerenter/pointerleave with small delay to avoid flicker on touch/devices
    let closeTimer = null;
    drop.addEventListener('pointerenter', () => {
      clearTimeout(closeTimer);
      drop.classList.add('active');
      trigger.setAttribute('aria-expanded', 'true');
    });
    drop.addEventListener('pointerleave', () => {
      clearTimeout(closeTimer);
      closeTimer = setTimeout(() => {
        drop.classList.remove('active');
        trigger.setAttribute('aria-expanded', 'false');
      }, 220);
    });

    // clicking inside menu should not close it unless a link is followed
    menu.addEventListener('click', (ev) => {
      const a = ev.target.closest('a');
      if (a) {
        // close nav (useful on mobile)
        closeMenu();
      }
    });
  });

  // close dropdowns on outside click
  document.addEventListener('click', (e) => {
    if (e.target.closest('.dropdown')) return;
    closeAllDropdowns();
  });

  // keyboard global: Escape closes menus
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeMenu();
      closeAllDropdowns();
      const openToggle = document.querySelector('.menu-toggle[aria-expanded="true"]');
      if (openToggle) openToggle.focus();
    }
  });

  // attach toggle handlers (guarded)
    if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      if (!nav) return;
      const shown = nav.classList.toggle('show');
      menuToggle.setAttribute('aria-expanded', shown ? 'true' : 'false');
      menuToggle.setAttribute('aria-label', shown ? 'Close menu' : 'Open menu');
      // For drawer we don't need backdrop; for slide-in keep it
      backdrop.classList.toggle('show', shown && !nav.classList.contains('drawer'));
      // Prevent background scrolling when nav is open
      document.body.classList.toggle('nav-open', shown);
      toggleInertBackdrop(shown);
      if (shown) trapFocus(nav); else releaseFocusTrap();
    });
  }

  backdrop.addEventListener('click', () => {
    closeMenu();
  });

  function closeMenu() {
    if (nav) nav.classList.remove('show');
    if (menuToggle) {
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Open menu');
    }
    backdrop.classList.remove('show');
    document.body.classList.remove('nav-open');
    toggleInertBackdrop(false);
    releaseFocusTrap();
  }

  // Close the mobile nav when any normal nav link is clicked (useful on small screens)
  if (nav) {
    nav.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (!link) return;
      // if it's a dropdown parent (has .dropbtn) then don't auto-close here
      if (link.classList.contains('dropbtn')) return;
      // allow normal navigation but close the menu first for mobile UX
      closeMenu();
    });
  }

  function closeAllDropdowns() {
    document.querySelectorAll('.dropdown.active').forEach(d => {
      d.classList.remove('active');
      const t = d.querySelector('.dropbtn') || d.querySelector('a');
      if (t) t.setAttribute('aria-expanded', 'false');
    });
  }

  // Small utility for making background inert when nav open
  function toggleInertBackdrop(open) {
    const main = document.querySelector('main');
    const footer = document.querySelector('footer');
    if (main) main.setAttribute('aria-hidden', open ? 'true' : 'false');
    if (footer) footer.setAttribute('aria-hidden', open ? 'true' : 'false');
  }

  // Focus trap for keyboard while mobile nav is open
  let focusTrap = null;
  function trapFocus(container) {
    releaseFocusTrap();
    const focusable = Array.from(container.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])'))
      .filter(el => !el.hasAttribute('disabled'));
    if (!focusable.length) return;
    let idx = 0;
    focusTrap = (e) => {
      if (e.key !== 'Tab') return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    };
    document.addEventListener('keydown', focusTrap);
    // Focus first element
    setTimeout(() => focusable[0].focus(), 50);
  }

  function releaseFocusTrap() {
    if (focusTrap) document.removeEventListener('keydown', focusTrap);
    focusTrap = null;
  }

  // helper to create the menu toggle element
  function createMenuToggle() {
    const btn = document.createElement('button');
    btn.className = 'menu-toggle';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Open main menu');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<span class="hamburger" aria-hidden="true"></span>';
    return btn;
  }

  // helper to create backdrop
  function createBackdrop() {
    let b = document.querySelector('.nav-backdrop');
    if (!b) {
      b = document.createElement('div');
      b.className = 'nav-backdrop';
      document.body.appendChild(b);
    }
    return b;
  }
}
