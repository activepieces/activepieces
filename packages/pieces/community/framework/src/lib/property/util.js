"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.piecePropertiesUtils = void 0;
const property_type_1 = require("./input/property-type");
const typebox_1 = require("@sinclair/typebox");
const shared_1 = require("@activepieces/shared");
function buildSchema(props, auth, requireAuth = true) {
    const entries = Object.entries(props);
    const nullableType = [typebox_1.Type.Null(), typebox_1.Type.Undefined()];
    const nonNullableUnknownPropType = typebox_1.Type.Not(typebox_1.Type.Union(nullableType), typebox_1.Type.Unknown());
    const propsSchema = {};
    for (const [name, property] of entries) {
        switch (property.type) {
            case property_type_1.PropertyType.MARKDOWN:
                propsSchema[name] = typebox_1.Type.Optional(typebox_1.Type.Union([typebox_1.Type.Null(), typebox_1.Type.Undefined(), typebox_1.Type.Never(), typebox_1.Type.Unknown()]));
                break;
            case property_type_1.PropertyType.DATE_TIME:
            case property_type_1.PropertyType.SHORT_TEXT:
            case property_type_1.PropertyType.LONG_TEXT:
            case property_type_1.PropertyType.COLOR:
            case property_type_1.PropertyType.FILE:
                propsSchema[name] = typebox_1.Type.String({
                    minLength: property.required ? 1 : undefined,
                });
                break;
            case property_type_1.PropertyType.CHECKBOX:
                propsSchema[name] = typebox_1.Type.Union([
                    typebox_1.Type.Boolean({ defaultValue: false }),
                    typebox_1.Type.String({}),
                ]);
                break;
            case property_type_1.PropertyType.NUMBER:
                propsSchema[name] = typebox_1.Type.Union([
                    typebox_1.Type.String({
                        minLength: property.required ? 1 : undefined,
                    }),
                    typebox_1.Type.Number(),
                ]);
                break;
            case property_type_1.PropertyType.STATIC_DROPDOWN:
            case property_type_1.PropertyType.DROPDOWN:
                propsSchema[name] = nonNullableUnknownPropType;
                break;
            case property_type_1.PropertyType.BASIC_AUTH:
            case property_type_1.PropertyType.CUSTOM_AUTH:
            case property_type_1.PropertyType.SECRET_TEXT:
            case property_type_1.PropertyType.OAUTH2:
                break;
            case property_type_1.PropertyType.ARRAY: {
                const arrayItemSchema = (0, shared_1.isNil)(property.properties)
                    ? typebox_1.Type.String({
                        minLength: property.required ? 1 : undefined,
                    })
                    : buildSchema(property.properties, undefined);
                propsSchema[name] = typebox_1.Type.Union([
                    typebox_1.Type.Array(arrayItemSchema, {
                        minItems: property.required ? 1 : undefined,
                    }),
                    //for inline items mode
                    typebox_1.Type.Record(typebox_1.Type.String(), typebox_1.Type.Unknown()),
                    //for normal dynamic input mode
                    typebox_1.Type.String({
                        minLength: property.required ? 1 : undefined,
                    }),
                ]);
                break;
            }
            case property_type_1.PropertyType.OBJECT:
                propsSchema[name] = typebox_1.Type.Union([
                    typebox_1.Type.Record(typebox_1.Type.String(), typebox_1.Type.Any()),
                    typebox_1.Type.String({
                        minLength: property.required ? 1 : undefined,
                    }),
                ]);
                break;
            case property_type_1.PropertyType.JSON:
                propsSchema[name] = typebox_1.Type.Union([
                    typebox_1.Type.Record(typebox_1.Type.String(), typebox_1.Type.Any()),
                    typebox_1.Type.Array(typebox_1.Type.Any()),
                    typebox_1.Type.String({
                        minLength: property.required ? 1 : undefined,
                    }),
                ]);
                break;
            case property_type_1.PropertyType.MULTI_SELECT_DROPDOWN:
            case property_type_1.PropertyType.STATIC_MULTI_SELECT_DROPDOWN:
                propsSchema[name] = typebox_1.Type.Union([
                    typebox_1.Type.Array(typebox_1.Type.Any(), {
                        minItems: property.required ? 1 : undefined,
                    }),
                    typebox_1.Type.String({
                        minLength: property.required ? 1 : undefined,
                    }),
                ]);
                break;
            case property_type_1.PropertyType.DYNAMIC:
                propsSchema[name] = typebox_1.Type.Record(typebox_1.Type.String(), typebox_1.Type.Any());
                break;
            case property_type_1.PropertyType.CUSTOM:
                propsSchema[name] = typebox_1.Type.Unknown();
                break;
        }
        //optional array is checked against its children
        if (!property.required && property.type !== property_type_1.PropertyType.ARRAY) {
            propsSchema[name] = typebox_1.Type.Optional(typebox_1.Type.Union((0, shared_1.isEmpty)(propsSchema[name])
                ? [typebox_1.Type.Any(), ...nullableType]
                : [propsSchema[name], ...nullableType]));
        }
    }
    if (auth && requireAuth) {
        propsSchema[shared_1.AUTHENTICATION_PROPERTY_NAME] = typebox_1.Type.String({
            minLength: 1
        });
    }
    return typebox_1.Type.Object(propsSchema);
}
exports.piecePropertiesUtils = {
    buildSchema
};
//# sourceMappingURL=util.js.map