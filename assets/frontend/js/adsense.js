// ==================== ADSENSE MANAGER ====================
// یہ فائل ہر صفحے پر Ads لگاتی ہے — JSON config کے مطابق

(function() {
  'use strict';

  // ==================== CONFIG LOAD ====================
  let siteConfig = null;
  let adsenseConfig = null;
  let unitsConfig = null;
  let pagesConfig = null;

  // ==================== INIT ====================
  async function initAdsense() {
    try {
      // Load all config files
      const [site, adsense, units, pages] = await Promise.all([
        fetch('/config/site.config.json').then(r => r.json()).catch(() => ({})),
        fetch('/config/adsense.config.json').then(r => r.json()).catch(() => ({})),
        fetch('/config/units.json').then(r => r.json()).catch(() => ({ units: {} })),
        fetch('/config/pages.json').then(r => r.json()).catch(() => ({ pages: {} }))
      ]);

      siteConfig = site;
      adsenseConfig = adsense;
      unitsConfig = units;
      pagesConfig = pages;

      // If AdSense disabled globally, exit
      if (!adsenseConfig.enabled) {
        console.log('AdSense is disabled globally.');
        return;
      }

      // Get current page
      const currentPage = getCurrentPage();
      const pageConfig = pagesConfig.pages[currentPage];

      if (!pageConfig || !pageConfig.enabled) {
        console.log('No AdSense config for this page.');
        return;
      }

      // Apply ads based on page type
      if (currentPage === 'single-post.html' || currentPage === 'single-page.html') {
        applySinglePageAds(pageConfig.units);
      } else {
        applyArchivePageAds(pageConfig.units);
      }

    } catch (err) {
      console.error('AdSense init error:', err);
    }
  }

  // ==================== GET CURRENT PAGE ====================
  function getCurrentPage() {
    let path = window.location.pathname;
    let page = path.split('/').pop() || 'index.html';
    if (page === '') page = 'index.html';
    return page;
  }

  // ==================== SINGLE POST/PAGE ADS ====================
  function applySinglePageAds(units) {
    // Ad #1: After Post Title (before Author/Date)
    if (units.includes('ad-slot-1-post') && isUnitEnabled('ad-slot-1-post')) {
      const title = document.querySelector('.post-title, .entry-title, h1.post-title');
      if (title) {
        const ad = createAdSlot('ad-slot-1-post');
        title.parentNode.insertBefore(ad, title.nextSibling);
      }
    }

    // Ad #2: After 2nd Paragraph in content
    if (units.includes('ad-slot-2-post') && isUnitEnabled('ad-slot-2-post')) {
      const content = document.querySelector('.post-content, .entry-content, .post-body');
      if (content) {
        const paragraphs = content.querySelectorAll('p');
        if (paragraphs.length >= 2) {
          const ad = createAdSlot('ad-slot-2-post');
          paragraphs[1].parentNode.insertBefore(ad, paragraphs[1].nextSibling);
        } else if (paragraphs.length === 1) {
          const ad = createAdSlot('ad-slot-2-post');
          paragraphs[0].parentNode.insertBefore(ad, paragraphs[0].nextSibling);
        }
      }
    }

    // Ad #3: Before Comments OR Before Last H2
    if (units.includes('ad-slot-3-post') && isUnitEnabled('ad-slot-3-post')) {
      const commentsSection = document.querySelector('.comments-section, #comments, .comment-section');
      
      if (commentsSection) {
        // Comments exist — place before comments
        const ad = createAdSlot('ad-slot-3-post');
        commentsSection.parentNode.insertBefore(ad, commentsSection);
      } else {
        // No comments — place before last H2
        const content = document.querySelector('.post-content, .entry-content, .post-body');
        if (content) {
          const h2s = content.querySelectorAll('h2');
          if (h2s.length > 0) {
            const lastH2 = h2s[h2s.length - 1];
            const ad = createAdSlot('ad-slot-3-post');
            lastH2.parentNode.insertBefore(ad, lastH2);
          } else {
            // No H2 either — place at end of content
            const ad = createAdSlot('ad-slot-3-post');
            content.appendChild(ad);
          }
        }
      }
    }

    // Sidebar Ads (no change)
    applySidebarAds(units);
  }

  // ==================== ARCHIVE PAGE ADS ====================
  function applyArchivePageAds(units) {
    // Only sidebar ads on archive pages
    applySidebarAds(units);
  }

  // ==================== SIDEBAR ADS ====================
  function applySidebarAds(units) {
    // Sidebar Top
    if (units.includes('sidebar-top') && isUnitEnabled('sidebar-top')) {
      const sidebar = document.querySelector('.sidebar, aside, #sidebar');
      if (sidebar) {
        const ad = createAdSlot('sidebar-top');
        sidebar.insertBefore(ad, sidebar.firstChild);
      }
    }

    // Sidebar Bottom
    if (units.includes('sidebar-bottom') && isUnitEnabled('sidebar-bottom')) {
      const sidebar = document.querySelector('.sidebar, aside, #sidebar');
      if (sidebar) {
        const ad = createAdSlot('sidebar-bottom');
        sidebar.appendChild(ad);
      }
    }
  }

  // ==================== CHECK IF UNIT ENABLED ====================
  function isUnitEnabled(unitId) {
    if (!unitsConfig.units || !unitsConfig.units[unitId]) return false;
    return unitsConfig.units[unitId].enabled === true;
  }

  // ==================== CREATE AD SLOT ====================
  function createAdSlot(unitId) {
    const wrapper = document.createElement('div');
    wrapper.className = 'ad-slot ad-slot-' + unitId;
    wrapper.setAttribute('data-unit', unitId);

    // If no client ID, show placeholder
    if (!adsenseConfig.client_id || adsenseConfig.client_id === 'ca-pub-XXXXXXXXXXXXXXXX') {
      wrapper.innerHTML = '<div style="background:#f0f0f0;border:1px dashed #ccc;padding:20px;text-align:center;color:#999;font-size:12px;">📢 Ad Slot: ' + unitId + '</div>';
      return wrapper;
    }

    // Real AdSense code
    const slotId = adsenseConfig.slots && adsenseConfig.slots[unitId] 
      ? adsenseConfig.slots[unitId] 
      : '';

    wrapper.innerHTML = 
      '<ins class="adsbygoogle" ' +
      'style="display:block" ' +
      'data-ad-client="' + adsenseConfig.client_id + '" ' +
      'data-ad-slot="' + slotId + '" ' +
      'data-ad-format="auto" ' +
      'data-full-width-responsive="true"></ins>';

    // Push AdSense
    try {
      (adsbygoogle = window.adsbygoogle || []).push({});
    } catch(e) {
      console.log('AdSense not loaded yet');
    }

    return wrapper;
  }

  // ==================== START ====================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdsense);
  } else {
    initAdsense();
  }

})();
