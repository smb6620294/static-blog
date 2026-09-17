/* ============================================
   F-LOAD-SIDEBAR.JS - Auto-load frontend sidebar
   Loads sidebar.html and its widgets
   ============================================ */

(function() {
  'use strict';
  
  async function loadSidebar() {
    let container = document.getElementById('sidebar-container');
    if (!container) {
      console.warn('⚠️ sidebar-container not found');
      return;
    }
    
    try {
      let response = await fetch('/assets/frontend/components/sidebar.html');
      if (!response.ok) throw new Error('Sidebar not found: ' + response.status);
      let html = await response.text();
      container.innerHTML = html;
      
      // Load widgets after sidebar is loaded
      if (typeof loadWidgets === 'function') {
        await loadWidgets();
      }
      
      console.log('✅ Frontend Sidebar loaded');
    } catch (err) {
      console.error('❌ Sidebar load error:', err);
      container.innerHTML = '<div style="padding:20px;background:#fff;border-radius:8px;text-align:center;color:#666;">Sidebar unavailable</div>';
    }
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadSidebar);
  } else {
    loadSidebar();
  }
})();
