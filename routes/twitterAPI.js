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
    fs.readFile( __dirname + '/../data/feelings_duo_lang.csv', function (err, data) {
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

router.get('/getTweets/:hash_tag', function(req, res){
    let htag = '#'+req.params.hash_tag;
    console.log('Asking for tag: '+ htag);
    //console.log(process.env.TWITTER_CONSUMER_KEY);
    let client = new Twitter({
        consumer_key: process.env.TWITTER_CONSUMER_KEY,
        consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
        access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
        access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET

    });

    let feelingsFromCSV = createHashFromCVS();
    let maxTweetsFromTwitter = 200;
    let maxDisplayableDataItems = 100;
    client.get('search/tweets', {q: htag, count: maxTweetsFromTwitter}, function(error, tweets, response) {

        console.log('Num tweets from Twitter: '+tweets.statuses.length);
        let returnValues = [];
        if (!error) {
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
                if(returnValues.size > maxDisplayableDataItems) break;
            }

            console.log('Number of data objects for visualization: '+ returnValues.length);
            res.json(returnValues);
        } else {
            res.json({error: 'We have a problem! Pleas try later.'});
            console.log( error );
        }
    });
});
module.exports = router;