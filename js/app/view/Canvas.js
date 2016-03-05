/**
 * @class Canvas
 * @description Canvas-related API
 */
define([ 'app/view/View', 'app/model/CanvasModel' ], function (Super, Model) {
    'use strict';

    var View;

    View = Super.extend({
        el: '#cesium-container',
        events: {},
        /**
         * @private
         * @property    {CanvasModel}   $model              Canvas model instance
         * @property    {CanvasElement} $canvas_el          Canvas tag HTML element
         * @property                    $ellipsoid          Cesium: Earth WGS84 object
         * @property                    $scene              Cesium: Scene object
         * @property                    $camera             Cesium: Scene camera object
         * @property                    $satellites         Cesium: Satellites collection
         * @property                    $orbits             Cesium: Orbits collection
         * @property                    $central_body       Cesium: Central body
         * @property                    $transitioner       Cesium: Transition object to provide change view ability
         * @property                    $pos_pick_handler
         */
        $model              : new Model(),
        $canvas_el          : null,
        $ellipsoid          : null,
        $scene              : null,
        $camera             : null,
        $satellites         : null,
        $orbits             : null,
        $central_body       : null,
        $transitioner       : null,
        $pointer            : null,
        $pos_pick_handler   : null,
        $is_load            : $.Deferred(),
        auto_render         : false,
        /**
         */
        initialize: function () {
            this.$initCesiumComponents();
            this.$initSizes();
            this.$initEvents();

            $.when(this.$loadResources(), this.$initTileProvider()).done(function () {
                this.$initSky();
                this.render();
            }.bind(this));

            Super.prototype.initialize.apply(this, arguments);
        },
        /**
         */
        render: function () {
            var SCENE_RENDER_DELAY = 1000,
                tick = function () {
                    this.$scene.initializeFrame(); // takes optional 'time' argument
                    this.$scene.render();
                    Cesium.requestAnimationFrame(tick);
                }.bind(this);

            tick();
            // shown by default (without 'show' method invocation'). lets to provide correct 'is_shown' prop
            this.$model.set('is_shown', true);
            Super.prototype.render.apply(this, arguments);

            window.setTimeout(this.$is_load.resolve.bind(this.$is_load), SCENE_RENDER_DELAY);
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
         * @description Load image resource and notify on successful load
         * @returns {jQuery.Promise}
         */
        $loadResources: function () {
            var i, curr_img_url, curr_img, curr_def,
                BASE    = this.$model.get('cesium_texture_base_url') + '/SkyBox',
                images  = [
                    this.$model.get('pointer_url'),
                    this.$model.get('sat_icon_url'),
                    BASE + '/tycho2t3_80_px.jpg',
                    BASE + '/tycho2t3_80_mx.jpg',
                    BASE + '/tycho2t3_80_py.jpg',
                    BASE + '/tycho2t3_80_my.jpg',
                    BASE + '/tycho2t3_80_pz.jpg',
                    BASE + '/tycho2t3_80_mz.jpg'
                ],
                def_array = [];

            for (i = 0; curr_img_url = images[i]; i++) {
                curr_img        = new Image();
                curr_def        = $.Deferred();
                curr_img.onload = curr_def.resolve.bind(curr_def);
                curr_img.src    = curr_img_url;
                def_array.push(curr_def);
            }

            return $.when.apply($, def_array);
        },
        /**
         * @private
         * @description Initialize Cesium library components
         */
        $initCesiumComponents: function () {
            this.$canvas_el      = this.find('#canvas-gl').get(0);
            this.$ellipsoid      = Cesium.Ellipsoid.WGS84;
            this.$scene          = new Cesium.Scene(this.$canvas_el);
            this.$camera         = this.$scene.getCamera();
            _.extend(this.$scene.getScreenSpaceCameraController(), {
                minimumZoomDistance : this.$model.get('min_camera_alt'),
                maximumZoomDistance : this.$model.get('max_camera_alt'),
                inertiaZoom         : 0
            });
            this.$satellites     = new Cesium.BillboardCollection();
            // init Orbit traces
            this.$orbits         = new Cesium.PolylineCollection();
            this.$scene.getPrimitives().add(this.$orbits);
            // init Central body
            this.$central_body   = new Cesium.CentralBody(this.$ellipsoid);
            this.$scene.getPrimitives().setCentralBody(this.$central_body);
            this.$transitioner   = new Cesium.SceneTransitioner(this.$scene, this.$ellipsoid);
        },
        /**
         * @private
         * @description Initialize canvas events
         */
        $initEvents: function () {
            var event_handler = new Cesium.ScreenSpaceEventHandler(this.$canvas_el);

            window.addEventListener('resize', this.$initSizes.bind(this));
            // hover on satellite show it's name
            event_handler.setInputAction(function (movement) {
                var MESSAGE_ID  = 'sat',
                    object      = this.$scene.pick(movement.endPosition);

                if (object && !!object.satellite) {
                    App.gui.message.show({
                        id  : MESSAGE_ID,
                        text: object.satellite.name,
                        pos : {
                            x: movement.endPosition.x,
                            y: movement.endPosition.y - 30
                        }
                    });
                } else {
                    App.gui.message &&
                        App.gui.message.isShown() &&
                            App.gui.message.isID(MESSAGE_ID) &&
                                App.gui.message.hide();
                }
            }.bind(this), Cesium.ScreenSpaceEventType.MOUSE_MOVE);

            event_handler.setInputAction(function (click) {
                var object;

                if (!this.$pos_pick_handler) {
                    object = this.$scene.pick(click.position);
                    App.model.set('active_sat_id', object && !!object.satellite ?
                        object.satellite.norad_id : null);
                }
            }.bind(this), Cesium.ScreenSpaceEventType.LEFT_CLICK);
        },
        /**
         * @private
         * @description Download desired image
         * @param {String} type Image type. Allowed type: 'sat', 'pointer'
         * @returns {jQuery.Promise} Image will be passed as 'done' argument
         */
        $loadImage: function (type) {
            var image = new Image(),
                images = {
                    sat: {
                        def: $.Deferred(),
                        src: this.$model.get('sat_icon_url')
                    },
                    pointer: {
                        def: $.Deferred(),
                        src: this.$model.get('pointer_icon_url')
                    }
                };

            image.onload    = images[type].def.resolve.bind(images[type].def, image);
            image.src       = images[type].src;

            return images[type].def.promise();
        },
        /**
         * @private
         * @description Initialize maps tiles provider
         * @returns {jQueyr.Promise}
         */
        $initTileProvider: function () {
            var interval_handler,
                CHECK_INTERVAL  = 50,
                BASE            = this.$model.get('cesium_texture_base_url'),
                provider        = new Cesium.TileMapServiceImageryProvider({
                                    url: BASE + '/NaturalEarthII'
                                }),
                def             = $.Deferred(),
                cb_layers       = this.$central_body.getImageryLayers();

            cb_layers.addImageryProvider(provider);
            // there is no onReady event in imagery provider object; let's use interval
            interval_handler = window.setInterval(function () {
                if (provider.isReady()) {
                    def.resolve();
                    window.clearInterval(interval_handler);
                }
            }.bind(this), CHECK_INTERVAL);

            return def.promise();
        },
        /**
         * @private
         * @description Initialize sky background
         */
        $initSky: function () {
            var BASE = this.$model.get('cesium_texture_base_url') + '/SkyBox';

//            this.$scene.skyAtmosphere = new Cesium.SkyAtmosphere();

            this.$scene.skyBox = new Cesium.SkyBox({
                positiveX: BASE + '/tycho2t3_80_px.jpg',
                negativeX: BASE + '/tycho2t3_80_mx.jpg',
                positiveY: BASE + '/tycho2t3_80_py.jpg',
                negativeY: BASE + '/tycho2t3_80_my.jpg',
                positiveZ: BASE + '/tycho2t3_80_pz.jpg',
                negativeZ: BASE + '/tycho2t3_80_mz.jpg'
            });
        },
        /**
         * @private
         * @description Initialize canvas sizes
         */
        $initSizes: function () {
            var container   = document.getElementById('cesium-container'),
                sizes       = document.body.getBoundingClientRect();

            this.$canvas_el.width = container.width = sizes.width;
            this.$canvas_el.height = container.height = sizes.height;
            this.$camera.frustum.aspectRatio = sizes.width / sizes.height;
        },
        /**
         * @private
         * @description Clear space from objects (except Earth)
         */
        $clearSpace: function () {
            this.$orbits.removeAll();
            this.$satellites.removeAll();
        },
        /**
         * @private
         * @description Update satellites positions in space
         */
        $updateSatsPositions: function () {
            var i, l, sat_billboard,
                sat_data = App.tle_data.getActiveGNSSData();

            for (i = 0, l = sat_data.length; i < l; i++) {
                sat_billboard = this.$satellites.get(i);
                sat_billboard.setPosition(Cesium.Cartesian3.fromArray(sat_data[i].pos.cartesian));
            }
        },
        /**
         * @private
         * @description Update satellites highlight state and color
         */
        $updateSatsHighlight: function () {
            var i, curr_sat, sat_billboard, sat_color_prop,
                sat_data = App.tle_data.getActiveGNSSData();

            for (i = 0; curr_sat = sat_data[i]; i++) {
                sat_billboard = this.$satellites.get(i);

                if (sat_billboard.satellite.is_selected) {
                    sat_color_prop = curr_sat.is_visible ? 'selected_visible_sat_color' : 'selected_sat_color';
                } else {
                    sat_color_prop = curr_sat.is_visible ? 'visible_sat_color' : 'default_sat_color';
                }

                sat_billboard.setColor(this.$model.get(sat_color_prop));
                sat_billboard.satellite.is_visible = curr_sat.is_visible;
            }
        },
        /**
         * @private
         * @description Create billboards for each satellite
         * @param {Data.gnss_types} [type] Desired GNSS system type. (Active GNSS by default)
         */
        $createSatsBillboards: function (type) {
            var i, l, sat_billboard, curr_sat_info,
                sat_data = !!type ? App.tle_data.getGNSSData(type) : App.tle_data.getActiveGNSSData();

            for (i = 0, l = sat_data.length; i < l; i++) {
                sat_billboard = this.$satellites.add({
                    imageIndex  : 0,
                    position    : new Cesium.Cartesian3(0.0, 0.0, 0.0)
                });

                sat_billboard.setScale(this.$model.get('default_sat_scale'));
                sat_billboard.setColor(this.$model.get('default_sat_color'));
                curr_sat_info = sat_data[i].info;
                // lets add additional property to each satellite billboard (which is used in event listeners)
                sat_billboard.satellite = {
                    name        : curr_sat_info.name,
                    norad_id    : curr_sat_info.norad_id,
                    is_selected : false
                };
            }

            this.$loadImage('sat').done(function (image) {
                this.$satellites.setTextureAtlas(this.$scene.getContext().createTextureAtlas({
                    image: image
                }));
            }.bind(this));

            this.$scene.getPrimitives().add(this.$satellites);
        },
        /**
         * @private
         * @description Get satellite billboard object by ID
         * @param {String} id Satellite ID (NORAD ID)
         * @returns {Cesium.Billboard}
         */
        $getSatBillboardByID: function (id) {
            var sat_billboard, i, l,
                to_return = null;

            for (i = 0, l = this.$satellites.getLength(); i < l; i++) {
                sat_billboard = this.$satellites.get(i);

                if (sat_billboard.satellite.norad_id === id) {
                    to_return = sat_billboard;
                    break;
                }
            }

            return to_return;
        },
        /**
         * @private
         * @description Select satellite image
         * @param {String} id Satellite ID (NORAD ID)
         */
        $selectSatImage: function (id) {
            var sat_billboard = this.$getSatBillboardByID(id);

            if (!sat_billboard.satellite.is_selected) {
                this.$deselectActivatedSatImage(); // deselect previous selected billboard
                sat_billboard.satellite.is_selected = true;
                sat_billboard.setScale(this.$model.get('selected_sat_scale'));
                sat_billboard.setColor(this.$model.get('selected_sat_color'));
            }
        },
        /**
         * @private
         * @description Deselect satellite image (previously activated)
         */
        $deselectActivatedSatImage: function () {
            var i, sat_billboard;

            for (i = 0; sat_billboard = this.$satellites.get(i); i++) {
                if (sat_billboard.satellite.is_selected) {
                    sat_billboard.satellite.is_selected = false;
                    sat_billboard.setScale(this.$model.get('default_sat_scale'));
                    sat_billboard.setColor(this.$model.get('default_sat_color'));
                }
            }
        },
        /**
         * @private
         * @desription Get satellites medium alteration
         * @returns {String|Number} Alteration in meters
         */
        $getSatsAlt: function () {
            var sat_billboard   = this.$satellites.get(0),
                cart3           = sat_billboard.getPosition(),
                cartg           = App.pos_api.convertCartesianToCartographicDegrees(cart3);

            return cartg.alt;
        },
        /**
         * @private
         * @description Set camera alteration
         * @param {String|Number} new_alt Alteration in meters
         */
        $setCameraAlt: function (new_alt) {
            var cart3   = this.$camera.getPositionWC(),
                cartg   = App.pos_api.convertCartesianToCartographicDegrees(cart3);

            cartg.alt = new_alt;
            this.$moveCameraTo(App.pos_api.convertCartographicDegreesToCartesian(cartg));
        },
        /**
         * @private
         * @description Calculate camera alteration
         * @returns {Number} Alteration in meters
         */
        $getCameraAlt: function () {
            var cart3   = this.$camera.getPositionWC(),
                cartg   = App.pos_api.convertCartesianToCartographicDegrees(cart3);

            return cartg.alt;
        },
        /**
         * @private
         * @description Move camera to desired cartesian position and scales (alteration)
         * @param {Cesium.Cartesian3}   cart3   Desired position
         * @param {Number}              [scale]         Desired scale value
         */
        $moveCameraTo: function (cart3, scale) {
            var eye     = new Cesium.Cartesian3.clone(cart3),
                target  = Cesium.Cartesian3.ZERO,
                up      = new Cesium.Cartesian3(0, 0, 1);

            !!scale && eye.multiplyByScalar(scale);
            this.$camera.controller.lookAt(eye, target, up);
        },
        /**
         * @private
         * @description Initialize GNSS system optimal camera alteration
         */
        $initGNSSAlt: function () {
            var gnss_alt    = this.$getSatsAlt(),
                camera_alt  = gnss_alt * 2.0;

            if (camera_alt < this.$model.get('min_camera_alt')) {
                camera_alt = this.$model.get('optimal_camera_alt');
            }

            this.$scene.mode === Cesium.SceneMode.SCENE3D && this.$setCameraAlt(camera_alt);
        },
        /**
         * @public
         * @description Update satellites appearance
         */
        updateSats: function () {
            this.$updateSatsPositions();
            this.$updateSatsHighlight();
            !!App.model.get('active_sat_id') && this.showActiveSatOrbit();
        },
        /**
         * @public
         * @description Moves camera to desired satellite
         * @param {String} id Satellite ID (NORAD ID)
         */
        moveCameraToSat: function (id) {
            this.$scene.mode === Cesium.SceneMode.SCENE3D &&
                this.$moveCameraTo(this.$getSatBillboardByID(id).getPosition(), 2.0);
        },
        /**
         * @public
         * @description Show satellite orbit path
         * @param {String} id Satellite ID (NORAD ID)
         */
        showSatOrbit: function (id) {
            var path, path_material, minutes, point_jd, mins_since_epoch, new_sat_rec,
                positions           = [],
                start_sat_rec       = App.tle_data.getSatByID(id),
                // because of specific working procedure with real number type orbit's last value will be placed
                // before start one, hence lets remember start pos to draw last line to it to make it look like real ellipse
                start_pos           = Cesium.Cartesian3.fromArray(start_sat_rec.pos.cartesian),
                getPointsCount = function () {
                    var ALT_KM = start_sat_rec.pos.cartographic.alt / (1000 * 1000);

                    return parseInt(Math.sqrt(ALT_KM) * 100);
                },
                POINTS_RATIO        = getPointsCount(),
                record              = start_sat_rec.record,
                sat_epoch_jd        = Cesium.JulianDate.fromTotalDays(record.jdsatepoch),
                jd_now              = App.model.get('scene_date_jd'),
                // 'no' property determines how many radians satellite passes in one minute
                minutes_per_orbit   = 2 * Math.PI / record.no,
                minutes_per_point   = minutes_per_orbit / POINTS_RATIO;

            for (minutes = minutes_per_point; minutes <= minutes_per_orbit ; minutes += minutes_per_point) {
                point_jd            = jd_now.addMinutes(minutes);
                mins_since_epoch    = sat_epoch_jd.getMinutesDifference(point_jd);
                new_sat_rec         = App.pos_api.useSGP4(record, mins_since_epoch, jd_now);
                positions.push(Cesium.Cartesian3.fromArray(new_sat_rec.pos.cartesian));
            }

            positions.unshift(start_pos);
            // draw last line to start pos (actually it will increase real POINTS_RATIO by 1)
            positions.push(start_pos);
            this.$orbits.removeAll();

            path_material = new Cesium.Material({
                fabric: {
                    type: 'Color',
                    uniforms: {
                        color: this.$model.get('orbit_color')
                    }
                }
            });

            path = this.$orbits.add();
            path.setPositions(positions);
            path.setWidth(2.0);
            path.setMaterial(path_material);
        },
        /**
         * @public
         * @description Show orbit of active satellite
         */
        showActiveSatOrbit: function () {
            this.showSatOrbit(App.model.get('active_sat_id'));
        },
        /**
         * @public
         * @description Zoom scene
         * @param {String}  type    Zoom type. Allowed types: 'in', 'out'
         */
        zoom: function (type) {
            var DIVIDER         = 10.0,
                camera_height   = Cesium.Ellipsoid.WGS84.cartesianToCartographic(this.$camera.getPositionWC()).height,
                move_rate       = camera_height / DIVIDER,
                move_method     = type === 'in' ? 'zoomIn' : 'zoomOut',
                new_alt         = camera_height + (type === 'in' ? -1 : 1) * move_rate;

            this.$model.get('max_camera_alt') > new_alt &&
                this.$model.get('min_camera_alt') < new_alt &&
                    this.$camera.controller[move_method](move_rate);
        },
        /**
         * @public
         * @description Add pointer on the globe
         * @param {{lon: Number, lat: Number}} cartg_dg Desired pointer position
         * @param {Boolean} [move_camera] Move camera to pointer after addition
         */
        addPointer: function (cartg_dg, move_camera) {
            var show;

            show = function (image) {
                var cart2_pos   = this.$ellipsoid.cartographicToCartesian(
                        Cesium.Cartographic.fromDegrees(cartg_dg.lon, cartg_dg.lat)),
                    texture     = this.$scene.getContext().createTextureAtlas({
                        image: image
                    });

                this.$pointer = new Cesium.BillboardCollection();
                this.$pointer.setTextureAtlas(texture);
                this.$pointer.modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(cart2_pos);

                this.$pointer.add({
                    imageIndex  : 0,
                    position    : new Cesium.Cartesian3(0.0, 0.0, 0.0)
                });

                this.$scene.getPrimitives().add(this.$pointer);

                move_camera && this.moveCameraToPointer(cartg_dg);
            }.bind(this);

            if (this.$pointer) {
                this.removePointer();
                show();
            } else {
                this.$loadImage('pointer').done(show);
            }
        },
        /**
         * @public
         * @description Remove previously added pointer from the globe
         */
        removePointer: function () {
            this.$scene.getPrimitives().remove(this.$pointer);
            this.$pointer = null;
        },
        /**
         * @public
         * @description Move scene camera above pointer position
         * @param {{lon: String, lat: String}} cartg_dg Cartographic position
         */
        moveCameraToPointer: function (cartg_dg) {
            !!this.$pointer && this.$scene.mode === Cesium.SceneMode.SCENE3D &&
                this.$moveCameraTo(App.pos_api.convertCartographicDegreesToCartesian({
                    lon: cartg_dg.lon,
                    lat: cartg_dg.lat,
                    alt: this.$getCameraAlt()
                }));
        },
        /**
         * @public
         * @description Pick a position on the globe
         * @param {Function} cb Callback function. Receives Cesium.Cartesian3 object as argument
         */
        pickPosition: function (cb) {
            this.stopPickPosition();
            this.$pos_pick_handler = new Cesium.ScreenSpaceEventHandler(this.$canvas_el);

            App.gui.message.show({
                id      : 'choose-position',
                text    : 'За допомогою мишки оберіть бажану позицію на глобусі',
                pos     : 'center',
                ttl     : 2000
            });

            this.$pos_pick_handler.setInputAction(function (click) {
                var pos_xy      = [ click.position.x, click.position.y ],
                    point_pos   = this.$camera.controller.pickEllipsoid(
                        Cesium.Cartesian2.fromArray(pos_xy), this.$ellipsoid);

                if (point_pos) {
                    this.stopPickPosition();
                    cb(point_pos);
                }
            }.bind(this), Cesium.ScreenSpaceEventType.LEFT_CLICK);
        },
        /**
         * @public
         * @description Stop position pick on the globe
         */
        stopPickPosition: function () {
            this.$pos_pick_handler && this.$pos_pick_handler.destroy();
            this.$pos_pick_handler = null;
        },
        /**
         * @public
         * @description Show desired GNSS system
         * @param {String} type Desired GNSS type
         */
        showGNSS: function (type) {
            this.$clearSpace();
            this.$createSatsBillboards(type);
            this.$updateSatsPositions();
            this.$initGNSSAlt();
        },
        /**
         * @public
         * @description Select satellite as active
         * @param {String} id Satellite ID (NORAD ID)
         */
        selectSat: function (id) {
            if (id === null) {
                this.$deselectActivatedSatImage();
                this.$orbits.removeAll();
            } else {
                this.$selectSatImage(id);
//                this.moveCameraToSat(id);
                this.showSatOrbit(id);
            }
        },
        /**
         * @public
         * @description Change Cesium world-space view type
         * @param {String}  type        View type. Possible values: '2d', '3d', 'columbus'
         * @param {Boolean} [is_morph]  Is morphing transition used. Not allowed is current type is 2D
         */
        setViewType: function (type, is_morph) {
            var continueSatUpdate;

            if (type !== this.$scene.mode && !this.$model.get('under_transition')) {
                // there is an issue in Cesium library which throws error during transition from 2D to 3D/ColumbusView
                if (this.$scene.mode === Cesium.SceneMode.SCENE2D && is_morph) {
                    is_morph = false;
                }

                switch (type) {
                    case Cesium.SceneMode.SCENE2D:
                        !is_morph ? this.$transitioner.to2D() : this.$transitioner.morphTo2D();
                        App.gui.map_menu.setChecked('2d');
                        break;
                    case Cesium.SceneMode.SCENE3D:
                        !is_morph ? this.$transitioner.to3D() : this.$transitioner.morphTo3D();
                        App.gui.map_menu.setChecked('3d');
                        break;
                    case Cesium.SceneMode.COLUMBUS_VIEW:
                        !is_morph ? this.$transitioner.toColumbusView() : this.$transitioner.morphToColumbusView();
                        App.gui.map_menu.setChecked('columbus');
                        break;
                    default:
                        break;
                }
                // to provide better appearance lets pause satellite data update during transition
                if (is_morph) {
                    continueSatUpdate = function () {
                        this.$model.set('under_transition', false);
                        App.model.set('play_state', true);
                        this.$transitioner.onTransitionComplete.removeEventListener(continueSatUpdate);
                    }.bind(this);

                    this.$transitioner.onTransitionComplete.addEventListener(continueSatUpdate);

                    this.$model.set('under_transition', true);
                    App.model.set('play_state', false);
                }
            }
        }
    });

    return View;
});