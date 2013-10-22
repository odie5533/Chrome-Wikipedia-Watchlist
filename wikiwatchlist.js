/*
Copyright (C) David Bern
See COPYRIGHT.txt for details
*/
if (!localStorage['lang'])
    localStorage['lang'] = 'en';
if (!localStorage['https'])
    localStorage['https'] = true;
if (!localStorage['autoRead'])
    localStorage['autoRead'] = false;
if (!localStorage['checkDelay'] || !(localStorage['checkDelay'] > 0))
    localStorage['checkDelay'] = 5;

var httpPrefix = ((localStorage['https'] == 'true') ? 'https' : 'http') + '://';
var wikipediaUrl = httpPrefix + localStorage['lang'] + ".wikipedia.org";
var watchlistUrl = wikipediaUrl + "/w/api.php?action=feedwatchlist";
var watchlistLink = wikipediaUrl + "/wiki/Special:Watchlist";

if (!localStorage['last_date'])
    localStorage['last_date'] = '0';

// Checks user's watchlist for new items
// Can take a callback function which executes with the return data
function checkNewItems(callback) {
    console.log("Checking for new items...");
    chrome.browserAction.setBadgeText({text: ""});
    $.get(watchlistUrl, function(data) {
        handleWatchlistData(data);
        if (typeof(callback) == 'function')
            callback(data);
    });
}

// Looks at the localStorage['unread'] and updates the badge to reflect
function updateBadge() {
    var unread = localStorage['unread'].split(';').length;
    if (unread > 0 && localStorage['unread'])
        chrome.browserAction.setBadgeText({text: unread.toString()});
    else
        chrome.browserAction.setBadgeText({text: ""});
}

// Pushes new unread items to localStorage[unread], prune old items, updateBadge
function handleWatchlistData(data) {
    var unread = [];
    if (localStorage['unread'])
        unread = $(localStorage['unread'].split(';')).map(function(){
            return parseInt(this);});
    var rss = parseRSS(data);
    // rss_ms: array of ms values from RSS which was just read
    var rss_ms = rss.map(function(){
        var msDate = Date.parse(this.pubDate);
        // only push items with a newer timestamp than the last one read
        if (msDate > localStorage["last_date"]) {
            console.log("New unread item: " + this.title);
            unread.push(msDate);
        }
        return msDate;
    });
    localStorage["last_date"] = rss_ms.get(0);

    // prunes old entries that are no longer listed
    localStorage["unread"] = $(unread).filter(rss_ms).get().join(";");
    
    updateBadge();
}

/* RSS parser in 7 lines */
function parseRSS(d) {
    return $(d).find('item').map(function() {
        var i = new Object();
        $(this).children().each(function(){i[this.tagName]= this.textContent;});
        return i;
    });
}
