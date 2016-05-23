import _ from "lodash";

_.forOwn(directory_model, function (directory_model_value, directory_model_key) {
    _.forOwn(fields, function (fields_value, fields_key) {
        "use strict";
        if (directory_model_key === fields_key) {
            directory_model[directory_model_key].value = fields_value;
        }
    });

});

_.forOwn(fields, function (fields_value, fields_key) {
    if (directory_model[fields_key]) {
        directory_model[fields_key].value = fields_value;
    }
});

_.forOwn(fields, function (fields_value, fields_key) {
    directory_model[fields_key].value = fields_value;
});