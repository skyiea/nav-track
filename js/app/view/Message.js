define([ 'app/view/View' ], function (Super) {
    'use strict';

    var View;

    View = Super.extend({
        el: '#message',
        $id: null,
        $ttl_handler: null,
        /**
         * @private
         * @description Change message configuration
         * @param config
         */
        $changeConfig: function (config) {
            if (this.$ttl_handler) {
                window.clearInterval(this.$ttl_handler);
                this.$ttl_handler = null;
            }

            if (config.pos === 'center') {
                config.pos = {
                    x: document.body.offsetWidth / 2 - config.text.length * 8 / 2 + 'px',
                    y: document.body.offsetHeight / 2 - 8 / 2 + 'px'
                };
            }

            this.$el.text(config.text);
            this.$id = config.id;

            this.$el.css({
                left    : config.pos.x,
                top     : config.pos.y
            });

            if (config.ttl) {
                this.$ttl_handler = window.setTimeout(this.hide.bind(this), config.ttl);
            }
        },
        /**
         * @public
         * @description Show message
         * @param {Object} config Message information. Contains text and position.
         */
        show: function (config) {
            this.$changeConfig(config);

            Super.prototype.show.apply(this, arguments);
        },
        /**
         * @public
         * @description
         */
        hide: function () {
            var empty_config = {
                id: null,
                text: '',
                pos: {
                    x: 0,
                    y: 0
                }
            };

            this.$changeConfig(empty_config);

            Super.prototype.hide.apply(this, arguments);
        },
        /**
         * @public
         * @description Compared given ID with the one that is shown
         * @param {String} compared_id Given ID
         * @returns {Boolean}
         */
        isID: function (compared_id) {
            return this.$id === compared_id;
        }
    });

    return View;
});