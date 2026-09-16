/* ============================================
   POST-FORM.JS - Post Publish/Update/Load Logic
   Includes: Categories sync, Tags sync, Content load
   Fixed: Tags/Categories format (name + slug)
   Used by: add-new-post, edit-post
   ============================================ */

// ==================== COLLECT POST DATA ====================
function collectPostData() {
  // Auto-add any pending tag from input box
  if (typeof flushPendingTag === 'function') {
    flushPendingTag();
  }
  
  let titleEl = document.getElementById('postTitle');
  let permalinkEl = document.getElementById('postPermalink');
  
  let title = titleEl ? titleEl.value.trim() : '';
  let permalink = permalinkEl ? permalinkEl.value.trim() : '';
  
  if (!permalink && title) {
    permalink = generateSlug(title);
  }
  
  let post = {
    id: document.getElementById('postId')?.value || 'post_' + Date.now(),
    title: title,
    permalink: permalink,
    author: document.getElementById('postAuthor')?.value.trim() || 'Admin',
    date: document.getElementById('postDate')?.value || formatDate(new Date()),
    time: document.getElementById('postTime')?.value || formatTime(new Date()),
    timezone: document.getElementById('postTimezone')?.value || getTimezone(),
    categories: typeof getSelectedCategories === 'function' ? getSelectedCategories() : [],
    tags: typeof getTags === 'function' ? getTags() : [],
    image: typeof getUploadedImagePath === 'function' ? getUploadedImagePath() : '',
    content: typeof getEditorContent === 'function' ? getEditorContent() : '',
    excerpt: document.getElementById('postExcerpt')?.value.trim() || '',
    seoTitle: document.getElementById('seoTitle')?.value.trim() || '',
    seoDescription: document.getElementById('seoDescription')?.value.trim() || '',
    seoKeyword: document.getElementById('seoKeyword')?.value.trim() || '',
    createdAt: new Date().toISOString()
  };
  
  return post;
}

// ==================== SYNC TAGS TO GITHUB ====================
async function syncTagsToGitHub(newTags) {
  if (!newTags || newTags.length === 0) return;
  
  let token = getToken();
  if (!token) return;
  
  try {
    // 1. Load existing tags.json
    let existing = await fetchFileFromGitHub(CONFIG.TAGS_FILE);
    let tagsList = [];
    
    if (existing && existing.tags && Array.isArray(existing.tags)) {
      tagsList = existing.tags;
    }
    
    console.log('📋 Existing tags:', tagsList.length);
    
    // 2. Add new tags (skip if already exists)
    let added = 0;
    newTags.forEach(tagName => {
      let slug = generateSlug(tagName);
      if (!slug) return;
      
      // Check if exists (by slug OR by name)
      let exists = tagsList.find(t => t.slug === slug || t.name === tagName);
      if (!exists) {
        tagsList.push({
          id: 'tag_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          name: tagName,           // ← name (پرانی فائل جیسا)
          title: tagName,          // ← title (مستقبل کے لیے)
          slug: slug,
          description: '',
          count: 0,
          createdAt: new Date().toISOString()
        });
        added++;
        console.log('➕ Added tag:', tagName, '→', slug);
      }
    });
    
    if (added === 0) {
      console.log('ℹ️ No new tags to add');
      return;
    }
    
    // 3. Upload updated tags.json
    let jsonContent = JSON.stringify({ tags: tagsList }, null, 2);
    let contentBase64 = encodeBase64(jsonContent);
    
    await uploadFileToGitHub(
      CONFIG.TAGS_FILE,
      contentBase64,
      `Sync tags: added ${added} new tag(s)`
    );
    
    console.log('✅ Tags synced to GitHub:', added, 'new tag(s)');
    
  } catch (err) {
    console.warn('⚠️ Could not sync tags:', err);
  }
}

// ==================== SYNC CATEGORIES TO GITHUB ====================
async function syncCategoriesToGitHub(newCategories) {
  if (!newCategories || newCategories.length === 0) return;
  
  let token = getToken();
  if (!token) return;
  
  try {
    // 1. Load existing categories.json
    let existing = await fetchFileFromGitHub(CONFIG.CATEGORIES_FILE);
    let catsList = [];
    
    if (existing && existing.categories && Array.isArray(existing.categories)) {
      catsList = existing.categories;
    }
    
    console.log('📋 Existing categories:', catsList.length);
    
    // 2. Add new categories (skip if already exists)
    let added = 0;
    newCategories.forEach(catSlug => {
      if (!catSlug) return;
      
      let exists = catsList.find(c => c.slug === catSlug);
      if (!exists) {
        // Convert slug to readable title
        let title = catSlug.split('-').map(w => 
          w.charAt(0).toUpperCase() + w.slice(1)
        ).join(' ');
        
        catsList.push({
          id: 'cat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          name: title,             // ← name (پرانی فائل جیسا)
          title: title,            // ← title
          slug: catSlug,
          description: '',
          parent: null,
          count: 0,
          createdAt: new Date().toISOString()
        });
        added++;
        console.log('➕ Added category:', title, '→', catSlug);
      }
    });
    
    if (added === 0) {
      console.log('ℹ️ No new categories to add');
      return;
    }
    
    // 3. Upload updated categories.json
    let jsonContent = JSON.stringify({ categories: catsList }, null, 2);
    let contentBase64 = encodeBase64(jsonContent);
    
    await uploadFileToGitHub(
      CONFIG.CATEGORIES_FILE,
      contentBase64,
      `Sync categories: added ${added} new category(ies)`
    );
    
    console.log('✅ Categories synced to GitHub:', added, 'new');
    
  } catch (err) {
    console.warn('⚠️ Could not sync categories:', err);
  }
}

// ==================== PUBLISH POST ====================
async function publishPost() {
  let post = collectPostData();
  
  if (!post.content) {
    alert('Please write some content.');
    return;
  }
  if (!post.title) {
    alert('Please enter a post title.');
    return;
  }
  
  let token = getToken();
  if (!token) {
    promptForToken();
    return;
  }
  
  let btn = document.getElementById('publishBtn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏳ Publishing...';
  }
  
  try {
    // ========== STEP 1: Upload Image ==========
    let imageBase64 = getUploadedImageBase64();
    let imagePath = post.image;
    
    if (imageBase64 && imagePath) {
      if (btn) btn.textContent = '⏳ Uploading image...';
      let imageGithubPath = imagePath.replace(/^\//, '');
      await uploadFileToGitHub(imageGithubPath, imageBase64, `Upload image: ${imagePath}`);
    }
    
    // ========== STEP 2: Sync Categories ==========
    if (post.categories && post.categories.length > 0) {
      if (btn) btn.textContent = '⏳ Syncing categories...';
      await syncCategoriesToGitHub(post.categories);
    }
    
    // ========== STEP 3: Sync Tags ==========
    if (post.tags && post.tags.length > 0) {
      if (btn) btn.textContent = '⏳ Syncing tags...';
      await syncTagsToGitHub(post.tags);
    }
    
    // ========== STEP 4: Upload Post JSON ==========
    if (btn) btn.textContent = '⏳ Uploading post...';
    let postPath = CONFIG.POSTS_FOLDER + post.permalink + '.json';
    let postJson = JSON.stringify(post, null, 2);
    let postBase64 = encodeBase64(postJson);
    
    await uploadFileToGitHub(postPath, postBase64, `New post: ${post.title}`);
    
    // ========== STEP 5: LocalStorage ==========
    try {
      let existingPosts = JSON.parse(localStorage.getItem(CONFIG.POSTS_CACHE_KEY) || '[]');
      existingPosts.push(post);
      localStorage.setItem(CONFIG.POSTS_CACHE_KEY, JSON.stringify(existingPosts));
    } catch (e) {}
    
    showToast('✅ Post published!', 'success');
    
    setTimeout(() => {
      window.location.href = 'all-posts.html';
    }, 1500);
    
  } catch (error) {
    console.error(error);
    alert('❌ Error publishing:\n\n' + error.message);
    if (btn) {
      btn.disabled = false;
      btn.textContent = '🚀 Publish to GitHub';
    }
  }
}

// ==================== UPDATE POST ====================
async function updatePost() {
  let post = collectPostData();
  
  if (!post.content) {
    alert('Please write some content.');
    return;
  }
  if (!post.title) {
    alert('Please enter a post title.');
    return;
  }
  
  let token = getToken();
  if (!token) {
    promptForToken();
    return;
  }
  
  let btn = document.getElementById('updateBtn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏳ Updating...';
  }
  
  try {
    post.updatedAt = new Date().toISOString();
    
    // STEP 1: Upload New Image
    let imageBase64 = getUploadedImageBase64();
    let imagePath = post.image;
    
    if (imageBase64 && imagePath) {
      if (btn) btn.textContent = '⏳ Uploading image...';
      let imageGithubPath = imagePath.replace(/^\//, '');
      await uploadFileToGitHub(imageGithubPath, imageBase64, `Update image: ${imagePath}`);
    }
    
    // STEP 2: Sync Categories
    if (post.categories && post.categories.length > 0) {
      if (btn) btn.textContent = '⏳ Syncing categories...';
      await syncCategoriesToGitHub(post.categories);
    }
    
    // STEP 3: Sync Tags
    if (post.tags && post.tags.length > 0) {
      if (btn) btn.textContent = '⏳ Syncing tags...';
      await syncTagsToGitHub(post.tags);
    }
    
    // STEP 4: Upload Post JSON
    if (btn) btn.textContent = '⏳ Updating post...';
    let postPath = CONFIG.POSTS_FOLDER + post.permalink + '.json';
    let postJson = JSON.stringify(post, null, 2);
    let postBase64 = encodeBase64(postJson);
    
    await uploadFileToGitHub(postPath, postBase64, `Update post: ${post.title}`);
    
    // STEP 5: LocalStorage
    try {
      let localPosts = JSON.parse(localStorage.getItem(CONFIG.POSTS_CACHE_KEY) || '[]');
      let index = localPosts.findIndex(p => p.id === post.id);
      if (index !== -1) {
        localPosts[index] = post;
      } else {
        localPosts.push(post);
      }
      localStorage.setItem(CONFIG.POSTS_CACHE_KEY, JSON.stringify(localPosts));
    } catch (e) {}
    
    showToast('✅ Post updated!', 'success');
    
    setTimeout(() => {
      window.location.href = 'all-posts.html';
    }, 1500);
    
  } catch (error) {
    console.error(error);
    alert('❌ Error updating:\n\n' + error.message);
    if (btn) {
      btn.disabled = false;
      btn.textContent = '💾 Update Post';
    }
  }
}

// ==================== SAVE DRAFT ====================
function saveDraft() {
  let post = collectPostData();
  if (!post.title) { alert('Please enter a title to save draft.'); return; }
  
  post.id = 'draft_' + Date.now();
  post.status = 'draft';
  
  let drafts = JSON.parse(localStorage.getItem(CONFIG.DRAFTS_KEY) || '[]');
  drafts.push(post);
  localStorage.setItem(CONFIG.DRAFTS_KEY, JSON.stringify(drafts));
  
  showToast('📝 Draft saved locally!', 'success');
}

// ==================== LOAD POST DATA ====================
async function loadPostData(postId) {
  if (!postId) postId = getQueryParam('id');
  
  if (!postId) {
    alert('No post ID provided.');
    window.location.href = 'all-posts.html';
    return;
  }
  
  console.log('🔄 Loading post:', postId);
  
  let post = null;
  
  // Try LocalStorage
  try {
    let localPosts = JSON.parse(localStorage.getItem(CONFIG.POSTS_CACHE_KEY) || '[]');
    post = localPosts.find(p => p.id === postId);
    if (post) console.log('✅ Found in LocalStorage');
  } catch (e) {}
  
  // Try GitHub
  if (!post) {
    console.log('🔍 Searching GitHub...');
    try {
      let files = await listFilesFromGitHub(CONFIG.POSTS_FOLDER);
      for (let file of files) {
        if (!file.name.endsWith('.json')) continue;
        let fetchedPost = await fetchFileFromGitHub(CONFIG.POSTS_FOLDER + file.name);
        if (fetchedPost && fetchedPost.id === postId) {
          post = fetchedPost;
          console.log('✅ Found on GitHub:', file.name);
          break;
        }
      }
    } catch (err) {}
  }
  
  if (!post) {
    alert('Post not found.');
    window.location.href = 'all-posts.html';
    return;
  }
  
  // Fill fields
  document.getElementById('postId').value = post.id || '';
  let displayId = document.getElementById('displayPostId');
  if (displayId) displayId.textContent = post.id || '-';
  
  document.getElementById('postTitle').value = post.title || '';
  document.getElementById('postPermalink').value = post.permalink || '';
  document.getElementById('postAuthor').value = post.author || 'Admin';
  document.getElementById('postDate').value = post.date || '';
  document.getElementById('postTime').value = post.time || formatTime(new Date());
  document.getElementById('postTimezone').value = post.timezone || getTimezone();
  document.getElementById('postExcerpt').value = post.excerpt || '';
  document.getElementById('postImage').value = post.image || '';
  
  let permalinkEl = document.getElementById('postPermalink');
  if (permalinkEl) permalinkEl.dataset.manual = 'true';
  
  document.getElementById('seoTitle').value = post.seoTitle || '';
  document.getElementById('seoDescription').value = post.seoDescription || '';
  document.getElementById('seoKeyword').value = post.seoKeyword || '';
  
  // Categories
  if (typeof setSelectedCategories === 'function') {
    setSelectedCategories(post.categories || []);
  }
  
  // Tags
  if (typeof setTags === 'function') {
    setTags(post.tags || []);
  }
  
  // Content
  if (post.content) {
    await sleep(300);
    if (typeof setEditorContent === 'function') {
      setEditorContent(post.content);
    } else if (tinymce.get('postContentVisual')) {
      tinymce.get('postContentVisual').setContent(post.content);
    }
  }
  
  // Image
  if (post.image && typeof showExistingImage === 'function') {
    showExistingImage(post.image);
  }
  
  if (typeof updateSEO === 'function') updateSEO();
  
  console.log('✅ Post loaded');
}

// ==================== VIEW POST ====================
function viewPost() {
  let permalink = document.getElementById('postPermalink')?.value;
  if (!permalink) { alert('No permalink.'); return; }
  window.open('../posts/' + permalink + '.html', '_blank');
}

// ==================== DELETE POST ====================
async function deletePost(postId, fileName, source, title) {
  if (!confirm('Delete this post?\n\n"' + title + '"')) return;
  
  let token = getToken();
  if (!token) { promptForToken(); return; }
  
  try {
    let localPosts = JSON.parse(localStorage.getItem(CONFIG.POSTS_CACHE_KEY) || '[]');
    localPosts = localPosts.filter(p => p.id !== postId);
    localStorage.setItem(CONFIG.POSTS_CACHE_KEY, JSON.stringify(localPosts));
    
    if (source === 'github' && fileName) {
      await deleteFileFromGitHub(CONFIG.POSTS_FOLDER + fileName, `Delete: ${title}`);
    }
    
    showToast('✅ Post deleted!', 'success');
    setTimeout(() => { if (typeof loadPosts === 'function') loadPosts(); else location.reload(); }, 800);
    
  } catch (err) {
    alert('❌ Delete failed:\n\n' + err.message);
  }
}

console.log('✅ post-form.js loaded — with tags/categories sync fixed');
