define([ 'app/view/Popup', 'text!/templates/SatMenu.html' ], function (Super, Template) {
    'use strict';

    var View;

    View = Super.extend({
        el      : '#sat-menu',
        template: Template,
        events: {
            'change #select-gnss-type': function () {
                // 'value' is select tag property (not attribute)
                var type = this.$select_gnss_el.get(0).value;

                App.model.set('active_system_type', type);
            },
            'change #select-satellite-name': function () {
                var index   = this.$select_name_el.get(0).selectedIndex,
                    id      = $(this.$select_name_el.children().get(index)).attr('norad_id');

                App.model.set('active_sat_id', id);
                !App.gui.sat_info.isShown() && App.gui.sat_info.show();
            }
        },
        /**
         * @private
         * @property    {?jQuery}   $select_gnss_el     GNSS select jquery element
         * @property    {?jQuery}   $select_name_el     Satellite select jquery element
         */
        $select_gnss_el: null,
        $select_name_el: null,
        /**
         */
        render: function () {
            Super.prototype.render.apply(this, arguments);

            this.$initSelectors();
        },
        /**
         * @private
         * @description Initialize selectors
         */
        $initSelectors: function () {
            this.$select_gnss_el = this.find('#select-gnss-type');
            this.$select_name_el = this.find('#select-satellite-name');
            this.$fillGNSSSelector();
        },
        /**
         * @private
         * @description Populate GNSS-type selector with available GNSS types
         */
        $fillGNSSSelector: function () {
            var option_el,
                types = App.tle_data.gnss_types;

            _.each(types, function (value, prop) {
                option_el = $('<option></option>').attr('value', prop).html(value);
                this.$select_gnss_el.append(option_el);
            }.bind(this));
            // unset active option
            this.$select_gnss_el.get(0).selectedIndex = -1;
        },
        /**
         * @private
         * @description Populate satellite-name selector with name array of desired system type
         * @param {String} type Desired system type
         */
        $fillSatNameSelector: function (type) {
            var i, option_el, curr_sat,
                sat_data = App.tle_data.getGNSSData(type);

            for (i = 0; curr_sat = sat_data[i]; i++) {
                option_el = $('<option></option>').attr('norad_id', curr_sat.info.norad_id).html(curr_sat.info.name);
                this.$select_name_el.append(option_el);
            }
            // unset active option
            this.$select_name_el.get(0).selectedIndex = -1;
        },
        /**
         * @private
         * @description Clear satellite-name selector from options
         */
        $clearSatNameSelector: function () {
            if (this.$select_name_el.children().length) {
                this.$select_name_el.empty();
            }
        },
        /**
         * @public
         * @description Select GNSS type
         */
        selectGNSS: function (type) {
            var getOptionIndex, type_index,
                select_el = this.$select_gnss_el;
            /**
             * @function
             * @description Determine desired type index in select element using value property
             * @returns {Number} index
             */
            getOptionIndex = function () {
                var i, current_option, index;

                for (i = 0; current_option = select_el.children().get(i); i++) {
                    if (current_option.value === type) {
                        index = i;
                        break;
                    }
                }

                return index;
            };
            // index of desired type, determined using 'value' property of each option
            type_index = getOptionIndex();
            // if it is not already same index. it is possible if selectGNSS is called directly from select onchange
            if (select_el.get(0).selectedIndex !== type_index) {
                select_el.get(0).selectedIndex = type_index;
            }

            this.$clearSatNameSelector();
            this.$fillSatNameSelector(type);
        },
        /**
         * @public
         * @description Select satellite in satellite-name select tag using its NORAD ID
         * @param {String} id NORAD ID
         */
        selectSatByID: function (id) {
            var index, getOptionIndex,
                select_el = this.$select_name_el;
            /**
             * @function
             * @description Determine desired satellite index in select element using NORAD ID
             * @returns {Number} index
             */
            getOptionIndex = function () {
                var i, current_option,
                    index = -1; // -1 unselects select element

                for (i = 0; current_option = select_el.children().get(i); i++) {
                    if (current_option.getAttribute('norad_id') === id) {
                        index = i;
                        break;
                    }
                }

                return index;
            };

            if (id === null) {
                index = -1; // -1 unselects select element
            } else {
                index = getOptionIndex();
            }
            // this method could be invoked directly after satellite-name select onchange by user
            // in this case there is no need to select it twice
            if (select_el.get(0).selectedIndex !== index) {
                select_el.get(0).selectedIndex = index;
            }
        }
    });

    return View;
});