'use strict';

var util = require('util'),
    EventEmitter = require('events');

/**
 * Exports
 */

module.exports = ConnectionManager;


/**
 * Connection manager handles endpoint bindings and connections.
 *
 * @interface
 * @constructor
 * */
function ConnectionManager() {
    EventEmitter.call(this);

    this.endpoints = [];
    this.connections = [];
}

util.inherits(ConnectionManager, EventEmitter);


/**
 *
 * */
ConnectionManager.prototype.listen = function (port, type, callback) {
};


/**
 *
 * */
ConnectionManager.prototype.connect = function (address, port) {
};


/**
 *
 * */
ConnectionManager.prototype.disconnect = function (address, port) {
};


/**
 *
 * */
ConnectionManager.prototype.subscribe = function (address, port, topics) {
};


/**
 *
 * */
ConnectionManager.prototype.unsubscribe = function (address, port, topics) {
};


/**
 *
 * */
ConnectionManager.prototype.send = function (receiver, message) {
};


/**
 *
 * */
ConnectionManager.prototype.publish = function (message) {
};
