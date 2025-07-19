/*
Copyright (C) David Bern
See COPYRIGHT.txt for details
*/

// Storage helper functions for Manifest V3
async function getStorageData(keys) {
    return new Promise((resolve) => {
        chrome.storage.sync.get(keys, resolve);
    });
}

async function setStorageData(data) {
    return new Promise((resolve) => {
        chrome.storage.sync.set(data, resolve);
    });
}

async function initializeSettings() {
    const settings = await getStorageData(['lang', 'https', 'autoRead', 'checkDelay']);
    
    const defaults = {
        lang: settings.lang || 'en',
        https: settings.https !== undefined ? settings.https : 'true',
        autoRead: settings.autoRead || 'false',
        checkDelay: settings.checkDelay > 0 ? settings.checkDelay : '5'
    };
    
    await setStorageData(defaults);
    return defaults;
}

async function getWatchlistUrls() {
    const settings = await getStorageData(['lang', 'https']);
    const httpPrefix = ((settings.https === 'true') ? 'https' : 'http') + '://';
    const wikipediaUrl = httpPrefix + settings.lang + ".wikipedia.org";
    const watchlistUrl = wikipediaUrl + "/w/api.php?action=feedwatchlist";
    const watchlistLink = wikipediaUrl + "/wiki/Special:Watchlist";
    
    return { watchlistUrl, watchlistLink, wikipediaUrl };
}

// Checks user's watchlist for new items
// Can take a callback function which executes with the return data
async function checkNewItems(callback) {
    console.log("Checking for new items...");
    chrome.action.setBadgeText({text: ""});
    
    const { watchlistUrl } = await getWatchlistUrls();
    
    try {
        const response = await fetch(watchlistUrl);
        const data = await response.text();
        await handleWatchlistData(data);
        if (typeof(callback) == 'function') {
            callback(data);
        }
        return data;
    } catch (error) {
        console.error("Error fetching watchlist:", error);
    }
}

// Looks at the stored unread items and updates the badge to reflect
async function updateBadge() {
    const settings = await getStorageData(['unread']);
    const unreadItems = settings.unread ? settings.unread.split(';') : [];
    const unreadCount = unreadItems.filter(item => item.length > 0).length;
    
    if (unreadCount > 0) {
        chrome.action.setBadgeText({text: unreadCount.toString()});
    } else {
        chrome.action.setBadgeText({text: ""});
    }
}

// Pushes new unread items to storage, prune old items, updateBadge
async function handleWatchlistData(data) {
    const settings = await getStorageData(['unread', 'last_date']);
    let unread = [];
    
    if (settings.unread) {
        unread = settings.unread.split(';').map(item => parseInt(item)).filter(item => !isNaN(item));
    }
    
    const rss = parseRSS(data);
    // rss_ms: array of ms values from RSS which was just read
    const rss_ms = [];
    
    rss.forEach(item => {
        const msDate = Date.parse(item.pubDate);
        // only push items with a newer timestamp than the last one read
        if (msDate > (parseInt(settings.last_date) || 0)) {
            console.log("New unread item: " + item.title);
            unread.push(msDate);
        }
        rss_ms.push(msDate);
    });
    
    const lastDate = rss_ms.length > 0 ? Math.max(...rss_ms).toString() : (settings.last_date || '0');

    // prunes old entries that are no longer listed
    const filteredUnread = unread.filter(item => rss_ms.includes(item));
    
    await setStorageData({
        "last_date": lastDate,
        "unread": filteredUnread.join(";")
    });
    
    updateBadge();
}

/* RSS parser for service worker (no DOM) */
function parseRSS(data) {
    const results = [];
    // Simple regex-based parsing for RSS items
    const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/g;
    let match;
    
    while ((match = itemRegex.exec(data)) !== null) {
        const itemContent = match[1];
        const rssItem = {};
        
        // Extract common RSS fields
        const fields = ['title', 'link', 'description', 'pubDate', 'dc:creator'];
        fields.forEach(field => {
            const fieldRegex = new RegExp(`<${field}[^>]*>([\\s\\S]*?)<\\/${field}>`, 'i');
            const fieldMatch = fieldRegex.exec(itemContent);
            if (fieldMatch) {
                rssItem[field] = fieldMatch[1].trim();
            }
        });
        
        if (rssItem.title) {
            results.push(rssItem);
        }
    }
    
    return results;
}
