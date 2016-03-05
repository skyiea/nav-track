var connect     = require('connect');
var serveStatic = require('serve-static');
var updateTLE   = require('./updateTLE');

var SERVER_PORT         = process.env.OPENSHIFT_NODEJS_PORT || 8080;
var SERVER_IP_ADDRESS   = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';

// create web-server
connect().use(serveStatic(process.cwd())).listen(SERVER_PORT, SERVER_IP_ADDRESS, function () {
    console.log('Listening on',  SERVER_IP_ADDRESS + ':' + SERVER_PORT);
});
// load data on start
updateTLE();
// and daily
setInterval(updateTLE, 24 * 60 * 60 * 1000); // ms in day