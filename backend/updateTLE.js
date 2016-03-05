var http    = require('http');
var mkdirp  = require('mkdirp');

var DATA_HOST = 'celestrak.com';

module.exports = function updateTLE() { // load all Navigation Satellite Systems TLE data
    var success = false;

    http.get({
        host: DATA_HOST
    }, function () { // if connection is OK
        var i, curr_name, req,
            fs      = require('fs'),
            DIR     = 'tle/',
            EXT     = '.txt',
            PROTOCOL= 'http://',
            TLE_PATH= '/NORAD/elements/',
            PATH    = PROTOCOL + DATA_HOST + TLE_PATH,
            NAMES   = [ // available GNSS data in TLE format
                'beidou',
                'galileo',
                'glo-ops',
                'gps-ops',
                'musson',
                'nnss',
                'sbas'
            ];

        console.log('Update TLE data. Time: ', new Date().toLocaleTimeString(), new Date().toLocaleDateString());

        mkdirp(DIR, function(err) {
            if (err) {
                console.log('Can\'t ensure %s directory existence', DIR);
            } else {
                for (i = 0; curr_name = NAMES[i]; i++) {
                    (function (name) { // need to use closure in case that http.get request is asynchronous
                        req = http.get(PATH + name + EXT, function (resp) {
                            resp.pipe(fs.createWriteStream(DIR + name + EXT)); // write
                        });
                    }(curr_name));
                }

                success = true;
            }
        });

    }).on('error', function () {
        !success && // error callback fires (after some delay) even if success callback was fired previously
            console.log('No connection to TLE Data server. Existed TLE data will be used instead.');
    });
};