const express = require('express');
const winston = require('winston');
const cors = require('cors');
const app = express();

app.use(cors());

require('./startup/routes')(app);
require('./startup/db')();
require('./startup/logging')();
require('./startup/config')();
require('./startup/validation')();
require('./startup/prod')(app);

const port = process.env.PORT || 3001;
const server = app.listen(port, () => winston.info(`Listening to port ${port}...`));

module.exports = server;