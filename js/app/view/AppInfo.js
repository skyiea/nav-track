/**
 * @class
 * @description Application information popup window
 */
define([ 'app/view/Popup', 'text!/templates/AppInfo.html' ], function (Super, Template) {
    'use strict';

    var View;

    View = Super.extend({
        el: '#app-info',
        template: Template
    });

    return View;
});