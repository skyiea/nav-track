const connect     = require('connect');
const serveStatic = require('serve-static');
const updateTLE   = require('./updateTLE');

const SERVER_PORT       = process.env.OPENSHIFT_NODEJS_PORT || 8080;
const SERVER_IP_ADDRESS = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';

// create web-server
connect().use(serveStatic(process.cwd())).listen(SERVER_PORT, SERVER_IP_ADDRESS, () => {
    console.log('Listening on http://%s:%s',  SERVER_IP_ADDRESS, SERVER_PORT);
});
// load data on start
updateTLE();
// and daily
setInterval(updateTLE, 24 * 60 * 60 * 1000); // ms in day