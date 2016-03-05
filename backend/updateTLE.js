'use strict';

const http    = require('http');
const mkdirp  = require('mkdirp');

const DATA_HOST = 'celestrak.com';

module.exports = function updateTLE() { // load all Navigation Satellite Systems TLE data
    let success = false;

    http.get({ host: DATA_HOST },  () => { // if connection is OK
        const fs        = require('fs');

        const DIR       = 'tle/';
        const EXT       = '.txt';
        const PROTOCOL  = 'http://';
        const TLE_PATH  = '/NORAD/elements/';
        const PATH      = PROTOCOL + DATA_HOST + TLE_PATH;

        const NAMES = [ // available GNSS data in TLE format
            'beidou',
            'galileo',
            'glo-ops',
            'gps-ops',
            'musson',
            'nnss',
            'sbas'
        ];

        mkdirp(DIR, (err) => {
            if (err) {
                console.log('Can\'t ensure %s directory existence', DIR);
            } else {
                for (let currName of NAMES) {
                    ((name) => { // need to use closure in case that http.get request is asynchronous
                        http.get(PATH + name + EXT, (resp) => {
                            resp.pipe(fs.createWriteStream(DIR + name + EXT)); // write
                        });
                    })(currName);
                }

                console.log('Update TLE data. Time: %s %s', new Date().toLocaleTimeString(), new Date().toLocaleDateString());

                success = true;
            }
        });

    }).on('error', () => {
        !success && // error callback fires (after some delay) even if success callback was fired previously
            console.log('No connection to TLE Data server. Existed TLE data will be used instead.');
    });
};