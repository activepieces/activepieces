"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamicProperties = exports.DynamicPropsValue = exports.DynamicProp = void 0;
const typebox_1 = require("@sinclair/typebox");
const static_dropdown_1 = require("./dropdown/static-dropdown");
const text_property_1 = require("./text-property");
const common_1 = require("./common");
const property_type_1 = require("./property-type");
const json_property_1 = require("./json-property");
const array_property_1 = require("./array-property");
exports.DynamicProp = typebox_1.Type.Union([
    text_property_1.ShortTextProperty,
    static_dropdown_1.StaticDropdownProperty,
    json_property_1.JsonProperty,
    array_property_1.ArrayProperty,
    static_dropdown_1.StaticMultiSelectDropdownProperty,
]);
exports.DynamicPropsValue = typebox_1.Type.Record(typebox_1.Type.String(), exports.DynamicProp);
exports.DynamicProperties = typebox_1.Type.Composite([
    typebox_1.Type.Object({
        refreshers: typebox_1.Type.Array(typebox_1.Type.String()),
    }),
    common_1.BasePropertySchema,
    (0, common_1.TPropertyValue)(typebox_1.Type.Unknown(), property_type_1.PropertyType.DYNAMIC),
]);
//# sourceMappingURL=dynamic-prop.js.map