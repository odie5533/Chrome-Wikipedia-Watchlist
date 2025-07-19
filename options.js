/*
Copyright (C) David Bern
See COPYRIGHT.txt for details
*/

// Storage helper functions
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

$(async function(){
    // Load current settings
    const settings = await getStorageData(['https', 'autoRead', 'lang', 'checkDelay']);
    
    $("#https").prop("checked", (settings.https === 'true'));
    $("#autoRead").prop("checked", (settings.autoRead === 'true'));
    $("#lang").val(settings.lang || 'en');
    $("#checkDelay").val(settings.checkDelay || '5');

    $("#options").submit(async function(event) {
        event.preventDefault();
        
        const currentSettings = await getStorageData(['lang', 'checkDelay']);
        const lang = $("#lang").val();
        
        if (lang != currentSettings.lang) {
            // change language and reset any previous unread/last_date
            await setStorageData({
                'lang': lang,
                'unread': '',
                'last_date': '0'
            });
        } else {
            await setStorageData({'lang': lang});
        }
        
        const httpsChecked = $("#https").prop("checked");
        const autoReadChecked = $("#autoRead").prop("checked");
        
        await setStorageData({
            'https': httpsChecked.toString(),
            'autoRead': autoReadChecked.toString()
        });

        const delay = parseInt($("#checkDelay").val());
        if (delay != currentSettings.checkDelay && delay > 0) {
            await setStorageData({'checkDelay': delay.toString()});
            console.log("Scheduling request for " + delay + " minutes");
            console.log("Creating alarm 'checkNewItems'");
            chrome.alarms.create('checkNewItems', {periodInMinutes: delay});
        }
        
        // Show saved message
        const saveMessage = $('<div style="color: green; margin-top: 10px;">Settings saved!</div>');
        $(this).append(saveMessage);
        setTimeout(() => saveMessage.fadeOut(), 2000);
    });
});
