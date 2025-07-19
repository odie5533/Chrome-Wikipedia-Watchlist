/*
Copyright (C) David Bern
See COPYRIGHT.txt for details
*/

// Send unload event to service worker instead of calling background page
addEventListener("unload", function (event) {
    chrome.runtime.sendMessage({action: 'unloadEvent'});
}, true);

// Storage helper functions for popup
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

// Initialize popup
$(document).ready(async function(){
    const settings = await getStorageData(['lang', 'https']);
    const httpPrefix = ((settings.https === 'true') ? 'https' : 'http') + '://';
    const watchlistLink = httpPrefix + settings.lang + ".wikipedia.org/wiki/Special:Watchlist";
    $('#watchlist').prop('href', watchlistLink);
    
    // Load and display unread items
    displayUnreadItems();
});

async function displayUnreadItems() {
    try {
        const { watchlistUrl } = await getWatchlistUrls();
        const response = await fetch(watchlistUrl);
        const data = await response.text();
        displayUnread(data);
    } catch (error) {
        console.error("Error loading watchlist:", error);
    }
}

async function getWatchlistUrls() {
    const settings = await getStorageData(['lang', 'https']);
    const httpPrefix = ((settings.https === 'true') ? 'https' : 'http') + '://';
    const wikipediaUrl = httpPrefix + settings.lang + ".wikipedia.org";
    const watchlistUrl = wikipediaUrl + "/w/api.php?action=feedwatchlist";
    const watchlistLink = wikipediaUrl + "/wiki/Special:Watchlist";
    
    return { watchlistUrl, watchlistLink, wikipediaUrl };
}

async function displayUnread(data) {
    const rss = parseRSS(data);
    const settings = await getStorageData(['unread', 'autoRead']);
    
    // Delegate adds mousedown handlers to new items as they appear
    $("html > body").delegate(".item", "mousedown", async function(){
        const m = $(this).removeClass('unread').attr('ms');
        console.log("Removing item: " + m);
        const reg = new RegExp(';'+m+'$|'+m+';?');
        const currentUnread = settings.unread || '';
        const newUnread = currentUnread.replace(reg, '');
        await setStorageData({'unread': newUnread});
        updateBadge();
    }).delegate(".item", "mouseenter", function() {
        $('#status').text(unescape(this.getAttribute('desc')));
    }).delegate(".item", "mouseleave", function() {
        $('#status').text('');
    });
    
    let lastDate = null;
    const string = [];
    rss.forEach(function(i){
        const msDate = Date.parse(i.pubDate);
        const d = new Date(msDate);
        const strTime = d.toLocaleTimeString().replace(/:\d+$/, '')
        const date = d.toDateString();
        if (lastDate != date) {
            if (lastDate != null) string.push('<hr/>');
            string.push('<div class="date">'+date+'</div>');
            lastDate = date;
        }
        let unread = '';
        if ((settings.unread || '').indexOf(msDate) != -1)
            unread = ' unread';
        string.push('<span desc="'+escape(i.description)+'" ms="'+msDate+'" class="item'+unread+'">(<a class="diff" href="'+i.link+'?diff=cur&oldid=prev" target="_blank"> d </a>) ');
        string.push(strTime+' <a href="'+i.link+'" class="link" target="_blank">'+i.title+'</a> '+i['dc:creator']+'</span><br/>');
    });
    $(document.body).append(string.join(''));
    
    if (settings.autoRead !== 'true') {
        // Show mark all read button
        $('<a href="#" id="markall">Mark All Read</a>').click(async function(){
            $("span.item").removeClass('unread');
            await setStorageData({'unread': ""});
            updateBadge();
        }).appendTo('body');
    }
    $('<div id="status"></div>').appendTo('body');
}

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

// DOM-based RSS parser for popup
function parseRSS(data) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(data, 'text/xml');
    const items = doc.querySelectorAll('item');
    
    const results = [];
    items.forEach(item => {
        const rssItem = {};
        item.children.forEach(child => {
            rssItem[child.tagName] = child.textContent;
        });
        results.push(rssItem);
    });
    
    return results;
}