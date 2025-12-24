"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckboxProperty = void 0;
const typebox_1 = require("@sinclair/typebox");
const common_1 = require("./common");
const property_type_1 = require("./property-type");
exports.CheckboxProperty = typebox_1.Type.Composite([
    common_1.BasePropertySchema,
    (0, common_1.TPropertyValue)(typebox_1.Type.Boolean(), property_type_1.PropertyType.CHECKBOX)
]);
//# sourceMappingURL=checkbox-property.js.map