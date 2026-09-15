/* ============================================
   SEO.JS - SEO Scoring System
   Used by: add-new-post, edit-post, add-new-page, edit-new-page
   ============================================ */

let _seoChart = null;

/**
 * Initialize SEO chart
 */
function initSeoChart() {
  let canvas = document.getElementById('seoChart');
  if (!canvas) return;
  if (_seoChart) return; // already initialized
  
  const ctx = canvas.getContext('2d');
  _seoChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Score', 'Remaining'],
      datasets: [{
        data: [0, 100],
        backgroundColor: ['#d63638', '#e9ecef'],
        borderWidth: 0
      }]
    },
    options: {
      cutout: '70%',
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
      },
      responsive: true,
      maintainAspectRatio: true
    }
  });
}

/**
 * Update SEO analysis (called on content change)
 */
function updateSEO() {
  let titleEl = document.getElementById('postTitle');
  let seoTitleEl = document.getElementById('seoTitle');
  let seoDescEl = document.getElementById('seoDescription');
  let seoKeywordEl = document.getElementById('seoKeyword');
  
  if (!titleEl) return;
  
  let title = (titleEl.value || '').toLowerCase();
  let seoTitle = (seoTitleEl?.value || '').toLowerCase();
  let seoDesc = (seoDescEl?.value || '').toLowerCase();
  let keyword = (seoKeywordEl?.value || '').toLowerCase().trim();
  
  // Get content
  let content = '';
  if (typeof getEditorTextContent === 'function') {
    content = getEditorTextContent().toLowerCase();
  } else if (typeof getCurrentContent === 'function') {
    content = getCurrentContent().toLowerCase();
  }
  
  // Update character counters
  let titleCountEl = document.getElementById('seoTitleCount');
  let descCountEl = document.getElementById('seoDescCount');
  if (titleCountEl) titleCountEl.textContent = seoTitleEl?.value.length || 0;
  if (descCountEl) descCountEl.textContent = seoDescEl?.value.length || 0;
  
  if (!keyword) {
    renderSeoChecks([]);
    updateSeoChart(0);
    return;
  }
  
  let checks = [];
  let score = 0;
  
  // Check 1: Keyword in Title
  let titleHasKeyword = seoTitle.includes(keyword) || title.includes(keyword);
  checks.push({ label: 'Focus keyword in Title', pass: titleHasKeyword });
  if (titleHasKeyword) score += 20;
  
  // Check 2: Keyword in Meta Description
  let descHasKeyword = seoDesc.includes(keyword);
  checks.push({ label: 'Focus keyword in Meta Description', pass: descHasKeyword });
  if (descHasKeyword) score += 20;
  
  // Check 3: Keyword at start of content
  let keywordAtStart = content.substring(0, 150).includes(keyword);
  checks.push({ label: 'Keyword at start of content', pass: keywordAtStart });
  if (keywordAtStart) score += 20;
  
  // Check 4: Keyword in Headings
  let headingCount = 0;
  let htmlContent = '';
  if (typeof getEditorContent === 'function') {
    htmlContent = getEditorContent();
  } else {
    let codeArea = document.getElementById('postContentCode');
    htmlContent = codeArea ? codeArea.value : '';
  }
  let headings = htmlContent.match(/<h[1-6][^>]*>.*?<\/h[1-6]>/gi) || [];
  headings.forEach(h => {
    if (h.toLowerCase().includes(keyword)) headingCount++;
  });
  let headingHasKeyword = headingCount > 0;
  checks.push({ label: 'Keyword in Headings (' + headingCount + ' times)', pass: headingHasKeyword });
  if (headingHasKeyword) score += 15;
  
  // Check 5: Keyword Density
  let keywordCount = (content.match(new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
  let words = content.split(/\s+/).filter(w => w.length > 0);
  let density = words.length > 0 ? (keywordCount / words.length) * 100 : 0;
  let densityOk = density >= CONFIG.SEO_DENSITY_MIN && density <= CONFIG.SEO_DENSITY_MAX;
  checks.push({ label: 'Keyword Density: ' + density.toFixed(2) + '%', pass: densityOk });
  if (densityOk) score += 15;
  
  // Check 6: Content Length
  let wordCount = words.length;
  let lengthOk = wordCount >= CONFIG.SEO_MIN_WORDS;
  checks.push({ label: 'Content Length: ' + wordCount + ' words (min ' + CONFIG.SEO_MIN_WORDS + ')', pass: lengthOk });
  if (lengthOk) score += 10;
  
  renderSeoChecks(checks);
  updateSeoChart(score);
}

/**
 * Render SEO checks list
 */
function renderSeoChecks(checks) {
  let container = document.getElementById('seoChecks');
  if (!container) return;
  
  if (!checks || checks.length === 0) {
    container.innerHTML = '<div class="note">Enter a Focus Keyword to see SEO analysis.</div>';
    return;
  }
  
  container.innerHTML = checks.map(c => 
    `<div class="seo-check ${c.pass ? 'pass' : 'fail'}">
      <span class="icon">${c.pass ? '✓' : '✗'}</span>
      <span>${escapeHtml(c.label)}</span>
    </div>`
  ).join('');
}

/**
 * Update SEO chart with score
 */
function updateSeoChart(score) {
  if (!_seoChart) return;
  
  let color = score >= 80 ? '#00a32a' : (score >= 50 ? '#dba617' : '#d63638');
  _seoChart.data.datasets[0].data = [score, 100 - score];
  _seoChart.data.datasets[0].backgroundColor = [color, '#e9ecef'];
  _seoChart.update();
}