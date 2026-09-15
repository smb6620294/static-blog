/* ============================================
   POST-FORM.JS - Post Publish/Update/Load Logic
   Used by: add-new-post, edit-post
   ============================================ */

/**
 * Collect all form data into a post object
 */
function collectPostData() {
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

/**
 * Publish a new post to GitHub
 */
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
    btn.textContent = 'Publishing to GitHub...';
  }
  
  try {
    // Step 1: Upload image (if any)
    let imageBase64 = getUploadedImageBase64();
    let imagePath = post.image;
    
    if (imageBase64 && imagePath) {
      if (btn) btn.textContent = 'Uploading image...';
      let imageGithubPath = imagePath.replace(/^\//, '');
      await uploadFileToGitHub(imageGithubPath, imageBase64, `Upload image: ${imagePath}`);
    }
    
    // Step 2: Upload post JSON
    if (btn) btn.textContent = 'Uploading post...';
    let postPath = CONFIG.POSTS_FOLDER + post.permalink + '.json';
    let postJson = JSON.stringify(post, null, 2);
    let postBase64 = encodeBase64(postJson);
    
    await uploadFileToGitHub(postPath, postBase64, `New post: ${post.title}`);
    
    // Step 3: Save to LocalStorage (for instant preview)
    let existingPosts = JSON.parse(localStorage.getItem(CONFIG.POSTS_CACHE_KEY) || '[]');
    existingPosts.push(post);
    localStorage.setItem(CONFIG.POSTS_CACHE_KEY, JSON.stringify(existingPosts));
    
    showToast('✅ Post published to GitHub!', 'success');
    
    setTimeout(() => {
      window.location.href = 'all-posts.html';
    }, 1500);
    
  } catch (error) {
    console.error(error);
    alert('❌ Error publishing:\n\n' + error.message);
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Publish to GitHub';
    }
  }
}

/**
 * Update an existing post on GitHub
 */
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
    btn.textContent = 'Updating...';
  }
  
  try {
    post.updatedAt = new Date().toISOString();
    
    // Step 1: Upload new image if any
    let imageBase64 = getUploadedImageBase64();
    let imagePath = post.image;
    
    if (imageBase64 && imagePath) {
      if (btn) btn.textContent = 'Uploading image...';
      let imageGithubPath = imagePath.replace(/^\//, '');
      await uploadFileToGitHub(imageGithubPath, imageBase64, `Update image: ${imagePath}`);
    }
    
    // Step 2: Update post JSON
    if (btn) btn.textContent = 'Updating post...';
    let postPath = CONFIG.POSTS_FOLDER + post.permalink + '.json';
    let postJson = JSON.stringify(post, null, 2);
    let postBase64 = encodeBase64(postJson);
    
    await uploadFileToGitHub(postPath, postBase64, `Update post: ${post.title}`);
    
    // Step 3: Update LocalStorage
    let localPosts = JSON.parse(localStorage.getItem(CONFIG.POSTS_CACHE_KEY) || '[]');
    let index = localPosts.findIndex(p => p.id === post.id);
    if (index !== -1) {
      localPosts[index] = post;
    } else {
      localPosts.push(post);
    }
    localStorage.setItem(CONFIG.POSTS_CACHE_KEY, JSON.stringify(localPosts));
    
    showToast('✅ Post updated!', 'success');
    
    setTimeout(() => {
      window.location.href = 'all-posts.html';
    }, 1500);
    
  } catch (error) {
    console.error(error);
    alert('❌ Error updating:\n\n' + error.message);
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Update Post';
    }
  }
}

/**
 * Save draft locally (no GitHub)
 */
function saveDraft() {
  let post = collectPostData();
  
  if (!post.title) {
    alert('Please enter a title to save draft.');
    return;
  }
  
  post.id = 'draft_' + Date.now();
  post.status = 'draft';
  
  let drafts = JSON.parse(localStorage.getItem(CONFIG.DRAFTS_KEY) || '[]');
  drafts.push(post);
  localStorage.setItem(CONFIG.DRAFTS_KEY, JSON.stringify(drafts));
  
  showToast('📝 Draft saved locally!', 'success');
}

/**
 * Load post data into form (for edit page)
 */
async function loadPostData(postId) {
  if (!postId) {
    postId = getQueryParam('id');
  }
  
  if (!postId) {
    alert('No post ID provided. Redirecting to All Posts.');
    window.location.href = 'all-posts.html';
    return;
  }
  
  // 1. Try LocalStorage first
  let post = null;
  let localPosts = JSON.parse(localStorage.getItem(CONFIG.POSTS_CACHE_KEY) || '[]');
  post = localPosts.find(p => p.id === postId);
  
  // 2. Try GitHub if not in LocalStorage
  if (!post) {
    let files = await listFilesFromGitHub(CONFIG.POSTS_FOLDER);
    for (let file of files) {
      if (!file.name.endsWith('.json')) continue;
      let fetchedPost = await fetchFileFromGitHub(CONFIG.POSTS_FOLDER + file.name);
      if (fetchedPost && fetchedPost.id === postId) {
        post = fetchedPost;
        break;
      }
    }
  }
  
  if (!post) {
    alert('Post with ID "' + postId + '" not found.');
    window.location.href = 'all-posts.html';
    return;
  }
  
  // Fill form fields
  document.getElementById('postId').value = post.id || '';
  let displayId = document.getElementById('displayPostId');
  if (displayId) displayId.textContent = post.id || '-';
  
  document.getElementById('postTitle').value = post.title || '';
  document.getElementById('postPermalink').value = post.permalink || '';
  document.getElementById('postAuthor').value = post.author || 'Admin';
  document.getElementById('postDate').value = post.date || '';
  document.getElementById('postTime').value = post.time || '';
  document.getElementById('postTimezone').value = post.timezone || getTimezone();
  document.getElementById('postExcerpt').value = post.excerpt || '';
  document.getElementById('postImage').value = post.image || '';
  
  document.getElementById('seoTitle').value = post.seoTitle || '';
  document.getElementById('seoDescription').value = post.seoDescription || '';
  document.getElementById('seoKeyword').value = post.seoKeyword || '';
  
  let permalinkEl = document.getElementById('postPermalink');
  if (permalinkEl) permalinkEl.dataset.manual = 'true';
  
  // Set categories
  if (typeof setSelectedCategories === 'function') {
    setSelectedCategories(post.categories || []);
  }
  
  // Set tags
  if (typeof setTags === 'function') {
    setTags(post.tags || []);
  }
  
  // Set content
  if (typeof setEditorContent === 'function') {
    setEditorContent(post.content || '');
  }
  
  // Show image preview
  if (post.image && typeof showExistingImage === 'function') {
    showExistingImage(post.image);
  }
  
  if (typeof updateSEO === 'function') updateSEO();
}

/**
 * View post on frontend
 */
function viewPost() {
  let permalink = document.getElementById('postPermalink')?.value;
  if (!permalink) {
    alert('No permalink set.');
    return;
  }
  window.open('../posts/' + permalink + '.html', '_blank');
}

/**
 * Delete a post (GitHub + LocalStorage)
 */
async function deletePost(postId, fileName, source) {
  if (!confirm('Are you sure you want to delete this post?\n\nID: ' + postId)) {
    return;
  }
  
  let token = getToken();
  
  // 1. Delete from LocalStorage
  let posts = JSON.parse(localStorage.getItem(CONFIG.POSTS_CACHE_KEY) || '[]');
  let originalLength = posts.length;
  posts = posts.filter(p => p.id !== postId);
  if (posts.length < originalLength) {
    localStorage.setItem(CONFIG.POSTS_CACHE_KEY, JSON.stringify(posts));
  }
  
  // 2. Delete from GitHub (if token available and file exists)
  if (token && fileName) {
    try {
      await deleteFileFromGitHub(
        CONFIG.POSTS_FOLDER + fileName,
        `Delete post: ${fileName}`
      );
      showToast('✅ Post deleted from GitHub!', 'success');
    } catch (err) {
      console.warn('GitHub delete failed:', err);
      showToast('⚠️ Deleted locally, but GitHub delete failed', 'warning');
    }
  } else {
    showToast('✅ Post deleted locally!', 'success');
  }
  
  // Refresh list
  if (typeof loadPosts === 'function') {
    loadPosts();
  } else {
    location.reload();
  }
}