/* ============================================
   F-LOAD-PAGINATION.JS - Modular Pagination
   Used by: Index, Category, Tag, Search pages
   ============================================ */

(function() {
  'use strict';

  // ==================== STATE ====================
  let paginationState = {
    currentPage: 1,
    totalPages: 1,
    context: 'index',
    contextValue: '',
    baseUrl: '',
    pagesShown: 5,
    type: 'numbered'
  };

  // ==================== INIT PAGINATION ====================
  window.initPagination = function(options) {
    paginationState.currentPage = options.currentPage || 1;
    paginationState.totalPages = options.totalPages || 1;
    paginationState.context = options.context || 'index';
    paginationState.contextValue = options.contextValue || '';
    paginationState.pagesShown = options.pagesShown || 5;
    paginationState.type = options.type || 'numbered';
    
    paginationState.baseUrl = buildBaseUrl();
    
    loadPaginationComponent().then(() => {
      renderPagination();
    });
  };

  // ==================== BUILD BASE URL ====================
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
        base = '/search.html?q=' + encodeURIComponent(paginationState.contextValue) + '&page=';
        break;
      case 'index':
      default:
        base = '/?page=';
        break;
    }
    
    return base;
  }

  // ==================== LOAD COMPONENT ====================
  async function loadPaginationComponent() {
    if (document.getElementById('paginationWrapper')) return true;
    
    let container = document.getElementById('paginationContainer');
    if (!container) {
      console.warn('⚠️ paginationContainer not found');
      return false;
    }
    
    try {
      let response = await fetch('/assets/frontend/components/pagination.html');
      if (!response.ok) throw new Error('Pagination component not found');
      let html = await response.text();
      container.innerHTML = html;
      return true;
    } catch (err) {
      console.error('❌ Pagination load error:', err);
      return false;
    }
  }

  // ==================== RENDER PAGINATION ====================
  function renderPagination() {
    let wrapper = document.getElementById('paginationWrapper');
    let numbersEl = document.getElementById('paginationNumbers');
    let infoEl = document.getElementById('paginationInfo');
    let prevBtn = document.getElementById('pagPrev');
    let nextBtn = document.getElementById('pagNext');
    
    if (!wrapper || !numbersEl) return;
    
    if (paginationState.totalPages <= 1) {
      wrapper.style.display = 'none';
      if (infoEl) infoEl.style.display = 'none';
      return;
    }
    
    wrapper.style.display = 'flex';
    
    // Prev button
    if (paginationState.currentPage <= 1) {
      prevBtn.disabled = true;
      prevBtn.classList.add('disabled');
    } else {
      prevBtn.disabled = false;
      prevBtn.classList.remove('disabled');
    }
    
    // Next button
    if (paginationState.currentPage >= paginationState.totalPages) {
      nextBtn.disabled = true;
      nextBtn.classList.add('disabled');
    } else {
      nextBtn.disabled = false;
      nextBtn.classList.remove('disabled');
    }
    
    // Numbers
    let type = paginationState.type;
    
    if (type === 'prev-next') {
      numbersEl.innerHTML = '';
    } else if (type === 'load-more') {
      numbersEl.innerHTML = `
        <button type="button" class="pagination-loadmore" onclick="goToNextPage()">
          Load More Posts
        </button>
      `;
    } else {
      numbersEl.innerHTML = renderNumbers();
    }
    
    // Info
    if (infoEl) {
      infoEl.style.display = 'block';
      infoEl.textContent = 'Page ' + paginationState.currentPage + ' of ' + paginationState.totalPages;
    }
  }

  // ==================== RENDER NUMBERS ====================
  function renderNumbers() {
    let current = paginationState.currentPage;
    let total = paginationState.totalPages;
    let shown = paginationState.pagesShown;
    let baseUrl = paginationState.baseUrl;
    
    let html = '';
    
    let start = Math.max(1, current - Math.floor(shown / 2));
    let end = Math.min(total, start + shown - 1);
    if (end - start + 1 < shown) start = Math.max(1, end - shown + 1);
    
    if (start > 1) {
      html += renderNumberLink(1, current, baseUrl);
      if (start > 2) {
        html += '<span class="pagination-dots">...</span>';
      }
    }
    
    for (let i = start; i <= end; i++) {
      html += renderNumberLink(i, current, baseUrl);
    }
    
    if (end < total) {
      if (end < total - 1) {
        html += '<span class="pagination-dots">...</span>';
      }
      html += renderNumberLink(total, current, baseUrl);
    }
    
    return html;
  }

  // ==================== RENDER SINGLE NUMBER ====================
  function renderNumberLink(pageNum, currentPage, baseUrl) {
    let isCurrent = pageNum === currentPage;
    let className = 'pagination-number' + (isCurrent ? ' current' : '');
    
    if (isCurrent) {
      return `
        <span class="${className}">
          <span class="pag-num">${pageNum}</span>
          <span class="pag-block"></span>
        </span>
      `;
    }
    
    return `
      <a href="${baseUrl}${pageNum}" class="${className}" data-page="${pageNum}">
        <span class="pag-num">${pageNum}</span>
        <span class="pag-block"></span>
      </a>
    `;
  }

  // ==================== NAVIGATION ====================
  window.goToPrevPage = function() {
    if (paginationState.currentPage > 1) {
      window.location.href = paginationState.baseUrl + (paginationState.currentPage - 1);
    }
  };
  
  window.goToNextPage = function() {
    if (paginationState.currentPage < paginationState.totalPages) {
      window.location.href = paginationState.baseUrl + (paginationState.currentPage + 1);
    }
  };

})();

console.log('✅ f-load-pagination.js loaded');
