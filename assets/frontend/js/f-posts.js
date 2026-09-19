/* ============================================
   F-POSTS.JS - Frontend Posts Loader
   Path: /assets/frontend/js/f-posts.js
   
   Ad Placement:
     1. after-post-title  → پوسٹ ٹائٹل کے نیچے، Author/Date سے اوپر
                            (صرف پہلی 2 پوسٹوں میں)
     2. between-posts     → 3rd پوسٹ کے بعد ایک بار
     3. index-bottom-banner → تمام پوسٹوں کے بعد
     4. after-pagination  → pagination کے بعد (اگر pagination ہو)
   ============================================ */

let frontendConfig = null;
let allPosts = [];
let currentPage = 1;
let totalPages = 1;

/* --------------------------------------------
   LOAD FRONTEND CONFIG
   -------------------------------------------- */
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
   EXCERPT GENERATOR
   -------------------------------------------- */
function generateExcerpt(post, settings) {
  let maxWords = settings.excerpt_length || 25;
  let source = '';

  if (post.excerpt && post.excerpt.trim() !== '') {
    source = post.excerpt.trim();
  } else if (post.content) {
    let tmp = document.createElement('div');
    tmp.innerHTML = post.content;
    source = (tmp.textContent || '').trim();
  }

  if (!source) return '';

  let words = source.split(/\s+/).filter(w => w.length > 0);
  if (words.length <= maxWords) return words.join(' ');
  return words.slice(0, maxWords).join(' ') + '...';
}

/* --------------------------------------------
   LOAD ALL POSTS FROM GITHUB
   -------------------------------------------- */
async function loadAllPosts() {
  let container = document.getElementById('postsContainer');
  if (!container) return;

  container.innerHTML =
    '<div style="text-align:center;padding:40px;background:#fff;border-radius:8px;">' +
    '<div class="spinner"></div><div>Loading posts...</div></div>';

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
    totalPages = Math.ceil(allPosts.length / perPage) || 1;

    let urlParams = new URLSearchParams(window.location.search);
    currentPage = parseInt(urlParams.get('page')) || 1;
    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;

    renderPage(currentPage);
  } catch (err) {
    console.error(err);
    container.innerHTML =
      '<div style="text-align:center;padding:40px;color:#d63638;">Error loading posts</div>';
  }
}

/* --------------------------------------------
   RENDER PAGE
   -------------------------------------------- */
function renderPage(page) {
  let container = document.getElementById('postsContainer');
  let settings = frontendConfig.homepage;
  let perPage = settings.posts_per_page || 10;
  let startIndex = (page - 1) * perPage;
  let endIndex = startIndex + perPage;
  let pagePosts = allPosts.slice(startIndex, endIndex);

  if (pagePosts.length === 0) {
    container.innerHTML =
      '<div style="text-align:center;padding:40px;background:#fff;border-radius:8px;color:#666;">No posts yet</div>';
    return;
  }

  let html = '';
  let hasPagination = totalPages > 1;

  pagePosts.forEach((post, index) => {
    // ✅ Ad #1 & #2 → ٹائٹل کے نیچے، Author/Date سے اوپر
    //    صرف پہلی 2 پوسٹوں میں
    let showTitleAd = (index < 2);

    html += renderPostCard(post, settings, showTitleAd);

    // ✅ Between Posts Ad → صرف 3rd پوسٹ کے بعد (ایک بار)
    if (index === 2 && pagePosts.length > 3) {
      html += '<div class="adsense-placeholder" data-slot="between-posts" style="margin: 15px 0;"></div>';
    }
  });

  // ✅ Bottom Banner → تمام پوسٹوں کے بعد
  html += '<div class="adsense-placeholder tall" data-slot="index-bottom-banner" style="margin: 20px 0;"></div>';

  // ✅ After Pagination → صرف اگر pagination موجود ہو
  if (hasPagination) {
    html += '<div class="adsense-placeholder" data-slot="after-pagination" style="margin: 30px 0 10px;"></div>';
  }

  container.innerHTML = html;

  // Init modular pagination
  if (typeof initPagination === 'function') {
    initPagination({
      currentPage: page,
      totalPages: totalPages,
      context: 'index',
      contextValue: '',
      pagesShown: settings.pagination_pages_shown || 5,
      type: settings.pagination_type || 'numbered'
    });
  }

  // ✅ Re-run AdSense injector to fill newly created placeholders
  if (typeof reloadAdSense === 'function') {
    setTimeout(reloadAdSense, 300);
  }

  if (page > 1) window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* --------------------------------------------
   RENDER SINGLE POST CARD
   
   Ad Placement: post-title کے فوراً بعد، post-meta سے پہلے
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

  // ✅ Ad slot placed BETWEEN title and meta
  let adAfterTitle = '';
  if (showTitleAd) {
    adAfterTitle = '<div class="adsense-placeholder" data-slot="after-post-title" style="margin: 12px 24px;"></div>';
  }

  // Categories
  let catsHtml = '';
  if (settings.show_categories && post.categories && post.categories.length > 0) {
    catsHtml = post.categories.slice(0, 3).map(cat =>
      `<a href="/category/${escapeHtml(generateSlug(cat))}">${escapeHtml(cat)}</a>`
    ).join('');
  }

  // Tags
  let tagsHtml = '';
  if (settings.show_tags && post.tags && post.tags.length > 0) {
    tagsHtml = post.tags.slice(0, 3).map(tag =>
      `<a href="/tag/${escapeHtml(generateSlug(tag))}">${escapeHtml(tag)}</a>`
    ).join('');
  }

  // Excerpt
  let excerptHtml = '';
  if (settings.show_excerpt && excerpt) {
    excerptHtml = `<div class="post-excerpt">${escapeHtml(excerpt)}</div>`;
  }

  // Final card markup
  return `
    <article class="post-card">
      <a href="/post/${escapeHtml(post.permalink || post.id)}" class="post-title-link">
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
        <a href="/post/${escapeHtml(post.permalink || post.id)}" class="read-more">${escapeHtml(settings.read_more_text || 'Read More →')}</a>
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

console.log('✅ f-posts.js loaded — title ad + between posts + bottom + after pagination');
