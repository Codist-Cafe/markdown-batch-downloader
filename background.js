// Batch processing state
const batchState = {
  isRunning: false,
  urls: [],
  currentIndex: 0,
  settings: {
    delay: 2000,
    autoSave: true
  },
  results: []
};

// Track used filenames to handle duplicates
const usedFilenames = new Set();

// Create context menu for single-page download
browser.contextMenus.create({
  id: 'download-current-page',
  title: 'Download current page as Markdown',
  contexts: ['page']
});

// Handle context menu click
browser.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'download-current-page') {
    await scrapeAndDownload(tab.id);
  }
});

// Listen for messages from popup
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'startBatch':
      startBatch(message.urls, message.settings);
      break;
    case 'cancelBatch':
      cancelBatch();
      break;
  }
});

async function startBatch(urls, settings) {
  if (batchState.isRunning) {
    return;
  }

  // Reset state
  batchState.isRunning = true;
  batchState.urls = urls;
  batchState.currentIndex = 0;
  batchState.settings = settings;
  batchState.results = [];
  usedFilenames.clear();

  // Start processing
  await processNextUrl();
}

function cancelBatch() {
  batchState.isRunning = false;
  sendComplete(true);
}

async function processNextUrl() {
  if (!batchState.isRunning || batchState.currentIndex >= batchState.urls.length) {
    return completeBatch();
  }

  const url = batchState.urls[batchState.currentIndex];
  sendProgressUpdate();

  let tab = null;
  try {
    // Create background tab
    tab = await browser.tabs.create({ url, active: false });

    // Wait for page load with timeout
    await waitForTabLoad(tab.id, 30000);

    // Scrape the tab
    const markdown = await scrapeTab(tab.id);

    // Close tab
    await browser.tabs.remove(tab.id);
    tab = null;

    // Save markdown
    const filename = await saveMarkdown(markdown, batchState.settings.autoSave);
    recordSuccess(url, filename);

  } catch (error) {
    // Clean up tab if still open
    if (tab) {
      try {
        await browser.tabs.remove(tab.id);
      } catch (e) {
        // Tab might already be closed
      }
    }
    recordError(url, error);
  }

  batchState.currentIndex++;

  // Continue with next URL after delay
  if (batchState.isRunning && batchState.currentIndex < batchState.urls.length) {
    setTimeout(processNextUrl, batchState.settings.delay);
  } else {
    completeBatch();
  }
}

function waitForTabLoad(tabId, timeout) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error('Page load timeout'));
    }, timeout);

    const listener = (updatedTabId, changeInfo) => {
      if (updatedTabId !== tabId) return;

      if (changeInfo.status === 'complete') {
        cleanup();
        resolve();
      } else if (changeInfo.status === 'error') {
        cleanup();
        reject(new Error('Failed to load page'));
      }
    };

    const cleanup = () => {
      clearTimeout(timeoutId);
      browser.tabs.onUpdated.removeListener(listener);
    };

    browser.tabs.onUpdated.addListener(listener);
  });
}

async function scrapeTab(tabId) {
  try {
    // Try to send message to content script
    return await browser.tabs.sendMessage(tabId, { action: 'getMarkdown' });
  } catch (error) {
    // Content script not loaded, inject it
    await browser.tabs.executeScript(tabId, { file: 'lib/turndown.min.js' });
    await browser.tabs.executeScript(tabId, { file: 'lib/Readability.min.js' });
    await browser.tabs.executeScript(tabId, { file: 'content.js' });

    // Now try again
    return await browser.tabs.sendMessage(tabId, { action: 'getMarkdown' });
  }
}

async function saveMarkdown(response, autoSave) {
  if (response.error) {
    throw new Error(response.error);
  }

  // Generate base filename from title
  const baseFilename = response.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);

  // Handle duplicates
  let filename = baseFilename + '.md';
  let counter = 1;
  while (usedFilenames.has(filename)) {
    filename = `${baseFilename}-${counter}.md`;
    counter++;
  }
  usedFilenames.add(filename);

  // Create blob and download
  const blob = new Blob([response.markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);

  await browser.downloads.download({
    url: url,
    filename: filename,
    saveAs: !autoSave
  });

  return filename;
}

async function scrapeAndDownload(tabId) {
  try {
    const response = await scrapeTab(tabId);
    if (response.error) {
      console.error('Error scraping page:', response.error);
      return;
    }
    await saveMarkdown(response, false);
  } catch (error) {
    console.error('Error in scrapeAndDownload:', error);
  }
}

function recordSuccess(url, filename) {
  batchState.results.push({ url, success: true, filename });
  sendResult(url, true, filename, null);
}

function recordError(url, error) {
  const errorMsg = error.message || 'Unknown error';
  batchState.results.push({ url, success: false, error: errorMsg });
  sendResult(url, false, null, errorMsg);
}

function sendProgressUpdate() {
  browser.runtime.sendMessage({
    action: 'progress',
    current: batchState.currentIndex + 1,
    total: batchState.urls.length,
    url: batchState.urls[batchState.currentIndex]
  }).catch(() => {
    // Popup might be closed, ignore
  });
}

function sendResult(url, success, filename, error) {
  browser.runtime.sendMessage({
    action: 'result',
    url,
    success,
    filename,
    error
  }).catch(() => {
    // Popup might be closed, ignore
  });
}

function completeBatch() {
  batchState.isRunning = false;
  sendComplete(false);
}

function sendComplete(cancelled) {
  browser.runtime.sendMessage({
    action: 'complete',
    cancelled
  }).catch(() => {
    // Popup might be closed, ignore
  });
}
