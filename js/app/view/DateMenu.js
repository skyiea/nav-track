/**
 * @class DateMenu
 * @description Date menu popup window which gives ability to choose desired date and time
 */
define([ 'app/view/Popup', 'text!/templates/DateMenu.html' ], function (Super, Template) {
    'use strict';

    var View;

    View = Super.extend({
        el: '#date-menu',
        template: Template,
        /**
         * @private
         * @property    {jQuery}    $dtpicker_el    jQuery element, after which date-picker plugin will be appended
         * @property    {Function}  $dateTimePick   Function, that takes argument as method, that should be called in
         *                                          date-picker plugin
         */
        $date_el        : $('#now-date'),
        $dtpicker_el    : null,
        $dateTimePick   : null,
        /**
         */
        render: function () {
            Super.prototype.render.apply(this, arguments);
            // moment.js library hasn't Ukrainian language as default; let's define it
            moment.lang('ua', {
                months        : 'січень_лютий_березень_квітень_травень_червень_липень_серпень_вересень_жовтень_листопад_грудень'.split('_'),
                weekdaysShort : 'нд_пн_вт_ср_чт_пт_сб'.split('_')
            });

            this.$dtpicker_el   = this.find('.header');
            this.$dateTimePick  = this.$dtpicker_el.filthypillow.bind(this.$dtpicker_el);

            this.$dateTimePick({ // start configuration
                minDateTime: function () {
                    return moment(new Date(String(App.model.get('min_year'))));
                },
                maxDateTime: function () {
                    return moment(new Date(String(App.model.get('max_year'))));
                }
            });

            this.$dateTimePick('show'); // show method doesn't actually show plugin (date-menu won't be displayed)
                                        // it is required to append plugin's DOM to menu container
            this.$dateTimePick('removeEvents'); // don't listen events while date-menu isn't showed

            this.$dtpicker_el.on('fp:save', function (e, moment_date) {
                App.model.set('scene_date', moment_date.toDate());
            });
        },
        /**
         * @public
         * @description Toggle menu visibility
         */
        toggle: function () {
            Super.prototype.toggle.apply(this, arguments);

            if (this.isShown()) { // it means that it was hidden, but is shown from now (super's method executes 1st)
                this.$dateTimePick('addEvents');
                this.setDTPickerDate(App.model.get('scene_date'));
            } else {
                this.$dateTimePick('removeEvents');
            }
        },
        /**
         * @public
         * @description Set date-picker plugin date
         * @param {Date} new_date Desired time
         */
        setDTPickerDate: function (new_date) {
            this.$dateTimePick('updateDateTime', new_date);
        },
        /**
         * @public
         * @description Change showed date
         * @param {Date} date Desired date to be shown
         */
        showDate: function (date) {
            var seconds = date.getSeconds(),
                minutes = date.getMinutes(),
                hours   = date.getHours(),
                result  = date.toLocaleDateString() + ' ' +
                    (hours < 10 ? '0' : '') + hours + ':' +
                    (minutes < 10 ? '0' : '') + minutes + ':' +
                    (seconds < 10 ? '0' : '') + seconds;

            this.$date_el.text(result);
        },
        /**
         * @public
         * @description Show current date
         */
        showCurrentDate: function () {
            this.showDate(new Date());
        }
    });

    return View;
});