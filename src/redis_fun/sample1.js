"use strict";
let redis = require('redis');
let client = redis.createClient(6379, '127.0.0.1');
let net = require('net');

const mainRoom = 'main_chat_room';

var server = net.createServer(function (socket) {
    var subscriber;
    var publisher;
    socket.on('connect', function () {
        subscriber = redis.createClient();
        subscriber.subscribe('main_chat_room');
        subscriber.on('message', function (channel, message) {
            socket.write('Channel ' + channel + ': ' + message);
        });
        publisher = redis.createClient();
    });
    socket.on('data', function (data) {
        publisher.publish('main_chat_room', data);
    });
    socket.on('end', function () {
        subscriber.unsubscribe('main_chat_room');
        subscriber.end();
        publisher.end();
    });
});
server.listen(3000);

