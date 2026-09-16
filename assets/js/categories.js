/* ============================================
   CATEGORIES.JS - Categories Management with Auto-Load & Auto-Save
   Loads categories from GitHub, saves new ones automatically
   Used by: add-new-post, edit-post
   ============================================ */

// ==================== STATE ====================
let _allCategories = [];        // All categories from GitHub
let _categoriesLoaded = false;  // Flag to avoid reloading

// ==================== LOAD CATEGORIES FROM GITHUB ====================
/**
 * Load categories.json from GitHub
 * If file doesn't exist, use default categories
 */
async function loadCategoriesList() {
  let container = document.getElementById('categoryCheckboxes');
  if (container) {
    container.innerHTML = '<div class="note">⏳ Loading categories...</div>';
  }
  
  try {
    // Try to fetch categories.json from GitHub
    let data = await fetchFileFromGitHub(CONFIG.CATEGORIES_FILE);
    
    if (data && data.categories && Array.isArray(data.categories)) {
      _allCategories = data.categories;
      console.log('✅ Loaded categories from GitHub:', _allCategories.length);
    } else {
      // Fallback: default categories
      _allCategories = [
        { id: 'cat_1', title: 'Technology', slug: 'technology', description: '' },
        { id: 'cat_2', title: 'News', slug: 'news', description: '' },
        { id: 'cat_3', title: 'Lifestyle', slug: 'lifestyle', description: '' }
      ];
      console.log('⚠️ Using default categories (file not found on GitHub)');
    }
  } catch (err) {
    console.warn('Could not load categories:', err);
    _allCategories = [
      { id: 'cat_1', title: 'Technology', slug: 'technology', description: '' },
      { id: 'cat_2', title: 'News', slug: 'news', description: '' },
      { id: 'cat_3', title: 'Lifestyle', slug: 'lifestyle', description: '' }
    ];
  }
  
  _categoriesLoaded = true;
  renderCategoryCheckboxes();
  return _allCategories;
}

// ==================== RENDER CHECKBOXES ====================
/**
 * Render category checkboxes in the #categoryCheckboxes container
 */
function renderCategoryCheckboxes() {
  let container = document.getElementById('categoryCheckboxes');
  if (!container) return;
  
  if (_allCategories.length === 0) {
    container.innerHTML = '<div class="note">No categories yet. Click "+ Add New Category" to create one.</div>';
    return;
  }
  
  container.innerHTML = _allCategories.map(cat => {
    // Support both old (name) and new (title) format
    let title = cat.title || cat.name || 'Untitled';
    let slug = cat.slug || title.toLowerCase();
    
    return `<label>
      <input type="checkbox" value="${escapeHtml(slug)}">
      ${escapeHtml(title)}
    </label>`;
  }).join('');
}

// ==================== ADD NEW CATEGORY ====================
/**
 * Prompt user for new category name
 * Adds it to the list and saves to GitHub
 */
async function addNewCategory() {
  let title = prompt("Enter new category name:");
  if (!title || !title.trim()) return;
  
  title = title.trim();
  
  // Generate slug using transliterate (smartSlugify)
  let slug = generateSlug(title);
  
  if (!slug) {
    alert('❌ Could not generate a valid slug from this name.');
    return;
  }
  
  // Check if already exists
  let exists = _allCategories.find(c => c.slug === slug);
  if (exists) {
    alert('⚠️ Category "' + exists.title + '" already exists.');
    return;
  }
  
  // Create new category object
  let newCategory = {
    id: 'cat_' + Date.now(),
    title: title,
    slug: slug,
    description: '',  // empty, can be filled later
    createdAt: new Date().toISOString()
  };
  
  // Add to list
  _allCategories.push(newCategory);
  
  // Re-render checkboxes
  renderCategoryCheckboxes();
  
  // Auto-check the new category
  let newCheckbox = document.querySelector(`#categoryCheckboxes input[value="${slug}"]`);
  if (newCheckbox) newCheckbox.checked = true;
  
  // Save to GitHub (background, no blocking)
  saveCategoriesToGitHub().then(() => {
    showToast('✅ Category added: ' + title, 'success');
  }).catch(err => {
    console.warn('Could not save category to GitHub:', err);
    showToast('⚠️ Category added locally, but not saved to GitHub', 'warning');
  });
}

// ==================== SAVE CATEGORIES TO GITHUB ====================
/**
 * Save categories.json to GitHub
 * Called automatically when a new category is added
 */
async function saveCategoriesToGitHub() {
  let token = getToken();
  if (!token) {
    console.warn('No token, skipping categories save');
    return false;
  }
  
  try {
    let data = {
      categories: _allCategories
    };
    
    let jsonContent = JSON.stringify(data, null, 2);
    let contentBase64 = encodeBase64(jsonContent);
    
    await uploadFileToGitHub(
      CONFIG.CATEGORIES_FILE,
      contentBase64,
      `Update categories: added new category`
    );
    
    console.log('✅ Categories saved to GitHub');
    return true;
    
  } catch (err) {
    console.error('❌ Failed to save categories:', err);
    throw err;
  }
}

// ==================== GETTERS / SETTERS ====================
/**
 * Get selected categories (array of slugs)
 */
function getSelectedCategories() {
  let selected = [];
  document.querySelectorAll('#categoryCheckboxes input[type="checkbox"]:checked').forEach(cb => {
    selected.push(cb.value);
  });
  return selected;
}

/**
 * Set selected categories (check matching checkboxes)
 */
function setSelectedCategories(slugs) {
  if (!Array.isArray(slugs)) slugs = [];
  
  document.querySelectorAll('#categoryCheckboxes input[type="checkbox"]').forEach(cb => {
    cb.checked = slugs.includes(cb.value);
  });
}

/**
 * Get all categories
 */
function getAllCategories() {
  return [..._allCategories];
}

/**
 * Get category by slug
 */
function getCategoryBySlug(slug) {
  return _allCategories.find(c => c.slug === slug);
}

/**
 * Check if categories are loaded
 */
function areCategoriesLoaded() {
  return _categoriesLoaded;
}

// ==================== LOG ON LOAD ====================
console.log('✅ categories.js loaded — auto-load & auto-save ready');