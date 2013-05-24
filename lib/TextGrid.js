var util = require('util')
    , node_config = require("./nodeconfig_devserver")
    , couch_keys = require("./couchkeys_devserver")
    , mail_config = require("./mailconfig_devserver")
    , _ = require('underscore');


console.log("Loading the TextGrid Module");

var nano = require('nano')(
    node_config.usersDbConnection.protocol + couch_keys.username + ':'
    + couch_keys.password + '@' + node_config.usersDbConnection.domain
    + ':' + node_config.usersDbConnection.port
    + node_config.usersDbConnection.path);

/*
 * User Authentication functions
 */
module.exports = {};

/*
 * Requests the TextGrid 
 */
module.exports.areTextGridsFresh = function(username, password, req, done) {
  
};

