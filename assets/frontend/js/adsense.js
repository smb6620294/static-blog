/* ============================================
   ADSENSE.JS - Frontend Ad Code Injector
   
   Reads pages.json + units.json
   Injects Header Code (into <head>) + Body Code (into placeholders)
   Executes <script> tags (security bypass)
   
   Page Types:
   ├── List Pages (index, category, tag, search)
   │   └── Units: ad-slot-1, ad-slot-2, ad-slot-3
   │
   └── Single Pages (single-post, single-page)
       ├── ad-slot-post-1 → After Title
       ├── ad-slot-post-2 → After 2nd Paragraph
       └── ad-slot-post-3 → Before Comments (or Last H2)
   
   Sidebar (all pages):
   ├── sidebar-top
   └── sidebar-bottom
   ============================================ */

(function() {
  'use strict';

  // ==================== STATE ====================
  let adsenseUnits = [];
  let adsensePages = {};
  let pageConfig = null;
  let currentPageFile = '';

  // ==================== DETECT CURRENT PAGE ====================
  function detectCurrentPage() {
    let path = window.location.pathname;
    let fileName = path.substring(path.lastIndexOf('/') + 1) || 'index.html';
    
    if (fileName === '' || path.endsWith('/')) fileName = 'index.html';
    if (fileName.includes('?')) fileName = fileName.split('?')[0];
    
    return fileName;
  }

  // ==================== LOAD DATA ====================
  async function loadAdSenseData() {
    try {
      // Load pages.json
      let pagesResp = await fetch(
        `https://raw.githubusercontent.com/${CONFIG.GITHUB_REPO}/${CONFIG.GITHUB_BRANCH}/admin/adsense/config/pages.json`
      );
      if (pagesResp.ok) {
        let pagesData = await pagesResp.json();
        adsensePages = pagesData.pages || {};
      }
      
      // Load units.json
      let unitsResp = await fetch(
        `https://raw.githubusercontent.com/${CONFIG.GITHUB_REPO}/${CONFIG.GITHUB_BRANCH}/admin/adsense/config/units.json`
      );
      if (unitsResp.ok) {
        let unitsData = await unitsResp.json();
        adsenseUnits = Array.isArray(unitsData.units) ? unitsData.units : [];
      }
      
      console.log('✅ AdSense data loaded:', {
        pages: Object.keys(adsensePages).length,
        units: adsenseUnits.length,
        currentPage: currentPageFile
      });
      
    } catch (err) {
      console.warn('⚠️ AdSense data load error:', err);
      adsenseUnits = [];
      adsensePages = {};
    }
  }

  // ==================== FIND PAGE CONFIG ====================
  function findPageConfig() {
    if (adsensePages[currentPageFile]) {
      return adsensePages[currentPageFile];
    }
    
    let withoutExt = currentPageFile.replace('.html', '');
    if (adsensePages[withoutExt]) {
      return adsensePages[withoutExt];
    }
    
    if (adsensePages[withoutExt + '.html']) {
      return adsensePages[withoutExt + '.html'];
    }
    
    return null;
  }

  // ==================== GET UNITS FOR PAGE ====================
  function getUnitsForPage() {
    if (!pageConfig) return [];
    if (pageConfig.enabled !== true) return [];
    if (!Array.isArray(pageConfig.units)) return [];
    
    return pageConfig.units
      .map(slug => adsenseUnits.find(u => u.slug === slug))
      .filter(u => u && u.enabled !== false);
  }

  // ==================== EXECUTE SCRIPTS ====================
  function executeScripts(container) {
    let scripts = container.querySelectorAll('script');
    
    scripts.forEach(oldScript => {
      let newScript = document.createElement('script');
      
      [...oldScript.attributes].forEach(attr => {
        newScript.setAttribute(attr.name, attr.value);
      });
      
      newScript.textContent = oldScript.textContent;
      oldScript.parentNode.replaceChild(newScript, oldScript);
    });
  }

  // ==================== INJECT HEADER CODE ====================
  function injectHeaderCode(units) {
    if (!units || units.length === 0) return;
    
    let head = document.head;
    let injected = 0;
    
    units.forEach(unit => {
      let headerCode = (unit.header_code || '').trim();
      if (!headerCode) return;
      
      let temp = document.createElement('div');
      temp.innerHTML = headerCode;
      
      while (temp.firstChild) {
        let node = temp.firstChild;
        head.appendChild(node);
        temp.removeChild(node);
      }
      
      injected++;
      console.log('✅ Header Code injected:', unit.slug);
    });
    
    if (injected > 0) {
      console.log('✅ Total Header Codes: ' + injected);
    }
  }

  // ==================== FIND PLACEHOLDER ====================
  function findPlaceholder(slotSlug) {
    let el = document.querySelector(`[data-slot="${slotSlug}"]`);
    if (el) return el;
    
    el = document.querySelector(`.adsense-placeholder[data-slot="${slotSlug}"]
