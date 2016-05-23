'use strict';

const redis = require('redis');
const bluebird = require('bluebird');
const request = require('request');
const elasticsearch = require('elasticsearch');
const fs = require('fs');
const _ = require('lodash');
const async = require('async');
const sh = require('shorthash');
const sleep = require('sleep');
const config = require('../config');
const readline = require('readline'); //handy wrapper for readStream


bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

let client = redis.createClient({
    host: config.redis.url,
    port: config.redis.port
});

let ES = elasticsearch.Client({
    host: config.elasticsearch.url,
    requestTimeout: 30000000
});

const readLineStream = readline.createInterface({ //this stream will serve keys one per line
    input: fs.createReadStream('no-keys')
});

let keysBuffer = [];
readLineStream.on('line', (line) => { // you were splitting with '\n' I guess your input is key per-line
    if (line) { //check for empty lines
        keysBuffer.push(line);
        if (keysBuffer.length === 1000) {
            migrateKeys(keysBuffer);
            keysBuffer = [];
        }
    }
});

readLineStream.on('end', ()=>{
    if(keysBuffer.length >0){
        migrateKeys(keysBuffer); // remember to flush your local buffer
    }
});

function migrateKeys(chunkOfKeys) {
    client.mget(chunkOfKeys, (mgetError, replies) => {
        if (mgetError) {
            console.error(mgetError); // Consider returning early
        }
        console.log('MGET complete from Redis');
        console.log('We have ' + replies.length + ' documents');

        let parsedReplies = [];
        replies.forEach((reply)=> {
            try {
                let content = JSON.parse(reply);
                parsedReplies.push([{
                    index: {
                        _index: config.elasticsearch.index,
                        _type: 'article',
                        _id: sh.unique(content.url),
                        _timestamp: (new Date()).toISOString()
                    }
                }, content]); // no need to filter out replies with parse errors
            } catch (e) {
                console.error(e);
            }
        }); //using async for sync code is not recommended

        console.log('Export complete with ' + parsedReplies.length);

        ES.bulk({body: parsedReplies}, () => {
            console.log('Import complete');
        });
    });
}