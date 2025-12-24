"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiSelectDropdownProperty = exports.DropdownProperty = void 0;
const common_1 = require("../common");
const typebox_1 = require("@sinclair/typebox");
const property_type_1 = require("../property-type");
exports.DropdownProperty = typebox_1.Type.Composite([
    common_1.BasePropertySchema,
    (0, common_1.TPropertyValue)(typebox_1.Type.Unknown(), property_type_1.PropertyType.DROPDOWN),
    typebox_1.Type.Object({
        refreshers: typebox_1.Type.Array(typebox_1.Type.String()),
    }),
]);
exports.MultiSelectDropdownProperty = typebox_1.Type.Composite([
    common_1.BasePropertySchema,
    (0, common_1.TPropertyValue)(typebox_1.Type.Array(typebox_1.Type.Unknown()), property_type_1.PropertyType.MULTI_SELECT_DROPDOWN),
    typebox_1.Type.Object({
        refreshers: typebox_1.Type.Array(typebox_1.Type.String()),
    }),
]);
//# sourceMappingURL=dropdown-prop.js.map