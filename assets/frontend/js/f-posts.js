/* ============================================
   F-POSTS.JS - Frontend Posts Loader
   Path: /assets/frontend/js/f-posts.js
   
   PURPOSE:
     Load posts from GitHub, render listing pages,
     inject ads at specific positions.
   
   AD PLACEMENT RULES:
   
   Case A: Multiple posts (2 or more)
     1. after-post-title  → Below 1st post title
     2. after-post-title  → Below 2nd post title
     3. after-last-post   → After last post (before pagination)
   
   Case B: Single post only
     1. after-post-title  → Below the only post title
     2. after-last-post   → After the only post (pagination hidden)
   
   NOTE:
     - Pagination hidden when only 1 post on page
     - after-pagination slot disabled for now
     - Multi-language support deferred to future phase
   ============================================ */

let frontendConfig = null;
let allPosts = [];
let currentPage = 1;
let totalPages = 1;

/* --------------------------------------------
   LOAD FRONTEND CONFIG
   Fetches config from GitHub raw content
   -------------------------------------------- */
async function loadFrontendConfig() {
  try {
    const response = await fetch(
      `https://raw.githubusercontent.com/${CONFIG.GITHUB_REPO}/${CONFIG.GITHUB_BRANCH}/config/frontend.config.json`
    );
    if (response.ok) {
      frontendConfig = await response.json();
      console.log('✅ Frontend config loaded');
    } else {
      frontendConfig = getDefaultConfig();
    }
  } catch (err) {
    console.warn('⚠️ Config fetch failed, using defaults');
    frontendConfig = getDefaultConfig();
  }
  return frontendConfig;
}

/* --------------------------------------------
   DEFAULT CONFIG FALLBACK
   Used when remote config is unavailable
   -------------------------------------------- */
function getDefaultConfig() {
  return {
    homepage: {
      posts_per_page: 10,
      pagination_type: 'numbered',
      pagination_pages_shown: 5,
      show_featured_image: true,
      show_excerpt: true,
      excerpt_length: 25,
      show_author: true,
      show_date: true,
      show_categories: true,
      show_tags: true,
      read_more_text: 'Read More →'
    }
  };
}

/* --------------------------------------------
   GENERATE EXCERPT
   Uses custom excerpt if provided, else content
   -------------------------------------------- */
function generateExcerpt(post, settings) {
  const maxWords = settings.excerpt_length || 25;
  let source = '';

  if (post.excerpt && post.excerpt.trim() !== '') {
    source = post.excerpt.trim();
  } else if (post.content) {
    const tmp = document.createElement('div');
    tmp.innerHTML = post.content;
    source = (tmp.textContent || '').trim();
  }

  if (!source) return '';

  const words = source.split(/\s+/).filter(w => w.length > 0);
  if (words.length <= maxWords) return words.join(' ');
  return words.slice(0, maxWords).join(' ') + '...';
}

/* --------------------------------------------
   LOAD ALL POSTS FROM GITHUB
   Fetches each post JSON, sorts by date desc
   -------------------------------------------- */
async function loadAllPosts() {
  const container = document.getElementById('postsContainer');
  if (!container) return;

  container.innerHTML =
    '<div style="text-align:center;padding:40px;background:#fff;border-radius:8px;">' +
    '<div class="spinner"></div><div>Loading posts...</div></div>';

  try {
    const response = await fetch(
      `https://api.github.com/repos/${CONFIG.GITHUB_REPO}/contents/content/posts`
    );
    if (!response.ok) throw new Error('Failed to fetch posts list');

    const files = await response.json();
    allPosts = [];

    for (const file of files) {
      if (!file.name.endsWith('.json')) continue;
      try {
        const postResp = await fetch(file.download_url);
        const post = await postResp.json();
        allPosts.push(post);
      } catch (e) {
        console.warn('Post load failed:', file.name);
      }
    }

    // Sort newest first
    allPosts.sort((a, b) => {
      const dateA = (a.date || '') + ' ' + (a.time || '');
      const dateB = (b.date || '') + ' ' + (b.time || '');
      return dateB.localeCompare(dateA);
    });

    const perPage = frontendConfig.homepage.posts_per_page || 10;
    totalPages = Math.ceil(allPosts.length / perPage) || 1;

    const urlParams = new URLSearchParams(window.location.search);
    currentPage = parseInt(urlParams.get('page')) || 1;
    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;

    renderPage(currentPage);
  } catch (err) {
    console.error('Posts load error:', err);
    container.innerHTML =
      '<div style="text-align:center;padding:40px;color:#d63638;">Error loading posts</div>';
  }
}

/* --------------------------------------------
   RENDER PAGE (Listing)
   
   Ad Slots Rendered:
     - after-post-title  (1st post, 2nd post)
     - after-last-post   (after all posts)
   
   Pagination Rendered:
     - Only if totalPages > 1 AND page has >1 post
   -------------------------------------------- */
function renderPage(page) {
  const container = document.getElementById('postsContainer');
  const settings = frontendConfig.homepage;
  const perPage = settings.posts_per_page || 10;
  const startIndex = (page - 1) * perPage;
  const endIndex = startIndex + perPage;
  const pagePosts = allPosts.slice(startIndex, endIndex);

  if (pagePosts.length === 0) {
    container.innerHTML =
      '<div style="text-align:center;padding:40px;background:#fff;border-radius:8px;color:#666;">No posts yet</div>';
    return;
  }

  const totalPostsOnPage = pagePosts.length;
  const hasPagination = totalPages > 1 && totalPostsOnPage > 1;

  let html = '';

  // Render each post
  pagePosts.forEach((post, index) => {
    // Show title ad on first two posts only
    const showTitleAd = (index < 2);
    html += renderPostCard(post, settings, showTitleAd);
  });

  // Ad #3: after-last-post (always after all posts)
  html += '<div class="adsense-placeholder tall" data-slot="after-last-post" style="margin: 20px 0;"></div>';

  // Pagination container (only if applicable)
  if (hasPagination) {
    html += '<div id="paginationContainer"></div>';
  } else {
    console.log('ℹ️ Single post on page — pagination hidden');
  }

  container.innerHTML = html;

  // Initialize modular pagination
  if (hasPagination && typeof initPagination === 'function') {
    initPagination({
      currentPage: page,
      totalPages: totalPages,
      context: 'index',
      contextValue: '',
      pagesShown: settings.pagination_pages_shown || 5,
      type: settings.pagination_type || 'numbered'
    });
  }

  // Re-run AdSense injector for newly created placeholders
  if (typeof reloadAdSense === 'function') {
    setTimeout(reloadAdSense, 300);
  }

  if (page > 1) window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* --------------------------------------------
   RENDER SINGLE POST CARD
   
   Structure:
     <article>
       <a><h2>Title</h2></a>
       [after-post-title ad if showTitleAd]
       <div>Author/Date</div>
       <div>Image + Excerpt</div>
       <div>Tags + Read More</div>
     </article>
   -------------------------------------------- */
function renderPostCard(post, settings, showTitleAd) {
  // Excerpt
  let excerpt = '';
  if (settings.show_excerpt) {
    excerpt = generateExcerpt(post, settings);
  }

  // Featured image
  let imageHtml = '';
  if (settings.show_featured_image) {
    if (post.image && post.image.trim() !== '') {
      imageHtml = `<div class="post-image" style="background-image: url('${escapeHtml(post.image)}');"></div>`;
    } else {
      imageHtml = '<div class="post-image"></div>';
    }
  }

  // Meta (Author + Date)
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

  // Ad after title (conditional)
  let adAfterTitle = '';
  if (showTitleAd) {
    adAfterTitle = '<div class="adsense-placeholder" data-slot="after-post-title" style="margin: 12px 24px;"></div>';
  }

  // Categories
  let catsHtml = '';
  if (settings.show_categories && post.categories && post.categories.length > 0) {
    catsHtml = post.categories.slice(0, 3).map(cat =>
      `<a href="/category/${escapeHtml(generateSlug(cat))}/">${escapeHtml(cat)}</a>`
    ).join('');
  }

  // Tags
  let tagsHtml = '';
  if (settings.show_tags && post.tags && post.tags.length > 0) {
    tagsHtml = post.tags.slice(0, 3).map(tag =>
      `<a href="/tag/${escapeHtml(generateSlug(tag))}/">${escapeHtml(tag)}</a>`
    ).join('');
  }

  // Excerpt HTML
  let excerptHtml = '';
  if (settings.show_excerpt && excerpt) {
    excerptHtml = `<div class="post-excerpt">${escapeHtml(excerpt)}</div>`;
  }

  // Final card markup
  return `
    <article class="post-card">
      <a href="/post/${escapeHtml(post.permalink || post.id)}/" class="post-title-link">
        <h2 class="post-title">${escapeHtml(post.title || 'Untitled')}</h2>
      </a>
      ${adAfterTitle}
      ${metaHtml}
      <div class="post-body ${settings.show_featured_image ? 'with-image' : 'no-image'}">
        ${imageHtml}
        ${excerptHtml}
      </div>
      <div class="post-footer">
        <div class="post-tags">${catsHtml} ${tagsHtml}</div>
        <a href="/post/${escapeHtml(post.permalink || post.id)}/" class="read-more">${escapeHtml(settings.read_more_text || 'Read More →')}</a>
      </div>
    </article>
  `;
}

/* --------------------------------------------
   INIT
   -------------------------------------------- */
async function initFrontendPosts() {
  await loadFrontendConfig();
  await loadAllPosts();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFrontendPosts);
} else {
  initFrontendPosts();
}

console.log('✅ f-posts.js loaded — ad slots: after-post-title x2 + after-last-post');
