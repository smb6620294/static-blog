/* ============================================
   TAGS.JS - Tags Management System
   Used by: add-new-post, edit-post
   ============================================ */

let _tags = [];

/**
 * Initialize tags system (attach event listeners)
 */
function initTags() {
  let tagInput = document.getElementById('tagInput');
  if (!tagInput) return;
  
  tagInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTagsFromInput();
    }
  });
}

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

/**
 * Remove tag by index
 */
function removeTag(index) {
  _tags.splice(index, 1);
  renderTags();
  if (typeof updateSEO === 'function') updateSEO();
}

/**
 * Get all tags
 */
function getTags() {
  return [..._tags];
}

/**
 * Set tags array (replaces existing)
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