/* ============================================
   IMAGE-UPLOAD.JS - Image Upload + SVG Conversion
   Compresses images to ≤ 100 KB automatically
   Used by: add-new-post, edit-post, add-new-page, edit-new-page
   ============================================ */

let _uploadedImagePath = '';
let _uploadedImageBase64 = '';
let _uploadedImageSize = 0;

// ==================== HANDLE IMAGE UPLOAD ====================
function handleImageUpload(event) {
  let file = event.target.files[0];
  if (!file) return;
  
  let status = document.getElementById('uploadStatus');
  let preview = document.getElementById('imagePreview');
  
  if (status) {
    status.textContent = '📷 Reading file...';
    status.className = 'upload-status info';
  }

  // Validate it's an image
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
      if (status) {
        status.textContent = '⚙️ Compressing to ≤ 100 KB...';
        status.className = 'upload-status info';
      }
      
      // Convert and compress image to SVG
      let svgContent = convertImageToSVG(img, file.name);
      
      // Generate filename from permalink or title
      let permalink = document.getElementById('postPermalink')?.value.trim();
      if (!permalink) {
        let titleEl = document.getElementById('postTitle');
        permalink = titleEl ? generateSlug(titleEl.value) : '';
      }
      if (!permalink) permalink = 'post-image-' + Date.now();
      
      let fileName = permalink + '.svg';
      let imagePath = '/' + CONFIG.IMAGES_FOLDER + fileName;
      
      // Save state
      _uploadedImagePath = imagePath;
      _uploadedImageBase64 = encodeBase64(svgContent);
      _uploadedImageSize = Math.round(svgContent.length / 1024);
      
      // Set hidden fields
      let pathField = document.getElementById('postImage');
      let base64Field = document.getElementById('postImageBase64');
      if (pathField) pathField.value = imagePath;
      if (base64Field) base64Field.value = _uploadedImageBase64;
      
      // Show preview
      if (preview) {
        let blob = new Blob([svgContent], {type: 'image/svg+xml'});
        preview.src = URL.createObjectURL(blob);
        preview.style.display = 'block';
      }
      
      // Success message with size
      let sizeIcon = _uploadedImageSize <= 100 ? '✅' : '⚠️';
      if (status) {
        status.textContent = sizeIcon + ' ' + fileName + ' — ' + _uploadedImageSize + ' KB';
        status.className = 'upload-status ' + (_uploadedImageSize <= 100 ? 'success' : 'info');
      }
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// ==================== CONVERT IMAGE TO SVG (with compression) ====================
function convertImageToSVG(img, originalName) {
  // ==================== SETTINGS ====================
  const MAX_WIDTH = 800;
  const MAX_HEIGHT = 600;
  const MAX_SIZE_KB = 100;
  const USE_WEBP = true;
  
  // ==================== CALCULATE NEW SIZE ====================
  let width = img.width;
  let height = img.height;
  
  if (width > MAX_WIDTH || height > MAX_HEIGHT) {
    let ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }
  
  // ==================== CREATE CANVAS ====================
  let canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  let ctx = canvas.getContext('2d');
  
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);
  
  // ==================== CHOOSE FORMAT ====================
  let mimeType = 'image/jpeg';
  
  if (USE_WEBP) {
    let testCanvas = document.createElement('canvas');
    testCanvas.width = 1;
    testCanvas.height = 1;
    let testData = testCanvas.toDataURL('image/webp');
    if (testData.indexOf('data:image/webp') === 0) {
      mimeType = 'image/webp';
    }
  }
  
  // ==================== COMPRESS ====================
  let qualities = [0.7, 0.6, 0.5, 0.4, 0.3];
  let base64 = '';
  let sizeKB = 0;
  
  for (let q of qualities) {
    base64 = canvas.toDataURL(mimeType, q);
    sizeKB = Math.round((base64.length * 3 / 4) / 1024);
    if (sizeKB <= MAX_SIZE_KB) break;
  }
  
  // ==================== IF STILL TOO BIG ====================
  if (sizeKB > MAX_SIZE_KB) {
    let ratio = Math.sqrt(MAX_SIZE_KB / sizeKB);
    let newW = Math.round(width * ratio);
    let newH = Math.round(height * ratio);
    
    let canvas2 = document.createElement('canvas');
    canvas2.width = newW;
    canvas2.height = newH;
    let ctx2 = canvas2.getContext('2d');
    ctx2.imageSmoothingEnabled = true;
    ctx2.imageSmoothingQuality = 'high';
    ctx2.drawImage(canvas, 0, 0, newW, newH);
    
    base64 = canvas2.toDataURL(mimeType, 0.5);
    sizeKB = Math.round((base64.length * 3 / 4) / 1024);
    
    width = newW;
    height = newH;
  }
  
  // ==================== LOG ====================
  console.log('🖼️ Image compressed:', {
    originalSize: img.width + '×' + img.height,
    finalSize: width + '×' + height,
    sizeKB: sizeKB,
    format: mimeType,
    underLimit: sizeKB <= MAX_SIZE_KB
  });
  
  // ==================== BUILD SVG ====================
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <title>${originalName}</title>
  <image width="${width}" height="${height}" xlink:href="${base64}"/>
</svg>`;
}

// ==================== GETTERS / SETTERS ====================
function getUploadedImagePath() {
  let field = document.getElementById('postImage');
  return field ? field.value : _uploadedImagePath;
}

function getUploadedImageBase64() {
  let field = document.getElementById('postImageBase64');
  return field ? field.value : _uploadedImageBase64;
}

// ==================== RESET ====================
function resetImageUpload() {
  _uploadedImagePath = '';
  _uploadedImageBase64 = '';
  _uploadedImageSize = 0;
  
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

// ==================== SHOW EXISTING IMAGE ====================
function showExistingImage(imagePath) {
  let preview = document.getElementById('imagePreview');
  let status = document.getElementById('uploadStatus');
  
  if (imagePath && preview) {
    preview.src = imagePath;
    preview.style.display = 'block';
    if (status) {
      status.textContent = '📷 Existing image loaded';
      status.className = 'upload-status success';
    }
  }
}
