var sessionsStorageKey = 'userSessions';
var activeSessionKey = 'activeSessionName';
var sessionsView = $('#sessions');

$(document).ready(function () {
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
        if ($(e.target).closest('span').is('span')) {   //remove session if on remove button click
            removeSession(e);
        } else {
            activateSession(e);
        }
    });
});

chrome.storage.local.get(sessionsStorageKey, function (items) {
    chrome.storage.local.get(activeSessionKey, function (result) {
        items[sessionsStorageKey]._sessions.forEach(function (session) {
            sessionsView.append('<li ' + (session.name === result[activeSessionKey] ? 'class="active"' : '') + ' ><a href="#">' + session.name + '<span style="margin-left:75%"><button class="btn btn-danger" type="button"><span class="glyphicon glyphicon-trash" aria-hidden="true"></span></button></span></a></li>');
        });
    });
});

function activateSession(e) {
    var sessionName = $(e.target).closest('li').text();
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

function saveStateToActiveSession(callback) {
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
                            callback && callback();
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
                sessionsView.append('<li><a href="#">' + session.name + '</a></li>');
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
