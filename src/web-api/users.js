const axios = require("axios");
const config = require("../config");

const url = config.webApiUrl;

const getJwtToken = async credentials => {
  try {
    const response = await axios.post(`${url}/public/auth/login`, credentials);
    const data = response.data;
    if (data)
      return data.token;
  } catch (error) {
    console.log(error);
  }
};

module.exports.getJwtToken = getJwtToken;