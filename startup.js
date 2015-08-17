"use strict";

// init session holder;

chrome.storage.local.get('userSessions', function (items) {
    //alert(Object.keys(items).length === 0);
    if (Object.keys(items).length === 0) {
        var sessionHolder = new SessionsHolder();
        chrome.storage.local.set({'userSessions': sessionHolder}, function () {
            //TODO Operation Successful
        });
    }
});

chrome.storage.local.get('activeSessionName', function (items) {
    if (Object.keys(items).length === 0) {
        //TODO: Think about default active session and start tab
        //chrome.storage.local.set({'userSessions': sessionHolder}, function () {
        //    //TODO Operation Successful
        //});
    }
});




//getSessions();

//chrome.windows.onRemoved.addListener(function (windowId) {
//    alert("!! Exiting the Browser !!");
//});
//
function getSessions() {
    chrome.storage.local.get('userSessions', function (items) {
        var sessions = $('sessions');
        alert(JSON.stringify(items));
        //items['userSessions']._sessions.forEach(function (session) {
        //   alert(session.name);
        //});
    });
}