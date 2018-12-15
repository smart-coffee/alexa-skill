const axios = require("axios");
const config = require("../config");

const postCoffeeJob = async (deviceUIID, jobDetails, customHeaders) => {

  const requestUrl = `https://${deviceUIID}.${config.deviceApiUrl}/device/job`;

  try {
    const response = await axios.post(requestUrl, jobDetails, {headers: customHeaders});
    const jobConfirmation = response.data;
    if (typeof jobConfirmation !== 'undefined')
      return jobConfirmation;
  } catch (error) {
    console.log(error);
  }
};

module.exports.postCoffeeJob = postCoffeeJob;