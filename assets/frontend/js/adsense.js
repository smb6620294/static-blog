/* ============================================
   ADSENSE.JS - Frontend AdSense Loader
   Test Mode → Placeholders
   Real Mode → Google AdSense
   ============================================ */

let adsenseConfig = null;
let adsenseUnits = [];
let adsensePages = {};

// ==================== LOAD CONFIG ====================
async function loadAdSenseConfig() {
  try {
    // Config
    let configResp = await fetch(
      `https://raw.githubusercontent.com/${CONFIG.GITHUB_REPO}/${CONFIG.GITHUB_BRANCH}/admin/adsense/config/config.json`
    );
    if (configResp.ok) adsenseConfig = await configResp.json();
    
    // Units
    let unitsResp = await fetch(
      `https://raw.githubusercontent.com/${CONFIG.GITHUB_REPO}/${CONFIG.GITHUB_BRANCH}/admin/adsense/config/units.json`
    );
    if (unitsResp.ok) {
      let unitsData = await unitsResp.json();
      adsenseUnits = unitsData.units || [];
    }
    
    // Pages
    let pagesResp = await fetch(
      `https://raw.githubusercontent.com/${CONFIG.GITHUB_REPO}/${CONFIG.GITHUB_BRANCH}/admin/adsense/config/pages.json`
    );
    if (pagesResp.ok) {
      let pagesData = await pagesResp.json();
      adsensePages = pagesData.pages || {};
    }
    
    console.log('✅ AdSense config loaded:', {
      enabled: adsenseConfig?.enabled,
      testMode: adsenseConfig?.test_mode,
      units: adsenseUnits.length,
      pages: Object.keys(adsensePages).length
    });
    
  } catch (err) {
    console.warn('⚠️ AdSense config load error:', err);
  }
}

// ==================== LOAD ADSENSE BLOCKS ====================
async function loadAdSenseBlocks() {
  if (!adsenseConfig) await loadAdSenseConfig();
  
  // If AdSense disabled → remove all placeholders
  if (!adsenseConfig || !adsenseConfig.enabled) {
    document.querySelectorAll('.adsense-placeholder, .adsense-real').forEach(el => el.remove());
    console.log('ℹ️ AdSense is disabled');
    return;
  }
  
  // Find all placeholder elements
  let placeholders = document.querySelectorAll('.adsense-placeholder');
  
  if (adsenseConfig.test_mode) {
    // TEST MODE → Keep placeholders as-is
    console.log('🧪 Test Mode: ' + placeholders.length + ' placeholders');
    return;
  }
  
  // REAL ADSENSE MODE → Replace placeholders with actual ads
  let publisherId = adsenseConfig.publisher_id;
  if (!publisherId) {
    console.warn('⚠️ No Publisher ID — keeping placeholders');
    return;
  }
  
  // Load AdSense script once
  loadAdSenseScript(publisherId);
  
  // Replace each placeholder with real ad code
  placeholders.forEach((el, index) => {
    let slotName = el.dataset.slot || 'default';
    let unit = adsenseUnits.find(u => u.slug === slotName);
    
    if (!unit || !unit.slot_id) {
      el.innerHTML = '<div style="font-size:11px;color:#999;">Ad slot not configured</div>';
      return;
    }
    
    let slotId = unit.slot_id;
    el.classList.remove('adsense-placeholder');
    el.classList.add('adsense-real');
    el.innerHTML = `
      <ins class="adsbygoogle"
           style="display:block"
           data-ad-client="${escapeHtml(publisherId)}"
           data-ad-slot="${escapeHtml(slotId)}"
           data-ad-format="auto"
           data-full-width-responsive="true"></ins>
    `;
    
    // Push to AdSense
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.warn('AdSense push error:', e);
    }
  });
  
  console.log('✅ Real AdSense blocks loaded');
}

// ==================== LOAD ADSENSE SCRIPT ====================
function loadAdSenseScript(publisherId) {
  // Avoid duplicate
  if (document.querySelector('script[src*="adsbygoogle"]')) return;
  
  let script = document.createElement('script');
  script.async = true;
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`;
  script.crossOrigin = 'anonymous';
  document.head.appendChild(script);
  
  console.log('📥 AdSense script loaded');
}

// ==================== INITIALIZE ====================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(loadAdSenseBlocks, 500);
  });
} else {
  setTimeout(loadAdSenseBlocks, 500);
}

console.log('✅ adsense.js loaded');
