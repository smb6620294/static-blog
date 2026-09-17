/* ============================================
   F-POSTS.JS - Load posts from GitHub
   ============================================ */

const POSTS_FOLDER_FRONTEND = 'content/posts';

// ==================== LOAD ALL POSTS ====================
async function loadFrontendPosts() {
  let container = document.getElementById('postsContainer');
  if (!container) return;
  
  container.innerHTML = '<div style="text-align:center;padding:40px;background:#fff;border-radius:8px;"><div class="spinner"></div><div>Loading posts...</div></div>';
  
  try {
    // Fetch file list from GitHub
    let response = await fetch(
      `https://api.github.com/repos/${CONFIG.GITHUB_REPO}/contents/${POSTS_FOLDER_FRONTEND}`
    );
    
    if (!response.ok) throw new Error('Failed to fetch posts');
    let files = await response.json();
    
    // Load all posts
    let posts = [];
    for (let file of files) {
      if (!file.name.endsWith('.json')) continue;
      
      try {
        let postResp = await fetch(file.download_url);
        let post = await postResp.json();
        posts.push(post);
      } catch (e) {
        console.warn('Could not load:', file.name);
      }
    }
    
    // Sort by date (newest first)
    posts.sort((a, b) => {
      let dateA = (a.date || '') + ' ' + (a.time || '');
      let dateB = (b.date || '') + ' ' + (b.time || '');
      return dateB.localeCompare(dateA);
    });
    
    renderFrontendPosts(posts);
    
  } catch (err) {
    console.error('❌ Posts load error:', err);
    container.innerHTML = '<div style="text-align:center;padding:40px;color:#d63638;">Error loading posts</div>';
  }
}

// ==================== RENDER POSTS ====================
function renderFrontendPosts(posts) {
  let container = document.getElementById('postsContainer');
  
  if (posts.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:40px;background:#fff;border-radius:8px;color:#666;">No posts yet</div>';
    return;
  }
  
  let html = '';
  
  posts.forEach((post, index) => {
    // AdSense block after every 3rd post (or before first post)
    if (index === 0) {
      html += '<div class="adsense-placeholder" data-slot="index-top-banner"></div>';
    }
    
    html += renderPostCard(post, index);
    
    // AdSense after each post title
    html += '<div class="adsense-placeholder" data-slot="after-post-title"></div>';
    
    // AdSense between posts (every 3rd post)
    if ((index + 1) % 3 === 0 && index < posts.length - 1) {
      html += '<div class="adsense-placeholder" data-slot="between-posts"></div>';
    }
  });
  
  // Bottom AdSense
  html += '<div class="adsense-placeholder tall" data-slot="index-bottom-banner"></div>';
  
  container.innerHTML = html;
  
  // Trigger AdSense load
  if (typeof loadAdSenseBlocks === 'function') {
    loadAdSenseBlocks();
  }
}

// ==================== RENDER SINGLE POST CARD ====================
function renderPostCard(post, index) {
  // Excerpt
  let excerpt = post.excerpt || '';
  if (!excerpt && post.content) {
    let tmp = document.createElement('div');
    tmp.innerHTML = post.content;
    excerpt = (tmp.textContent || '').substring(0, 200).trim() + '...';
  }
  
  // Image
  let imageHtml = '';
  if (post.image) {
    imageHtml = `<div class="post-image" style="background-image: url('${escapeHtml(post.image)}');"></div>`;
  } else {
    imageHtml = '<div class="post-image">📝</div>';
  }
  
  // Tags
  let tagsHtml = '';
  if (post.tags && post.tags.length > 0) {
    tagsHtml = post.tags.slice(0, 3).map(tag => 
      `<a href="/tag/${escapeHtml(generateSlug(tag))}">${escapeHtml(tag)}</a>`
    ).join('');
  }
  
  return `
    <article class="post-card">
      <a href="/post/${escapeHtml(post.permalink || post.id)}" class="post-title-link">
        <h2 class="post-title">${escapeHtml(post.title || 'Untitled')}</h2>
      </a>
      <div class="post-meta">
        <span>📅 ${escapeHtml(post.date || '')}</span>
        <span>👤 ${escapeHtml(post.author || 'Admin')}</span>
      </div>
      <div class="post-body ${post.image ? '' : 'no-image'}">
        ${post.image ? imageHtml : ''}
        <div class="post-excerpt">${escapeHtml(excerpt)}</div>
      </div>
      <div class="post-footer">
        <div class="post-tags">${tagsHtml}</div>
        <a href="/post/${escapeHtml(post.permalink || post.id)}" class="read-more">Read More →</a>
      </div>
    </article>
  `;
}

console.log('✅ f-posts.js loaded');
