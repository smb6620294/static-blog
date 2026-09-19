/* ============================================
   ADSENSE.JS - Frontend Ad Code Injector
   Path: /assets/frontend/js/adsense.js
   
   PURPOSE:
     Reads pages.json + units.json.
     Injects Header Code → <head>.
     Injects Body Code → matching [data-slot] placeholders.
     
   AUTO-HIDE RULE:
     If unit has empty body_code, hide the placeholder
     completely (no empty dashed box shown to user).
   ============================================ */

(function () {
  'use strict';

  var adsenseUnits = [];
  var adsensePages = {};
  var pageConfig = null;
  var currentPageFile = '';
  var isInitialized = false;
  var isInjecting = false;

  /* --------------------------------------------
     DETECT CURRENT PAGE FILENAME
     -------------------------------------------- */
  function detectCurrentPage() {
    var path = window.location.pathname || '/';
    var fileName = path.substring(path.lastIndexOf('/') + 1);

    if (fileName === '' || path.endsWith('/')) {
      fileName = 'index.html';
    }

    fileName = fileName.split('?')[0].split('#')[0];
    return fileName;
  }

  /* --------------------------------------------
     LOAD PAGES.JSON + UNITS.JSON
     -------------------------------------------- */
  function loadAdSenseData() {
    var rawBase = 'https://raw.githubusercontent.com/' + CONFIG.GITHUB_REPO + '/' + CONFIG.GITHUB_BRANCH;

    return fetch(rawBase + '/admin/adsense/config/pages.json', { cache: 'no-cache' })
      .then(function (r) {
        if (r.ok) {
          return r.json();
        }
        return { pages: {} };
      })
      .then(function (pagesData) {
        adsensePages = (pagesData && pagesData.pages) ? pagesData.pages : {};

        return fetch(rawBase + '/admin/adsense/config/units.json', { cache: 'no-cache' });
      })
      .then(function (r) {
        if (r.ok) {
          return r.json();
        }
        return { units: [] };
      })
      .then(function (unitsData) {
        adsenseUnits = (unitsData && unitsData.units) ? unitsData.units : [];

        console.log('[OK] AdSense data loaded:', {
          pages: Object.keys(adsensePages).length,
          units: adsenseUnits.length
        });
      })
      .catch(function (err) {
        console.warn('[WARN] AdSense data load error:', err);
        adsenseUnits = [];
        adsensePages = {};
      });
  }

  /* --------------------------------------------
     FIND PAGE CONFIG
     -------------------------------------------- */
  function findPageConfig() {
    if (!currentPageFile) return null;

    if (adsensePages[currentPageFile]) {
      return adsensePages[currentPageFile];
    }

    var withoutExt = currentPageFile.replace(/\.html?$/i, '');
    if (adsensePages[withoutExt]) {
      return adsensePages[withoutExt];
    }

    return null;
  }

  /* --------------------------------------------
     GET ENABLED UNITS FOR CURRENT PAGE
     -------------------------------------------- */
  function getUnitsForPage() {
    if (!pageConfig) return [];
    if (pageConfig.enabled !== true) return [];
    if (!Array.isArray(pageConfig.units)) return [];

    return pageConfig.units
      .map(function (slug) {
        return adsenseUnits.find(function (u) { return u.slug === slug; });
      })
      .filter(function (u) { return u && u.enabled !== false; });
  }

  /* --------------------------------------------
     EXECUTE INLINE SCRIPTS IN CONTAINER
     -------------------------------------------- */
  function executeScripts(container) {
    if (!container) return;
    var scripts = container.querySelectorAll('script');
    scripts.forEach(function (oldScript) {
      var newScript = document.createElement('script');
      Array.prototype.slice.call(oldScript.attributes).forEach(function (attr) {
        newScript.setAttribute(attr.name, attr.value);
      });
      newScript.textContent = oldScript.textContent;
      oldScript.parentNode.replaceChild(newScript, oldScript);
    });
  }

  /* --------------------------------------------
     INJECT HEADER CODE → <head>
     -------------------------------------------- */
  function injectHeaderCode(units) {
    if (!units || units.length === 0) return 0;

    var injected = 0;
    var head = document.head;

    units.forEach(function (unit) {
      var headerCode = (unit.header_code || '').trim();
      if (!headerCode) return;

      try {
        var temp = document.createElement('div');
        temp.innerHTML = headerCode;

        while (temp.firstChild) {
          var node = temp.firstChild;
          if (node.nodeType === 3 && !node.textContent.trim()) {
            temp.removeChild(node);
            continue;
          }
          head.appendChild(node);
        }

        injected++;
        console.log('[OK] Header Code injected:', unit.slug);
      } catch (err) {
        console.warn('[WARN] Header inject failed:', unit.slug, err);
      }
    });

    return injected;
  }

  /* --------------------------------------------
     FIND PLACEHOLDER FOR SLOT
     -------------------------------------------- */
  function findPlaceholder(slotSlug) {
    return document.querySelector('[data-slot="' + slotSlug + '"]');
  }

  /* --------------------------------------------
     INJECT BODY CODE → MATCHING PLACEHOLDERS
     
     AUTO-HIDE RULE:
       If unit has empty body_code → hide placeholder
       (no empty dashed box visible to user).
   -------------------------------------------- */
  function injectBodyCode(units) {
    if (!units || units.length === 0) return { injected: 0, hidden: 0, notFound: 0 };

    var injected = 0;
    var hidden = 0;
    var notFound = 0;

    units.forEach(function (unit) {
      var bodyCode = (unit.body_code || '').trim();
      var placeholder = findPlaceholder(unit.slug);

      if (!placeholder) {
        notFound++;
        return;
      }

      // ✅ KEY CHANGE: If body_code is empty → HIDE placeholder completely
      if (!bodyCode) {
        placeholder.style.display = 'none';
        placeholder.innerHTML = '';
        placeholder.classList.add('ad-empty');
        placeholder.classList.remove('adsense-placeholder');
        hidden++;
        console.log('[INFO] Placeholder hidden (empty body_code):', unit.slug);
        return;
      }

      // Body code exists → inject it
      try {
        placeholder.innerHTML = '';
        placeholder.classList.remove('adsense-placeholder');
        placeholder.classList.add('ad-container');
        placeholder.style.display = '';
        placeholder.innerHTML = bodyCode;

        executeScripts(placeholder);

        injected++;
        console.log('[OK] Body Code injected:', unit.slug);
      } catch (err) {
        console.warn('[WARN] Body inject failed:', unit.slug, err);
      }
    });

    console.log('[SUMMARY] Injection: ' + injected + ' injected, ' + hidden + ' hidden, ' + notFound + ' not found');
    return { injected: injected, hidden: hidden, notFound: notFound };
  }

  /* --------------------------------------------
     CLEANUP — Hide any leftover empty containers
     -------------------------------------------- */
  function cleanupEmptyContainers() {
    setTimeout(function () {
      document.querySelectorAll('.ad-container').forEach(function (container) {
        var hasContent =
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
  function initAdSense() {
    if (isInjecting) return;
    isInjecting = true;

    currentPageFile = detectCurrentPage();
    console.log('[INFO] AdSense page detected:', currentPageFile);

    loadAdSenseData()
      .then(function () {
        pageConfig = findPageConfig();

        if (!pageConfig) {
          console.log('[INFO] No AdSense config for this page');
          return;
        }

        if (pageConfig.enabled !== true) {
          console.log('[INFO] AdSense disabled for this page');
          return;
        }

        var units = getUnitsForPage();
        if (units.length === 0) {
          console.log('[INFO] No enabled units for this page');
          return;
        }

        console.log('[INFO] Processing ' + units.length + ' unit(s)...');

        injectHeaderCode(units);
        injectBodyCode(units);
        cleanupEmptyContainers();

        isInitialized = true;
        console.log('[OK] AdSense init complete');
      })
      .catch(function (err) {
        console.warn('[WARN] AdSense init error:', err);
      })
      .then(function () {
        isInjecting = false;
      });
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
     AUTO-INIT — Delayed for dynamic content
     -------------------------------------------- */
  function scheduleInit() {
    setTimeout(initAdSense, 900);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleInit);
  } else {
    scheduleInit();
  }

  console.log('[OK] adsense.js loaded — auto-hide empty placeholders enabled');
})();
