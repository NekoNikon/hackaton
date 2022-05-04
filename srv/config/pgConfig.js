const constants = require("./constants");
const { Client } = require('pg');

const client = new Client({
    user: constants.database.user,
    password: constants.database.password,
    host: constants.database.host,
    port: constants.database.port,
    database: constants.database.database
});

module.exports = client;