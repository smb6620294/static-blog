/* ============================================
   TAGS.JS - Tags Management with Auto-Load & Auto-Save
   Loads tags from GitHub, saves new ones automatically
   Used by: add-new-post, edit-post
   ============================================ */

// ==================== STATE ====================
let _tags = [];              // Current post's tags (array of tag titles)
let _allTags = [];           // All tags from GitHub (array of objects)
let _tagsLoaded = false;     // Flag to avoid reloading

// ==================== INITIALIZE ====================
/**
 * Initialize tags system (attach event listeners)
 */
function initTags() {
  let tagInput = document.getElementById('tagInput');
  if (!tagInput) return;
  
  // Prevent duplicate listeners
  if (tagInput.dataset.initDone === 'true') return;
  tagInput.dataset.initDone = 'true';
  
  tagInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTagsFromInput();
    }
  });
  
  console.log('✅ Tags system initialized');
}

// ==================== LOAD TAGS FROM GITHUB ====================
/**
 * Load tags.json from GitHub
 * This is called before saving to know which tags already exist
 */
async function loadTagsList() {
  try {
    let data = await fetchFileFromGitHub(CONFIG.TAGS_FILE);
    
    if (data && data.tags && Array.isArray(data.tags)) {
      _allTags = data.tags;
      console.log('✅ Loaded tags from GitHub:', _allTags.length);
    } else {
      _allTags = [];
      console.log('⚠️ No tags found on GitHub (empty file)');
    }
  } catch (err) {
    console.warn('Could not load tags from GitHub:', err);
    _allTags = [];
  }
  
  _tagsLoaded = true;
  return _allTags;
}

// ==================== ADD TAGS FROM INPUT ====================
/**
 * Add tags from input (comma-separated)
 */
function addTagsFromInput() {
  let tagInput = document.getElementById('tagInput');
  if (!tagInput) return;
  
  let raw = tagInput.value.trim();
  if (!raw) return;
  
  let parts = raw.split(',')
    .map(t => t.trim())
    .filter(t => t.length > 0);
  
  parts.forEach(part => {
    if (!_tags.includes(part)) _tags.push(part);
  });
  
  tagInput.value = '';
  renderTags();
  
  if (typeof updateSEO === 'function') updateSEO();
}

// ==================== FLUSH PENDING TAG ====================
/**
 * Flush any pending tag in the input box to the tags array
 * Called before collecting post data (in case user didn't click + Add Tags)
 */
function flushPendingTag() {
  let tagInput = document.getElementById('tagInput');
  if (!tagInput) return;
  
  let raw = tagInput.value.trim();
  if (!raw) return;
  
  let parts = raw.split(',')
    .map(t => t.trim())
    .filter(t => t.length > 0);
  
  parts.forEach(part => {
    if (!_tags.includes(part)) _tags.push(part);
  });
  
  tagInput.value = '';
  renderTags();
}

// ==================== RENDER TAGS ====================
/**
 * Render tag badges
 */
function renderTags() {
  let tagsContainer = document.getElementById('tagsContainer');
  let tagInput = document.getElementById('tagInput');
  if (!tagsContainer || !tagInput) return;
  
  // Remove existing badges
  document.querySelectorAll('.tag-badge').forEach(b => b.remove());
  
  // Add new badges
  _tags.forEach((tag, index) => {
    let badge = document.createElement('div');
    badge.className = 'tag-badge';
    badge.innerHTML = `${escapeHtml(tag)} <span onclick="removeTag(${index})">×</span>`;
    tagsContainer.insertBefore(badge, tagInput);
  });
}

// ==================== REMOVE TAG ====================
/**
 * Remove tag by index
 */
function removeTag(index) {
  _tags.splice(index, 1);
  renderTags();
  if (typeof updateSEO === 'function') updateSEO();
}

// ==================== GETTERS / SETTERS ====================
/**
 * Get all current tags (post's tags)
 */
function getTags() {
  return [..._tags];
}

/**
 * Set tags array (replaces existing)
 * Used when loading post for edit
 */
function setTags(newTags) {
  _tags = Array.isArray(newTags) ? [...newTags] : [];
  renderTags();
}

/**
 * Clear all tags
 */
function clearTags() {
  _tags = [];
  renderTags();
}

/**
 * Get all tags from GitHub (global)
 */
function getAllTags() {
  return [..._allTags];
}

/**
 * Check if tags are loaded
 */
function areTagsLoaded() {
  return _tagsLoaded;
}

// ==================== SAVE NEW TAGS TO GITHUB ====================
/**
 * Save new tags to GitHub's tags.json
 * Only adds tags that don't already exist (by slug)
 * Description is left empty (can be filled via Edit Tag page later)
 */
async function saveNewTagsToGitHub() {
  let token = getToken();
  if (!token) {
    console.warn('No token, skipping tags save');
    return false;
  }
  
  // Make sure we have the latest tags list
  if (!_tagsLoaded) {
    await loadTagsList();
  }
  
  // Find new tags (not in _allTags)
  let newTagsToAdd = [];
  
  _tags.forEach(tagTitle => {
    let slug = typeof generateSlug === 'function' ? generateSlug(tagTitle) : tagTitle.toLowerCase();
    
    // Check if tag already exists (by slug)
    let exists = _allTags.find(t => {
      let existingSlug = t.slug || (typeof generateSlug === 'function' ? generateSlug(t.title || t.name) : (t.title || t.name || '').toLowerCase());
      return existingSlug === slug;
    });
    
    if (!exists && slug) {
      newTagsToAdd.push({
        id: 'tag_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        title: tagTitle,
        slug: slug,
        description: '',  // Empty, will be filled via Edit Tag
        createdAt: new Date().toISOString()
      });
    }
  });
  
  // If no new tags, skip
  if (newTagsToAdd.length === 0) {
    console.log('✅ All tags already exist in tags.json');
    return true;
  }
  
  // Add new tags to _allTags
  _allTags = _allTags.concat(newTagsToAdd);
  
  // Prepare data
  let data = {
    tags: _allTags
  };
  
  let jsonContent = JSON.stringify(data, null, 2);
  let contentBase64 = encodeBase64(jsonContent);
  
  try {
    await uploadFileToGitHub(
      CONFIG.TAGS_FILE,
      contentBase64,
      `Update tags: added ${newTagsToAdd.length} new tag(s)`
    );
    
    console.log('✅ Saved', newTagsToAdd.length, 'new tags to GitHub');
    return true;
    
  } catch (err) {
    console.error('❌ Failed to save tags:', err);
    throw err;
  }
}

// ==================== AUTO-SAVE ON PUBLISH ====================
/**
 * Called during publish/update
 * Saves only new tags (skips existing)
 */
async function syncTagsOnPublish() {
  try {
    await saveNewTagsToGitHub();
    return true;
  } catch (err) {
    console.warn('Tags sync failed:', err);
    return false;
  }
}

// ==================== LOG ON LOAD ====================
console.log('✅ tags.js loaded — auto-load & auto-save ready');