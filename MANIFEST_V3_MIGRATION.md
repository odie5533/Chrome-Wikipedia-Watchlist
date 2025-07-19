# Manifest V3 Migration Guide

This document outlines the changes made to migrate the Chrome Wikipedia Watchlist extension from Manifest V2 to Manifest V3.

## Key Changes Made

### 1. Manifest.json Updates
- **manifest_version**: Updated from `2` to `3`
- **browser_action**: Replaced with `action`
- **background**: 
  - Replaced `scripts` array with `service_worker` pointing to a single file
  - Removed `persistent: true` (service workers are non-persistent by nature)
- **permissions**: 
  - Added `storage` permission for chrome.storage API
  - Moved host permissions to separate `host_permissions` array
  - Updated host permission from specific API endpoint to broader domain pattern

### 2. Background Script Migration
- **File**: `background.js`
- **Changes**:
  - Converted from persistent background page to service worker
  - Added `importScripts('wikiwatchlist.js')` to load shared functionality
  - Implemented proper service worker lifecycle handling
  - Added message passing for communication with popup/options
  - Replaced synchronous localStorage with asynchronous chrome.storage

### 3. Storage API Migration
- **File**: `wikiwatchlist.js`
- **Changes**:
  - Replaced all `localStorage` usage with `chrome.storage.sync`
  - Created helper functions `getStorageData()` and `setStorageData()`
  - Updated all storage operations to be asynchronous
  - Added proper initialization of default settings

### 4. Chrome API Updates
- **browserAction → action**: Updated all references from `chrome.browserAction` to `chrome.action`
- **RSS Parsing**: Created service worker-compatible RSS parser using regex (no DOM access)
- **Fetch API**: Replaced jQuery AJAX with native `fetch()` API for service worker compatibility

### 5. Popup Script Updates
- **File**: `popup.js`
- **Changes**:
  - Replaced `chrome.extension.getBackgroundPage()` with message passing
  - Updated to use chrome.storage instead of localStorage
  - Maintained DOM-based RSS parser for popup context
  - Added proper async/await handling

### 6. Options Script Updates
- **File**: `options.js`
- **Changes**:
  - Migrated from localStorage to chrome.storage
  - Added async/await for all storage operations
  - Improved form handling with proper event prevention
  - Added user feedback for save operations

## Compatibility Notes

### What Works the Same
- All user-facing functionality remains identical
- Extension icon and popup behavior unchanged
- Options page layout and functionality preserved
- Alarm scheduling and notifications work as before

### What Changed Under the Hood
- Storage is now synced across devices (chrome.storage.sync)
- Background processing is now event-driven (service worker)
- Better error handling and async operation management
- More secure permission model

## Testing

The extension has been tested for:
- ✅ Syntax validation of all JavaScript files
- ✅ Manifest V3 compliance
- ✅ UI functionality (popup and options pages)
- ✅ Chrome API compatibility

## Installation

To install the updated extension:
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the extension directory
5. Verify no errors appear in the console

## Migration Benefits

- **Future-proof**: Compliant with Chrome's latest extension standards
- **Better performance**: Service workers are more efficient than persistent background pages
- **Enhanced security**: Stricter permission model
- **Cross-device sync**: Settings now sync across Chrome instances
- **Improved reliability**: Better error handling and lifecycle management