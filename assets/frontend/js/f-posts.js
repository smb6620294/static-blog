/* ============================================
   F-POSTS.JS - Frontend Posts Loader with Pagination
   Empty fields → empty space (no shifts)
   ============================================ */

let frontendConfig = null;
let allPosts = [];
let currentPage = 1;
let totalPages = 1;

// ==================== LOAD CONFIG ====================
async function loadFrontendConfig() {
  try {
    let response = await fetch(
      `https://raw.githubusercontent.com/${CONFIG.GITHUB_REPO}/${CONFIG.GITHUB_BRANCH}/config/frontend.config.json`
    );
    
    if (response.ok) {
      frontendConfig = await response.json();
      console.log('✅ Frontend config loaded');
    } else {
      frontendConfig = getDefaultConfig();
    }
  } catch (err) {
    frontendConfig = getDefaultConfig();
  }
  
  return frontendConfig;
}

function getDefaultConfig() {
  return {
    homepage: {
      posts_per_page: 10,
      pagination_type: 'numbered',
      pagination_pages_shown: 5,
      show_featured_image: true,
      show_excerpt: true,
      excerpt_length: 200,
      show_author: true,
      show_date: true,
      show_categories: true,
      show_tags: true,
      read_more_text: 'Read More →'
    }
  };
}

// ==================== LOAD ALL POSTS ====================
async function loadAllPosts() {
  let container = document.getElementById('postsContainer');
  if (!container) return;
  
  container.innerHTML = '<div style="text-align:center;padding:40px;background:#fff;border-radius:8px;"><div class="spinner"></div><div>Loading posts...</div></div>';
  
  try {
    let response = await fetch(
      `https://api.github.com/repos/${CONFIG.GITHUB_REPO}/contents/content/posts`
    );
    
    if (!response.ok) throw new Error('Failed to fetch posts');
    let files = await response.json();
    
    allPosts = [];
    for (let file of files) {
      if (!file.name.endsWith('.json')) continue;
      try {
        let postResp = await fetch(file.download_url);
        let post = await postResp.json();
        allPosts.push(post);
      } catch (e) {}
    }
    
    allPosts.sort((a, b) => {
      let dateA = (a.date || '') + ' ' + (a.time || '');
      let dateB = (b.date || '') + ' ' + (b.time || '');
      return dateB.localeCompare(dateA);
    });
    
    let perPage = frontendConfig.homepage.posts_per_page || 10;
    totalPages = Math.ceil(allPosts.length / perPage);
    
    let urlParams = new URLSearchParams(window.location.search);
    currentPage = parseInt(urlParams.get('page')) || 1;
    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;
    
    renderPage(currentPage);
    
  } catch (err) {
    container.innerHTML = '<div style="text-align:center;padding:40px;color:#d63638;">Error loading posts</div>';
  }
}

// ==================== RENDER PAGE ====================
function renderPage(page) {
  let container = document.getElementById('postsContainer');
  let settings = frontendConfig.homepage;
  let perPage = settings.posts_per_page || 10;
  
  let startIndex = (page - 1) * perPage;
  let endIndex = startIndex + perPage;
  let pagePosts = allPosts.slice(startIndex, endIndex);
  
  if (pagePosts.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:40px;background:#fff;border-radius:8px;color:#666;">No posts yet</div>';
    return;
  }
  
  let html = '';
  
  pagePosts.forEach((post, index) => {
    html += renderPostCard(post, settings);
    
    if ((index + 1) % 3 === 0 && index < pagePosts.length - 1) {
      html += '<div class="adsense-placeholder" data-slot="between-posts" style="margin: 10px 0;"></div>';
    }
  });
  
  html += '<div class="adsense-placeholder tall" data-slot="index-bottom-banner"></div>';
  html += renderPagination(page, totalPages, settings.pagination_type, settings.pagination_pages_shown);
  
  container.innerHTML = html;
  
  if (typeof loadAdSenseBlocks === 'function') {
    loadAdSenseBlocks();
  }
  
  if (page > 1) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// ==================== RENDER POST CARD ====================
function renderPostCard(post, settings) {
  // ============ EXCERPT ============
  let excerpt = '';
  if (settings.show_excerpt) {
    excerpt = post.excerpt || '';
    if (!excerpt && post.content) {
      let tmp = document.createElement('div');
      tmp.innerHTML = post.content;
      let fullText = tmp.textContent || '';
      let words = fullText.split(/\s+/).slice(0, settings.excerpt_length || 200);
      excerpt = words.join(' ') + '...';
    }
  }
  
  // ============ IMAGE — ہمیشہ جگہ رہے (چاہے خالی ہو) ============
  let imageHtml = '';
  if (settings.show_featured_image) {
    if (post.image && post.image.trim() !== '') {
      imageHtml = `<div class="post-image" style="background-image: url('${escapeHtml(post.image)}');"></div>`;
    } else {
      imageHtml = '<div class="post-image"></div>';
    }
  }
  
  // ============ META — خالی جگہ رہے اگر دونوں خالی ہوں ============
  let metaHtml = '';
  if (settings.show_date || settings.show_author) {
    metaHtml = '<div class="post-meta">';
    if (settings.show_date) {
      metaHtml += `<span>📅 ${escapeHtml(post.date || '')}</span>`;
    }
    if (settings.show_author) {
      metaHtml += `<span>👤 ${escapeHtml(post.author || '')}</span>`;
    }
    metaHtml += '</div>';
  }
  
  // ============ CATEGORIES ============
  let catsHtml = '';
  if (settings.show_categories && post.categories && post.categories.length > 0) {
    catsHtml = post.categories.slice(0, 3).map(cat => 
      `<a href="/category/${escapeHtml(generateSlug(cat))}">${escapeHtml(cat)}</a>`
    ).join('');
  }
  
  // ============ TAGS ============
  let tagsHtml = '';
  if (settings.show_tags && post.tags && post.tags.length > 0) {
    tagsHtml = post.tags.slice(0, 3).map(tag => 
      `<a href="/tag/${escapeHtml(generateSlug(tag))}">${escapeHtml(tag)}</a>`
    ).join('');
  }
  
  // ============ EXCERPT HTML ============
  let excerptHtml = '';
  if (settings.show_excerpt) {
    excerptHtml = `<div class="post-excerpt">${escapeHtml(excerpt)}</div>`;
  }
  
  // ============ POST CARD ============
  return `
    <article class="post-card">
      <a href="/post/${escapeHtml(post.permalink || post.id)}" class="post-title-link">
        <h2 class="post-title">${escapeHtml(post.title || 'Untitled')}</h2>
      </a>
      
      <div class="adsense-placeholder" data-slot="after-post-title" style="margin: 12px 24px;"></div>
      
      ${metaHtml}
      
      <div class="post-body ${settings.show_featured_image ? 'with-image' : 'no-image'}">
        ${imageHtml}
        ${excerptHtml}
      </div>
      
      <div class="post-footer">
        <div class="post-tags">${catsHtml} ${tagsHtml}</div>
        <a href="/post/${escapeHtml(post.permalink || post.id)}" class="read-more">${escapeHtml(settings.read_more_text || 'Read More →')}</a>
      </div>
    </article>
  `;
}

// ==================== RENDER PAGINATION ====================
function renderPagination(currentPage, totalPages, type, pagesShown) {
  if (totalPages <= 1) return '';
  
  let html = '<nav class="pagination">';
  
  if (type === 'prev-next') {
    html += currentPage > 1 
      ? `<a href="?page=${currentPage - 1}" class="page-link">← Previous</a>`
      : `<span class="page-link disabled">← Previous</span>`;
    html += `<span class="page-info">Page ${currentPage} of ${totalPages}</span>`;
    html += currentPage < totalPages 
      ? `<a href="?page=${currentPage + 1}" class="page-link">Next →</a>`
      : `<span class="page-link disabled">Next →</span>`;
  } else if (type === 'load-more') {
    html += currentPage < totalPages
      ? `<button class="page-link load-more" onclick="loadNextPage()">Load More Posts</button>`
      : `<span class="page-info">All posts loaded</span>`;
  } else {
    html += currentPage > 1 
      ? `<a href="?page=${currentPage - 1}" class="page-link">← Prev</a>`
      : `<span class="page-link disabled">← Prev</span>`;
    
    let start = Math.max(1, currentPage - Math.floor(pagesShown / 2));
    let end = Math.min(totalPages, start + pagesShown - 1);
    if (end - start + 1 < pagesShown) start = Math.max(1, end - pagesShown + 1);
    
    if (start > 1) {
      html += `<a href="?page=1" class="page-link">1</a>`;
      if (start > 2) html += `<span class="page-dots">...</span>`;
    }
    
    for (let i = start; i <= end; i++) {
      html += i === currentPage
        ? `<span class="page-link current">${i}</span>`
        : `<a href="?page=${i}" class="page-link">${i}</a>`;
    }
    
    if (end < totalPages) {
      if (end < totalPages - 1) html += `<span class="page-dots">...</span>`;
      html += `<a href="?page=${totalPages}" class="page-link">${totalPages}</a>`;
    }
    
    html += currentPage < totalPages 
      ? `<a href="?page=${currentPage + 1}" class="page-link">Next →</a>`
      : `<span class="page-link disabled">Next →</span>`;
  }
  
  html += '</nav>';
  return html;
}

// ==================== LOAD MORE ====================
function loadNextPage() {
  if (currentPage < totalPages) {
    currentPage++;
    renderPage(currentPage);
    window.history.pushState({}, '', '?page=' + currentPage);
  }
}

// ==================== INITIALIZE ====================
async function initFrontendPosts() {
  await loadFrontendConfig();
  await loadAllPosts();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFrontendPosts);
} else {
  initFrontendPosts();
}

console.log('✅ f-posts.js loaded — empty fields → empty space');
