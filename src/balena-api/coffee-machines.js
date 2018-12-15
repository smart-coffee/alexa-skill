const axios = require("axios");
const config = require("../config");

const baseUrl = config.balenaApiUrl;

const getCoffeeMachineUUID = async (customHeaders) => {

  const requestUrl = `${baseUrl}/devices`;

  try {
    const response = await axios.get(requestUrl, customHeaders);

    if (Array.isArray(response.data) && response.data.length) {
      const { uuid } = response.data[0];
      if (typeof uuid !== 'undefined') {
        return uuid;
      }
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports.getCoffeeMachineUUID = getCoffeeMachineUUID;