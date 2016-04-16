"use strict";
let Twitter = require('twitter');
let util = require('util');
let chalk = require('chalk');
let fs = require('fs');
let sentiment = require('sentiment');

const polishDictionary = JSON.parse(fs.readFileSync(__dirname + '/data/polish-dictionary.json'));
const twitterKeys = JSON.parse(fs.readFileSync(__dirname + '/twitter_keys.json', 'utf-8'));


function logInColor(text, color) {
    console.log(chalk[color](text))
}


logInColor('config loaded', 'green');

var twitterClient = new Twitter({
    consumer_key: twitterKeys.TWITTER_CONSUMER_KEY,
    consumer_secret: twitterKeys.TWITTER_CONSUMER_SECRET,
    access_token_key: twitterKeys.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: twitterKeys.TWITTER_ACCESS_TOKEN_SECRET
});


function throwErrorIfPresent(err) {
    if (err) {
        console.error(err);
        throw err;
    }
}

function printTweetWithSentimentToConsole(tweet) {
    if (tweet.text.startsWith("RT")) {
        return;
    }
    const sentimentResult = sentiment(tweet.text, polishDictionary);
    console.log(
        chalk.red(tweet.user.screen_name)
        + `: ${tweet.text.replace(/\r?\n|\r/g, ' ')} `
        + chalk.yellow(`score: ${sentimentResult.score}`)
    );
}

const listenOnStream = function (stream) {
    logInColor('stream connected', 'green');
    stream.on('data', (tweet) => {
        printTweetWithSentimentToConsole(tweet)
    });

    stream.on('error', throwErrorIfPresent);
};

const trackSettings = {track: 'CLF4Krakow,ZAGLGD,GoSovia,AferyGW,DUDZIE', language: 'pl'};


logInColor(`starting to track: ${trackSettings.track}`, 'yellow');
twitterClient.stream('statuses/filter', trackSettings, listenOnStream);
