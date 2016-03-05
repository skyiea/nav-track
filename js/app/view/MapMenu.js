define([ 'app/view/Popup', 'text!/templates/MapMenu.html' ], function (Super, Template) {
    'use strict';

    var View;

    View = Super.extend({
        el: '#map-menu',
        template: Template,
        events: {
            'click #two-d': function () {
                App.canvas.setViewType(Cesium.SceneMode.SCENE2D);//, true);
            },
            'click #three-d': function () {
                App.canvas.setViewType(Cesium.SceneMode.SCENE3D);//, true);
            },
            'click #columbus': function () {
                App.canvas.setViewType(Cesium.SceneMode.COLUMBUS_VIEW);//, true);
            }
        },
        /**
         */
        render: function () {
            Super.prototype.render.apply(this, arguments);

            this.setChecked(App.model.get('def_view_type'));
        },
        /**
         * @public
         * @description Set proper button as checked
         * @param {String} type Map type. Allowed values: '2d', '3d', 'columbus'
         */
        setChecked: function (type) {
            var selector,
                CHECKED_CLASS = 'checked';
            // uncheck previous type
            this.$el.find('#map-area').children().removeClass(CHECKED_CLASS);

            switch (type) {
                case '2d':
                    selector = '#two-d';
                    break;
                case '3d':
                    selector = '#three-d';
                    break;
                case 'columbus':
                    selector = '#columbus';
                    break;
                default:
                    break;
            }

            this.find(selector).addClass(CHECKED_CLASS);
        }
    });

    return View;
});