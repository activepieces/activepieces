"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Nullable = exports.BaseModelSchema = void 0;
exports.NullableEnum = NullableEnum;
exports.DiscriminatedUnion = DiscriminatedUnion;
const typebox_1 = require("@sinclair/typebox");
exports.BaseModelSchema = {
    id: typebox_1.Type.String(),
    created: typebox_1.Type.String(),
    updated: typebox_1.Type.String(),
};
// Used to generate valid nullable in OpenAPI Schema
const Nullable = (schema) => typebox_1.Type.Optional(typebox_1.Type.Unsafe(Object.assign(Object.assign({}, schema), { nullable: true })));
exports.Nullable = Nullable;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function NullableEnum(schema) {
    const values = schema.anyOf.map(f => f.const);
    return typebox_1.Type.Optional(typebox_1.Type.Unsafe({ type: 'string', enum: values, nullable: true }));
}
/** Creates a DiscriminatedUnion that works with OpenAPI. */
function DiscriminatedUnion(discriminator, types, options) {
    return (0, typebox_1.CreateType)({
        [typebox_1.Kind]: 'DiscriminatedUnion',
        anyOf: types,
        discriminator: {
            propertyName: discriminator,
        },
    }, options);
}
//# sourceMappingURL=base-model.js.map