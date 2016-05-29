"use strict";

let cluster = require('cluster');
let _ = require('lodash');
let fs = require('fs');
let MasterSorter = require('./master');
let WorkerSorter = require('./worker');
let messages = require('./messages');
let utils = require('./utils');


function initializeWorkers() {
    return require('os').cpus().map(()=> {
        return cluster.fork();
    })
}


function loadInputData(path) {
    return (JSON.parse(fs.readFileSync(path))).data;
}

function listenOnLoggingAndChangeToEvents(workers) {
    workers.forEach((worker)=> {
        worker.on('message', (message)=> {
            if (message.type === messages.logging) {
                console.info(`Worker: ${worker.id} logged: ${message.data}`)
            } else if (message.type === messages.sortResult) {
                worker.emit(messages.sortResult + message.data.meta, message.data.output);
            }
        })
    });

    return workers;
}

function checkArray(array) {
    for (let i = 1; i < array.length; i++) {
        if (array[i] < array[i - 1]) {
            throw new Error('not sorted!');
        }
    }
}

function checkWithOriginal(array, original) {
    const difference = _.difference(array, original);
    if (difference.length > 0) {
        throw new Error('something is missing:' + difference.length);
    }
}

function checkWithOriginalDeep(array, original) {
    const sortedOriginal = _.sortBy(original);

    sortedOriginal.forEach((element, index)=> {
        if (element !== array[index]) {
            throw new Error(`not equal: ${element} != ${array[index]}`);
        }
    })
}


if (cluster.isMaster) {
    console.log(`Master starting with path: ${process.argv[2]}`);

    cluster.on('online', function (worker) {
        console.log(`Worker pid: ${worker.process.pid} id: ${worker.id} is online`);
    });

    const workers = listenOnLoggingAndChangeToEvents(initializeWorkers());
    const master = new MasterSorter(workers);

    const inputData = utils.timeAndLog(()=>loadInputData(process.argv[2]), 'main - loading input data');

    master.sortData(inputData, (err, result)=> {
        if (err) throw err;

        console.log(`finished sorting, result: ${result.length} length / ${result.slice(0, 50)} ... `);
        process.exit(0);
    })

} else {
    const worker = new WorkerSorter(process);

}