"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TPropertyValue = exports.BasePropertySchema = void 0;
const typebox_1 = require("@sinclair/typebox");
exports.BasePropertySchema = typebox_1.Type.Object({
    displayName: typebox_1.Type.String(),
    description: typebox_1.Type.Optional(typebox_1.Type.String())
});
const TPropertyValue = (T, propertyType) => typebox_1.Type.Object({
    type: typebox_1.Type.Literal(propertyType),
    required: typebox_1.Type.Boolean(),
    defaultValue: typebox_1.Type.Optional(typebox_1.Type.Any()),
});
exports.TPropertyValue = TPropertyValue;
//# sourceMappingURL=common.js.map