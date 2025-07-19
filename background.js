/*
Copyright (C) David Bern
See COPYRIGHT.txt for details
*/

// Service worker background script for Manifest V3
// Import the main functionality
importScripts('wikiwatchlist.js');

// Initialize settings and schedule check when service worker starts
chrome.runtime.onStartup.addListener(initializeExtension);
chrome.runtime.onInstalled.addListener(initializeExtension);

async function initializeExtension() {
    console.log("Extension initializing...");
    await initializeSettings();
    await scheduleRequest();
    checkNewItems();
}

async function scheduleRequest() {
    const settings = await getStorageData(['checkDelay']);
    const period = parseInt(settings.checkDelay || 5);
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

async function unloadEvent() {
    console.log("Unload event");
    const settings = await getStorageData(['autoRead']);
    if (settings.autoRead === 'true') {
        await setStorageData({'unread': ""});
        chrome.action.setBadgeText({text: ""});
    }
}

// Listen for alarms
chrome.alarms.onAlarm.addListener(onAlarm);

// Handle messages from popup and options
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'unloadEvent') {
        unloadEvent().then(() => sendResponse({success: true}));
        return true; // Keep message channel open for async response
    }
});

// Initialize when service worker starts
initializeExtension();
