define([], {
    /**
     * @private
     * @property    {Array}     $gnss_data  All GNSS systems data object (used to cache previously loaded data)
     */
    $gnss_data: {},
    /**
     * @public
     * @property    {Object}    gnss_types  Existed GNSS types and their full names
     */
    gnss_types: {
        'gps-ops'   : 'NAVSTAR GPS',
        'galileo'   : 'Galileo',
        'glo-ops'   : 'GLONASS',
        'beidou'    : 'Beidou',
        'musson'    : 'Russian LEO Navigation',
        'sbas'      : 'Satellite-Based Augmentation System',
        'nnss'      : 'Navy Navigation Satellite System'
    },
    /**
     * @private
     * @description Load GNSS start data (with start positions and all)
     * @param {Data.gnss_types} type Desired GNSS type to load
     */
    $loadGNSSStartData: function (type) {
        var curr_tle, i, l,
            dir         = 'tle/', // direction
            ext         = '.txt', // file extension
            tle_data    = sgp4lib.parseFile(dir + type + ext),
            result      = [];

        for (i = 0, l = tle_data.length; i < l; i++) {
            curr_tle = tle_data[i];

            result.push({
                info: {
                    name        : curr_tle[0].trim(),
                    designator  : curr_tle[1].slice(9, 17).trim(),
                    norad_id    : curr_tle[2].split(' ')[1]
                },
                record: sgp4lib.convertTLE2Record(curr_tle.slice(1)) // skip name (we need only TLE data lines)
            });
        }

        this.$gnss_data[type] = result;
        // TLE data updates on daily basis, hence we should remove old data and make new request for TLE data file daily
        setTimeout(function () {
            delete this.$gnss_data[type];
        }.bind(this), 24 * 60 * 60 * 1000);
    },
    /**
     * @public
     * @description Update desired GNSS data
     * @param {Data.gnss_types} type Desired GNSS type
     */
    updateGNSSData: function (type) {
        var i, l, curr_sat, sat_jd, mins_since_epoch, result, isVisibleFromPointer,
            visible_sat_count       = 0,
            gnss_obj                = this.getGNSSData(type),
            scene_date              = App.model.get('scene_date'),
            pointer_pos             = App.model.get('pointer_pos'),
            time_since_last_update  = Date.now() - App.model.get('last_update_time'),
            new_scene_time          = scene_date.getTime() +
                                        App.model.get('time_speed') * time_since_last_update,
            new_scene_date          = new Date(new_scene_time),
            jd_now                  = Cesium.JulianDate.fromDate(new_scene_date);

        App.model.set('scene_date', new_scene_date);

        isVisibleFromPointer = function (sat, pointer_pos) {
            var dist_sat_point, dist_sat_coverage, sat_pos_rad, pointer_pos_rad,
                RAD_IN_DEG = Math.PI / 180,
                is_visible = false;

            if (!!pointer_pos) {
                sat_pos_rad = {
                    lat: sat.pos.cartographic.lat * RAD_IN_DEG,
                    lon: sat.pos.cartographic.lon * RAD_IN_DEG
                };

                pointer_pos_rad = {
                    lat: pointer_pos.lat * RAD_IN_DEG,
                    lon: pointer_pos.lon * RAD_IN_DEG
                };
                // distance (arc length) between satellite projection (on globe) and pointer position in meters
                dist_sat_point = sgp4lib.RADIUS * Math.acos(Math.sin(sat_pos_rad.lat) * Math.sin(pointer_pos_rad.lat) +
                    Math.cos(sat_pos_rad.lat) * Math.cos(pointer_pos_rad.lat) *
                        Math.cos(sat_pos_rad.lon - pointer_pos_rad.lon));
                // distance between satellite projection and coverage limit (circle)
                dist_sat_coverage = Math.PI * sgp4lib.RADIUS * sat.coverage_angle / 360;

                if (dist_sat_point <= dist_sat_coverage) {
                    is_visible = true;
                }
            }

            return is_visible;
        };

        for (i = 0, l = gnss_obj.length; i < l; i++) {
            curr_sat            = gnss_obj[i];
            sat_jd              = new Cesium.JulianDate.fromTotalDays(curr_sat.record.jdsatepoch);
            mins_since_epoch    = sat_jd.getMinutesDifference(jd_now);
            result              = App.pos_api.useSGP4(curr_sat.record, mins_since_epoch, jd_now);
            _.extend(curr_sat, result);
            curr_sat.is_visible = isVisibleFromPointer(curr_sat, pointer_pos);
            curr_sat.is_visible && visible_sat_count++;
        }

        App.model.set('visible_sat_count', visible_sat_count);
    },
    /**
     * @public
     * @description Update active GNSS data
     */
    updateActiveGNSSData: function () {
        this.updateGNSSData(App.model.get('active_system_type'));
    },
    /**
     * @public
     * @description Get desired GNSS data
     * @param {Data.gnss_types} type Desired GNSS type
     * @return {Array}
     */
    getGNSSData: function (type) {
        // if it wasn't loaded before
        if (!(type in this.$gnss_data)) {
            this.$loadGNSSStartData(type);
            // need to call update on load to provide full sat info (position, velocity)
            this.updateGNSSData(type);
        }

        return this.$gnss_data[type];
    },
    /**
     * @public
     * @description Get active GNSS data
     * @returns {Array}
     */
    getActiveGNSSData: function () {
        return this.getGNSSData(App.model.get('active_system_type'));
    },
    /**
     * @public
     * @description Get satellite data by ID (NORAD ID) and GNSS type
     * @param {String}          id              Satellite NORAD ID
     * @param {Data.gnss_types} [system_type]   GNSS type (active GNSS by default)
     * @returns {!Object}
     */
    getSatByID: function (id, system_type) {
        var i, sat_obj,
            gnss_data = system_type ? this.getGNSSData(system_type) : this.getActiveGNSSData();

        for (i = 0; sat_obj = gnss_data[i]; i++) {
            if (sat_obj.info.norad_id === id) {
                break;
            }
        }

        return sat_obj;
    },
    /**
     * @public
     * @description Get active satellite data
     * @returns {!Object}
     */
    getActiveSat: function () {
        return this.getSatByID(App.model.get('active_sat_id'));
    }
});