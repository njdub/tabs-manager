"use strict";

function SessionsHolder() {
    this._sessions = [];
}

SessionsHolder.prototype.addSession = function (session) {
    this._sessions.push(session);
};

function restoreHolder(holder) {
    holder.addSession = SessionsHolder.prototype.addSession;
}