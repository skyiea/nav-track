var connect     = require('connect');
var serveStatic = require('serve-static');
var updateTLE   = require('./updateTLE');

var PORT = 8080;

// create web-server
connect().use(serveStatic(process.cwd())).listen(PORT, function () {
    console.log('Web-server successfully created on port %s', PORT);
});
// load data on start
updateTLE();
// and daily
setInterval(updateTLE, 24 * 60 * 60 * 1000); // ms in day