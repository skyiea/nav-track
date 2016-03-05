define([ 'app/view/Popup', 'text!/templates/PointerInfo.html' ], function (Super, Template) {
    'use strict';

    var View;

    View = Super.extend({
        el: '#pointer-info',
        template: Template,
        setCoords: function (cartg_dg) {
            this.find('#pointer-lon').text(Number(cartg_dg.lon).toFixed(3));
            this.find('#pointer-lat').text(Number(cartg_dg.lat).toFixed(3));
        },
        setSatCount: function (new_count) {
            this.find('#sat-count').text(new_count);
        }
    });

    return View;
});