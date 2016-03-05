define([ 'app/view/Popup', 'text!/templates/PlayerMenu.html' ], function (Super, Template) {
    'use strict';

    var View;

    View = Super.extend({
        el: '#player-menu',
        template: Template,
        events: {
            'click #play': function () {
                App.model.set('play_state', true);
            },
            'click #pause': function () {
                App.model.set('play_state', false);
            },
            'change #speed-range': function (e) {
                App.model.set('time_speed', Number(e.target.value));
            },
            'change #freq-range': function (e) {
                App.model.set('update_interval', 1000 / Number(e.target.value));
            }
        },
        template_config: {
            freq        : 1000 / App.model.get('update_interval'),
            speed       : App.model.get('time_speed'),
            max_speed   : App.model.get('max_time_speed')
        },
        /**
         * @public
         * @description Set play state and impact on menu elements state
         * @param {Boolean} is_played Desired play state
         */
        setPlayState: function (is_played) {
            var CHECKED_CLASS   = App.model.get('checked_class'),
                play_el         = this.find('#play'),
                pause_el        = this.find('#pause');

            if (is_played) {
                pause_el.removeClass(CHECKED_CLASS);
                play_el.addClass(CHECKED_CLASS);
            } else {
                play_el.removeClass(CHECKED_CLASS);
                pause_el.addClass(CHECKED_CLASS);
            }
        },
        /**
         * @public
         * @description Toggle play state
         */
        togglePlayState: function () {
            var CHECKED_CLASS = App.model.get('checked_class');

            this.find('#pause').toggleClass(CHECKED_CLASS);
            this.find('#play').toggleClass(CHECKED_CLASS);
        }
    });

    return View;
});