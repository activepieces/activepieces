"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaticDropdownEmptyOption = exports.Field = exports.FieldType = void 0;
const typebox_1 = require("@sinclair/typebox");
const common_1 = require("../common");
var FieldType;
(function (FieldType) {
    FieldType["TEXT"] = "TEXT";
    FieldType["NUMBER"] = "NUMBER";
    FieldType["DATE"] = "DATE";
    FieldType["STATIC_DROPDOWN"] = "STATIC_DROPDOWN";
})(FieldType || (exports.FieldType = FieldType = {}));
exports.Field = typebox_1.Type.Union([typebox_1.Type.Object(Object.assign(Object.assign({}, common_1.BaseModelSchema), { name: typebox_1.Type.String(), externalId: typebox_1.Type.String(), type: typebox_1.Type.Literal(FieldType.STATIC_DROPDOWN), tableId: typebox_1.Type.String(), projectId: typebox_1.Type.String(), data: typebox_1.Type.Object({
            options: typebox_1.Type.Array(typebox_1.Type.Object({
                value: typebox_1.Type.String(),
            })),
        }) })), typebox_1.Type.Object(Object.assign(Object.assign({}, common_1.BaseModelSchema), { name: typebox_1.Type.String(), externalId: typebox_1.Type.String(), type: typebox_1.Type.Union([typebox_1.Type.Literal(FieldType.TEXT), typebox_1.Type.Literal(FieldType.NUMBER), typebox_1.Type.Literal(FieldType.DATE)]), tableId: typebox_1.Type.String(), projectId: typebox_1.Type.String() }))]);
exports.StaticDropdownEmptyOption = {
    label: '',
    value: '',
};
//# sourceMappingURL=field.js.map