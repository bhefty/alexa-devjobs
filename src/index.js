const Alexa = require('alexa-sdk');
const Promise = require('promise');
const fetch = require('isomorphic-fetch');
const API_KEY = process.env.API_KEY;
const APP_ID = process.env.APP_ID;

// Text strings =====================================================================================================

const goodbyeMessage = `Be sure to check back later for updated results.`;
const helpMessage = `You can ask to for the top search terms.`;

let searchTermsArray = []
// 2. Skill Code =======================================================================================================

exports.handler = function(event, context, callback) {
    // allow using callback as finish/error-handlers
    context.callbackWaitsForEmptyEventLoop = false;

    var alexa = Alexa.handler(event, context);

    alexa.appId = APP_ID;

    alexa.registerHandlers(handlers);
    alexa.execute();
};

var handlers = {
    'LaunchRequest': function () {        
        this.emit('TopSearchIntent')
    },

    'TopSearchIntent': function () {
        fetch(`https://api.rss2json.com/v1/api.json?rss_url=https://trends.google.com/trends/hottrends/atom/feed?pn=p1&api_key=${API_KEY}`)
            .then(res => res.json())
            .then(terms => {
                searchTermsArray = terms.items
                const count = searchTermsArray.length > 10 ? 10 : searchTermsArray.length
                
                let results = []
                for (let i = 0; i < count; i++) {
                    results.push(searchTermsArray[i].title)
                }

                this.emit(':tell', `The current top search terms are: ${results.join('...')}`)
            })
    },

    'AMAZON.HelpIntent': function () {
        this.emit(':ask', helpMessage, helpMessage);
    },

    'AMAZON.StopIntent': function () {
        this.emit(':tell', goodbyeMessage);
    },

    'AMAZON.CancelIntent': function () {
        this.emit(':tell', goodbyeMessage);
    },

    'Unhandled': function () {
        this.emit(':ask', `Sorry, I didn't understand that. Say help for assistance.`);
    },
};


//    END of Intent Handlers {} ========================================================================================