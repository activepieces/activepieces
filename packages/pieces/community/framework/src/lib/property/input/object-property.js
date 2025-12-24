"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObjectProperty = void 0;
const typebox_1 = require("@sinclair/typebox");
const common_1 = require("./common");
const property_type_1 = require("./property-type");
exports.ObjectProperty = typebox_1.Type.Composite([
    common_1.BasePropertySchema,
    (0, common_1.TPropertyValue)(typebox_1.Type.Record(typebox_1.Type.String(), typebox_1.Type.Unknown()), property_type_1.PropertyType.OBJECT)
]);
//# sourceMappingURL=object-property.js.map