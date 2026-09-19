/* ============================================
   F-POSTS.JS - Frontend Posts Loader
   Path: /assets/frontend/js/f-posts.js

   PURPOSE:
     Load posts from GitHub, render listing pages,
     inject ads at specific positions.

   NOTE:
     Uses ONLY ES5 syntax for maximum compatibility.
     Wrapped in IIFE to avoid global scope conflicts.
     Delayed init to avoid race conditions.
   ============================================ */

(function () {
  'use strict';

  // Private state (not exposed to window)
  var frontendConfig = null;
  var allPosts = [];
  var currentPage = 1;
  var internalTotalPages = 1;

  /* --------------------------------------------
     LOAD FRONTEND CONFIG
     -------------------------------------------- */
  function loadFrontendConfig() {
    var url = 'https://raw.githubusercontent.com/' + CONFIG.GITHUB_REPO + '/' + CONFIG.GITHUB_BRANCH + '/config/frontend.config.json';

    return fetch(url)
      .then(function (response) {
        if (response.ok) {
          return response.json();
        }
        return getDefaultConfig();
      })
      .then(function (data) {
        frontendConfig = data;
        console.log('[OK] Frontend config loaded');
        return frontendConfig;
      })
      .catch(function (err) {
        console.warn('[WARN] Config fetch failed, using defaults');
        frontendConfig = getDefaultConfig();
        return frontendConfig;
      });
  }

  /* --------------------------------------------
     DEFAULT CONFIG FALLBACK
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
        read_more_text: 'Read More'
      }
    };
  }

  /* --------------------------------------------
     GENERATE EXCERPT
     -------------------------------------------- */
  function generateExcerpt(post, settings) {
    var maxWords = settings.excerpt_length || 25;
    var source = '';

    if (post.excerpt && post.excerpt.trim() !== '') {
      source = post.excerpt.trim();
    } else if (post.content) {
      var tmp = document.createElement('div');
      tmp.innerHTML = post.content;
      source = (tmp.textContent || '').trim();
    }

    if (!source) return '';

    var words = source.split(/\s+/).filter(function (w) {
      return w.length > 0;
    });

    if (words.length <= maxWords) return words.join(' ');
    return words.slice(0, maxWords).join(' ') + '...';
  }

  /* --------------------------------------------
     LOAD ALL POSTS FROM GITHUB
     -------------------------------------------- */
  function loadAllPosts() {
    var container = document.getElementById('postsContainer');
    if (!container) {
      console.warn('[WARN] postsContainer not found');
      return Promise.resolve();
    }

    container.innerHTML = '<div style="text-align:center;padding:40px;background:#fff;border-radius:8px;">' +
      '<div class="spinner"></div><div>Loading posts...</div></div>';

    var apiUrl = 'https://api.github.com/repos/' + CONFIG.GITHUB_REPO + '/contents/content/posts';

    console.log('[INFO] Fetching posts from: ' + apiUrl);

    return fetch(apiUrl)
      .then(function (response) {
        console.log('[INFO] Posts list status: ' + response.status);
        if (!response.ok) throw new Error('Failed to fetch posts list: ' + response.status);
        return response.json();
      })
      .then(function (files) {
        console.log('[INFO] Got ' + files.length + ' files');

        var promises = [];

        files.forEach(function (file) {
          if (!file.name.endsWith('.json')) return;

          var p = fetch(file.download_url)
            .then(function (r) {
              return r.ok ? r.json() : null;
            })
            .catch(function () {
              console.warn('Post load failed:', file.name);
              return null;
            });

          promises.push(p);
        });

        return Promise.all(promises);
      })
      .then(function (posts) {
        allPosts = posts.filter(function (p) {
          return p !== null;
        });

        console.log('[OK] Loaded ' + allPosts.length + ' posts');

        allPosts.sort(function (a, b) {
          var dateA = (a.date || '') + ' ' + (a.time || '');
          var dateB = (b.date || '') + ' ' + (b.time || '');
          return dateB.localeCompare(dateA);
        });

        var perPage = frontendConfig.homepage.posts_per_page || 10;
        internalTotalPages = Math.ceil(allPosts.length / perPage) || 1;

        var urlParams = new URLSearchParams(window.location.search);
        currentPage = parseInt(urlParams.get('page')) || 1;
        if (currentPage < 1) currentPage = 1;
        if (currentPage > internalTotalPages) currentPage = internalTotalPages;

        renderPage(currentPage);
      })
      .catch(function (err) {
        console.error('[ERROR] Posts load error:', err);
        container.innerHTML = '<div style="text-align:center;padding:40px;color:#d63638;">Error loading posts: ' + err.message + '</div>';
      });
  }

  /* --------------------------------------------
     RENDER PAGE (Listing)
     -------------------------------------------- */
  function renderPage(page) {
    var container = document.getElementById('postsContainer');
    var settings = frontendConfig.homepage;
    var perPage = settings.posts_per_page || 10;
    var startIndex = (page - 1) * perPage;
    var endIndex = startIndex + perPage;
    var pagePosts = allPosts.slice(startIndex, endIndex);

    if (pagePosts.length === 0) {
      container.innerHTML = '<div style="text-align:center;padding:40px;background:#fff;border-radius:8px;color:#666;">No posts yet</div>';
      return;
    }

    var totalPostsOnPage = pagePosts.length;
    var hasPagination = internalTotalPages > 1 && totalPostsOnPage > 1;

    var html = '';

    pagePosts.forEach(function (post, index) {
      var showTitleAd = index < 2;
      html += renderPostCard(post, settings, showTitleAd);
    });

    html += '<div class="adsense-placeholder tall" data-slot="after-last-post" style="margin: 20px 0;"></div>';

    if (hasPagination) {
      html += '<div id="paginationContainer"></div>';
    } else {
      console.log('[INFO] Single post on page - pagination hidden');
    }

    container.innerHTML = html;

    if (hasPagination && typeof initPagination === 'function') {
      initPagination({
        currentPage: page,
        totalPages: internalTotalPages,
        context: 'index',
        contextValue: '',
        pagesShown: settings.pagination_pages_shown || 5,
        type: settings.pagination_type || 'numbered'
      });
    }

    if (typeof reloadAdSense === 'function') {
      setTimeout(reloadAdSense, 300);
    }

    if (page > 1) window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* --------------------------------------------
     RENDER SINGLE POST CARD
     -------------------------------------------- */
  function renderPostCard(post, settings, showTitleAd) {
    var excerpt = '';
    if (settings.show_excerpt) {
      excerpt = generateExcerpt(post, settings);
    }

    var imageHtml = '';
    if (settings.show_featured_image) {
      if (post.image && post.image.trim() !== '') {
        imageHtml = '<div class="post-image" style="background-image: url(' + "'" + escapeHtml(post.image) + "'" + ');"></div>';
      } else {
        imageHtml = '<div class="post-image"></div>';
      }
    }

    var metaHtml = '';
    if (settings.show_date || settings.show_author) {
      metaHtml = '<div class="post-meta">';
      if (settings.show_date) {
        metaHtml += '<span>Date: ' + escapeHtml(post.date || '') + '</span>';
      }
      if (settings.show_author) {
        metaHtml += '<span>Author: ' + escapeHtml(post.author || '') + '</span>';
      }
      metaHtml += '</div>';
    }

    var adAfterTitle = '';
    if (showTitleAd) {
      adAfterTitle = '<div class="adsense-placeholder" data-slot="after-post-title" style="margin: 12px 24px;"></div>';
    }

    var catsHtml = '';
    if (settings.show_categories && post.categories && post.categories.length > 0) {
      catsHtml = post.categories.slice(0, 3).map(function (cat) {
        return '<a href="/category/' + escapeHtml(generateSlug(cat)) + '/">' + escapeHtml(cat) + '</a>';
      }).join('');
    }

    var tagsHtml = '';
    if (settings.show_tags && post.tags && post.tags.length > 0) {
      tagsHtml = post.tags.slice(0, 3).map(function (tag) {
        return '<a href="/tag/' + escapeHtml(generateSlug(tag)) + '/">' + escapeHtml(tag) + '</a>';
      }).join('');
    }

    var excerptHtml = '';
    if (settings.show_excerpt && excerpt) {
      excerptHtml = '<div class="post-excerpt">' + escapeHtml(excerpt) + '</div>';
    }

    return '<article class="post-card">' +
        '<a href="/post/' + escapeHtml(post.permalink || post.id) + '/" class="post-title-link">' +
          '<h2 class="post-title">' + escapeHtml(post.title || 'Untitled') + '</h2>' +
        '</a>' +
        adAfterTitle +
        metaHtml +
        '<div class="post-body ' + (settings.show_featured_image ? 'with-image' : 'no-image') + '">' +
          imageHtml +
          excerptHtml +
        '</div>' +
        '<div class="post-footer">' +
          '<div class="post-tags">' + catsHtml + ' ' + tagsHtml + '</div>' +
          '<a href="/post/' + escapeHtml(post.permalink || post.id) + '/" class="read-more">' + escapeHtml(settings.read_more_text || 'Read More') + '</a>' +
        '</div>' +
      '</article>';
  }

  /* --------------------------------------------
     INIT
     -------------------------------------------- */
  function initFrontendPosts() {
    console.log('[INFO] initFrontendPosts called');
    loadFrontendConfig().then(function () {
      loadAllPosts();
    });
  }

  // Expose for manual debugging
  window.initFrontendPosts = initFrontendPosts;

  // ✅ DELAYED INIT — wait for other modules to finish
  function delayedInit() {
    setTimeout(initFrontendPosts, 500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', delayedInit);
  } else {
    delayedInit();
  }

  console.log('[OK] f-posts.js loaded — delayed init enabled');

})();
