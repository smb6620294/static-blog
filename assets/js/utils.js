/* ============================================
   UTILS.JS - Utility Functions
   Used by: All admin pages
   ============================================ */

/**
 * Escape HTML special characters (prevent XSS)
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Generate URL-friendly slug from text
 */
function generateSlug(text) {
  if (!text) return '';
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Format date to string (YYYY-MM-DD)
 */
function formatDate(date) {
  if (!date) return '';
  let d = (date instanceof Date) ? date : new Date(date);
  let year = d.getFullYear();
  let month = String(d.getMonth() + 1).padStart(2, '0');
  let day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format time to string (HH:MM)
 */
function formatTime(date) {
  if (!date) return '';
  let d = (date instanceof Date) ? date : new Date(date);
  let hours = String(d.getHours()).padStart(2, '0');
  let minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Get current timezone
 */
function getTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Base64 encode a string (UTF-8 safe)
 */
function encodeBase64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

/**
 * Base64 decode a string (UTF-8 safe)
 */
function decodeBase64(base64) {
  return decodeURIComponent(escape(atob(base64)));
}

/**
 * Show a temporary toast notification
 */
function showToast(message, type = 'info', duration = 3000) {
  let toast = document.createElement('div');
  toast.className = 'admin-toast admin-toast-' + type;
  toast.textContent = message;
  
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 6px;
    color: #fff;
    font-size: 14px;
    z-index: 99999;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: slideIn 0.3s ease;
    max-width: 90vw;
  `;
  
  if (type === 'success') toast.style.background = '#00a32a';
  else if (type === 'error') toast.style.background = '#d63638';
  else if (type === 'warning') toast.style.background = '#dba617';
  else toast.style.background = '#2271b1';
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * Confirm dialog with custom message
 */
function confirmAction(message) {
  return confirm(message);
}

/**
 * Get query parameter from URL
 */
function getQueryParam(name) {
  let params = new URLSearchParams(window.location.search);
  return params.get(name);
}

/**
 * Debounce a function (limit call frequency)
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Load a script dynamically
 */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    let script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Add CSS animation for toast
(function addToastAnimation() {
  if (document.getElementById('toast-animation-style')) return;
  let style = document.createElement('style');
  style.id = 'toast-animation-style';
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
})();