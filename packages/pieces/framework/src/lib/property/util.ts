import { PiecePropertyMap } from ".";
import { PieceAuthProperty } from "./authentication";
import { PropertyType } from "./input/property-type";
import { Type, TSchema } from "@sinclair/typebox";
import { AUTHENTICATION_PROPERTY_NAME, isEmpty, isNil } from "@activepieces/shared";

function buildSchema(props: PiecePropertyMap, auth: PieceAuthProperty | PieceAuthProperty[] | undefined, requireAuth: boolean | undefined = true) {
    const entries = Object.entries(props);
    const nullableType = [Type.Null(), Type.Undefined()];
    const nonNullableUnknownPropType = Type.Not(
      Type.Union(nullableType),
      Type.Unknown(),
    );
    const propsSchema: Record<string, TSchema> = {};
    for (const [name, property] of entries) {
      switch (property.type) {
        case PropertyType.MARKDOWN:
          propsSchema[name] = Type.Optional(
            Type.Union([Type.Null(), Type.Undefined(), Type.Never(), Type.Unknown()]),
          );
          break;
        case PropertyType.DATE_TIME:
        case PropertyType.SHORT_TEXT:
        case PropertyType.LONG_TEXT:
        case PropertyType.COLOR:
        case PropertyType.FILE:
          propsSchema[name] = Type.String({
            minLength: property.required ? 1 : undefined,
          });
          break;
        case PropertyType.CHECKBOX:
          propsSchema[name] = Type.Union([
            Type.Boolean({ defaultValue: false }),
            Type.String({}),
          ]);
          break;
        case PropertyType.NUMBER:
          propsSchema[name] = Type.Union([
            Type.String({
              minLength: property.required ? 1 : undefined,
            }),
            Type.Number(),
          ]);
          break;
        case PropertyType.STATIC_DROPDOWN:
        case PropertyType.DROPDOWN:
          propsSchema[name] = nonNullableUnknownPropType;
          break;
        case PropertyType.BASIC_AUTH:
        case PropertyType.CUSTOM_AUTH:
        case PropertyType.SECRET_TEXT:
        case PropertyType.OAUTH2:
          break;
        case PropertyType.ARRAY: {
          const arrayItemSchema = isNil(property.properties)
            ? Type.String({
                minLength: property.required ? 1 : undefined,
              })
            : buildSchema(property.properties,undefined);
          propsSchema[name] = Type.Union([
            Type.Array(arrayItemSchema, {
              minItems: property.required ? 1 : undefined,
            }),
            //for inline items mode
            Type.Record(Type.String(), Type.Unknown()),
            //for normal dynamic input mode
            Type.String({
              minLength: property.required ? 1 : undefined,
            }),
          ]);
          break;
        }
        case PropertyType.OBJECT:
          propsSchema[name] = Type.Union([
            Type.Record(Type.String(), Type.Any()),
            Type.String({
              minLength: property.required ? 1 : undefined,
            }),
          ]);
          break;
        case PropertyType.JSON:
          propsSchema[name] = Type.Union([
            Type.Record(Type.String(), Type.Any()),
            Type.Array(Type.Any()),
            Type.String({
              minLength: property.required ? 1 : undefined,
            }),
          ]);
          break;
        case PropertyType.MULTI_SELECT_DROPDOWN:
        case PropertyType.STATIC_MULTI_SELECT_DROPDOWN:
          propsSchema[name] = Type.Union([
            Type.Array(Type.Any(), {
              minItems: property.required ? 1 : undefined,
            }),
            Type.String({
              minLength: property.required ? 1 : undefined,
            }),
          ]);
          break;
        case PropertyType.DYNAMIC:
          propsSchema[name] = Type.Record(Type.String(), Type.Any());
          break;
        case PropertyType.CUSTOM:
          propsSchema[name] = Type.Unknown();
          break;
      }
   
      //optional array is checked against its children
      if (!property.required && property.type !== PropertyType.ARRAY) {
        propsSchema[name] = Type.Optional(
          Type.Union(
            isEmpty(propsSchema[name])
              ? [Type.Any(), ...nullableType]
              : [propsSchema[name], ...nullableType],
          ),
        );
      }
    }
    if(auth && requireAuth)
      {
       propsSchema[AUTHENTICATION_PROPERTY_NAME] = Type.String({
         minLength: 1
       })
      }
    return Type.Object(propsSchema);
  } 

  export const piecePropertiesUtils = {
    buildSchema
  }