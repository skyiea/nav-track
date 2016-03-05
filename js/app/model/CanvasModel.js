define([ 'app/model/Model' ], function (Super) {
    var Model;

    Model = Super.extend({
        defaults: _.extend({
            pointer_icon_url        : 'images/pointer.png',
            sat_icon_url            : 'images/sat.png',
            cesium_texture_base_url : 'js/libs/cesium/Assets/Textures',
            under_transition        : false,
            default_sat_scale       : 0.15,
            selected_sat_scale      : 0.25,
            optimal_camera_alt      : 10000000,
            min_camera_alt          : 5000000,
            max_camera_alt          : 100000000,
            orbit_color : {
                red     : 0.2,
                blue    : 0.4,
                green   : 0.2,
                alpha   : 1.0
            },
            default_sat_color: {
                red     : 1.0,
                blue    : 1.0,
                green   : 1.0,
                alpha   : 0.6
            },
            selected_sat_color: {
                red     : 0.5,
                blue    : 0.8,
                green   : 0.5,
                alpha   : 1
            },
            visible_sat_color: {
                red     : 1.0,
                blue    : 0.1,
                green   : 0.1,
                alpha   : 0.9
            },
            selected_visible_sat_color: {
                red     : 1.0,
                blue    : 0.1,
                green   : 0.1,
                alpha   : 1
            }
        }, Super.prototype.defaults)
    });

    return Model;
});