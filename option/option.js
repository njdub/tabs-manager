"use strict";

displayCurrentSetting();

function displayCurrentSetting() {
    chrome.storage.local.get('setting', function (result) {
        var setting = result['setting'];
        $('#auto-save').prop('checked', setting.autoSave);
    });
}

$('#save-setting').click(function (e) {
    var newSetting = new ExtensionSetting();
    newSetting.autoSave = $('#auto-save').prop('checked');
    chrome.storage.local.set({'setting': newSetting}, function () {
        //TODO MSG:New setting Saved
    });
});