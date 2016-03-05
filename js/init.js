if (!window.chrome || !window.WebGLRenderingContext) { // in Google Chrome browser WebGL is supported starting from 9.x
    document.getElementById('loader').innerHTML =
        '<span>Коректна робота програми можлива лише в браузері ' +
            '<a href="http://google.com.ua/intl/ru/chrome/">Google&nbspChrome</a>' +
        '<span>';
} else {
    require.config({
        baseUrl: '/js/libs',
        paths: {
            jquery      : 'jquery.min',
            dtpicker    : 'jquery.filthypillow',
            moment      : 'moment.min',
            underscore  : 'underscore.min',
            backbone    : 'backbone.min',
            cesium      : 'cesium/Cesium',
            sgp4lib     : 'sgp4lib',
            app         : '/js/app/',
            App         : '/js/app/view/App',
            Loader      : '/js/app/view/Loader'
        },
        shim: {
            jquery: {
                exports: '$'
            },
            dtpicker: {
                deps: [ 'moment', 'jquery' ],
                exports: '$.fn.filthypillow'
            },
            underscore: {
                exports: '_'
            },
            backbone: {
                deps: [ 'underscore', 'jquery', 'text' ],
                exports: 'Backbone'
            },
            cesium: {
                exports: 'Cesium'
            },
            sgp4lib: {
                deps: [ 'cesium' ],
                exports: 'sgp4lib'
            }
        }
    });

    require([ 'underscore', 'jquery', 'backbone', 'cesium', 'sgp4lib', 'dtpicker' ], function () {
        'use strict';

        require([ 'App' ], function (App) {
            window.App = App;
            App.initialize();
        });
    });
}