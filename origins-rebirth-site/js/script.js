let currentSlide = 0;
const slides = document.querySelectorAll('.background-carousel .slide');
const slideInterval = 7000;

function showNextSlide() {
  slides[currentSlide].classList.remove('active');
  currentSlide = (currentSlide + 1) % slides.length;
  slides[currentSlide].classList.add('active');
}

setInterval(showNextSlide, slideInterval);
// script.js

window.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('loaded');
});

/* Navigation: mobile hamburger + dropdowns (click/tap friendly) */
(() => {
  const menuToggle = document.querySelector('.menu-toggle');
  const navMenu = document.getElementById('navMenu');
  const dropdowns = document.querySelectorAll('.dropdown');

  // Toggle mobile nav
  function toggleMenu() {
    if (!navMenu) return;
    navMenu.classList.toggle('show');
    // update aria on any dropdown buttons inside
    const expanded = navMenu.classList.contains('show');
    navMenu.querySelectorAll('.dropbtn').forEach(btn => btn.setAttribute('aria-expanded', expanded));
    // update hamburger aria and body class for scroll lock
    if (menuToggle) {
      menuToggle.setAttribute('aria-expanded', expanded);
    }
    document.body.classList.toggle('nav-open', expanded);
    // backdrop handling and focus-trap
    handleBackdropAndFocus(expanded);
    // set aria-hidden for background content when menu open
    const main = document.getElementById('main-content');
    const footer = document.querySelector('footer');
    if (main) main.setAttribute('aria-hidden', expanded ? 'true' : 'false');
    if (footer) footer.setAttribute('aria-hidden', expanded ? 'true' : 'false');
  }

  // Attach click handler to the hamburger if present
  if (menuToggle) {
    menuToggle.setAttribute('role', 'button');
    menuToggle.setAttribute('tabindex', '0');
    menuToggle.setAttribute('aria-controls', 'navMenu');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.addEventListener('click', toggleMenu);
    // Keyboard support: Enter or Space toggles
    menuToggle.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleMenu();
      }
    });
  }

  /* Backdrop and focus trap utilities */
  const BACKDROP_ID = 'nav-backdrop';

  function createBackdrop() {
    let bd = document.getElementById(BACKDROP_ID);
    if (!bd) {
      bd = document.createElement('div');
      bd.id = BACKDROP_ID;
      bd.className = 'nav-backdrop';
      document.body.appendChild(bd);
    }
    return bd;
  }

  function handleBackdropAndFocus(open) {
    const bd = createBackdrop();
    if (open) {
      bd.classList.add('show');
      // close menu when backdrop clicked
      bd.addEventListener('click', backdropClickHandler);
      // trap focus in nav
      trapFocus(navMenu);
    } else {
      bd.classList.remove('show');
      bd.removeEventListener('click', backdropClickHandler);
      releaseFocusTrap();
    }
  }

  function backdropClickHandler() {
    if (navMenu && navMenu.classList.contains('show')) {
      navMenu.classList.remove('show');
      if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('nav-open');
    }
  }

  // Focus trap: keep keyboard focus inside the nav when open
  let previousFocus = null;
  let focusableElements = [];
  let firstFocusable = null;
  let lastFocusable = null;
  let focusTrapHandler = null;

  function trapFocus(container) {
    if (!container) return;
    previousFocus = document.activeElement;
    focusableElements = Array.from(container.querySelectorAll('a, button, input, [tabindex]:not([tabindex="-1"])')).filter(el => !el.hasAttribute('disabled'));
    if (focusableElements.length === 0) {
      container.setAttribute('tabindex', '-1');
      container.focus();
      return;
    }
    firstFocusable = focusableElements[0];
    lastFocusable = focusableElements[focusableElements.length - 1];
    // focus the first focusable item
    firstFocusable.focus();

    focusTrapHandler = function(e) {
      if (e.key === 'Tab') {
        if (e.shiftKey) { // shift + tab
          if (document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable.focus();
          }
        } else { // tab
          if (document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable.focus();
          }
        }
      } else if (e.key === 'Escape') {
        // close on escape
        if (navMenu && navMenu.classList.contains('show')) {
          navMenu.classList.remove('show');
          if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
          document.body.classList.remove('nav-open');
          releaseFocusTrap();
        }
      }
    };

    document.addEventListener('keydown', focusTrapHandler);
  }

  function releaseFocusTrap() {
    if (focusTrapHandler) {
      document.removeEventListener('keydown', focusTrapHandler);
      focusTrapHandler = null;
    }
    if (previousFocus && previousFocus.focus) previousFocus.focus();
    previousFocus = null;
    focusableElements = [];
    firstFocusable = lastFocusable = null;
  }

  // Make dropdowns open on click/tap and close when clicking outside
  dropdowns.forEach(drop => {
    const btn = drop.querySelector('.dropbtn');
    const content = drop.querySelector('.dropdown-content');
    let closeTimeout = null;

    if (!btn) return;

  // Prefer click so touch devices work. First click opens submenu; second click navigates to the main page.
  btn.addEventListener('click', (e) => {
      const href = btn.getAttribute('href');

      // Allow modifier / middle click to behave normally (open in new tab)
      if (e.ctrlKey || e.metaKey || e.button === 1) return;

      const isActive = drop.classList.contains('active');

      // If the link has an href, use click-to-open then click-to-navigate behavior:
      if (href) {
        if (!isActive) {
          // First click -> open dropdown
          e.preventDefault();
          // close other open dropdowns
          document.querySelectorAll('.dropdown.active').forEach(d => { if (d !== drop) d.classList.remove('active'); });
          drop.classList.add('active');
          btn.setAttribute('aria-expanded', 'true');
        } else {
          // Second click while already open -> navigate to the href
          // close dropdown first for a cleaner UX
          drop.classList.remove('active');
          btn.setAttribute('aria-expanded', 'false');
          // navigate (respects same-origin navigation)
          window.location.href = href;
        }
      } else {
        // No href present: just toggle as before
        e.preventDefault();
        document.querySelectorAll('.dropdown.active').forEach(d => { if (d !== drop) d.classList.remove('active'); });
        if (!isActive) {
          drop.classList.add('active');
          btn.setAttribute('aria-expanded', 'true');
        } else {
          drop.classList.remove('active');
          btn.setAttribute('aria-expanded', 'false');
        }
      }
    });

    // Keyboard support: open/close on Enter/Space
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        btn.click();
      }
    });

    // Keep dropdown open while pointer/focus inside; small delay when leaving to prevent flicker
    function openDrop() {
      clearTimeout(closeTimeout);
      document.querySelectorAll('.dropdown.active').forEach(d => { if (d !== drop) d.classList.remove('active'); });
      drop.classList.add('active');
      if (btn) btn.setAttribute('aria-expanded', 'true');
    }

    function scheduleClose() {
      clearTimeout(closeTimeout);
      closeTimeout = setTimeout(() => {
        drop.classList.remove('active');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      }, 220); // small delay to allow pointer movement
    }

    drop.addEventListener('pointerenter', openDrop);
    drop.addEventListener('pointerleave', scheduleClose);
    // keyboard focus in/out
    drop.addEventListener('focusin', openDrop);
    drop.addEventListener('focusout', (e) => {
      // if focus moved outside the dropdown entirely, schedule close
      if (!drop.contains(e.relatedTarget)) scheduleClose();
    });

    // Stop clicks inside dropdown content from closing the menu (so links can be clicked)
    if (content) {
      content.addEventListener('click', (e) => {
        // allow links inside to work normally; close mobile nav after selection
        const targetLink = e.target.closest('a');
        if (targetLink) {
          // close mobile menu if open (mobile UX)
          if (navMenu && navMenu.classList.contains('show')) {
            navMenu.classList.remove('show');
          }
          // close dropdown
          drop.classList.remove('active');
        }
      });
    }
  });

  // Close menus when clicking outside
  document.addEventListener('click', (e) => {
    // if click inside any .dropdown or .menu-toggle or navMenu, ignore
    if (e.target.closest('.dropdown') || e.target.closest('.menu-toggle') || e.target.closest('#navMenu')) return;
    document.querySelectorAll('.dropdown.active').forEach(d => d.classList.remove('active'));
    if (navMenu && navMenu.classList.contains('show')) navMenu.classList.remove('show');
  });

  // Close on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.dropdown.active').forEach(d => d.classList.remove('active'));
      if (navMenu) navMenu.classList.remove('show');
    }
  });

})();
