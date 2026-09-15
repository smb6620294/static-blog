/* ============================================
   EDITOR.JS - TinyMCE Rich Text Editor
   Used by: add-new-post, edit-post, add-new-page, edit-new-page
   ============================================ */

let _editorMode = 'visual';
let _editorInitialized = false;

/**
 * Initialize TinyMCE editor
 * @param {string} selector - CSS selector (default: '#postContentVisual')
 * @param {function} onChangeCallback - Optional callback on content change
 */
function initRichEditor(selector, onChangeCallback) {
  if (_editorInitialized) return;
  
  let targetSelector = selector || '#postContentVisual';
  
  tinymce.init({
    selector: targetSelector,
    height: 400,
    menubar: false,
    plugins: 'lists link image table wordcount',
    toolbar: 'undo redo | blocks | bold italic underline | alignleft aligncenter alignright | bullist numlist | link image',
    content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
    setup: function(editor) {
      editor.on('keyup change', function() {
        let codeArea = document.getElementById('postContentCode');
        if (codeArea) codeArea.value = editor.getContent();
        
        if (typeof onChangeCallback === 'function') {
          onChangeCallback(editor.getContent());
        } else if (typeof updateSEO === 'function') {
          updateSEO();
        }
      });
    }
  });
  
  _editorInitialized = true;
}

/**
 * Switch between Visual and Code tabs
 * @param {string} mode - 'visual' or 'code'
 */
function switchEditorTab(mode) {
  if (mode === _editorMode) return;

  let visualTab = document.getElementById('tabVisual');
  let codeTab = document.getElementById('tabCode');
  let visualPanel = document.getElementById('panelVisual');
  let codePanel = document.getElementById('panelCode');
  let codeTextarea = document.getElementById('postContentCode');

  if (!visualTab || !codeTab) return;

  if (mode === 'code') {
    let content = tinymce.get('postContentVisual').getContent();
    codeTextarea.value = content;
    visualTab.classList.remove('active');
    codeTab.classList.add('active');
    visualPanel.classList.remove('active');
    codePanel.classList.add('active');
  } else {
    let codeContent = codeTextarea.value;
    tinymce.get('postContentVisual').setContent(codeContent);
    visualTab.classList.add('active');
    codeTab.classList.remove('active');
    visualPanel.classList.add('active');
    codePanel.classList.remove('active');
  }

  _editorMode = mode;
  if (typeof updateSEO === 'function') updateSEO();
}

/**
 * Get current editor content (HTML)
 */
function getEditorContent() {
  if (_editorMode === 'visual') {
    return tinymce.get('postContentVisual') ? tinymce.get('postContentVisual').getContent() : '';
  } else {
    let codeArea = document.getElementById('postContentCode');
    return codeArea ? codeArea.value : '';
  }
}

/**
 * Get current editor content (plain text, tags stripped)
 */
function getEditorTextContent() {
  let html = getEditorContent();
  return html.replace(/<[^>]*>/g, '').trim();
}

/**
 * Set editor content
 */
function setEditorContent(html) {
  if (tinymce.get('postContentVisual')) {
    tinymce.get('postContentVisual').setContent(html || '');
  }
  let codeArea = document.getElementById('postContentCode');
  if (codeArea) codeArea.value = html || '';
}

/**
 * Get current editor mode ('visual' or 'code')
 */
function getEditorMode() {
  return _editorMode;
}