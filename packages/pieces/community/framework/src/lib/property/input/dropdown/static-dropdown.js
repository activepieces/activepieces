"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaticMultiSelectDropdownProperty = exports.StaticDropdownProperty = void 0;
const typebox_1 = require("@sinclair/typebox");
const common_1 = require("../common");
const common_2 = require("./common");
const property_type_1 = require("../property-type");
exports.StaticDropdownProperty = typebox_1.Type.Composite([
    common_1.BasePropertySchema,
    typebox_1.Type.Object({
        options: common_2.DropdownState
    }),
    (0, common_1.TPropertyValue)(typebox_1.Type.Unknown(), property_type_1.PropertyType.STATIC_DROPDOWN)
]);
exports.StaticMultiSelectDropdownProperty = typebox_1.Type.Composite([
    common_1.BasePropertySchema,
    typebox_1.Type.Object({
        options: common_2.DropdownState
    }),
    (0, common_1.TPropertyValue)(typebox_1.Type.Array(typebox_1.Type.Unknown()), property_type_1.PropertyType.STATIC_MULTI_SELECT_DROPDOWN)
]);
//# sourceMappingURL=static-dropdown.js.map