var sessionsStorageKey = 'userSessions';
var activeSessionKey = 'activeSessionName';
var sessionsView = $('#sessions');
var setting = null;


initSetting(bindEvents);

displaySessions();

function displaySessions() {
    chrome.storage.local.get(sessionsStorageKey, function (items) {
        chrome.storage.local.get(activeSessionKey, function (result) {
            items[sessionsStorageKey]._sessions.forEach(function (session) {
                renderSession(session, result[activeSessionKey]);
            });
        });
    });
}

function bindEvents() {
    $("#btn_new_session").click(function (e) {
        e.preventDefault();
        var sessionName = $("#new_session_name").val();
        if (sessionName === "") {
            return;
        }
        saveStateToNewSession(sessionName);
    });

    $('#btn_save_session').click(function (e) {
        e.preventDefault();
        saveStateToActiveSession();
    });

    $('#btn_save_quit').click(function (e) {
        e.preventDefault();
        saveStateToActiveSession(closeBrowser);
    });

    $('#btn_quit').click(function (e) {
        e.preventDefault();
        closeBrowser();
    });

    sessionsView.click(function (e) {
        var sessionName = $(e.target).text();
        activateSession(sessionName);         //ToDO:

        //if ($(e.target).closest('span').is('span')) {   //remove session if on remove button click
        //    removeSession(e);
        //} else {
        //    if (setting.autoSave) {
        //        saveStateToActiveSession(activateSession, e);
        //    } else {
        //        activateSession(e);
        //    }
        //}
    });
}

function activateSession(sessionName) {
    chrome.storage.local.set({activeSessionName: sessionName}, function () {
    });
    chrome.storage.local.get(sessionsStorageKey, function (items) {
        items['userSessions']._sessions.forEach(function (session) {
            if (session.name === sessionName) {
                chrome.windows.create({state: "maximized"}, function (window) {
                    session._tabs.forEach(function (tab) {
                        chrome.tabs.create({url: tab.url, windowId: window.id}, function (tab) {
                            //TODO: log here
                        });
                    });

                    chrome.tabs.getAllInWindow(window.id, function (tabs) {
                        chrome.tabs.remove(tabs[0].id);     // Close first tab in new window.
                        // Here we have a chance to remove new window, if we remove first tab before any of
                        // others will be created
                    });
                    chrome.windows.getAll({}, function (windows) {
                        windows.forEach(function (w) {
                            if (w.id !== window.id) {
                                chrome.windows.remove(w.id);    //close windows from previous session
                            }
                        });
                    });
                });
            }
        });
    });
}

function removeSession(e) {
    var sessionName = $(e.target).closest('li').text();
    chrome.storage.local.get(sessionsStorageKey, function (result) {
        for (var i = 0; i < result['userSessions']._sessions.length; i++) {
            if (result['userSessions']._sessions[i].name === sessionName) {
                result['userSessions']._sessions.splice(i, 1);
                break;
            }
        }
        chrome.storage.local.set({'userSessions': result['userSessions']}, function () {
            $(e.target).closest('li').remove();
        });
        chrome.storage.local.get(activeSessionKey, function (result) {
            if (result[activeSessionKey] === sessionName) {
                chrome.storage.local.set({activeSessionName: ''}, function () {
                });
            }
        });
    });
}

function saveStateToActiveSession(callback, arg) {
    chrome.storage.local.get(activeSessionKey, function (active) {
        chrome.storage.local.get('userSessions', function (result) {
            var sessionHolder = result['userSessions'];
            //restoreHolder(sessionHolder);
            sessionHolder._sessions.forEach(function (session) {
                if (session.name === active[activeSessionKey]) {
                    session._tabs = [];
                    chrome.tabs.query({}, function (tabs) {
                        tabs.forEach(function (tab) {
                            var simpleTab = new SimpleTab(tab.url, tab.title);
                            session._tabs.push(simpleTab);
                        });
                        //sessionHolder.addSession(session);
                        chrome.storage.local.set({'userSessions': sessionHolder}, function () {
                            //TODO Operation Successful
                            callback && callback(arg);
                        });
                    });
                }
            });


        });
    });
}

function saveStateToNewSession(name) {
    var session = new Session(name);
    chrome.tabs.query({}, function (tabs) {
        tabs.forEach(function (tab) {
            var simpleTab = new SimpleTab(tab.url, tab.title);
            session.addTab(simpleTab);
        });
        chrome.storage.local.get('userSessions', function (result) {
            var sessionHolder = result['userSessions'];
            restoreHolder(sessionHolder);
            sessionHolder.addSession(session);
            chrome.storage.local.set({'userSessions': sessionHolder}, function () {
                //TODO Operation Successful
                renderSession(session);
                $("#new_session_name").val('');
            });
        });
    });
}

function closeBrowser() {
    chrome.windows.getAll({}, function (windows) {
        windows.forEach(function (window) {
            chrome.windows.remove(window.id);    //close all windows to quit from browser
        });
    });
}

function renderSession(session, activeSessionName) {
    //sessionsView.append(
    //    '<li ' + (session.name === activeSessionName ? 'class="active"' : '') + ' >' +
    //    '<a href="#"><span style="margin-right:5%">' +
    //    '<button class="btn btn-danger" type="button"><span class="glyphicon glyphicon-trash" aria-hidden="true"></span>' +
    //    '</button>' +
    //    '</span>' + session.name +
    //    '</a>' +
    //    '</li>');
    sessionsView.append('<div class="session-view">' +
        '<button type="button" class="btn session-name' + (session.name === activeSessionName ? ' active ' : '') + '">' + session.name + '</button>' +
        '<button type="button" class="btn dropdown-toggle session-context" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"><span class="caret"></span><span class="sr-only">Toggle Dropdown</span></button>' +
        '<ul class="session-menu">' +
        '<li><a href="#">Activate</a></li>' +
        '<li><a href="#">Save & Activate</a></li>' +
        '<li class="divider"></li>' +
        '<li><a href="#">Rename</a></li>' +
        '<li><a href="#">Remove</a></li></ul>' +
        '</div>');

}

function initSetting(callback) {
    chrome.storage.local.get('setting', function (result) {
        setting = result['setting'];
        callback();
    });
}