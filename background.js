/*
Copyright (C) David Bern
See COPYRIGHT.txt for details
*/
function scheduleRequest() {
    var period = parseInt(localStorage['checkDelay']);
    console.log("Scheduling request for " + period + " minutes");
    console.log("Creating alarm 'checkNewItems'");
    chrome.alarms.create('checkNewItems', {periodInMinutes: period});
    chrome.alarms.onAlarm.addListener(onAlarm);
}

function onAlarm(alarm) {
    console.log("Got alarm", alarm);
    if (alarm && alarm.name == 'checkNewItems') {
        checkNewItems();
    }
}

function unloadEvent() {
    console.log("Unload event");
    if (localStorage['autoRead'] == 'true') {
        localStorage['unread'] = "";
        chrome.browserAction.setBadgeText({text: ""});
    }
}

scheduleRequest();
checkNewItems();
