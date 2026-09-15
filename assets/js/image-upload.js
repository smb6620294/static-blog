/* ============================================
   IMAGE-UPLOAD.JS - Image Upload + SVG Conversion
   Used by: add-new-post, edit-post, add-new-page, edit-new-page
   ============================================ */

let _uploadedImagePath = '';
let _uploadedImageBase64 = '';

/**
 * Handle image file upload
 */
function handleImageUpload(event) {
  let file = event.target.files[0];
  if (!file) return;
  
  let status = document.getElementById('uploadStatus');
  let preview = document.getElementById('imagePreview');
  
  if (status) {
    status.textContent = 'Converting to SVG...';
    status.className = 'upload-status info';
  }

  // Validate
  if (!file.type.startsWith('image/')) {
    if (status) {
      status.textContent = '❌ Invalid image file.';
      status.className = 'upload-status error';
    }
    return;
  }

  let reader = new FileReader();
  reader.onload = function(e) {
    let img = new Image();
    img.onload = function() {
      let svgContent = convertImageToSVG(img, file.name);
      
      // Generate filename from permalink or title
      let permalink = document.getElementById('postPermalink')?.value.trim();
      if (!permalink) {
        let titleEl = document.getElementById('postTitle');
        permalink = titleEl ? generateSlug(titleEl.value) : '';
      }
      if (!permalink) permalink = 'post-image-' + Date.now();
      
      let fileName = permalink + '.' + CONFIG.IMAGE_FORMAT;
      let imagePath = '/' + CONFIG.IMAGES_FOLDER + fileName;
      
      // Save
      _uploadedImagePath = imagePath;
      _uploadedImageBase64 = encodeBase64(svgContent);
      
      let pathField = document.getElementById('postImage');
      let base64Field = document.getElementById('postImageBase64');
      if (pathField) pathField.value = imagePath;
      if (base64Field) base64Field.value = _uploadedImageBase64;
      
      // Show preview
      if (preview) {
        let svgBlob = new Blob([svgContent], {type: 'image/svg+xml'});
        preview.src = URL.createObjectURL(svgBlob);
        preview.style.display = 'block';
      }
      
      if (status) {
        status.textContent = '✓ Ready to upload: ' + fileName;
        status.className = 'upload-status success';
      }
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

/**
 * Convert an image element to SVG string
 */
function convertImageToSVG(img, originalName) {
  let width = img.width;
  let height = img.height;
  
  let canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  let ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  
  let base64 = canvas.toDataURL('image/png');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <title>${originalName}</title>
  <image width="${width}" height="${height}" xlink:href="${base64}"/>
</svg>`;
}

/**
 * Get uploaded image path
 */
function getUploadedImagePath() {
  let field = document.getElementById('postImage');
  return field ? field.value : _uploadedImagePath;
}

/**
 * Get uploaded image base64
 */
function getUploadedImageBase64() {
  let field = document.getElementById('postImageBase64');
  return field ? field.value : _uploadedImageBase64;
}

/**
 * Reset image upload state
 */
function resetImageUpload() {
  _uploadedImagePath = '';
  _uploadedImageBase64 = '';
  
  let pathField = document.getElementById('postImage');
  let base64Field = document.getElementById('postImageBase64');
  if (pathField) pathField.value = '';
  if (base64Field) base64Field.value = '';
  
  let preview = document.getElementById('imagePreview');
  if (preview) {
    preview.src = '';
    preview.style.display = 'none';
  }
  
  let status = document.getElementById('uploadStatus');
  if (status) {
    status.textContent = '';
    status.className = 'upload-status';
  }
}

/**
 * Show existing image preview (for edit mode)
 */
function showExistingImage(imagePath) {
  let preview = document.getElementById('imagePreview');
  let status = document.getElementById('uploadStatus');
  
  if (imagePath && preview) {
    preview.src = imagePath;
    preview.style.display = 'block';
    if (status) {
      status.textContent = 'Existing image loaded';
      status.className = 'upload-status success';
    }
  }
}