"use strict";

let _ = require('lodash');
let messages = require('./messages');
let utils = require('./utils');

class SortingWorker {

    constructor(process) {
        this._process = process;
        this._pid = process.pid;
        this._addListenersToProcess(this._process);
    }

    _addListenersToProcess(process) {
        process.on('message', (message)=> {
            if (message.type === messages.sort) {
                this.sendMessage(messages.logging, `got sort message, problem size: ${message.data.input.length}, chunkId : ${message.data.meta}`);
                this._processSortMessage(message);
            } else {
                this.sendMessage(messages.logging, `unknown message type`);
            }
        })
    }

    _processSortMessage(message) {
        const sortedData = utils.timer(()=>SortingWorker.sortData(message.data.input));

        this.sendMessage(messages.logging, `the sorting took: ${sortedData.time} miliseconds`);

        this.sendMessage(messages.sortResult, {output: sortedData.result, meta: message.data.meta});
    }

    sendMessage(type, data) {
        process.send({
            type: type,
            from: `Worker: ${this._pid}`,
            data: data
        });
    }

    static sortData(data) {
        return _.sortBy(data);
    }
}

module.exports = SortingWorker;