// ============================================
// BULK-UPDATE.JS - Batch update HTML files
// ============================================

var FILES_TO_UPDATE = [
  'admin/add-new-post.html',
  'admin/edit-post.html',
  'admin/all-posts.html',
  'admin/add-new-category.html',
  'admin/edit-category.html',
  'admin/add-new-tag.html',
  'admin/edit-tag.html',
  'admin/general-settings.html',
  'admin/import-export.html',
  'admin/index.html'
];

var SCRIPT_TAG = '<script src="/assets/js/transliterate.js"></script>';
var ANCHOR_TAG = '<script src="/assets/js/load-sidebar.js"></script>';
var fileStates = {};
var isRunning = false;

function initFileList() {
  var list = document.getElementById('fileList');
  if (!list) return;
  list.innerHTML = '';
  FILES_TO_UPDATE.forEach(function(file) {
    fileStates[file] = 'pending';
    var item = document.createElement('div');
    item.className = 'file-item';
    item.id = 'file-' + file.replace(/[^a-z0-9]/gi, '-');
    item.innerHTML = '<span class="file-name">' + file + '</span>' +
                    '<span class="file-status status-pending">⏳ Pending</span>';
    list.appendChild(item);
  });
}

function setFileStatus(file, status, message) {
  fileStates[file] = status;
  var item = document.getElementById('file-' + file.replace(/[^a-z0-9]/gi, '-'));
  if (!item) return;
  var statusEl = item.querySelector('.file-status');
  var map = {
    'pending': ['status-pending', '⏳ Pending'],
    'processing': ['status-processing', '🔄 Processing...'],
    'success': ['status-success', '✅ Updated'],
    'skipped': ['status-skipped', '⏭️ Skipped'],
    'error': ['status-error', '❌ Error']
  };
  var s = map[status] || map.pending;
  statusEl.className = 'file-status ' + s[0];
  statusEl.textContent = message || s[1];
}

function updateProgress(cur, total) {
  var pct = Math.round((cur / total) * 100);
  document.getElementById('progressBar').classList.add('show');
  var fill = document.getElementById('progressFill');
  fill.style.width = pct + '%';
  fill.textContent = pct + '% (' + cur + '/' + total + ')';
}

async function runBulkUpdate() {
  if (isRunning) return;
  var token = getToken();
  if (!token) { promptForToken(); return; }
  if (!confirm('Update ' + FILES_TO_UPDATE.length + ' files on GitHub?')) return;

  isRunning = true;
  document.getElementById('runBtn').disabled = true;
  document.getElementById('summary').classList.remove('show');

  var stats = { updated: 0, skipped: 0, errors: 0 };
  var total = FILES_TO_UPDATE.length;
  var current = 0;

  for (var i = 0; i < FILES_TO_UPDATE.length; i++) {
    var file = FILES_TO_UPDATE[i];
    setFileStatus(file, 'processing');

    try {
      var resp = await fetch(
        CONFIG.GITHUB_API + '/repos/' + CONFIG.GITHUB_REPO + '/contents/' + file + '?ref=' + CONFIG.GITHUB_BRANCH,
        { headers: { 'Authorization': 'token ' + token } }
      );

      if (!resp.ok) throw new Error('Fetch failed: ' + resp.status);

      var data = await resp.json();
      var content = decodeBase64(data.content.replace(/\n/g, ''));
      var sha = data.sha;

      if (content.indexOf('transliterate.js') !== -1) {
        setFileStatus(file, 'skipped', '⏭️ Already has it');
        stats.skipped++;
        current++;
        updateProgress(current, total);
        continue;
      }

      if (content.indexOf(ANCHOR_TAG) === -1) {
        setFileStatus(file, 'error', '❌ No anchor');
        stats.errors++;
        current++;
        updateProgress(current, total);
        continue;
      }

      var newContent = content.replace(ANCHOR_TAG, '  ' + SCRIPT_TAG + '\n  ' + ANCHOR_TAG);
      var b64 = encodeBase64(newContent);

      var upResp = await fetch(
        CONFIG.GITHUB_API + '/repos/' + CONFIG.GITHUB_REPO + '/contents/' + file,
        {
          method: 'PUT',
          headers: {
            'Authorization': 'token ' + token,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: 'Add transliterate.js to ' + file,
            content: b64,
            sha: sha,
            branch: CONFIG.GITHUB_BRANCH
          })
        }
      );

      if (!upResp.ok) {
        var err = await upResp.json();
        throw new Error(err.message || 'Upload failed');
      }

      setFileStatus(file, 'success', '✅ Updated');
      stats.updated++;

    } catch (err) {
      console.error('Error:', file, err);
      setFileStatus(file, 'error', '❌ ' + (err.message || 'Error'));
      stats.errors++;
    }

    current++;
    updateProgress(current, total);
    await new Promise(function(r) { setTimeout(r, 500); });
  }

  document.getElementById('sumTotal').textContent = total;
  document.getElementById('sumUpdated').textContent = stats.updated;
  document.getElementById('sumSkipped').textContent = stats.skipped;
  document.getElementById('sumErrors').textContent = stats.errors;
  document.getElementById('summary').classList.add('show');

  isRunning = false;
  document.getElementById('runBtn').disabled = false;
}

function resetAll() {
  if (isRunning) { alert('Running...'); return; }
  if (!confirm('Reset?')) return;
  initFileList();
  document.getElementById('summary').classList.remove('show');
  document.getElementById('progressBar').classList.remove('show');
  document.getElementById('progressFill').style.width = '0%';
}

window.addEventListener('load', function() {
  checkToken();
  initFileList();
});