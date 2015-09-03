var sessionsStorageKey = 'userSessions';
var activeSessionKey = 'activeSessionName';
var sessionsView = $('#sessions');
var setting = null;


initSetting(showPopup);

function showPopup() {
    chrome.storage.local.get(sessionsStorageKey, function (items) {
        chrome.storage.local.get(activeSessionKey, function (result) {
            items[sessionsStorageKey]._sessions.forEach(function (session) {
                renderSession(session, result[activeSessionKey]);
            });
            bindEvents();
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

    sessionBindEvents();
}

function sessionBindEvents() {
    sessionsView.find(".session-menu li :contains(Remove)").each(function (index, elem) {
        $(elem).click(function (e) {
            var sessionView = $(e.target).closest('div');
            var sessionName = sessionView.find('button:eq(0)').first().text();
            removeSession(sessionName, sessionView)
        })
    });

    sessionsView.find(".session-menu li :contains(Activate):not(:contains(Save & Activate))").each(function (index, elem) {
        $(elem).click(function (e) {
            var sessionName = $(e.target).closest('div').find('button:eq(0)').first().text();
            activateSession(sessionName);
        })
    });

    sessionsView.find(".session-menu li :contains(Save & Activate)").each(function (index, elem) {
        $(elem).click(function (e) {
            var sessionName = $(e.target).closest('div').find('button:eq(0)').first().text();
            saveStateToActiveSession(activateSession, sessionName);
        })
    });

    sessionsView.find(".session-name").each(function (index, elem) {
        $(elem).click(function (e) {
            var sessionName = $(e.target).text();
            if (setting.autoSave) {
                saveStateToActiveSession(activateSession, sessionName);
            } else {
                activateSession(sessionName);
            }
        })
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

function removeSession(sessionName, sessionView) {
    chrome.storage.local.get(sessionsStorageKey, function (result) {
        for (var i = 0; i < result['userSessions']._sessions.length; i++) {
            if (result['userSessions']._sessions[i].name === sessionName) {
                result['userSessions']._sessions.splice(i, 1);
                break;
            }
        }
        chrome.storage.local.set({'userSessions': result['userSessions']}, function () {
            sessionView.remove();
            chrome.storage.local.get(activeSessionKey, function (result) {
                if (result[activeSessionKey] === sessionName) {
                    chrome.storage.local.set({activeSessionName: ''}, function () {
                    });
                }
            });
        });
    });
}

/**
 * Do nothing if can't find active session in sessionHolder
 *
 * @param callback
 * @param arg arguments for callback
 */
function saveStateToActiveSession(callback, arg) {
    chrome.storage.local.get(activeSessionKey, function (active) {
        chrome.storage.local.get('userSessions', function (result) {
            var sessionHolder = result['userSessions'];
            sessionHolder._sessions.forEach(function (session) {
                if (session.name === active[activeSessionKey]) {
                    session._tabs = [];
                    chrome.tabs.query({}, function (tabs) {
                        tabs.forEach(function (tab) {
                            var simpleTab = new SimpleTab(tab.url, tab.title);
                            session._tabs.push(simpleTab);
                        });
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
                sessionBindEvents();        //TODO: bind events only to new session
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
    sessionsView.append('<div class="session-view">' +
        '<button type="button" class="btn session-name' + (session.name === activeSessionName ? ' active ' : '') + '">' + session.name + '</button>' +
        '<button type="button" class="btn dropdown-toggle session-context' + (session.name === activeSessionName ? ' active ' : '') + '" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"><span class="caret"></span><span class="sr-only">Toggle Dropdown</span></button>' +
        '<ul class="session-menu">' +
        '<li><a href="#">Activate</a></li>' +
        '<li><a href="#">Save & Activate</a></li>' +
        '<li class="divider"></li>' +
        '<li class="disabled"><a href="#">Rename</a></li>' +
        '<li><a href="#">Remove</a></li></ul>' +
        '</div>');

}

function initSetting(callback) {
    chrome.storage.local.get('setting', function (result) {
        setting = result['setting'];
        callback && callback();
    });
}