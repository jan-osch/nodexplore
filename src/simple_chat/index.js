/* @flow */

import {EventEmitter} from "events";
import net from "net";


class Channel extends EventEmitter {
    constructor() {
        super();
        this.clients = {};
        this.subscriptions = {};
    }
}

let channel = new Channel();

channel.on('join', (id, client)=> {
    this.clients[id] = client;
    this.subscriptions[id] = createSubscriptionFunction(id);
    this.on('broadcast', this.subscriptions[id].call(this));
});

let createSubscriptionFunction = (id)=> {
    return (senderId, message)=> {
        if (id !== senderId) {
            this.clients[id].write(message);
        }
    }
};

let server = net.createServer((client)=> {
    const id = `{client.remoteAddress}:{client.remotePort}`;
    client.on('connect', ()=> {
        channel.emit('join', id, client);
    });
    client.on('data', (data)=> {
        data = data.toString();
        channel.emit('broadcast', id, data);
    })
});