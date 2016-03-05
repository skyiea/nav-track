define([ 'app/model/Model' ], function (Super) {
    var Model;

    Model = Super.extend({
        defaults: _.extend({
            opened_menu: null
        }, Super.prototype.defaults)
    });

    return Model;
});