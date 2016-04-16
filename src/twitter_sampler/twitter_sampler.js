"use strict";
var Twitter = require('twitter');
var util = require('util');
var chalk = require('chalk');
var fs = require('fs');


var twitterClient = new Twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

const throwErrorIfPresent = function (err) {
    if (err) {
        throw err;
    }
};

const listenOnStream = function (stream) {
    stream.on('data', (tweet) => {
        console.log(chalk.red(`${tweet.user.screen_name} `) + `wrote: ${tweet.text}`);
    });

    stream.on('error', (error)=> {
        throw error;
    });
};

twitterClient.stream('statuses/filter', {track: 'kukiz,Kukiz', language: 'pl'}, listenOnStream);
