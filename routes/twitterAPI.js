require('dotenv').config();
const express = require('express');
const router = express.Router();
const Twitter = require('twitter');
const parse = require('csv-parse');
const fs = require('fs');

function FeelingCVSData(text, type, num) {
    this.text = text;
    this.type = type;
    this.num = num;
}

function createHashFromCVS(){
     this.feelingsFromCSV = new Map();
    fs.readFile( __dirname + '/../data/feelings.csv', function (err, data) {
        if (err) {
            throw err;
        }
        parse(data,{}, function(err, output){
            if(err){
                throw err;
            }
            for(index in output){
                this.feelingsFromCSV.set(output[index][1], new FeelingCVSData(output[index][1], output[index][2], 0) );
            }
        });
    });
    return this.feelingsFromCSV;
}

let TweetData = function tweetData(type, tag, tweet){
    this.type = type;
    this.tag = tag;
    this.tweetText = tweet.text;
};

function getWordsFromTweet(tweetText){
    let wordArray = tweetText.split(/[\.\,\@\#\b \b]/);
    return wordArray;
}

router.get('/', function(req, res){

    //console.log(process.env.TWITTER_CONSUMER_KEY);
    let client = new Twitter({
        consumer_key: process.env.TWITTER_CONSUMER_KEY,
        consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
        access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
        access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET

    });

    let feelingsFromCSV = createHashFromCVS();

    client.get('search/tweets', {q: '#feeling', count: '100'}, function(error, tweets, response) {

        //let returnValues = new Map();
        let returnValues = [];

        if (!error) {
            console.log(JSON.stringify(tweets.statuses));
            //Extract words from tweet
            for(stat in tweets.statuses){
                let wordsArray = getWordsFromTweet(tweets.statuses[stat].text);
                for(word in wordsArray){
                    if((typeof feelingsFromCSV.get(wordsArray[word])) != 'undefined'){
                        //feelingsFromCSV.get(wordsArray[word]).num += 1;
                        returnValues.push(new TweetData(feelingsFromCSV.get(wordsArray[word]).type, wordsArray[word], tweets.statuses[stat]));
                        break;
                    }
                }
            }

            console.log('Number of visual objects: '+ returnValues.length);
            res.json(returnValues);
            //res.json(tweets);
        } else {
            res.json({error: 'We have a problem! Pleas try later.'});
            console.log( error );
        }
    });
});
module.exports = router;