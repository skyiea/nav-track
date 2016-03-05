define([], function () {
    var Model;

    Model = Backbone.Model.extend({
        defaults: {
            def_system_type     : 'gps-ops',
            active_system_type  : null,
            active_sat_id       : null,
            checked_class       : 'checked',
            time_speed          : 1,
            max_time_speed      : 1000,
            update_interval     : 50,
            play_state          : false,
            start_date          : new Date(),
            scene_date          : null,
            scene_date_jd       : null,
            pointer_pos         : null,
            geo_pos             : null,
            visible_sat_count   : null,
            min_year            : 2000,
            max_year            : 3000,
            def_view_type       : '3d'
        }
    });

    return Model;
});