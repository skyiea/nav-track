define([ 'app/view/Popup', 'text!/templates/SatInfo.html' ], function (Super, Template) {
    'use strict';

    var View;

    View = Super.extend({
        el: '#sat-info',
        template: Template,
        changeConfig: function (config) {
            var prop;

            for (prop in config) {
                this.find('#sat-' + prop).html(config[prop]);
            }
        },
        show: function (config) {
            config && this.changeConfig(config);

            Super.prototype.show.apply(this, arguments);
        }
    });

    return View;
});