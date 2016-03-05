/**
 * @author Sergiy Murygin
 * @info Application controller
 */
define([ 'app/model/AppModel' ], function (Model) {
    'use strict';

    var App;

    App = {
        /**
         * @private
         * @property    {?Interval} $update_handler     Update interval instance
         */
        $update_handler : null,
        model           : new Model(),
        pos_api         : null,
        tle_data        : null,
        canvas          : null,
        gui             : null,
        /**
         */
        initialize: function () {
            require( [ 'app/tools/PosAPI', 'app/tools/TLEData', 'app/view/Canvas', 'app/view/Interface' ],
                function (PosAPI, TLEData, Canvas, Interface) {
                    // initialize all aggregates
                    this.pos_api        = PosAPI;
                    this.tle_data       = TLEData;
                    this.canvas         = new Canvas;
                    this.gui            = new Interface;

                    this.$initEvents();

                    this.onLoad().done(function () {
                        this.model.set({
                            scene_date          : new Date(),
                            active_system_type  : this.model.get('def_system_type'),
                            play_state          : true
                        });

                        this.gui.loader.hide()
                    }.bind(this));
                }.bind(this));
            // block render invocation in parent class and call it only after required modules load
        },
        /**
         * @public
         * @description Define when component load is finished
         * @returns {jQuery.Promise}
         */
        onLoad: function () {
            return $.when(this.canvas.onLoad(), this.gui.onLoad());
        },
        /**
         * @private
         * @description Initialize events listeners
         */
        $initEvents: function () {
            this.model.on('change:active_system_type', function (model, new_type) {
                this.model.set('active_sat_id', null);
                this.gui.sat_menu.selectGNSS(new_type);
                this.canvas.showGNSS(new_type);
            }.bind(this));

            this.model.on('change:active_sat_id', function (model, new_id) {
                this.gui.sat_menu.selectSatByID(new_id);
                this.canvas.selectSat(new_id);

                if (new_id !== null) {
                    // update satellite information even if it's not shown to provide immediate info
                    // on sat-info popup show (without need to wait till interval will update it)
                    this.gui.updateSatInfo();
                    !this.gui.sat_info.isShown() && this.gui.sat_info.show();
                } else {
                    this.gui.sat_info.isShown() && this.gui.sat_info.hide();
                }
            }.bind(this));

            this.model.on('change:scene_date', function (model, new_date) {
                this.gui.date_menu.showDate(new_date);

                this.model.set({
                    last_update_time    : Date.now(),
                    scene_date_jd       : Cesium.JulianDate.fromDate(new_date)
                });
            }.bind(this));

            this.model.on('change:play_state', function (model, new_play_state) {
                this.gui.player_menu.setPlayState(new_play_state);

                if (new_play_state) {
                    this.model.set('last_update_time', Date.now());
                    this.$startSatsDataUpdate();
                } else {
                    this.$pauseSatsDataUpdate();
                }
            }.bind(this));

            this.model.on('change:update_interval', function () {
                // to start new interval timer need to restart it
                this.model.set('play_state', false);
                this.model.set('play_state', true);
            }.bind(this));

            this.model.on('change:pointer_pos', function (model, new_pointer_pos) {
                var is_geo_pos;

                if (!!new_pointer_pos) {
                    is_geo_pos = !!this.model.get('geo_pos') &&
                        _.isEqual(new_pointer_pos, this.model.get('geo_pos'));

                    this.canvas.addPointer(new_pointer_pos, is_geo_pos);
                    this.gui.pointer_info.setCoords(new_pointer_pos);
                    this.gui.pointer_info.setSatCount(this.model.get('visible_sat_count'));
                    this.gui.pointer_info.show();
                    this.$update();
                } else {
                    this.canvas.removePointer();
                    this.gui.pointer_info.hide();
                    this.model.set('visible_sat_count', null);
                }
            }.bind(this));

            this.model.on('change:visible_sat_count', function (model, new_sat_count) {
                !!this.model.get('pointer_pos') && this.gui.pointer_info.setSatCount(new_sat_count);
            }.bind(this));
        },
        /**
         * @private
         * @description Start satellites data update procedure
         */
        $startSatsDataUpdate: function () {
            !!this.$update_handler && this.$pauseSatsDataUpdate();
            // save interval instance to have ability to stop update in future
            this.$update_handler = window.setInterval(this.$update.bind(this),
                this.model.get('update_interval'));
        },
        /**
         * @private
         * @description Pause satellites data update procedure
         */
        $pauseSatsDataUpdate: function () {
            window.clearInterval(this.$update_handler);
            this.$update_handler = null;
        },
        /**
         * @private
         * @description Update satellites-related data
         */
        $update: function () {
            // update sats data firstly
            this.tle_data.updateActiveGNSSData();
            this.canvas.updateSats();
            this.gui.sat_info.isShown() && this.gui.updateSatInfo();
        },
        /**
         * @public
         * @description Defines current device geo-location
         * @returns {jQuery.Promise}
         */
        defineGeolocation: function () {
            var showDisallowMessage, wait_handler,
                MAX_GEO_GET_TIME    = 5000,
                def                 = $.Deferred(),
                geo_pos             = this.model.get('geo_pos');

            showDisallowMessage = function () {
                this.gui.message.show({
                    id      : 'geo-disallowed',
                    text    : 'Ви заборонили визначення гео-локації',
                    pos     : 'center',
                    ttl     : 2000
                });
            }.bind(this);

            switch (geo_pos) {
                case null: // first invocation
                    if ('geolocation' in navigator) { // check browser support
                        this.gui.loader.show();

                        wait_handler = window.setTimeout(function () {
                            this.gui.loader.hide();
                            window.clearTimeout(wait_handler);
                            wait_handler = null;

                            this.gui.message.show({
                                id      : 'waiting-exceeded',
                                text    : 'Час очікування вичерпано',
                                pos     : 'center',
                                ttl     : 2000
                            });
                        }.bind(this), MAX_GEO_GET_TIME);

                        navigator.geolocation.getCurrentPosition(
                            function (position) { // user allow position determination
                                var pos = {
                                    lon: position.coords.longitude,
                                    lat: position.coords.latitude
                                };
                                // remember it to avoid multiple determination
                                this.model.set('geo_pos', pos);
                                // if pos determined faster then max waiting time
                                if (wait_handler) {
                                    window.clearTimeout(wait_handler);
                                    this.gui.loader.hide();
                                    def.resolve(pos);
                                }
                            }.bind(this),
                            function () { // user disallow position determination
                                // browser remembers user choice. we need to inform
                                showDisallowMessage();
                                this.model.set('geo_pos', 'disallowed');
                                // if pos determined faster then max waiting time
                                if (wait_handler) {
                                    window.clearTimeout(wait_handler);
                                    this.gui.loader.hide();
                                    def.resolve(false);
                                }
                            }.bind(this));
                    } else {
                        this.model.set('geo_pos', 'unavailable');
                        def.resolve(false);

                        this.gui.message.show({
                            id      : 'geo-no-support',
                            text    : 'Ваш браузер не підтримує визначення гео-локації',
                            pos     : 'center',
                            ttl     : 2000
                        })
                    }
                    break;
                case 'unavailable': // no browser support
                    def.resolve(false);
                    break;
                case 'disallowed': // previously disallowed
                    showDisallowMessage();
                    def.resolve(false);
                    break;
                default: // already determined
                    def.resolve(geo_pos);
                    break;
            }

            return def.promise();
        }
    };

    return App;
});