/* ============================================
   F-LOAD-PAGINATION.JS
   Path: /assets/frontend/js/f-load-pagination.js
   
   PURPOSE:
     Modular pagination for listing pages.
     Supports 3 modes:
       - numbered   → « ‹ 1 2 [3] 4 5 › »
       - prev-next  → ‹ Previous    Next ›
       - load-more  → [Load More Posts]
   
   USAGE:
     initPagination({
       currentPage: 1,
       totalPages: 10,
       context: 'index',
       contextValue: '',
       pagesShown: 5,
       type: 'numbered'
     });
   ============================================ */

(function () {
  'use strict';

  /* --------------------------------------------
     STATE
     -------------------------------------------- */
  let paginationState = {
    currentPage: 1,
    totalPages: 1,
    context: 'index',
    contextValue: '',
    baseUrl: '',
    pagesShown: 5,
    type: 'numbered'
  };

  /* --------------------------------------------
     PUBLIC: INIT
     -------------------------------------------- */
  window.initPagination = function (options) {
    paginationState.currentPage = options.currentPage || 1;
    paginationState.totalPages = options.totalPages || 1;
    paginationState.context = options.context || 'index';
    paginationState.contextValue = options.contextValue || '';
    paginationState.pagesShown = options.pagesShown || 5;
    paginationState.type = options.type || 'numbered';
    paginationState.baseUrl = buildBaseUrl();

    // Load HTML component first
    loadPaginationComponent().then(() => {
      renderPagination();
    });
  };

  /* --------------------------------------------
     BUILD BASE URL
     Based on page context
     -------------------------------------------- */
  function buildBaseUrl() {
    let base = '';

    switch (paginationState.context) {
      case 'category':
        base = '/category/' + paginationState.contextValue + '/?page=';
        break;
      case 'tag':
        base = '/tag/' + paginationState.contextValue + '/?page=';
        break;
      case 'search':
        base = '/search.html?q=' +
          encodeURIComponent(paginationState.contextValue) + '&page=';
        break;
      case 'index':
      default:
        base = '/?page=';
        break;
    }

    return base;
  }

  /* --------------------------------------------
     LOAD PAGINATION COMPONENT HTML
     -------------------------------------------- */
  async function loadPaginationComponent() {
    // Already loaded?
    if (document.getElementById('paginationWrapper')) return true;

    const container = document.getElementById('paginationContainer');
    if (!container) return false;

    try {
      const response = await fetch('/assets/frontend/components/pagination.html');
      if (!response.ok) throw new Error('Pagination component not found');
      const html = await response.text();
      container.innerHTML = html;
      return true;
    } catch (err) {
      console.error('❌ Pagination load error:', err);
      return false;
    }
  }

  /* --------------------------------------------
     RENDER PAGINATION
     -------------------------------------------- */
  function renderPagination() {
    const wrapper = document.getElementById('paginationWrapper');
    const numbersEl = document.getElementById('paginationNumbers');
    const infoEl = document.getElementById('paginationInfo');
    const firstBtn = document.getElementById('pagFirst');
    const prevBtn = document.getElementById('pagPrev');
    const nextBtn = document.getElementById('pagNext');
    const lastBtn = document.getElementById('pagLast');

    if (!wrapper || !numbersEl) return;

    // Hide if only 1 page
    if (paginationState.totalPages <= 1) {
      wrapper.style.display = 'none';
      if (infoEl) infoEl.style.display = 'none';
      return;
    }

    wrapper.style.display = 'flex';

    // Disable First/Prev if on first page
    const onFirstPage = paginationState.currentPage <= 1;
    if (firstBtn) {
      firstBtn.disabled = onFirstPage;
      firstBtn.classList.toggle('disabled', onFirstPage);
    }
    if (prevBtn) {
      prevBtn.disabled = onFirstPage;
      prevBtn.classList.toggle('disabled', onFirstPage);
    }

    // Disable Next/Last if on last page
    const onLastPage = paginationState.currentPage >= paginationState.totalPages;
    if (nextBtn) {
      nextBtn.disabled = onLastPage;
      nextBtn.classList.toggle('disabled', onLastPage);
    }
    if (lastBtn) {
      lastBtn.disabled = onLastPage;
      lastBtn.classList.toggle('disabled', onLastPage);
    }

    // Render based on mode
    const type = paginationState.type;

    if (type === 'prev-next') {
      // Hide numbers and first/last
      numbersEl.innerHTML = '';
      if (firstBtn) firstBtn.style.display = 'none';
      if (lastBtn) lastBtn.style.display = 'none';
    } else if (type === 'load-more') {
      numbersEl.innerHTML =
        '<button type="button" class="pagination-loadmore" onclick="goToNextPage()">' +
        'Load More Posts</button>';
      if (firstBtn) firstBtn.style.display = 'none';
      if (lastBtn) lastBtn.style.display = 'none';
    } else {
      // numbered (default)
      numbersEl.innerHTML = renderNumbers();
    }

    // Info text
    if (infoEl) {
      infoEl.style.display = 'block';
      infoEl.textContent = 'Page ' + paginationState.currentPage +
        ' of ' + paginationState.totalPages;
    }
  }

  /* --------------------------------------------
     RENDER NUMBERED PAGES
     Format: 1 2 [3] 4 5 ... 10
     -------------------------------------------- */
  function renderNumbers() {
    const current = paginationState.currentPage;
    const total = paginationState.totalPages;
    const shown = paginationState.pagesShown;
    const baseUrl = paginationState.baseUrl;
    let html = '';

    // Calculate window of pages to show
    let start = Math.max(1, current - Math.floor(shown / 2));
    let end = Math.min(total, start + shown - 1);

    // Adjust start if end is too close to total
    if (end - start + 1 < shown) {
      start = Math.max(1, end - shown + 1);
    }

    // First page + dots
    if (start > 1) {
      html += renderNumberLink(1, current, baseUrl);
      if (start > 2) {
        html += '<span class="pagination-dots">...</span>';
      }
    }

    // Page numbers
    for (let i = start; i <= end; i++) {
      html += renderNumberLink(i, current, baseUrl);
    }

    // Dots + last page
    if (end < total) {
      if (end < total - 1) {
        html += '<span class="pagination-dots">...</span>';
      }
      html += renderNumberLink(total, current, baseUrl);
    }

    return html;
  }

  /* --------------------------------------------
     RENDER SINGLE NUMBER LINK
     -------------------------------------------- */
  function renderNumberLink(pageNum, currentPage, baseUrl) {
    const isCurrent = pageNum === currentPage;
    const className = 'pagination-number' + (isCurrent ? ' current' : '');

    if (isCurrent) {
      return '<span class="' + className + '">' +
             '<span class="pag-num">' + pageNum + '</span>' +
             '<span class="pag-block"></span>' +
             '</span>';
    }

    return '<a href="' + baseUrl + pageNum + '" class="' + className + '" ' +
           'data-page="' + pageNum + '">' +
           '<span class="pag-num">' + pageNum + '</span>' +
           '<span class="pag-block"></span>' +
           '</a>';
  }

  /* --------------------------------------------
     PUBLIC: NAVIGATION FUNCTIONS
     -------------------------------------------- */
  window.goToPage = function (pageNum) {
    if (pageNum < 1 || pageNum > paginationState.totalPages) return;
    if (pageNum === paginationState.currentPage) return;
    window.location.href = paginationState.baseUrl + pageNum;
  };

  window.goToPrevPage = function () {
    if (paginationState.currentPage > 1) {
      window.location.href =
        paginationState.baseUrl + (paginationState.currentPage - 1);
    }
  };

  window.goToNextPage = function () {
    if (paginationState.currentPage < paginationState.totalPages) {
      window.location.href =
        paginationState.baseUrl + (paginationState.currentPage + 1);
    }
  };

  /* --------------------------------------------
     EXPOSE totalPages FOR « » BUTTONS
     -------------------------------------------- */
  Object.defineProperty(window, 'totalPages', {
    get: function () { return paginationState.totalPages; }
  });

})();

console.log('✅ f-load-pagination.js loaded — numbered | prev-next | load-more');
