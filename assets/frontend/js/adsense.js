/* ============================================
   ADSENSE.JS - Frontend Ad Code Injector
   Reads pages.json + units.json
   Injects Header Code + Body Code dynamically
   Executes <script> tags (security bypass)
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
    
    // Remove trailing slash
    if (fileName === '' || path.endsWith('/')) fileName = 'index.html';
    
    // Remove query string
    if (fileName.includes('?')) fileName = fileName.split('?')[0];
    
    return fileName;
  }

  // ==================== LOAD CONFIG ====================
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
    // Exact match first
    if (adsensePages[currentPageFile]) {
      return adsensePages[currentPageFile];
    }
    
    // Try without .html
    let withoutExt = currentPageFile.replace('.html', '');
    if (adsensePages[withoutExt]) {
      return adsensePages[withoutExt];
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

  // ==================== EXECUTE SCRIPT TAGS ====================
  // Browser's innerHTML doesn't execute <script> tags — this fixes that
  function executeScripts(container) {
    let scripts = container.querySelectorAll('script');
    
    scripts.forEach(oldScript => {
      let newScript = document.createElement('script');
      
      // Copy all attributes
      [...oldScript.attributes].forEach(attr => {
        newScript.setAttribute(attr.name, attr.value);
      });
      
      // Copy content
      newScript.textContent = oldScript.textContent;
      
      // Replace (this triggers execution)
      oldScript.parentNode.replaceChild(newScript, oldScript);
    });
  }

  // ==================== INJECT HEADER CODE ====================
  function injectHeaderCode(units) {
    if (!units || units.length === 0) return;
    
    let head = document.head;
    
    units.forEach(unit => {
      let headerCode = (unit.header_code || '').trim();
      if (!headerCode) return;
      
      // Create temp container to parse code
      let temp = document.createElement('div');
      temp.innerHTML = headerCode;
      
      // Move all nodes to head
      while (temp.firstChild) {
        let node = temp.firstChild;
        head.appendChild(node);
        temp.removeChild(node);
      }
      
      console.log('✅ Header Code injected:', unit.slug);
    });
  }

  // ==================== FIND PLACEHOLDER FOR SLOT ====================
  function findPlaceholder(slotSlug) {
    // Look for any element with data-slot attribute
    let el = document.querySelector(`[data-slot="${slotSlug}"]`);
    if (el) return el;
    
    // Try with different selectors
    el = document.querySelector(`.adsense-placeholder[data-slot="${slotSlug}"]`);
    return el;
  }

  // ==================== INJECT BODY CODE ====================
  function injectBodyCode(units) {
    if (!units || units.length === 0) return;
    
    let injected = 0;
    let notFound = 0;
    
    units.forEach(unit => {
      let bodyCode = (unit.body_code || '').trim();
      if (!bodyCode) return;
      
      // Find placeholder in page
      let placeholder = findPlaceholder(unit.slug);
      
      if (!placeholder) {
        console.warn('⚠️ Placeholder not found for:', unit.slug);
        notFound++;
        return;
      }
      
      // Clear existing placeholder content
      placeholder.innerHTML = '';
      placeholder.classList.add('ad-container');
      placeholder.classList.remove('adsense-placeholder');
      
      // Inject body code
      placeholder.innerHTML = bodyCode;
      
      // Execute scripts inside
      executeScripts(placeholder);
      
      injected++;
      console.log('✅ Body Code injected:', unit.slug);
    });
    
    console.log('✅ Total: ' + injected + ' injected, ' + notFound + ' not found');
  }

  // ==================== HIDE EMPTY AD CONTAINERS ====================
  function cleanupEmptyContainers() {
    // Wait a bit for Ad to load
    setTimeout(() => {
      document.querySelectorAll('.ad-container').forEach(container => {
        // Check if it has any real content
        let hasContent = container.textContent.trim().length > 0 || 
                         container.querySelector('iframe, img, ins, div, video') !== null;
        
        if (!hasContent) {
          container.classList.add('ad-empty');
          container.style.display = 'none';
          console.log('🗑️ Empty ad container hidden');
        }
      });
    }, 2000);
  }

  // ==================== MAIN ====================
  async function initAdSense() {
    console.log('🚀 AdSense init started');
    
    // Step 1: Detect current page
    currentPageFile = detectCurrentPage();
    console.log('📄 Current page:', currentPageFile);
    
    // Step 2: Load data from GitHub
    await loadAdSenseData();
    
    // Step 3: Find page config
    pageConfig = findPageConfig();
    
    if (!pageConfig) {
      console.log('ℹ️ No ad config for this page');
      return;
    }
    
    if (pageConfig.enabled !== true) {
      console.log('ℹ️ Ads disabled for this page');
      return;
    }
    
    // Step 4: Get units for this page
    let units = getUnitsForPage();
    
    if (units.length === 0) {
      console.log('ℹ️ No units configured for this page');
      return;
    }
    
    console.log('📦 Units to inject:', units.length);
    
    // Step 5: Inject Header Codes into <head>
    injectHeaderCode(units);
    
    // Step 6: Inject Body Codes into placeholders
    injectBodyCode(units);
    
    // Step 7: Cleanup empty containers
    cleanupEmptyContainers();
    
    console.log('✅ AdSense init complete');
  }

  // ==================== START ====================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(initAdSense, 800);  // Wait for other scripts to load
    });
  } else {
    setTimeout(initAdSense, 800);
  }

  // ==================== GLOBAL HELPERS ====================
  window.reloadAdSense = function() {
    console.log('🔄 Reloading AdSense...');
    initAdSense();
  };

})();

console.log('✅ adsense.js loaded (new injector)');
