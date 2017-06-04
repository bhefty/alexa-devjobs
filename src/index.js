const Alexa = require('alexa-sdk');
const Promise = require('promise');
const fetch = require('isomorphic-fetch');

// alexa-cookbook sample code

// There are three sections, Text Strings, Skill Code, and Helper Function(s).
// You can copy and paste the entire file contents as the code for a new Lambda function,
//  or copy & paste section #3, the helper function, to the bottom of your existing Lambda code.


// 1. Text strings =====================================================================================================
//    Modify these strings and messages to change the behavior of your Lambda function

const welcomeOutput = `Let's search for some remote jobs! What kind of job would you like to search for?`;
const welcomeReprompt = `Let me know what kind of job to search for.`;
const goodbyeMessage = `Ok, be sure to check back later for new job offerings.`;
const helpMessage = `You can ask to search for a job type, continue to the next job, or stop to end.`

let jobsArray = [
    {
        title: "First job title First job title First job title First job title First job title First job title First job title ",
        description: "First job description."
    },
    {
        title: "Second job title Second job title Second job title Second job title Second job title Second job title Second job title ",
        description: "Second job description."
    },
    {
        title: "THIRD job title THIRD job title THIRD job title THIRD job title THIRD job title THIRD job title THIRD job title THIRD job title ",
        description: "third job description."
    }
]
let indexCounter = 0
// 2. Skill Code =======================================================================================================

exports.handler = function(event, context, callback) {
    // allow using callback as finish/error-handlers
    context.callbackWaitsForEmptyEventLoop = false;

    var alexa = Alexa.handler(event, context);

    // alexa.appId = 'amzn1.echo-sdk-ams.app.1234';
    // alexa.dynamoDBTableName = 'YourTableName'; // creates new table for session.attributes

    alexa.registerHandlers(handlers);
    alexa.execute();
};

var handlers = {
    'LaunchRequest': function () {
        this.emit(':ask', welcomeOutput, welcomeReprompt);
    },

    'RemoteJobIntent': function () {
        // delegate to Alexa to collect the required slot values
        var filledSlots = delegateSlotCollection.call(this);
        console.log('request inten', this.event.request)
        var jobType = this.event.request.intent.slots.jobType.value;
        let jobCategory = parseJobType(jobType);
        fetch(`https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fweworkremotely.com%2Fcategories%2F${jobCategory}%2Fjobs.rss`)
            .then((res) => {
                console.log(res);
                return res.json()
            })
            .then((jobs) => {
                let jobResult = jobs.items[0].title.replace(/(&nbsp;|<([^>]+)>)/ig, '').replace(/&rsquo;/ig, `'`).replace(/&amp;/ig, 'and')
                this.emit(':ask', `The latest remote job for ${jobType} is: ${jobResult}... There are more jobs, say 'continue' to hear more, or 'stop' to end`, `Say 'continue' to hear more jobs, or 'stop' to end.`);
                // this.emit(':tell', jobsArray[indexCounter].title)
        })
            .catch((err) => {
                console.log(err);
                this.emit(':tell', 'Error occurred');
            })
    },

    'AMAZON.NextIntent': function() {
        if (indexCounter !== 2) {
            indexCounter++
            this.emit(':ask', `${jobsArray[indexCounter].description}... There are more jobs, say 'continue' to hear more, or 'stop' to end.`, `Say 'continue' to hear more jobs, or 'stop' to end.`)
        } else {
            this.emit(':tell', "That is all the jobs listed")
        }
        
        // this.emit(':tell', 'This is your next intent.');
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
// 3. Helper Function  =================================================================================================
function parseJobType(jobType) {
    switch (jobType) {
        case 'programming': 
        case 'software':
        case 'web':
        case 'developer':
            return '2-programming';
        case 'design':
            return '1-design';
        case 'business':
        case 'executive':
        case 'management':
        case 'business executive':
            return '3-business-exec-management';
        case 'customer':
        case 'support':
        case 'customer support':
            return '7-customer-support';
        case 'devop':
        case 'devops':
        case 'developer operations':
        case 'systems':
        case 'sys admin':
        case 'systems admin':
        case 'admin':
            return '6-devops-sysadmin';
        case 'copywriting':
            return '5-copywriting';
        case 'marketing':
        case 'sales':
            return '9-marketing';
        case 'others':
        case 'all others':
        case 'miscellaneous':
        default:
            return `https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fweworkremotely.com%2Fcategories%2F4-remote%2Fjobs.rss`;
    };
}

function delegateSlotCollection(){
  console.log("in delegateSlotCollection");
  console.log("current dialogState: "+this.event.request.dialogState);
    if (this.event.request.dialogState === "STARTED") {
      console.log("in Beginning");
      var updatedIntent=this.event.request.intent;
      //optionally pre-fill slots: update the intent object with slot values for which
      //you have defaults, then return Dialog.Delegate with this updated intent
      // in the updatedIntent property
      this.emit(":delegate", updatedIntent);
    } else if (this.event.request.dialogState !== "COMPLETED") {
      console.log("in not completed");
      // return a Dialog.Delegate directive with no updatedIntent property.
      this.emit(":delegate");
    } else {
      console.log("in completed");
      console.log("returning: "+ JSON.stringify(this.event.request.intent));
      // Dialog is now complete and all required slots should be filled,
      // so call your normal intent handler.
      return this.event.request.intent;
    }
}