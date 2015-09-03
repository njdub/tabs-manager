"use strict";

function Session(name) {
    this.name = name;
    this._tabs = [];
}

Session.prototype.addTab = function (tab) {
    this._tabs.push(tab);
};