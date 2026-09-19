
/* ============================================
   F-LOAD-HEADER.JS
   Path: /assets/frontend/js/f-load-header.js
   
   PURPOSE:
     Load header component, setup:
       - Language switcher
       - Mobile hamburger menu → toggles sidebar drawer
       - Overlay click → closes sidebar
       - Window resize → closes sidebar on desktop
   ============================================ */

(function () {
  'use strict';

  /* --------------------------------------------
     LOAD HEADER HTML
     -------------------------------------------- */
  async function loadHeader() {
    const container = document.getElementById('header-container');
    if (!container) return;

    try {
      const response = await fetch('/assets/frontend/components/header.html');
      if (!response.ok) throw new Error('Header not found');
      const html = await response.text();
      container.innerHTML = html;

      setupLangSwitcher();
      setupMobileMenu();

      console.log('✅ Header loaded');
    } catch (err) {
      console.error('❌ Header load error:', err);
    }
  }

  /* --------------------------------------------
     LANGUAGE SWITCHER
     -------------------------------------------- */
  function setupLangSwitcher() {
    const langLinks = document.querySelectorAll('#langSwitcher a');

    langLinks.forEach(link => {
      link.addEventListener('click', function (e) {
        e.preventDefault();

        const lang = this.dataset.lang;

        langLinks.forEach(l => l.classList.remove('active'));
        this.classList.add('active');

        localStorage.setItem('site_language', lang);

        window.dispatchEvent(new CustomEvent('languageChanged', {
          detail: { lang: lang }
        }));

        console.log('🌐 Language:', lang);
      });
    });

    // Restore active language from localStorage
    const savedLang = localStorage.getItem('site_language');
    if (savedLang) {
      langLinks.forEach(l => {
        l.classList.toggle('active', l.dataset.lang === savedLang);
      });
    }
  }

  /* --------------------------------------------
     MOBILE MENU — Hamburger Button
     Clicking hamburger toggles sidebar drawer
     -------------------------------------------- */
  function setupMobileMenu() {
    const btn = document.getElementById('mobileMenuBtn');
    if (!btn) {
      console.warn('⚠️ mobileMenuBtn not found in header');
      return;
    }

    // Remove any existing listeners by cloning
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('☰ Mobile menu clicked');
      toggleSidebarDrawer();
    });
  }

  /* --------------------------------------------
     TOGGLE SIDEBAR DRAWER
     -------------------------------------------- */
  window.toggleSidebarDrawer = function () {
    const sidebar = document.querySelector('.site-sidebar');
    if (!sidebar) {
      console.warn('⚠️ .site-sidebar not found');
      return;
    }

    // Create overlay if missing
    let overlay = document.querySelector('.sidebar-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'sidebar-overlay';
      overlay.onclick = closeSidebarDrawer;
      document.body.appendChild(overlay);
    }

    const isOpen = sidebar.classList.toggle('open');
    overlay.classList.toggle('show', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';

    console.log('📂 Sidebar drawer:', isOpen ? 'OPEN' : 'CLOSED');
  };

  /* --------------------------------------------
     CLOSE SIDEBAR DRAWER
     -------------------------------------------- */
  window.closeSidebarDrawer = function () {
    const sidebar = document.querySelector('.site-sidebar');
    const overlay = document.querySelector('.sidebar-overlay');

    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('show');
    document.body.style.overflow = '';
  };

  /* --------------------------------------------
     RESIZE — Auto close on desktop
     -------------------------------------------- */
  window.addEventListener('resize', function () {
    if (window.innerWidth > 900) {
      closeSidebarDrawer();
    }
  });

  /* --------------------------------------------
     AUTO-INIT
     -------------------------------------------- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadHeader);
  } else {
    loadHeader();
  }

})();

console.log('✅ f-load-header.js loaded — mobile drawer ready');
