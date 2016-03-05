define([ 'app/view/Popup', 'text!/templates/PointerMenu.html' ], function (Super, Template) {
    'use strict';

    var View;

    View = Super.extend({
        el: '#pointer-menu',
        template: Template,
        events: {
            'click #geo-pos': function () {
                var prev_mode   = this.$current_mode,
                    mode        = 'geo';

                this.$removeMode();

                if (prev_mode !== mode) {
                    this.$setMode(mode);

                    App.defineGeolocation().done(function (geo_loc) {
                        if (!!geo_loc) {
                            App.model.set('pointer_pos', geo_loc);
                        } else {
                            this.$removeMode();
                        }
                    }.bind(this));
                }
            },
            'click #choose-pos': function () {
                var prev_mode   = this.$current_mode,
                    mode        = 'choose';

                this.$removeMode();

                if (prev_mode !== mode) {
                    this.$setMode(mode);
//
                    App.canvas.pickPosition(function (cart_obj) {
                        var cart_array = [ cart_obj.x, cart_obj.y, cart_obj.z ],
                            cartographic_pos = App.pos_api.convertCartesianToCartographicDegrees(Cesium.Cartesian3.fromArray(cart_array)),
                            pointer_pos = {
                                lon: cartographic_pos.lon,
                                lat: cartographic_pos.lat
                            };

                        App.model.set('pointer_pos', pointer_pos);
                    });
                }
            }
        },
        $current_mode: null,
        $current_mode_el: null,
        $setMode: function (mode) {
            var new_mode_el = mode === 'geo' ?
                this.find('#geo-pos') :
                this.find('#choose-pos');

            new_mode_el.addClass(App.model.get('checked_class'));

            this.$current_mode      = mode;
            this.$current_mode_el   = new_mode_el;
        },
        $removeMode: function () {
            if (!!this.$current_mode) {
                this.$current_mode_el.removeClass(App.model.get('checked_class'));
                this.$current_mode      = null;
                this.$current_mode_el   = null;

                App.canvas.stopPickPosition();
                App.model.set('pointer_pos', null);
            }
        }
    });

    return View;
});