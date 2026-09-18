/* ============================================
   F-LOAD-HEADER.JS - Auto-load header
   Mobile hamburger → toggles SIDEBAR drawer
   ============================================ */

(function() {
  'use strict';
  
  async function loadHeader() {
    let container = document.getElementById('header-container');
    if (!container) return;
    
    try {
      let response = await fetch('/assets/frontend/components/header.html');
      if (!response.ok) throw new Error('Header not found');
      let html = await response.text();
      container.innerHTML = html;
      
      setupLangSwitcher();
      setupMobileMenu();
      
      console.log('✅ Header loaded');
    } catch (err) {
      console.error('❌ Header load error:', err);
    }
  }
  
  // ============ LANGUAGE SWITCHER ============
  function setupLangSwitcher() {
    document.querySelectorAll('#langSwitcher a').forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        let lang = this.dataset.lang;
        document.querySelectorAll('#langSwitcher a').forEach(l => l.classList.remove('active'));
        this.classList.add('active');
        localStorage.setItem('site_language', lang);
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: lang } }));
        console.log('🌐 Language:', lang);
      });
    });
  }
  
  // ============ MOBILE MENU → SIDEBAR DRAWER ============
  function setupMobileMenu() {
    let btn = document.getElementById('mobileMenuBtn');
    if (!btn) return;
    
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      toggleSidebarDrawer();
    });
  }
  
  // Toggle sidebar drawer (mobile only)
  window.toggleSidebarDrawer = function() {
    let sidebar = document.querySelector('.site-sidebar');
    let overlay = document.querySelector('.sidebar-overlay');
    if (!sidebar) return;
    
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'sidebar-overlay';
      overlay.onclick = closeSidebarDrawer;
      document.body.appendChild(overlay);
    }
    
    let isOpen = sidebar.classList.toggle('open');
    overlay.classList.toggle('show', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  };
  
  window.closeSidebarDrawer = function() {
    let sidebar = document.querySelector('.site-sidebar');
    let overlay = document.querySelector('.sidebar-overlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('show');
    document.body.style.overflow = '';
  };
  
  // Close on resize (desktop)
  window.addEventListener('resize', function() {
    if (window.innerWidth > 900) {
      closeSidebarDrawer();
    }
  });
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadHeader);
  } else {
    loadHeader();
  }
})();
