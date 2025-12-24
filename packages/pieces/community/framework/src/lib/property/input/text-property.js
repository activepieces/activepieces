"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LongTextProperty = exports.ShortTextProperty = void 0;
const typebox_1 = require("@sinclair/typebox");
const common_1 = require("./common");
const property_type_1 = require("./property-type");
exports.ShortTextProperty = typebox_1.Type.Composite([
    common_1.BasePropertySchema,
    (0, common_1.TPropertyValue)(typebox_1.Type.String(), property_type_1.PropertyType.SHORT_TEXT)
]);
exports.LongTextProperty = typebox_1.Type.Composite([
    common_1.BasePropertySchema,
    (0, common_1.TPropertyValue)(typebox_1.Type.String(), property_type_1.PropertyType.LONG_TEXT)
]);
//# sourceMappingURL=text-property.js.map