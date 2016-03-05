/**
 * @info Base View class
 */
define([ 'app/model/Model' ], function (Model) {
    'use strict';

    var View;

    View = Backbone.View.extend({
        /**
         * @public
         * @property    {Boolean}   auto_render     Automatically call render method
         */
        auto_render : true,
        /**
         */
        initialize: function () {
            // if there is no separate model for current View instance
            if (!this.$model) {
                this.$model = this.model || new Model;
            }

            this.auto_render && this.render();
        },
        /**
         */
        render: function () {
            this.$compileTemplate();
        },
        /**
         * @private
         * @description Compile view's template and append it to main element
         */
        $compileTemplate: function () {
            var template;

            if (this.template) {
                template = _.template(this.template, this.template_config || this);
                this.$el.append(template);
            }
        },
        /**
         * @public
         * @description Find element in current View
         * @param {String} selector Selector value
         * @returns {jQuery}
         */
        find: function (selector) {
            return this.$el.find(selector);
        },
        /**
         * @public
         * @description Show View
         */
        show: function () {
            this.$el.show();
            this.$model.set('is_shown', true);
        },
        /**
         * @public
         * @description Hide View
         */
        hide: function () {
            this.$el.hide();
            this.$model.set('is_shown', false);
        },
        /**
         * @public
         * @description Toggle View visibility
         */
        toggle: function () {
            this.$el.toggle();
            this.$model.set('is_shown', !this.$model.get('is_shown'));
        },
        /**
         * @public
         * @description Get view element show state
         * @returns {Boolean}
         */
        isShown: function () {
            return this.$model.get('is_shown');
        }
    });

    return View;
});