/* ============================================
   F-LOAD-HEADER.JS - Auto-load header
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
      
      // Setup language switcher
      setupLangSwitcher();
      
      // Setup mobile menu
      setupMobileMenu();
      
      console.log('✅ Header loaded');
    } catch (err) {
      console.error('❌ Header load error:', err);
    }
  }
  
  function setupLangSwitcher() {
    document.querySelectorAll('#langSwitcher a').forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        let lang = this.dataset.lang;
        
        // Update active state
        document.querySelectorAll('#langSwitcher a').forEach(l => l.classList.remove('active'));
        this.classList.add('active');
        
        // Save preference
        localStorage.setItem('site_language', lang);
        
        // Trigger language change event
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: lang } }));
        
        console.log('🌐 Language:', lang);
      });
    });
  }
  
  function setupMobileMenu() {
    let btn = document.getElementById('mobileMenuBtn');
    let nav = document.getElementById('siteNav');
    if (btn && nav) {
      btn.addEventListener('click', function() {
        nav.classList.toggle('open');
      });
    }
  }
  
  // Global function for inline onclick
  window.toggleMobileMenu = function() {
    let nav = document.getElementById('siteNav');
    if (nav) nav.classList.toggle('open');
  };
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadHeader);
  } else {
    loadHeader();
  }
})();
