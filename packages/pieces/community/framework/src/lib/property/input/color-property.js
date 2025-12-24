"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ColorProperty = void 0;
const typebox_1 = require("@sinclair/typebox");
const common_1 = require("./common");
const property_type_1 = require("./property-type");
exports.ColorProperty = typebox_1.Type.Composite([
    common_1.BasePropertySchema,
    (0, common_1.TPropertyValue)(typebox_1.Type.String(), property_type_1.PropertyType.COLOR)
]);
//# sourceMappingURL=color-property.js.map