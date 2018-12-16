const express = require("express");
const alexa = require("alexa-app");
const Speech = require('ssml-builder');

const userService = require('./web-api/users');
const deviceService = require('./device-api/devices');
const balenaService = require('./balena-api/coffee-machines');

// turn off reject unauthorized because the first certificate can not be verified
// the following workaround is super super dangerous -> need to fix asap
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
//process.env.NODE_EXTRA_CA_CERTS = './ssl/cert.pem';

console.log(process.env.NODE_EXTRA_CA_CERTS);
/*let rootCas = require('ssl-root-cas/latest').create();

require('https').globalAgent.options.ca = rootCas;*/

let PORT = process.env.PORT || 8080;
let app = express();

let alexaApp = new alexa.app('smartc');

const userName = process.env.USER_NAME;
const userPassword = process.env.USER_PASSWORD;


const debug = process.env.NODE_ENV !== 'production';
const checkCerts = process.env.NODE_ENV === 'production';

alexaApp.express({
  expressApp: app,
  checkCert: checkCerts,
  debug: debug
});

alexaApp.messages.NO_INTENT_FOUND = 'Sorry, i do not know what to do';

alexaApp.launch(async function (request, response) {
  console.log('Launched!');
  let session = request.getSession();
  session.set("status", "start");

  await makeCoffee()
    .then(() => {
      response.say('Sure, your coffee will be ready soon');
    })
    .catch( error => {
      console.error(error);
      response.say('There was a problem ordering your coffee, please try again later');
    });

  let speech = new Speech();

  response.say(speech.ssml(true)).reprompt('I messed up, can you repeat what you said please?');
  response.shouldEndSession(true);
});

// this is probably not necessary
alexaApp.intent('MakeCoffeeIntent', {
    'slots': { },
    'utterances': [
      "make me my favourite coffee",
      "make me my after lunch coffee",
      "make me my morning coffee"
    ]
  },
  async function(request, response) {

    await makeCoffee()
      .then(() => {
        response.say('Your coffee will be ready soon');
      })
      .catch( error => {
        console.error(error);
        response.say('There was a problem ordering your coffee, please try again later');
      });

    response.shouldEndSession(true);
  }
);

alexaApp.intent("AMAZON.NoIntent", {
    "slots": {},
    "utterances": []
  }, function (request, response) {
    response.shouldEndSession(true);
    response.say("Ok, dann bis später, ich freue mich auf dich!");
  }
);

alexaApp.intent("AMAZON.StopIntent", {
    "slots": {},
    "utterances": ["stop"]
  }, function (request, response) {
    response.say("Okay");
  }
);


const makeCoffee = async () => {

  let customHeaders = {'x-access-token': ''};
  customHeaders['x-access-token'] = await userService.getJwtToken({username: userName, password: userPassword});
  console.log(customHeaders["x-access-token"]);
  const machineUIID = await balenaService.getCoffeeMachineUUID(customHeaders);
  // set the job variables here, if needed
  const jobDetails = {coffee_strength_in_percent: 75, water_in_percent: 15, doses: 1};
  const jobConfirmation = await deviceService.postCoffeeJob(machineUIID, jobDetails, customHeaders);

  console.log(jobConfirmation);
};

/*
makeCoffee()
  .then(() => {
    console.log('done making coffee')
  })
  .catch( error => {
    console.error(error);
  });*/

app.listen(PORT, () => console.log("Listening on port " + PORT + "."));