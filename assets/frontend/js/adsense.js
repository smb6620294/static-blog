/* ============================================
   ADSENSE.JS - Frontend Ad Code Injector
   Path: /assets/frontend/js/adsense.js
   
   Reads:  admin/adsense/config/pages.json
           admin/adsense/config/units.json
   
   Injects:
     1. Header Code  → <head>
     2. Body Code    → matching [data-slot="slug"] placeholders
   
   Placeholders created by f-posts.js / f-widgets.js:
     - after-post-title
     - between-posts
     - index-top-banner
     - index-bottom-banner
     - sidebar-top
     - sidebar-bottom
     - after-pagination
   ============================================ */

(function () {
  'use strict';

  /* --------------------------------------------
     STATE
     -------------------------------------------- */
  let adsenseUnits = [];
  let adsensePages = {};
  let pageConfig = null;
  let currentPageFile = '';
  let isInitialized = false;
  let isInjecting = false;

  /* --------------------------------------------
     PAGE DETECTION
     -------------------------------------------- */
  function detectCurrentPage() {
    let path = window.location.pathname || '/';
    let fileName = path.substring(path.lastIndexOf('/') + 1);

    // Root or directory → index.html
    if (fileName === '' || path.endsWith('/')) {
      fileName = 'index.html';
    }

    // Strip query string / hash if present
    fileName = fileName.split('?')[0].split('#')[0];

    return fileName;
  }

  /* --------------------------------------------
     LOAD REMOTE CONFIG (pages.json + units.json)
     Uses raw.githubusercontent.com (no token needed)
     -------------------------------------------- */
  async function loadAdSenseData() {
    const rawBase = `https://raw.githubusercontent.com/${CONFIG.GITHUB_REPO}/${CONFIG.GITHUB_BRANCH}`;

    try {
      // Load pages.json
      const pagesResp = await fetch(`${rawBase}/admin/adsense/config/pages.json`, {
        cache: 'no-cache'
      });
      if (pagesResp.ok) {
        const pagesData = await pagesResp.json();
        adsensePages = (pagesData && pagesData.pages) ? pagesData.pages : {};
      } else {
        console.warn('⚠️ pages.json not found');
        adsensePages = {};
      }

      // Load units.json
      const unitsResp = await fetch(`${rawBase}/admin/adsense/config/units.json`, {
        cache: 'no-cache'
      });
      if (unitsResp.ok) {
        const unitsData = await unitsResp.json();
        adsenseUnits = Array.isArray(unitsData.units) ? unitsData.units : [];
      } else {
        console.warn('⚠️ units.json not found');
        adsenseUnits = [];
      }

      console.log('✅ AdSense data loaded:', {
        pages: Object.keys(adsensePages).length,
        units: adsenseUnits.length
      });
    } catch (err) {
      console.warn('❌ AdSense data load error:', err);
      adsenseUnits = [];
      adsensePages = {};
    }
  }

  /* --------------------------------------------
     FIND MATCHING PAGE CONFIG
     Tries: "index.html" → "index" → null
     -------------------------------------------- */
  function findPageConfig() {
    if (!currentPageFile) return null;

    // Exact match (e.g. "index.html")
    if (adsensePages[currentPageFile]) {
      return adsensePages[currentPageFile];
    }

    // Without extension (e.g. "index")
    const withoutExt = currentPageFile.replace(/\.html?$/i, '');
    if (adsensePages[withoutExt]) {
      return adsensePages[withoutExt];
    }

    return null;
  }

  /* --------------------------------------------
     RESOLVE UNITS FOR CURRENT PAGE
     Returns array of unit objects (enabled only)
     -------------------------------------------- */
  function getUnitsForPage() {
    if (!pageConfig) return [];
    if (pageConfig.enabled !== true) return [];
    if (!Array.isArray(pageConfig.units)) return [];

    return pageConfig.units
      .map(slug => adsenseUnits.find(u => u.slug === slug))
      .filter(u => u && u.enabled !== false);
  }

  /* --------------------------------------------
     EXECUTE INLINE <script> TAGS
     Required because innerHTML doesn't run scripts
     -------------------------------------------- */
  function executeScripts(container) {
    if (!container) return;
    const scripts = container.querySelectorAll('script');
    scripts.forEach(oldScript => {
      const newScript = document.createElement('script');
      // Copy all attributes
      Array.from(oldScript.attributes).forEach(attr => {
        newScript.setAttribute(attr.name, attr.value);
      });
      newScript.textContent = oldScript.textContent;
      oldScript.parentNode.replaceChild(newScript, oldScript);
    });
  }

  /* --------------------------------------------
     PARSE HTML STRING INTO DOM NODES
     -------------------------------------------- */
  function htmlToNodes(htmlString) {
    const temp = document.createElement('div');
    temp.innerHTML = htmlString;
    return Array.from(temp.childNodes);
  }

  /* --------------------------------------------
     INJECT HEADER CODE → <head>
     -------------------------------------------- */
  function injectHeaderCode(units) {
    if (!units || units.length === 0) return 0;

    let injected = 0;
    const head = document.head;

    units.forEach(unit => {
      const headerCode = (unit.header_code || '').trim();
      if (!headerCode) return;

      try {
        const nodes = htmlToNodes(headerCode);
        nodes.forEach(node => {
          // Skip empty text nodes
          if (node.nodeType === 3 && !node.textContent.trim()) return;
          head.appendChild(node);
        });
        injected++;
        console.log('✅ Header Code injected:', unit.slug);
      } catch (err) {
        console.warn('❌ Header inject failed:', unit.slug, err);
      }
    });

    return injected;
  }

  /* --------------------------------------------
     FIND PLACEHOLDER ELEMENT FOR A SLOT
     -------------------------------------------- */
  function findPlaceholder(slotSlug) {
    return document.querySelector(`[data-slot="${slotSlug}"]`);
  }

  /* --------------------------------------------
     INJECT BODY CODE → matching placeholders
     -------------------------------------------- */
  function injectBodyCode(units) {
    if (!units || units.length === 0) return { injected: 0, notFound: 0 };

    let injected = 0;
    let notFound = 0;

    units.forEach(unit => {
      const bodyCode = (unit.body_code || '').trim();
      if (!bodyCode) return;

      const placeholder = findPlaceholder(unit.slug);
      if (!placeholder) {
        notFound++;
        return;
      }

      try {
        // Clear placeholder
        placeholder.innerHTML = '';

        // Swap classes: remove placeholder style, add real container
        placeholder.classList.remove('adsense-placeholder');
        placeholder.classList.add('ad-container');

        // Inject body code
        placeholder.innerHTML = bodyCode;

        // Run any inline scripts
        executeScripts(placeholder);

        injected++;
        console.log('✅ Body Code injected:', unit.slug);
      } catch (err) {
        console.warn('❌ Body inject failed:', unit.slug, err);
      }
    });

    console.log(`✅ Body injection: ${injected} injected, ${notFound} not found`);
    return { injected, notFound };
  }

  /* --------------------------------------------
     CLEANUP EMPTY AD CONTAINERS
     If an ad didn't fill (blocked, empty), hide it
     -------------------------------------------- */
  function cleanupEmptyContainers() {
    setTimeout(() => {
      document.querySelectorAll('.ad-container').forEach(container => {
        const hasContent =
          container.textContent.trim().length > 0 ||
          container.querySelector('iframe, img, ins, video, canvas, svg') !== null;

        if (!hasContent) {
          container.classList.add('ad-empty');
          container.style.display = 'none';
        }
      });
    }, 2500);
  }

  /* --------------------------------------------
     MAIN INIT
     -------------------------------------------- */
  async function initAdSense() {
    if (isInjecting) return;
    isInjecting = true;

    try {
      currentPageFile = detectCurrentPage();
      console.log('📄 AdSense page detected:', currentPageFile);

      await loadAdSenseData();

      pageConfig = findPageConfig();

      if (!pageConfig) {
        console.log('ℹ️ No AdSense config for this page');
        return;
      }

      if (pageConfig.enabled !== true) {
        console.log('ℹ️ AdSense disabled for this page');
        return;
      }

      const units = getUnitsForPage();
      if (units.length === 0) {
        console.log('ℹ️ No enabled units for this page');
        return;
      }

      console.log(`📦 Injecting ${units.length} unit(s)...`);

      // 1. Header code → <head>
      injectHeaderCode(units);

      // 2. Body code → placeholders
      injectBodyCode(units);

      // 3. Cleanup empty containers after a delay
      cleanupEmptyContainers();

      isInitialized = true;
      console.log('✅ AdSense init complete');
    } catch (err) {
      console.warn('❌ AdSense init error:', err);
    } finally {
      isInjecting = false;
    }
  }

  /* --------------------------------------------
     PUBLIC API
     -------------------------------------------- */
  window.reloadAdSense = function () {
    isInitialized = false;
    initAdSense();
  };

  window.getAdSenseStatus = function () {
    return {
      initialized: isInitialized,
      page: currentPageFile,
      enabled: pageConfig ? pageConfig.enabled === true : false,
      unitsLoaded: adsenseUnits.length,
      pagesLoaded: Object.keys(adsensePages).length
    };
  };

  /* --------------------------------------------
     AUTO-INIT
     Wait for DOM + dynamic content (posts/widgets) to render
     -------------------------------------------- */
  function scheduleInit() {
    // Delay so f-posts.js / f-widgets.js can create placeholders first
    setTimeout(initAdSense, 900);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleInit);
  } else {
    scheduleInit();
  }

  console.log('✅ adsense.js loaded — injector ready');
})();
