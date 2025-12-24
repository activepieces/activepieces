"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NumberProperty = void 0;
const typebox_1 = require("@sinclair/typebox");
const common_1 = require("./common");
const property_type_1 = require("./property-type");
exports.NumberProperty = typebox_1.Type.Composite([
    common_1.BasePropertySchema,
    (0, common_1.TPropertyValue)(typebox_1.Type.Number(), property_type_1.PropertyType.NUMBER)
]);
//# sourceMappingURL=number-property.js.map