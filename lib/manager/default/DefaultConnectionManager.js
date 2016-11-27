'use strict';

var ConnectionManager = require('../ConnectionManager'),
    util = require('util'),
    ip = require('ip'),
    zmq = require('zmq-connection'),
    EndpointEventEnum = zmq.EndpointEventEnum,
    ProtocolEnum = zmq.ProtocolEnum,
    EndpointTypeEnum = zmq.EndpointTypeEnum;


module.exports = function () {
    return new DefaultConnectionManager();
};


/**
 * Default implementation of ConnectionManager using ZMQ.
 * */
function DefaultConnectionManager() {
    ConnectionManager.call(this);
}

util.inherits(DefaultConnectionManager, ConnectionManager);


DefaultConnectionManager.prototype.listen = function (port, type, callback) {
    
    var endpoint = this.createEndpoint(type, ip.address(), type + ':' + this.endpoints.length, []);
    endpoint.bind(ProtocolEnum.TCP, port, "", callback);

    this.endpoints.push(endpoint);
};


DefaultConnectionManager.prototype.connect = function (address, port, receiveEndpoint) {

    var endpoint = this.createEndpoint(EndpointTypeEnum.DEALER, ip.address(),
        EndpointTypeEnum.DEALER + ':' + this.endpoints.length, []);

    endpoint._zmqSocket.identity = JSON.stringify(receiveEndpoint) || endpoint._zmqSocket.identity;

    endpoint.connect(ProtocolEnum.TCP, address, port, "", "");

    this.connections.push(endpoint);
};


DefaultConnectionManager.prototype.disconnect = function (address, port) {

    for(var i = 0; i < this.connections.length; i++) {

        if (this.connections[i].address === address &&
            this.connections[i].connectedTo[0].port === port) {

            this.connections[i]._close();
            this.connections.splice(i, 1);
            break;
        }
    }
};


DefaultConnectionManager.prototype.subscribe = function (address, port, topics) {
    
    var endpoint = this.createEndpoint(EndpointTypeEnum.SUBSCRIBER, address,
        EndpointTypeEnum.SUBSCRIBER + ':' + this.endpoints.length, topics);

    endpoint.connect(ProtocolEnum.TCP, address, port, "", "");
    endpoint.subscribe(topics);

    this.connections.push(endpoint);
};


DefaultConnectionManager.prototype.unsubscribe = function (address, port) {
    this.disconnect(address, port);
};


DefaultConnectionManager.prototype.send = function (receiver, message) {

    for (var i = 0; i < this.connections.length; i++) {

        if (this.connections[i].address === receiver.address &&
            this.connections[i].connectedTo[0].port === receiver.port) {

            this.connections[i].send(message, this.connections[i].connectedTo[0].id);
            break;
        }
    }
};


DefaultConnectionManager.prototype.publish = function (topic, message) {

    for (var i = 0; i < this.endpoints.length; i++) {

        if (this.endpoints[i].type === EndpointTypeEnum.PUBLISHER) {
            this.endpoints[i].send(message, "", topic);
            break;
        }
    }
};

DefaultConnectionManager.prototype.createEndpoint = function(type, address, alias, topics) {

    var self = this;
    var endpoint = zmq.Endpoint.create(type, address, alias, topics);

    endpoint.on(EndpointEventEnum.CONNECTED, function () {
        self.emit(EndpointEventEnum.CONNECTED, arguments);
    });

    /*
    endpoint.on(EndpointEventEnum.CONNECT_DELAYED, function () {
        self.emit(EndpointEventEnum.CONNECT_DELAYED, arguments);
    });
    */

    endpoint.on(EndpointEventEnum.CONNECT_RETRIED, function () {
        self.emit(EndpointEventEnum.CONNECT_RETRIED, arguments);
    });

    endpoint.on(EndpointEventEnum.LISTENING, function () {
        self.emit(EndpointEventEnum.LISTENING, arguments);
    });

    endpoint.on(EndpointEventEnum.BIND_FAILED, function () {
        self.emit(EndpointEventEnum.BIND_FAILED, arguments);
    });

    endpoint.on(EndpointEventEnum.ACCEPTED, function () {
        self.emit(EndpointEventEnum.ACCEPTED, arguments);
    });

    endpoint.on(EndpointEventEnum.ACCEPT_ERROR, function () {
        self.emit(EndpointEventEnum.ACCEPT_ERROR, arguments);
    });

    endpoint.on(EndpointEventEnum.CLOSED, function () {
        self.emit(EndpointEventEnum.CLOSED, arguments);
    });

    endpoint.on(EndpointEventEnum.CLOSE_FAILED, function () {
        self.emit(EndpointEventEnum.CLOSE_FAILED, arguments);
    });

    endpoint.on(EndpointEventEnum.DISCONNECTED, function () {
        self.emit(EndpointEventEnum.DISCONNECTED, arguments);
    });

    endpoint.on(EndpointEventEnum.MESSAGE, function () {
        var args = Array.apply(null, arguments);
        args.splice(0, 1);
        self.emit(EndpointEventEnum.MESSAGE, args.toString());
    });

    endpoint._monitor(100, 0);

    return endpoint;
};

DefaultConnectionManager.prototype.getEndpoints = function () {
    var result = [];
    
    for (var i = 0; i < this.endpoints.length; i++) {
        
        result.push({
            address: this.endpoints[i].address,
            port: this.endpoints[i].bindings[0].port,
            type: this.endpoints[i].type
        });
    }

    return result;
};
