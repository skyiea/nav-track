define([], function () {
    var Model;

    Model = Backbone.Model.extend({
        defaults: {
            is_shown: false
        }
    });

    return Model;
});