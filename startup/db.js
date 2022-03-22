const mongoose = require("mongoose");
const winston = require('winston');
const config = require('config');


module.exports = function (){
    const uri = config.get('db');
    mongoose.connect(uri).then(
        () => winston.info(`Connect to ${config.get('db')}...`),
    );
}