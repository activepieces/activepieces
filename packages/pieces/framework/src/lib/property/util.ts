import { PiecePropertyMap } from ".";
import { PieceAuthProperty } from "./authentication";
import { PropertyType } from "./input/property-type";
import { z } from "zod";
import { AUTHENTICATION_PROPERTY_NAME, isEmpty, isNil } from "@activepieces/shared";

function buildSchema(props: PiecePropertyMap, auth: PieceAuthProperty | PieceAuthProperty[] | undefined, requireAuth: boolean | undefined = true) {
    const entries = Object.entries(props);
    const propsSchema: Record<string, z.ZodType> = {};
    for (const [name, property] of entries) {
      switch (property.type) {
        case PropertyType.MARKDOWN:
          propsSchema[name] = z.union([z.null(), z.undefined(), z.never(), z.unknown()]).optional();
          break;
        case PropertyType.DATE_TIME:
        case PropertyType.SHORT_TEXT:
        case PropertyType.LONG_TEXT:
        case PropertyType.COLOR:
        case PropertyType.FILE:
          propsSchema[name] = property.required
            ? z.string().min(1)
            : z.string();
          break;
        case PropertyType.CHECKBOX:
          propsSchema[name] = z.union([
            z.boolean(),
            z.string(),
          ]);
          break;
        case PropertyType.NUMBER:
          propsSchema[name] = z.union([
            property.required ? z.string().min(1) : z.string(),
            z.number(),
          ]);
          break;
        case PropertyType.STATIC_DROPDOWN:
        case PropertyType.DROPDOWN:
          propsSchema[name] = z.unknown().refine(
            (val) => val !== null && val !== undefined,
            { message: 'Value must not be null or undefined' },
          );
          break;
        case PropertyType.SECRET_TEXT:
          propsSchema[name] = property.required
            ? z.string().min(1)
            : z.string();
          break;
        case PropertyType.BASIC_AUTH:
        case PropertyType.CUSTOM_AUTH:
        case PropertyType.OAUTH2:
          break;
        case PropertyType.ARRAY: {
          const arrayItemSchema = isNil(property.properties)
            ? (property.required ? z.string().min(1) : z.string())
            : buildSchema(property.properties, undefined);
          propsSchema[name] = z.union([
            property.required
              ? z.array(arrayItemSchema).min(1)
              : z.array(arrayItemSchema),
            //for inline items mode
            z.record(z.string(), z.unknown()),
            //for normal dynamic input mode
            property.required ? z.string().min(1) : z.string(),
          ]);
          break;
        }
        case PropertyType.OBJECT:
          propsSchema[name] = z.union([
            z.record(z.string(), z.any()),
            property.required ? z.string().min(1) : z.string(),
          ]);
          break;
        case PropertyType.JSON:
          propsSchema[name] = z.union([
            z.record(z.string(), z.any()),
            z.array(z.any()),
            property.required ? z.string().min(1) : z.string(),
          ]);
          break;
        case PropertyType.MULTI_SELECT_DROPDOWN:
        case PropertyType.STATIC_MULTI_SELECT_DROPDOWN:
          propsSchema[name] = z.union([
            property.required
              ? z.array(z.any()).min(1)
              : z.array(z.any()),
            property.required ? z.string().min(1) : z.string(),
          ]);
          break;
        case PropertyType.DYNAMIC:
          propsSchema[name] = z.record(z.string(), z.any());
          break;
        case PropertyType.CUSTOM:
          propsSchema[name] = z.unknown();
          break;
      }

      //optional array is checked against its children
      if (!property.required && property.type !== PropertyType.ARRAY) {
        propsSchema[name] = z.union(
          isEmpty(propsSchema[name])
            ? [z.any(), z.null(), z.undefined()] as [z.ZodType, z.ZodType, z.ZodType]
            : [propsSchema[name], z.null(), z.undefined()] as [z.ZodType, z.ZodType, z.ZodType],
        ).optional();
      }
    }
    if(auth && requireAuth)
      {
       propsSchema[AUTHENTICATION_PROPERTY_NAME] = z.string().min(1)
      }
    return z.object(propsSchema);
  }

  export const piecePropertiesUtils = {
    buildSchema
  }
