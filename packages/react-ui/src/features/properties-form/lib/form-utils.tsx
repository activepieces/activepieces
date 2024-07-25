import {
  CONNECTION_REGEX,
  PiecePropertyMap,
  PropertyType,
} from '@activepieces/pieces-framework';
import { TSchema, Type } from '@sinclair/typebox';

export const formUtils = {
  buildSchema: (props: PiecePropertyMap) => {
    const entries = Object.entries(props);
    const nonNullableUnknownPropType = Type.Not(
      Type.Union([Type.Null(), Type.Undefined()]),
      Type.Unknown(),
    );
    const propsSchema: Record<string, TSchema> = {};
    for (const [name, property] of entries) {
      switch (property.type) {
        case PropertyType.MARKDOWN:
          propsSchema[name] = Type.Optional(
            Type.Union([
              Type.Null(),
              Type.Undefined(),
              Type.Never(),
              Type.Unknown(),
            ]),
          );
          break;
        case PropertyType.DATE_TIME:
        case PropertyType.SHORT_TEXT:
        case PropertyType.LONG_TEXT:
        case PropertyType.FILE:
          propsSchema[name] = Type.String({
            minLength: property.required ? 1 : undefined,
          });
          break;
        case PropertyType.CHECKBOX:
          propsSchema[name] = Type.Union([Type.Boolean(), Type.String({})]);
          break;
        case PropertyType.NUMBER:
          // Because it could be a variable
          propsSchema[name] = Type.String({});
          break;
        case PropertyType.STATIC_DROPDOWN:
          propsSchema[name] = nonNullableUnknownPropType;
          break;
        case PropertyType.DROPDOWN:
          propsSchema[name] = nonNullableUnknownPropType;
          break;
        case PropertyType.BASIC_AUTH:
        case PropertyType.CUSTOM_AUTH:
        case PropertyType.SECRET_TEXT:
        case PropertyType.OAUTH2:
          // Only accepts connections variable.
          propsSchema[name] = Type.Union([
            Type.RegExp(CONNECTION_REGEX),
            Type.String(),
          ]);
          break;
        case PropertyType.ARRAY:
          // Only accepts connections variable.
          propsSchema[name] = Type.Union([
            Type.Array(Type.Unknown({})),
            Type.String(),
          ]);
          break;
        case PropertyType.OBJECT:
          propsSchema[name] = Type.Union([
            Type.Record(Type.String(), Type.Any()),
            Type.String(),
          ]);
          break;
        case PropertyType.JSON:
          propsSchema[name] = Type.Union([
            Type.Record(Type.String(), Type.Any()),
            Type.Array(Type.Any()),
            Type.String(),
          ]);
          break;
        case PropertyType.MULTI_SELECT_DROPDOWN:
          propsSchema[name] = Type.Union([
            Type.Array(Type.Any()),
            Type.String(),
          ]);
          break;
        case PropertyType.STATIC_MULTI_SELECT_DROPDOWN:
          propsSchema[name] = Type.Union([
            Type.Array(Type.Any()),
            Type.String(),
          ]);
          break;
        case PropertyType.DYNAMIC:
          propsSchema[name] = Type.Record(Type.String(), Type.Any());
          break;
      }

      if (!property.required) {
        propsSchema[name] = Type.Optional(
          Type.Union([Type.Null(), Type.Undefined(), propsSchema[name]]),
        );
      }
    }

    return Type.Object(propsSchema);
  },
};
