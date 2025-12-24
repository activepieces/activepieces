"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarkDownProperty = void 0;
const typebox_1 = require("@sinclair/typebox");
const common_1 = require("./common");
const property_type_1 = require("./property-type");
exports.MarkDownProperty = typebox_1.Type.Composite([
    common_1.BasePropertySchema,
    (0, common_1.TPropertyValue)(typebox_1.Type.Void(), property_type_1.PropertyType.MARKDOWN),
]);
//# sourceMappingURL=markdown-property.js.map