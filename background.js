/*
Copyright (C) David Bern
See COPYRIGHT.txt for details
*/
try {
  importScripts("jquery-2.0.3.min.js", "wikiwatchlist.js");
} catch (e) {
  console.error(e);
}

function scheduleRequest() {
    var period = parseInt(localStorage['checkDelay']);
    console.log("Scheduling request for " + period + " minutes");
    console.log("Creating alarm 'checkNewItems'");
    chrome.alarms.create('checkNewItems', {periodInMinutes: period});
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
        chrome.action.setBadgeText({text: ""});
    }
}

chrome.alarms.onAlarm.addListener(onAlarm);

scheduleRequest();
checkNewItems();
