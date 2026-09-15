/* ============================================
   TOKEN.JS - GitHub Token Management
   Used by: All admin pages (anywhere GitHub API is used)
   ============================================ */

/**
 * Get GitHub token from localStorage
 * Returns null if not set
 */
function getToken() {
  return localStorage.getItem(CONFIG.TOKEN_KEY);
}

/**
 * Save token to localStorage
 */
function setToken(token) {
  if (!token) return false;
  localStorage.setItem(CONFIG.TOKEN_KEY, token.trim());
  hideTokenWarning();
  return true;
}

/**
 * Remove token from localStorage
 */
function clearToken() {
  localStorage.removeItem(CONFIG.TOKEN_KEY);
  showTokenWarning();
}

/**
 * Prompt user for token (via popup)
 */
function promptForToken() {
  let token = prompt(
    '🔑 Please paste your GitHub Personal Access Token:\n\n' +
    '(It will be saved in your browser for future use)'
  );
  
  if (token && token.trim()) {
    setToken(token.trim());
    showToast('✅ Token saved successfully!', 'success');
    return token.trim();
  }
  return null;
}

/**
 * Show token warning banner
 */
function showTokenWarning() {
  let warning = document.getElementById('tokenWarning');
  if (warning) warning.classList.add('show');
}

/**
 * Hide token warning banner
 */
function hideTokenWarning() {
  let warning = document.getElementById('tokenWarning');
  if (warning) warning.classList.remove('show');
}

/**
 * Auto-check on page load
 * Shows warning if no token exists
 */
function checkToken() {
  let token = getToken();
  if (!token) {
    showTokenWarning();
  } else {
    hideTokenWarning();
  }
  return token;
}

// Auto-check on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', checkToken);
} else {
  checkToken();
}