const { ERROR_MESSAGES } = require("./error-messages");
const API_HOST = 'api.jsonbin.io';
const API_SUB_URL = 'v3/b';
const SAMPLE_API_KEY = '6aa4589eac6210605ac1fb2a';
const API_HEADERS = {
  "x-secret-header": "secret",
};
const API_URL = `https://${API_HOST}/${API_SUB_URL}/${SAMPLE_API_KEY}`;

module.exports = {
    ERROR_MESSAGES,
    SAMPLE_API_KEY,
    API_SUB_URL,
    API_HOST,
    API_HEADERS,
    API_URL,
};