"use strict";

let messages = require('./messages');
let _ = require('lodash');
let async = require('async');
let utils = require('./utils');

const maxProblemSize = 300000;

class MasterSorer {
    constructor(workers) {
        this._workers = workers;
    }

    sortData(data, sortingDoneCallback) {
        const chunks = utils.timeAndLog(()=>MasterSorer._splitDataIntoChunks(data, this._workers.length), 'master: splitting into chunks');
        const roundRobinWorkers = this._createRoundRobinWorkersFunction(this._workers);

        const tasks = chunks.map((chunk, index) => {
            return (parallelCallback)=> MasterSorer._sendChunkToWorkerAndAwaitResult(chunk, index, roundRobinWorkers(), parallelCallback);
        });

        console.info(`master - number of chunks: ${tasks.length}`);

        async.parallelLimit(tasks,
            this._workers.length,
            (err, results)=> {
                if (err) return sortingDoneCallback(err);

                console.info(`master: got ${results.length} results, beginning to merge`);
                const merged = utils.timeAndLog(()=>MasterSorer.mergeResults(results), `master - merging results`);

                return sortingDoneCallback(null, merged)
            }
        );
    }

    static _splitDataIntoChunks(data, numberOfWorkers) {
        if (data.length <= numberOfWorkers) {
            return data.map((element)=> [element]);
        }

        const chunkLength = Math.min(Math.ceil(data.length / numberOfWorkers), maxProblemSize);
        const result = [];

        while (data.length > 0) {
            result.push(data.splice(0, chunkLength));
        }

        return result;
    }

    static _sendChunkToWorkerAndAwaitResult(chunk, chunkId, worker, callback) {
        worker.send({
            type: messages.sort,
            to: worker.wid,
            data: {
                input: chunk,
                meta: chunkId
            }
        });

        worker.once(messages.sortResult + chunkId, (data)=> {
            callback(null, data);
        });
    }

    static mergeResults(results) {
        if (results.length <= 1) {
            return results[0];
        }

        const first = results.shift();
        const second = results.shift();
        results.push(MasterSorer.mergeArrays(first, second));

        return MasterSorer.mergeResults(results);
    }


    static mergeArrays(leftArray, rightArray) {
        const result = [];
        let indexLeft = 0;
        let indexRight = 0;

        while (!endOfAtLeastOneArrayReached()) {
            if (leftArray[indexLeft] <= rightArray[indexRight]) {
                result.push(leftArray[indexLeft++]);
            } else {
                result.push(rightArray[indexRight++]);
            }
        }

        if (!endOfLeftArrayReached()) {
            return result.concat(leftArray.slice(indexLeft));
        } else if (!endOfRightArrayReached()) {
            return result.concat(rightArray.slice(indexRight));
        }

        return result;

        function endOfAtLeastOneArrayReached() {
            return endOfLeftArrayReached() || endOfRightArrayReached();
        }

        function endOfLeftArrayReached() {
            return (indexLeft >= leftArray.length);
        }

        function endOfRightArrayReached() {
            return (indexRight >= rightArray.length)
        }
    }

    _createRoundRobinWorkersFunction(workers) {
        let current = 0;
        return function () {
            const result = workers[current++];

            if (current === workers.length) {
                current = 0;
            }

            return result;
        }
    }
}

module.exports = MasterSorer;
