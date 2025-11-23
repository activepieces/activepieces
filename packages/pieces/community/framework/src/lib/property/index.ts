import { InputProperty } from './input';
import { PieceAuthProperty } from './authentication';
import { TSchema, Type } from '@sinclair/typebox';
import { PropertyType } from './input/property-type';
import { DropdownState } from './input/dropdown/common';
import { AUTHENTICATION_PROPERTY_NAME, isEmpty, isNil } from '@activepieces/shared';

// EXPORTED
export { ApFile } from './input/file-property';
export { DropdownProperty, MultiSelectDropdownProperty } from './input/dropdown/dropdown-prop';
export { DynamicProperties, DynamicProp } from './input/dynamic-prop';
export { PropertyType } from './input/property-type';
export { Property } from './input';
export { PieceAuth,getAuthPropertyForValue } from './authentication';
export { DynamicPropsValue } from './input/dynamic-prop';
export { DropdownOption,DropdownState } from './input/dropdown/common';
export { OAuth2PropertyValue } from './authentication/oauth2-prop';
export { PieceAuthProperty, DEFAULT_CONNECTION_DISPLAY_NAME} from './authentication';
export { ShortTextProperty } from './input/text-property';
export { ArrayProperty, ArraySubProps } from './input/array-property';
export { BasePropertySchema } from './input/common';
export { CheckboxProperty } from './input/checkbox-property';
export { DateTimeProperty } from './input/date-time-property';
export { LongTextProperty } from './input/text-property';
export { NumberProperty } from './input/number-property';
export { ObjectProperty } from './input/object-property';
export { OAuth2Props } from './authentication/oauth2-prop';
export { OAuth2AuthorizationMethod } from './authentication/oauth2-prop';
export { BasicAuthPropertyValue } from './authentication/basic-auth-prop';
export { StaticMultiSelectDropdownProperty } from './input/dropdown/static-dropdown';
export { StaticDropdownProperty } from './input/dropdown/static-dropdown';
export * from './authentication/custom-auth-prop';
export { OAuth2Property } from './authentication/oauth2-prop';
export { FileProperty } from './input/file-property';
export { BasicAuthProperty } from './authentication/basic-auth-prop';
export { SecretTextProperty } from './authentication/secret-text-property'
export { CustomAuthProperty } from './authentication/custom-auth-prop';

export { JsonProperty } from './input/json-property'
export const PieceProperty = Type.Union([InputProperty, PieceAuthProperty])
export type PieceProperty = InputProperty | PieceAuthProperty;
export {CustomProperty} from './input/custom-property'
export type {CustomPropertyCodeFunctionParams} from './input/custom-property'
export const PiecePropertyMap = Type.Record(Type.String(), PieceProperty)
export interface PiecePropertyMap {
  [name: string]: PieceProperty;
}
export type { InputProperty } from './input';
export const InputPropertyMap = Type.Record(Type.String(), InputProperty)
export interface InputPropertyMap {
  [name: string]: InputProperty;
}

export type PiecePropValueSchema<T extends PieceProperty> =
  T extends undefined
  ? undefined
  : T extends { required: true }
  ? T['valueSchema']
  : T['valueSchema'] | undefined;

export type StaticPropsValue<T extends PiecePropertyMap> = {
  [P in keyof T]: PiecePropValueSchema<T[P]>;
};


  
export type ExecutePropsResult<T extends PropertyType.DROPDOWN | PropertyType.MULTI_SELECT_DROPDOWN | PropertyType.DYNAMIC> = {
  type: T
  options: T extends PropertyType.DROPDOWN ? DropdownState<unknown> : T extends PropertyType.MULTI_SELECT_DROPDOWN ? DropdownState<unknown> : InputPropertyMap
}

export function buildSchemaForPieceProps(props: PiecePropertyMap, auth: PieceAuthProperty | PieceAuthProperty[] | undefined): TSchema {
  const entries = Object.entries(props);
  const nullableType: TSchema[] = [Type.Null(), Type.Undefined()];
  const nonNullableUnknownPropType = Type.Not(
    Type.Union(nullableType),
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
      case PropertyType.COLOR:
      case PropertyType.FILE:
        propsSchema[name] = Type.String({
          minLength: property.required ? 1 : undefined,
        });
        break;
      case PropertyType.CHECKBOX:
        propsSchema[name] = Type.Union([
          Type.Boolean({ defaultValue: false }),
          Type.String({
            minLength: property.required ? 1 : undefined,
          }),
        ]);
        break;
      case PropertyType.NUMBER:
        // Because it could be a variable
        propsSchema[name] = Type.Union([
          Type.String({
            minLength: property.required ? 1 : undefined,
          }),
          Type.Number(),
        ]);
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
        break;
      case PropertyType.ARRAY: {
        const arrayItemSchema = isNil(property.properties)
          ? Type.String({
              minLength: property.required ? 1 : undefined,
            })
          : buildSchemaForPieceProps(property.properties,undefined);
        propsSchema[name] = Type.Union([
          Type.Array(arrayItemSchema, {
            minItems: property.required ? 1 : undefined,
          }),
          Type.Record(Type.String(), Type.Unknown()),
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
  if(auth)
    {
     const authProperty = Array.isArray(auth) ? auth.at(0) : auth;
     propsSchema[AUTHENTICATION_PROPERTY_NAME] = Type.String({
       minLength: authProperty?.required? 1: 0
     })
    }
  return Type.Object(propsSchema);
} 