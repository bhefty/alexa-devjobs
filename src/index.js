const Alexa = require('alexa-sdk');
const Promise = require('promise');
const fetch = require('isomorphic-fetch');


// Text strings =====================================================================================================

const welcomeMessage = `Let's search for some remote jobs! What kind of job would you like to search for?`;
const repeatWelcomeMessage = `Let me know what kind of job to search for. You can say something like 'programming', 'design', 'business' or something else.`;
const goodbyeMessage = `Be sure to check back later for new job offerings.`;
const detailsMessage = `If you want more details, say 'details' or 'description'.`;
const helpMessage = `You can ask to search for a job type, continue to the next job, get details, start over to search for a new job, or stop to end.`;
const moreMessage = `There are more jobs, say 'continue' to hear more, or 'stop' to end.`;
const repeatMoreMessage = `Say 'continue' to hear more jobs, or 'stop' to end.`;
const noMoreMessage = `That was all the jobs I found at this time. You can say 'start over' to search for a new job, or 'stop' to end.`;


let sampleArray = [
    {
        title: "First job",
        description: "First job description."
    },
    {
        title: "Second job",
        description: "Second job description."
    },
    {
        title: "Third job",
        description: "Third job description."
    }
]

let jobsArray =[]


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
        indexCounter = 0
        this.emit(':ask', welcomeMessage, repeatWelcomeMessage);
    },

    'RemoteJobIntent': function () {
        indexCounter = 0
        // delegate to Alexa to collect the required slot values
        var filledSlots = delegateSlotCollection.call(this);

        var jobType = this.event.request.intent.slots.jobType.value;
        let jobCategory = parseJobType(jobType);
        fetch(`https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fweworkremotely.com%2Fcategories%2F${jobCategory}%2Fjobs.rss`)
            .then((res) => {
                return res.json()
            })
            .then((uncleanJobs) => {
                let cleanJobsPromises = uncleanJobs.items.map(cleanText)
                return Promise.all(cleanJobsPromises)
            })
            .then((jobs) => {
                jobsArray = jobs;

                // jobsArray = sampleArray
                let jobResult = jobsArray[indexCounter].title
                console.log('jobResult', jobResult)
                if (indexCounter + 1 !== jobsArray.length) {
                    this.emit(':ask', `The latest remote job for ${jobType} is: ${jobResult}... ${detailsMessage}... ${moreMessage}`, repeatMoreMessage);
                    indexCounter++;
                } else {
                    this.emit(':ask', `The latest remote job for ${jobType} is: ${jobResult}... ${detailsMessage}... ${noMoreMessage}`, noMoreMessage);
                }
        })
            .catch((err) => {
                console.log(err);
                this.emit(':tell', 'Sorry, an error occurred when getting job results. Try again later.');
            })
    },

    'JobDescriptionIntent': function() {
        if (indexCounter !== jobsArray.length) {
            // Rollback counter to ensure correct job is described
            indexCounter--;
            
            this.emit(':askWithCard', `Here is a description of the job...${jobsArray[indexCounter].description}... ${moreMessage}`, repeatMoreMessage, jobsArray[indexCounter].title, jobsArray[indexCounter].description)
            
            indexCounter++;
        } else {
            // Rollback counter to ensure correct job is described
            indexCounter--;
            this.emit(':askWithCard', `Here is a description of the job...${jobsArray[indexCounter].description}... ${noMoreMessage}`, noMoreMessage, jobsArray[indexCounter].title, jobsArray[indexCounter].description)
        }
        
    },

    'AMAZON.NextIntent': function() {
        if (indexCounter + 1 !== jobsArray.length) {
            let currentJobTitle = jobsArray[indexCounter].title
            this.emit(':ask', `${currentJobTitle}...${detailsMessage}... ${moreMessage}`, repeatMoreMessage)
            indexCounter++;
        } else if (indexCounter + 1 === jobsArray.length) {
            let currentJobTitle = jobsArray[indexCounter].title
            this.emit(':ask', `${currentJobTitle}... ${detailsMessage}... ${noMoreMessage}`, noMoreMessage)
            indexCounter++;
        } else {
            this.emit(':ask', noMoreMessage, noMoreMessage)
        }
    },

    'AMAZON.StartOverIntent': function() {
        indexCounter = 0;
        this.emit(':ask', welcomeMessage, repeatWelcomeMessage);
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
const cleanText = (job) => {
    console.log('in clean text', job)
    return new Promise(resolve => {
        let cleaned = {
            title: job.title.replace(/(&nbsp;|<([^>]+)>)/ig, '').replace(/&rsquo;/ig, `'`).replace(/&amp;/ig, 'and'),
            description: job.description.replace(/(&nbsp;|<([^>]+)>)/ig, '').replace(/&rsquo;/ig, `'`).replace(/&amp;/ig, 'and')
        }
        resolve(cleaned)
    })
}

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