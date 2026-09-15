/* ============================================
   CATEGORIES.JS - Categories Management
   Used by: add-new-post, edit-post
   ============================================ */

let _allCategories = [];

/**
 * Load categories from GitHub (with fallback)
 */
async function loadCategoriesList() {
  // Try GitHub first
  let data = await fetchFileFromGitHub(CONFIG.CATEGORIES_FILE);
  
  if (data && data.categories) {
    _allCategories = data.categories;
  } else {
    // Fallback: default categories
    _allCategories = [
      { name: 'Technology', slug: 'technology' },
      { name: 'News', slug: 'news' },
      { name: 'Lifestyle', slug: 'lifestyle' }
    ];
  }
  
  renderCategoryCheckboxes();
  return _allCategories;
}

/**
 * Render category checkboxes in the #categoryCheckboxes container
 */
function renderCategoryCheckboxes() {
  let container = document.getElementById('categoryCheckboxes');
  if (!container) return;
  
  container.innerHTML = _allCategories.map(cat => `
    <label>
      <input type="checkbox" value="${escapeHtml(cat.slug || cat.name.toLowerCase())}">
      ${escapeHtml(cat.name)}
    </label>
  `).join('');
}

/**
 * Add a new category at runtime
 */
function addNewCategory() {
  let newCat = prompt("Enter new category name:");
  if (!newCat || !newCat.trim()) return;
  
  newCat = newCat.trim();
  let slug = generateSlug(newCat);
  
  // Add to local array
  _allCategories.push({ name: newCat, slug: slug });
  
  // Add checkbox to UI
  let container = document.getElementById('categoryCheckboxes');
  if (container) {
    let label = document.createElement('label');
    label.innerHTML = `<input type="checkbox" value="${escapeHtml(slug)}" checked> ${escapeHtml(newCat)}`;
    container.appendChild(label);
  }
  
  showToast('✅ Category added: ' + newCat, 'success');
}

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
 * Set selected categories (uncheck all, then check matching)
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