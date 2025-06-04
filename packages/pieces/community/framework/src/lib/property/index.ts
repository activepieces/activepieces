import { InputProperty } from './input';
import { PieceAuthProperty } from './authentication';
import { Type } from '@sinclair/typebox';
import { PropertyType } from './input/property-type';
import { DropdownState } from './input/dropdown/common';

// EXPORTED
export { ApFile } from './input/file-property';
export { DropdownProperty, MultiSelectDropdownProperty } from './input/dropdown/dropdown-prop';
export { DynamicProperties, DynamicProp } from './input/dynamic-prop';
export { PropertyType } from './input/property-type';
export { Property } from './input';
export { PieceAuth } from './authentication';
export { DynamicPropsValue } from './input/dynamic-prop';
export { DropdownOption,DropdownState } from './input/dropdown/common';
export { OAuth2PropertyValue } from './authentication/oauth2-prop';
export { PieceAuthProperty } from './authentication';
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
