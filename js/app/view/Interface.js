/**
 * @class
 * @description Application graphical user interface
 */
define([ 'app/view/View', 'app/model/InterfaceModel', 'text!/templates/Interface.html' ], function (Super, Model, Template) {
    'use strict';

    var View;

    View = Super.extend({
        el: '#interface',
        template: Template,
        events: {           // events listeners information
            'click #zoom-in': function () {
                App.canvas.zoom('in');
            },
            'click #zoom-out': function () {
                App.canvas.zoom('out');
            },
            'click #show-sat-menu': function () {
                this.$toggleMenu('sat');
            },
            'click #show-map-menu': function () {
                this.$toggleMenu('map');
            },
            'click #show-player-menu': function () {
                this.$toggleMenu('player');
            },
            'click #show-pointer-menu': function () {
                this.$toggleMenu('pointer');
            },
            'click #show-date-menu': function () {
                this.date_menu.toggle();
            },
            'click #real-date': function () {
                var now = new Date();

                App.model.set('scene_date', now);
                this.date_menu.isShown() && this.date_menu.setDTPickerDate(now);
            },
            'click #fs-mode': function () {
                this.$toggleFullScreen();
            },
            'click #show-app-info': function () {
                this.app_info.toggle();
            },
            'click #show-app-info, #fs-mode, #show-date-menu': function (e) {
                this.$toggleElementCheckedState($(e.target));
            }
        },
        $model      : new Model,
        $is_load    : $.Deferred(),
        loader      : null,
        message     : null,
        sat_menu    : null,
        map_menu    : null,
        player_menu : null,
        pointer_menu: null,
        date_menu   : null,
        sat_info    : null,
        pointer_info: null,
        app_info    : null,
        /**
         */
        initialize: function () {
            this.$initEvents();

            require( [ 'app/view/Loader', 'app/view/SatMenu', 'app/view/MapMenu', 'app/view/PlayerMenu', 'app/view/PointerMenu',
                'app/view/DateMenu', 'app/view/Message', 'app/view/SatInfo', 'app/view/PointerInfo', 'app/view/AppInfo' ],
                function (Loader, SatMenu, MapMenu, PlayerMenu, PointerMenu, DateMenu, Message, SatInfo, PointerInfo, AppInfo) {
                    // initialize all aggregates
                    this.loader         = new Loader;
                    this.message        = new Message;
                    this.sat_menu       = new SatMenu;
                    this.map_menu       = new MapMenu;
                    this.player_menu    = new PlayerMenu;
                    this.pointer_menu   = new PointerMenu;
                    this.date_menu      = new DateMenu;
                    this.sat_info       = new SatInfo;
                    this.pointer_info   = new PointerInfo;
                    this.app_info       = new AppInfo;

                    this.$is_load.resolve();
                }.bind(this));

            Super.prototype.initialize.apply(this, arguments);
            // shown by default (without 'show' method invocation'). lets to provide correct 'is_shown' prop
            this.$model.set('is_shown', true);
        },
        /**
         * @public
         * @description Define when component load is finished
         * @returns {jQuery.Promise}
         */
        onLoad: function () {
            return this.$is_load.promise();
        },
        /**
         * @private
         * @description Initialize events listeners
         */
        $initEvents: function () {
            this.$model.on('change:opened_menu', function (model, new_menu_type) {
                var PREV_MENU_ID, PREV_MENU_AGGR_NAME,
                    MENU_AGGR_NAME  = new_menu_type + '_menu',
                    MENU_OPEN_ID    = '#show-' + new_menu_type + '-menu',
                    prev_menu_type  = model.previousAttributes().opened_menu;
                // close previous one, if it exists
                if (!!prev_menu_type) {
                    PREV_MENU_ID = '#show-' + prev_menu_type + '-menu';
                    PREV_MENU_AGGR_NAME = prev_menu_type + '_menu';
                    this[PREV_MENU_AGGR_NAME].toggle();
                    this.$toggleElementCheckedState(this.find(PREV_MENU_ID));
                }
                // if new type is not 'closed' one
                if (!!new_menu_type) {
                    this[MENU_AGGR_NAME].toggle();
                    this.$toggleElementCheckedState(this.find(MENU_OPEN_ID));
                }
            }.bind(this));
        },
        /**
         * @public
         * @description Toggle full screen mode
         */
        $toggleFullScreen: function () {
            var fs_el       = document.body,
                in_fs_el    = document.fullscreenElement || document.webkitFullscreenElement,
                already_fs  = !!in_fs_el,
                exitFS      = document.exitFullscreen || document.webkitExitFullscreen,
                enterFS     = fs_el.requestFullscreen || fs_el.webkitRequestFullscreen;

            if (already_fs) {
                exitFS.call(document);
            } else {
                enterFS.call(fs_el);
            }
        },
        /**
         * @private
         * @description Toggle menu window visibility and checked state
         * @param {String} menu_type Menu type. Allowed values: 'sat', 'map', 'player', 'pointer'
         */
        $toggleMenu: function (menu_type) {
            if (menu_type === this.$model.get('opened_menu')) {
                menu_type = null;
            }

            this.$model.set('opened_menu', menu_type);
        },
        /**
         * @private
         * @description Toggle desired element checked state
         * @param {jQuery} el Element
         */
        $toggleElementCheckedState: function (el) {
            el.toggleClass(App.model.get('checked_class'));
        },
        /**
         * @public
         * @description Update satellite-info popup window information
         */
        updateSatInfo: function () {
            var active_sat      = App.tle_data.getActiveSat(),
                vel_cartesian   = Cesium.Cartesian3.fromArray(active_sat.vel),
                config = {
                    name: active_sat.info.name,
                    id  : active_sat.info.norad_id,
                    vel : vel_cartesian.magnitude(). // get result value
                        toFixed(3)
                };
            // satellite-info popup requires longitude, latitude and altitude values
            _.extend(config, active_sat.pos.cartographic);
            config.alt = (config.alt / 1000).toFixed(3); // meters to kms
            this.sat_info.changeConfig(config);
        }
    });

    return View;
});