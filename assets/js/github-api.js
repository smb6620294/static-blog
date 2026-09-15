/* ============================================
   GITHUB-API.JS - GitHub API Operations
   Used by: All admin pages
   ============================================ */

/**
 * Upload or update a file on GitHub
 * @param {string} path - Path in repo (e.g., 'content/posts/my-post.json')
 * @param {string} contentBase64 - Base64-encoded content
 * @param {string} commitMessage - Commit message
 * @returns {Promise<object>} GitHub API response
 */
async function uploadFileToGitHub(path, contentBase64, commitMessage) {
  let token = getToken();
  if (!token) {
    throw new Error('GitHub token not set. Please set it first.');
  }

  // Check if file exists (to get SHA for update)
  let sha = null;
  try {
    let checkResponse = await fetch(
      `${CONFIG.GITHUB_API}/repos/${CONFIG.GITHUB_REPO}/contents/${path}?ref=${CONFIG.GITHUB_BRANCH}`,
      { headers: { 'Authorization': `token ${token}` } }
    );
    if (checkResponse.ok) {
      let existing = await checkResponse.json();
      sha = existing.sha;
    }
  } catch (e) {
    // File doesn't exist — that's fine
  }

  // Build request body
  let body = {
    message: commitMessage,
    content: contentBase64,
    branch: CONFIG.GITHUB_BRANCH
  };
  if (sha) body.sha = sha;

  // Upload (create or update)
  let response = await fetch(
    `${CONFIG.GITHUB_API}/repos/${CONFIG.GITHUB_REPO}/contents/${path}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }
  );

  if (!response.ok) {
    let err = await response.json();
    throw new Error('GitHub upload failed: ' + (err.message || response.statusText));
  }

  return await response.json();
}

/**
 * Fetch a single file from GitHub
 * @param {string} path - Path in repo
 * @returns {Promise<object|null>} Parsed JSON or null
 */
async function fetchFileFromGitHub(path) {
  let token = getToken();
  
  try {
    let response = await fetch(
      `${CONFIG.GITHUB_API}/repos/${CONFIG.GITHUB_REPO}/contents/${path}?ref=${CONFIG.GITHUB_BRANCH}`,
      { headers: token ? { 'Authorization': `token ${token}` } : {} }
    );
    
    if (!response.ok) return null;
    
    let data = await response.json();
    let content = decodeBase64(data.content.replace(/\n/g, ''));
    
    // Try to parse as JSON
    try {
      return JSON.parse(content);
    } catch (e) {
      return content; // Return raw text if not JSON
    }
  } catch (err) {
    console.warn('Fetch failed:', path, err);
    return null;
  }
}

/**
 * List files in a folder on GitHub
 * @param {string} folderPath - Folder path
 * @returns {Promise<Array>} Array of file objects
 */
async function listFilesFromGitHub(folderPath) {
  let token = getToken();
  
  try {
    let response = await fetch(
      `${CONFIG.GITHUB_API}/repos/${CONFIG.GITHUB_REPO}/contents/${folderPath}?ref=${CONFIG.GITHUB_BRANCH}`,
      { headers: token ? { 'Authorization': `token ${token}` } : {} }
    );
    
    if (!response.ok) return [];
    
    let files = await response.json();
    return Array.isArray(files) ? files : [];
  } catch (err) {
    console.warn('List failed:', folderPath, err);
    return [];
  }
}

/**
 * Delete a file from GitHub
 * @param {string} path - Path in repo
 * @param {string} commitMessage - Commit message
 * @returns {Promise<boolean>} Success
 */
async function deleteFileFromGitHub(path, commitMessage) {
  let token = getToken();
  if (!token) throw new Error('GitHub token not set.');

  try {
    // Get current SHA
    let checkResponse = await fetch(
      `${CONFIG.GITHUB_API}/repos/${CONFIG.GITHUB_REPO}/contents/${path}?ref=${CONFIG.GITHUB_BRANCH}`,
      { headers: { 'Authorization': `token ${token}` } }
    );
    
    if (!checkResponse.ok) {
      throw new Error('File not found on GitHub');
    }
    
    let existing = await checkResponse.json();

    // Delete
    let response = await fetch(
      `${CONFIG.GITHUB_API}/repos/${CONFIG.GITHUB_REPO}/contents/${path}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: commitMessage || `Delete: ${path}`,
          sha: existing.sha,
          branch: CONFIG.GITHUB_BRANCH
        })
      }
    );

    if (!response.ok) {
      let err = await response.json();
      throw new Error('Delete failed: ' + (err.message || response.statusText));
    }

    return true;
  } catch (err) {
    console.error('Delete error:', err);
    throw err;
  }
}

/**
 * Load all posts from GitHub (with LocalStorage fallback)
 */
async function loadAllPosts() {
  let posts = [];

  // 1. Try GitHub
  let files = await listFilesFromGitHub(CONFIG.POSTS_FOLDER);
  for (let file of files) {
    if (!file.name.endsWith('.json')) continue;
    let post = await fetchFileFromGitHub(CONFIG.POSTS_FOLDER + file.name);
    if (post && typeof post === 'object') {
      post._source = 'github';
      post._fileName = file.name;
      posts.push(post);
    }
  }

  // 2. Merge LocalStorage (for instant preview)
  try {
    let localPosts = JSON.parse(localStorage.getItem(CONFIG.POSTS_CACHE_KEY) || '[]');
    localPosts.forEach(post => {
      // Skip if already loaded from GitHub
      let exists = posts.find(p => p.id === post.id);
      if (!exists) {
        post._source = 'local';
        posts.push(post);
      }
    });
  } catch (e) {
    console.warn('LocalStorage read error:', e);
  }

  // Sort by date (newest first)
  posts.sort((a, b) => {
    let dateA = (a.date || '') + ' ' + (a.time || '');
    let dateB = (b.date || '') + ' ' + (b.time || '');
    return dateB.localeCompare(dateA);
  });

  return posts;
}