"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateFieldRequest = exports.CreateFieldRequest = void 0;
const typebox_1 = require("@sinclair/typebox");
const field_1 = require("../field");
const StaticDropdownData = typebox_1.Type.Object({
    options: typebox_1.Type.Array(typebox_1.Type.Object({
        value: typebox_1.Type.String(),
    })),
});
exports.CreateFieldRequest = typebox_1.Type.Union([typebox_1.Type.Object({
        name: typebox_1.Type.String(),
        type: typebox_1.Type.Literal(field_1.FieldType.STATIC_DROPDOWN),
        tableId: typebox_1.Type.String(),
        data: StaticDropdownData,
        externalId: typebox_1.Type.Optional(typebox_1.Type.String()),
    }), typebox_1.Type.Object({
        name: typebox_1.Type.String(),
        type: typebox_1.Type.Union([typebox_1.Type.Literal(field_1.FieldType.TEXT), typebox_1.Type.Literal(field_1.FieldType.NUMBER), typebox_1.Type.Literal(field_1.FieldType.DATE)]),
        tableId: typebox_1.Type.String(),
        externalId: typebox_1.Type.Optional(typebox_1.Type.String()),
    })]);
exports.UpdateFieldRequest = typebox_1.Type.Object({
    name: typebox_1.Type.String(),
});
//# sourceMappingURL=fields.dto.js.map