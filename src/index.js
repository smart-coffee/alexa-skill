const express = require("express");
const alexa = require("alexa-app");
const Speech = require('ssml-builder');

const userService = require('./web-api/users');
const deviceService = require('./device-api/devices');
const balenaService = require('./balena-api/coffee-machines');

// turn off reject unauthorized because the first certificate can not be verified
// the following workaround is super super dangerous -> need to fix asap
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

/*let rootCas = require('ssl-root-cas/latest').create();

require('https').globalAgent.options.ca = rootCas;*/


let PORT = process.env.PORT || 8080;
let app = express();

let alexaApp = new alexa.app('smartc');

const debug = process.env.NODE_ENV !== 'production';
const checkCerts = process.env.NODE_ENV === 'production';

alexaApp.express({
  expressApp: app,
  checkCert: checkCerts,
  debug: debug
});

alexaApp.messages.NO_INTENT_FOUND = 'Sorry, i do not know what to do';

alexaApp.launch(function (request, response) {
  console.log('Launched!');
  let session = request.getSession();
  session.set("status", "start");
  let speech = new Speech();

  response.say(speech.ssml(true)).reprompt('I messed up, can you repeat what you said please?');
  response.shouldEndSession(false);
});

alexaApp.intent('MakeCoffeeIntent', {
    'slots': { },
    'utterances': ['make me my favourite coffee']
  },
  async function(request, response) {
    response.shouldEndSession(true);
    let speech = new Speech()
      .say('Sure')
      .pause('100ms')
      .say('Just give me a second');

    await makeCoffee()
      .then(() => {
        response.say('Your coffee will be ready soon');
      })
      .catch( error => {
        console.error(error);
        response.say('There was a problem ordering your coffee, please try again later');
      });
  }
);


const makeCoffee = async () => {

  let customHeaders = {'x-access-token': ''};
  customHeaders['x-access-token'] = await userService.getJwtToken({username: 'admin', password: 'password'});
  console.log(customHeaders["x-access-token"]);
  const machineUIID = await balenaService.getCoffeeMachineUUID(customHeaders);
  // set the job variables here, if needed
  const jobDetails = {coffee_strength_in_percent: 75, water_in_percent: 15, doses: 1};
  const jobConfirmation = await deviceService.postCoffeeJob(machineUIID, jobDetails, customHeaders);

  console.log(jobConfirmation);
};

app.listen(PORT, () => console.log("Listening on port " + PORT + "."));