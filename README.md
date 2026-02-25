# Markdown Batch Downloader

A Firefox extension to batch download web pages as Markdown files with configurable rate limiting, auto-save, and progress tracking.

## Features

- **Batch URL Processing** - Enter multiple URLs at once and download them all as Markdown
- **File Upload Support** - Load URLs from a `.txt` file (one URL per line)
- **Configurable Delay** - Set a custom delay between requests to avoid rate limiting
- **Auto-Save Mode** - Skip the "Save As" dialog for seamless batch downloads
- **Progress Tracking** - Real-time progress bar and per-URL status updates
- **Error Handling** - Graceful handling of timeouts, failed pages, and invalid URLs
- **Context Menu** - Right-click any page to download it as Markdown instantly
- **Duplicate Handling** - Automatically appends `-1`, `-2`, etc. to duplicate filenames

## Installation

### Temporary Installation (Development)

1. Open Firefox and navigate to `about:debugging`
2. Click **This Firefox** in the sidebar
3. Click **Load Temporary Add-on**
4. Select any file from this extension's directory (e.g., `manifest.json`)

### Permanent Installation

The extension needs to be signed by Mozilla for permanent installation. See [Mozilla's signing documentation](https://extensionworkshop.com/documentation/publish/submitting-an-add-on-to-amo/) for details.

## Usage

### Batch Download

1. Click the extension icon in the Firefox toolbar
2. Enter URLs in the textarea (one per line) or upload a `.txt` file
3. Configure settings:
   - **Delay (seconds)**: Time to wait between processing each URL (default: 2)
   - **Auto-save**: When checked, files save automatically without prompts
4. Click **Start**
5. Monitor progress in the progress bar and results list
6. Click **Cancel** at any time to stop processing

### Single Page Download

Right-click anywhere on a page and select **Download current page as Markdown** from the context menu.

## File Structure

```
markdown-batch-downloader/
├── manifest.json       # Extension manifest
├── background.js       # Background script with batch processing logic
├── content.js          # Content script for page scraping
├── popup.html          # Popup UI
├── popup.css           # Popup styling
├── popup.js            # Popup logic
└── lib/
    ├── turndown.min.js     # HTML to Markdown converter
    └── Readability.min.js  # Mozilla's page content extractor
```

## How It Works

1. The extension creates a background tab for each URL
2. Waits for the page to load (30-second timeout)
3. Uses [Readability.js](https://github.com/mozilla/readability) to extract the main content
4. Converts HTML to Markdown using [Turndown](https://github.com/mixmark-io/turndown)
5. Downloads the Markdown file with a sanitized filename
6. Closes the tab and proceeds to the next URL after the configured delay

## Filename Format

Files are saved with sanitized titles:
- Lowercase letters and numbers only
- Non-alphanumeric characters replaced with dashes
- Maximum 100 characters
- Duplicates get `-1`, `-2`, etc. suffix

Example: `My Article Title!` becomes `my-article-title.md`

## Permissions

| Permission | Purpose |
|------------|---------|
| `activeTab` | Access content of the active tab |
| `tabs` | Create and manage tabs for batch processing |
| `downloads` | Save Markdown files to disk |
| `contextMenus` | Add right-click menu option |
| `<all_urls>` | Access content on any website |

## License

MIT License
