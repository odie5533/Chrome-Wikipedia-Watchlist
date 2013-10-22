/*
Copyright (C) David Bern
See COPYRIGHT.txt for details
*/
var background = chrome.extension.getBackgroundPage();
addEventListener("unload", function (event) {
    background.unloadEvent();
}, true);

// Set the watchlist url to the computed one, based on https and lang settings
$('#watchlist').prop('href', watchlistLink);

//localStorage.removeItem('unread');localStorage.removeItem('last_date');
checkNewItems(displayUnread);

function displayUnread(data) {
    var rss = parseRSS(data);
    
    // Delegate adds mousedown handlers to new items as they appear
    $("html > body").delegate(".item", "mousedown", function(){
        var m = $(this).removeClass('unread').attr('ms');
        console.log("Removing item: " + m);
        var reg = new RegExp(';'+m+'$|'+m+';?');
        localStorage['unread'] = localStorage['unread'].replace(reg, '');
        updateBadge();
    }).delegate(".item", "mouseenter", function() {
        $('#status').text(unescape(this.getAttribute('desc')));
    }).delegate(".item", "mouseleave", function() {
        $('#status').text('');
    });
    
    var lastDate = null;
    var string = new Array();
    rss.each(function(){
        var i = this;
        var msDate = Date.parse(i.pubDate);
        var d = new Date(msDate);
        var strTime = d.toLocaleTimeString().replace(/:\d+$/, '')
        var date = d.toDateString();;
        if (lastDate != date) {
            if (lastDate != null) string.push('<hr/>');
            string.push('<div class="date">'+date+'</div>');
            lastDate = date;
        }
        var unread = '';
        if (localStorage['unread'].indexOf(msDate) != -1)
            unread = ' unread';
        string.push('<span desc="'+escape(i.description)+'" ms="'+msDate+'" class="item'+unread+'">(<a class="diff" href="'+i.link+'?diff=cur&oldid=prev" target="_blank"> d </a>) ');
        string.push(strTime+' <a href="'+i.link+'" class="link" target="_blank">'+i.title+'</a> '+i['dc:creator']+'</span><br/>');
    });
    $(document.body).append(string.join(''));
    
    if (localStorage['autoRead'] != 'true') {
        // Show mark all read button
        $('<a href="#" id="markall">Mark All Read</a>').click(function(){
            $("span.item").removeClass('unread');
            localStorage['unread'] = "";
            updateBadge();
        }).appendTo('body');
    }
    $('<div id="status"></div>').appendTo('body');
}