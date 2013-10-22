/*
Copyright (C) David Bern
See COPYRIGHT.txt for details
*/
$(function(){
$("#https").prop("checked", (localStorage['https'] == 'true'));
$("#autoRead").prop("checked", (localStorage['autoRead'] == 'true'));
$("#lang").val(localStorage['lang']);
$("#checkDelay").val(localStorage['checkDelay']);

$("#options").submit(function() {
    var lang = $("#lang").val();
    if (lang != localStorage['lang']) {
        // change language and reset any previous unread/last_date
        localStorage['lang'] = lang;
        localStorage.removeItem('unread');
        localStorage.removeItem('last_date');
    }
    
    localStorage['https'] = $("#https").prop("checked");
    localStorage['autoRead'] = $("#autoRead").prop("checked");

    var delay = parseInt($("#checkDelay").val());
    if (delay != localStorage['checkDelay'] && delay > 0) {
        localStorage['checkDelay'] = delay;
        console.log("Scheduling request for " + delay + " minutes");
        console.log("Creating alarm 'checkNewItems'");
        chrome.alarms.create('checkNewItems', {periodInMinutes: delay});
    }
});
});
