"use strict";

// init session holder;

chrome.storage.local.get('userSessions', function (items) {
    if (Object.keys(items).length === 0) {
        var sessionHolder = new SessionsHolder();
        chrome.storage.local.set({'userSessions': sessionHolder}, function () {
            //TODO Operation Successful
        });
    }
});

// init active session

chrome.storage.local.get('activeSessionName', function (items) {
    if (Object.keys(items).length === 0) {
        alert("no AS");
        //TODO: Think about default active session and start tab
        //chrome.storage.local.set({'userSessions': sessionHolder}, function () {
        //    //TODO Operation Successful
        //});
    }
});

// init extension setting

chrome.storage.local.get('setting', function (result) {
    if (Object.keys(result).length === 0) {
        var defaultSetting = new ExtensionSetting();
        chrome.storage.local.set({'setting': defaultSetting}, function () {
            //TODO MSG:Custom setting not found, using default setting
        });
    }
});
