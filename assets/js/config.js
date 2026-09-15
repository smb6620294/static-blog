/* ============================================
   CONFIG.JS - Global Constants
   Used by: All admin pages
   ============================================ */

const CONFIG = {
  // GitHub Repository
  GITHUB_REPO: 'smb6620294/static-blog',
  GITHUB_BRANCH: 'main',
  GITHUB_API: 'https://api.github.com',
  
  // Folder Paths
  POSTS_FOLDER: 'content/posts/',
  CATEGORIES_FILE: 'content/categories/categories.json',
  TAGS_FILE: 'content/tags/tags.json',
  IMAGES_FOLDER: 'content/media/images/',
  PAGES_FOLDER: 'content/pages/',
  
  // Local Storage Keys
  TOKEN_KEY: 'github_token',
  POSTS_CACHE_KEY: 'blog_posts',
  DRAFTS_KEY: 'blog_drafts',
  CATEGORIES_CACHE_KEY: 'blog_categories',
  TAGS_CACHE_KEY: 'blog_tags',
  
  // Image Settings
  IMAGE_FORMAT: 'svg',
  MAX_IMAGE_SIZE_MB: 10,
  
  // SEO Settings
  SEO_TITLE_MIN: 50,
  SEO_TITLE_MAX: 60,
  SEO_DESC_MIN: 150,
  SEO_DESC_MAX: 160,
  SEO_MIN_WORDS: 300,
  SEO_DENSITY_MIN: 0.5,
  SEO_DENSITY_MAX: 2.5
};

// Export for modules (if using ES6)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}