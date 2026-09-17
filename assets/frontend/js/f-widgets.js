/* ============================================
   F-WIDGETS.JS - Widgets loader
   Loads widgets from content/widgets/widgets.json
   ============================================ */

const WIDGETS_FILE = 'content/widgets/widgets.json';
let widgetsData = [];

// ==================== LOAD WIDGETS ====================
async function loadWidgets() {
  let container = document.getElementById('widgetsContainer');
  if (!container) return;
  
  try {
    // Try fetch from GitHub raw
    let response = await fetch(
      `https://raw.githubusercontent.com/${CONFIG.GITHUB_REPO}/${CONFIG.GITHUB_BRANCH}/${WIDGETS_FILE}`
    );
    
    if (response.ok) {
      let data = await response.json();
      widgetsData = data.widgets || [];
    } else {
      widgetsData = getDefaultWidgets();
    }
  } catch (err) {
    console.warn('Widgets load error, using defaults:', err);
    widgetsData = getDefaultWidgets();
  }
  
  renderWidgets();
}

// ==================== DEFAULT WIDGETS ====================
function getDefaultWidgets() {
  return [
    { id: 'w_search', type: 'search', title: '🔍 Search', enabled: true, order: 1 },
    { id: 'w_about', type: 'html', title: 'ℹ️ About', content: '<p>Welcome to my blog!</p>', enabled: true, order: 2 },
    { id: 'w_categories', type: 'categories', title: '📂 Categories', enabled: true, order: 3 },
    { id: 'w_tags', type: 'tags', title: '🏷️ Tags', enabled: true, order: 4 }
  ];
}

// ==================== RENDER WIDGETS ====================
function renderWidgets() {
  let container = document.getElementById('widgetsContainer');
  if (!container) return;
  
  let activeWidgets = widgetsData
    .filter(w => w.enabled !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  
  if (activeWidgets.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:20px;color:#666;">No widgets</div>';
    return;
  }
  
  container.innerHTML = activeWidgets.map(widget => renderWidget(widget)).join('');
  
  // Attach widget-specific behaviors
  attachWidgetHandlers();
}

// ==================== RENDER SINGLE WIDGET ====================
function renderWidget(widget) {
  let html = `<div class="widget" data-widget-id="${escapeHtml(widget.id)}" data-widget-type="${escapeHtml(widget.type)}">`;
  
  // Title (not for adsense)
  if (widget.title && widget.type !== 'adsense') {
    html += `<h3 class="widget-title">${escapeHtml(widget.title)}</h3>`;
  }
  
  html += '<div class="widget-content">';
  
  // Type-specific content
  switch (widget.type) {
    case 'search':
      html += `
        <div class="search-box">
          <input type="text" id="widgetSearch" placeholder="Search posts...">
          <button onclick="doSearch()">Go</button>
        </div>
      `;
      break;
    
    case 'html':
      html += widget.content || '';
      break;
    
    case 'categories':
      html += '<ul id="widgetCategories"><li>Loading...</li></ul>';
      break;
    
    case 'tags':
      html += '<div class="tag-cloud" id="widgetTags">Loading...</div>';
      break;
    
    case 'recent-posts':
      html += '<ul id="widgetRecentPosts"><li>Loading...</li></ul>';
      break;
    
    case 'adsense':
      // AdSense placeholder — actual load via adsense.js
      html += `<div class="adsense-placeholder" data-slot="${escapeHtml(widget.slot_name || 'sidebar')}"></div>`;
      break;
    
    default:
      html += '<p>' + (widget.content || '') + '</p>';
  }
  
  html += '</div></div>';
  return html;
}

// ==================== ATTACH HANDLERS ====================
function attachWidgetHandlers() {
  // Load categories
  if (document.getElementById('widgetCategories')) {
    loadWidgetCategories();
  }
  
  // Load tags
  if (document.getElementById('widgetTags')) {
    loadWidgetTags();
  }
  
  // Load recent posts
  if (document.getElementById('widgetRecentPosts')) {
    loadWidgetRecentPosts();
  }
}

// ==================== LOAD CATEGORIES ====================
async function loadWidgetCategories() {
  let el = document.getElementById('widgetCategories');
  if (!el) return;
  
  try {
    let response = await fetch(
      `https://raw.githubusercontent.com/${CONFIG.GITHUB_REPO}/${CONFIG.GITHUB_BRANCH}/content/categories/categories.json`
    );
    
    if (!response.ok) throw new Error('Not found');
    let data = await response.json();
    
    if (data.categories && data.categories.length > 0) {
      el.innerHTML = data.categories.map(cat => {
        let name = cat.title || cat.name || 'Untitled';
        return `<li><a href="/category/${escapeHtml(cat.slug)}">${escapeHtml(name)}</a></li>`;
      }).join('');
    } else {
      el.innerHTML = '<li>No categories</li>';
    }
  } catch (err) {
    el.innerHTML = '<li>No categories yet</li>';
  }
}

// ==================== LOAD TAGS ====================
async function loadWidgetTags() {
  let el = document.getElementById('widgetTags');
  if (!el) return;
  
  try {
    let response = await fetch(
      `https://raw.githubusercontent.com/${CONFIG.GITHUB_REPO}/${CONFIG.GITHUB_BRANCH}/content/tags/tags.json`
    );
    
    if (!response.ok) throw new Error('Not found');
    let data = await response.json();
    
    if (data.tags && data.tags.length > 0) {
      el.innerHTML = data.tags.slice(0, 20).map(tag => {
        let name = tag.title || tag.name || 'untitled';
        return `<a href="/tag/${escapeHtml(tag.slug)}">${escapeHtml(name)}</a>`;
      }).join('');
    } else {
      el.textContent = 'No tags yet';
    }
  } catch (err) {
    el.textContent = 'No tags yet';
  }
}

// ==================== LOAD RECENT POSTS ====================
async function loadWidgetRecentPosts() {
  let el = document.getElementById('widgetRecentPosts');
  if (!el) return;
  
  try {
    let response = await fetch(
      `https://api.github.com/repos/${CONFIG.GITHUB_REPO}/contents/content/posts`
    );
    
    if (!response.ok) throw new Error('Not found');
    let files = await response.json();
    
    // Fetch first 5 posts
    let posts = [];
    for (let i = 0; i < Math.min(5, files.length); i++) {
      let file = files[i];
      if (!file.name.endsWith('.json')) continue;
      
      try {
        let postResp = await fetch(file.download_url);
        let post = await postResp.json();
        posts.push(post);
      } catch (e) {}
    }
    
    // Sort by date
    posts.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    
    if (posts.length > 0) {
      el.innerHTML = posts.map(post => 
        `<li><a href="/post/${escapeHtml(post.permalink)}">${escapeHtml(post.title)}</a></li>`
      ).join('');
    } else {
      el.innerHTML = '<li>No posts yet</li>';
    }
  } catch (err) {
    el.innerHTML = '<li>No posts yet</li>';
  }
}

// ==================== SEARCH ====================
function doSearch() {
  let input = document.getElementById('widgetSearch');
  if (!input) return;
  let query = input.value.trim();
  if (query) {
    window.location.href = '/search.html?q=' + encodeURIComponent(query);
  }
}

console.log('✅ f-widgets.js loaded');
