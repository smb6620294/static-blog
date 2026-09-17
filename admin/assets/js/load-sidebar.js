/* ============================================
   LOAD SIDEBAR + HIGHLIGHT ACTIVE ITEM
   ============================================ */

(function() {
  'use strict';

  // ---- 1. Load sidebar.html into #sidebar-container ----
  async function loadSidebar() {
    let container = document.getElementById('sidebar-container');
    if (!container) return;

    try {
           let response = await fetch('/admin/assets/components/sidebar.html');
      if (!response.ok) throw new Error('Sidebar not found');
      let html = await response.text();
      container.innerHTML = html;

      // After loading, highlight the active item
      highlightActiveItem();
      autoOpenActiveGroup();
      initMobileToggle();
      initCollapseToggle();

    } catch (err) {
      console.error('Sidebar load error:', err);
      container.innerHTML = '<div style="padding:20px;color:#f00;">⚠️ Sidebar failed to load</div>';
    }
  }

  // ---- 2. Toggle submenu ----
  window.toggleMenu = function(el) {
    let group = el.closest('.menu-group');
    if (!group) return;
    
    // Close other groups (accordion behavior - only one open at a time)
    let allGroups = document.querySelectorAll('.menu-group.open');
    allGroups.forEach(g => {
      if (g !== group) g.classList.remove('open');
    });
    
    // Toggle current
    group.classList.toggle('open');
  };

  // ---- 3. Highlight active menu item based on current page ----
  function highlightActiveItem() {
    let path = window.location.pathname;
    let filename = path.substring(path.lastIndexOf('/') + 1);
    
    // Remove .html extension
    let page = filename.replace('.html', '');
    if (page === '' || page === '/') page = 'index';

    // Find matching submenu item
    let activeItem = document.querySelector(`.submenu-item[data-page="${page}"]`);
    
    if (activeItem) {
      activeItem.classList.add('active');
    } else {
      // Check top-level items
      let activeTop = document.querySelector(`.menu-item[data-page="${page}"]`);
      if (activeTop) activeTop.classList.add('active');
    }
  }

  // ---- 4. Auto-open the group containing active item ----
  function autoOpenActiveGroup() {
    let activeItem = document.querySelector('.submenu-item.active');
    if (activeItem) {
      let group = activeItem.closest('.menu-group');
      if (group) group.classList.add('open');
    }
  }

  // ---- 5. Mobile hamburger toggle ----
  function initMobileToggle() {
    // Create hamburger button
    let btn = document.createElement('button');
    btn.className = 'mobile-toggle';
    btn.innerHTML = '☰';
    btn.onclick = toggleMobileSidebar;
    document.body.appendChild(btn);

    // Create overlay
    let overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    overlay.onclick = toggleMobileSidebar;
    document.body.appendChild(overlay);
  }

  function toggleMobileSidebar() {
    let sidebar = document.getElementById('sidebar-container');
    let overlay = document.querySelector('.sidebar-overlay');
    if (!sidebar) return;
    
    sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('show');
  }

  // ---- 6. Desktop collapse toggle (optional) ----
  function initCollapseToggle() {
    // Double-click on brand to collapse/expand
    let brand = document.querySelector('.brand-link');
    if (brand) {
      brand.addEventListener('dblclick', function(e) {
        e.preventDefault();
        let wrapper = document.getElementById('admin-wrapper');
        if (wrapper) wrapper.classList.toggle('collapsed');
      });
    }
  }

  // ---- Initialize ----
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadSidebar);
  } else {
    loadSidebar();
  }

})();
