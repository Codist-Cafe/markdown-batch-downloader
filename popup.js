// DOM Elements
const urlsTextarea = document.getElementById('urls');
const fileInput = document.getElementById('file-input');
const delayInput = document.getElementById('delay');
const autoSaveCheckbox = document.getElementById('auto-save');
const startBtn = document.getElementById('start-btn');
const cancelBtn = document.getElementById('cancel-btn');
const progressSection = document.getElementById('progress-section');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const resultsSection = document.getElementById('results-section');
const resultsList = document.getElementById('results-list');

// Parse URLs from text
function parseUrls(text) {
  const lines = text.split(/[\r\n]+/);
  const urls = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    try {
      const url = new URL(trimmed);
      if (url.protocol === 'http:' || url.protocol === 'https:') {
        urls.push(trimmed);
      }
    } catch (e) {
      // Invalid URL, skip
      console.log('Skipping invalid URL:', trimmed);
    }
  }

  return urls;
}

// Handle file upload
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    urlsTextarea.value = event.target.result;
  };
  reader.onerror = () => {
    console.error('Error reading file');
  };
  reader.readAsText(file);
});

// Start batch processing
startBtn.addEventListener('click', async () => {
  const text = urlsTextarea.value;
  const urls = parseUrls(text);

  if (urls.length === 0) {
    progressText.textContent = 'Please enter at least one valid URL';
    progressSection.hidden = false;
    return;
  }

  const settings = {
    delay: parseFloat(delayInput.value) * 1000 || 2000,
    autoSave: autoSaveCheckbox.checked
  };

  // Reset UI
  resultsList.innerHTML = '';
  resultsSection.hidden = true;
  progressSection.hidden = false;
  progressFill.style.width = '0%';
  progressText.textContent = 'Starting...';

  // Disable inputs
  setInputsDisabled(true);

  // Send message to background script
  browser.runtime.sendMessage({
    action: 'startBatch',
    urls,
    settings
  });
});

// Cancel batch processing
cancelBtn.addEventListener('click', () => {
  browser.runtime.sendMessage({ action: 'cancelBatch' });
  progressText.textContent = 'Cancelling...';
  cancelBtn.disabled = true;
});

// Listen for messages from background script
browser.runtime.onMessage.addListener((message) => {
  switch (message.action) {
    case 'progress':
      updateProgress(message.current, message.total, message.url);
      break;

    case 'result':
      addResult(message.url, message.success, message.filename, message.error);
      break;

    case 'complete':
      handleComplete(message.cancelled);
      break;
  }
});

function updateProgress(current, total, url) {
  const percent = Math.round((current / total) * 100);
  progressFill.style.width = percent + '%';
  progressText.textContent = `Processing ${current}/${total}: ${url}`;
}

function addResult(url, success, filename, error) {
  resultsSection.hidden = false;

  const item = document.createElement('li');
  item.className = 'result-item ' + (success ? 'success' : 'error');

  const urlSpan = document.createElement('span');
  urlSpan.className = 'url';
  urlSpan.textContent = url;
  item.appendChild(urlSpan);

  if (success) {
    const filenameSpan = document.createElement('span');
    filenameSpan.className = 'filename';
    filenameSpan.textContent = 'Saved: ' + filename;
    item.appendChild(filenameSpan);
  } else {
    const errorSpan = document.createElement('span');
    errorSpan.className = 'error-msg';
    errorSpan.textContent = 'Error: ' + error;
    item.appendChild(errorSpan);
  }

  resultsList.appendChild(item);
  resultsList.scrollTop = resultsList.scrollHeight;
}

function handleComplete(cancelled) {
  setInputsDisabled(false);
  cancelBtn.disabled = true;

  if (cancelled) {
    progressText.textContent = 'Batch cancelled';
  } else {
    progressText.textContent = 'Batch complete';
    progressFill.style.width = '100%';
  }
}

function setInputsDisabled(disabled) {
  urlsTextarea.disabled = disabled;
  fileInput.disabled = disabled;
  delayInput.disabled = disabled;
  autoSaveCheckbox.disabled = disabled;
  startBtn.disabled = disabled;
  cancelBtn.disabled = !disabled;
}
