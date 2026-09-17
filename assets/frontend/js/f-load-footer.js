/* ============================================
   F-LOAD-FOOTER.JS - Auto-load footer
   ============================================ */

(function() {
  'use strict';
  
  async function loadFooter() {
    let container = document.getElementById('footer-container');
    if (!container) return;
    
    try {
      let response = await fetch('/assets/frontend/components/footer.html');
      if (!response.ok) throw new Error('Footer not found');
      let html = await response.text();
      container.innerHTML = html;
      
      // Update copyright year
      updateCopyrightYear();
      
      console.log('✅ Footer loaded');
    } catch (err) {
      console.error('❌ Footer load error:', err);
    }
  }
  
  function updateCopyrightYear() {
    let el = document.getElementById('footerCopy');
    if (el) {
      let year = new Date().getFullYear();
      el.textContent = el.textContent.replace(/\d{4}/, year);
    }
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadFooter);
  } else {
    loadFooter();
  }
})();
