/* @flow */
"use strict";

let events = require('events');
let net = require('net');
let _ = require('lodash');
let moment = require('moment');


class Channel extends events.EventEmitter {
    constructor() {
        super();
        this.clients = {};
        this.aliases = {};
        this.subscriptions = {};
        this.initializeListeners();
    }

    _createSubscriptionFunction(id) {
        return (senderId, message)=> {
            if (id !== senderId) {
                this.clients[id].consumeMessage(this.formatMessage(senderId, `wrote: ${message}`));
            }
        }
    }

    getAliasForId(id) {
        let alias = this.aliases[id];
        if (alias) {
            return alias;
        }
        throw new Error('alias not found');
    }

    formatMessage(referencedId, message) {
        return `[${this.getAliasForId(referencedId)}] on ${moment().format('h:mm:ss')} ${message}`
    }

    initializeListeners() {
        this.on('join', (id, client)=> {
            this.clients[id] = client;
            this.aliases[id] = client.alias;
            this.announceJoined(id);
            this.subscriptions[id] = this._createSubscriptionFunction(id);
            this.on('broadcast', this.subscriptions[id]);
        });
    }

    announceJoined(joinedId) {
        _.forEach(this.clients, (client)=> {
            client.consumeMessage(this.formatMessage(joinedId, 'joined the channel'));
        })
    }
}

class Client {
    constructor(alias, connection, channel) {
        this._connection = connection;
        this._alias = alias;
        this._channel = channel;
        this._id = Client.createId(this._connection);
        this.joinChannel();
        this.listenForData();
    }

    get alias() {
        return this._alias;
    }

    joinChannel() {
        this._channel.emit('join', this._id, this);
    }

    static createId(connection) {
        return `${connection.remoteAddress}:${connection.remotePort}`;
    }

    listenForData() {
        this._connection.on('data', (data)=> {
            data = ChatServer.purifyString(data);
            this._channel.emit('broadcast', this._id, data);
        });
    }

    consumeMessage(message) {
        this._connection.write(`${message}\n`);
    }
}

class ChatServer {
    constructor(channel, port) {
        this._channel = channel;
        this.socketServer = this.createSocketServer(port);
    }

    createSocketServer(port) {
        return net.createServer((connection)=> {
            this.connectionListenerFunction(connection)
        }).listen(port, ()=> {
            console.log('server is listening');
        });
    }

    connectionListenerFunction(connection) {
        console.log(`new client connected`);
        connection.write('Please type your alias:\n');
        connection.once('data', (alias)=> {
            new Client(ChatServer.purifyString(alias), connection, this._channel);
        });
    }

    static purifyString(alias) {
        return alias.toString().trim();
    }
}

let channel = new Channel();
let server = new ChatServer(channel, 8888);
