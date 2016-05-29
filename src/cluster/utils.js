"use strict";

function timer(fn) {
    const start = new Date();
    const result = fn();
    const took = new Date().getTime() - start.getTime();

    return {
        result: result,
        time: took
    }
}

function unwrapAndLogTimedResult(timedResult, message) {
    console.info(`${message}: took ${timedResult.time} miliseconds`);
    return timedResult.result;
}

function chainable(fn) {
    return function (argument) {
        fn(argument);
        return argument;
    }
}

function timeAndLog(fn, message) {
    return unwrapAndLogTimedResult(timer(fn), message);
}

exports.chainable = chainable;
exports.timer = timer;
exports.unwrapAndLogTimedResult = unwrapAndLogTimedResult;
exports.timeAndLog = timeAndLog;