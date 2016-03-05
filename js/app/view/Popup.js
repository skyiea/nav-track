/**
 * @class Popup
 * @description Popup window abstract class
 */
define([ 'app/view/View' ], function (Super) {
    'use strict';

    var View;

    View = Super.extend({
        /**
         */
        render: function () {
            Super.prototype.render.apply(this, arguments);

            this.$el.addClass('popup');
        }
    });

    return View;
});