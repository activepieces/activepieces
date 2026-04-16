import { z } from 'zod'
import { PieceAuthProperty } from './authentication'
import { InputProperty } from './input'
import { DropdownState } from './input/dropdown/common'
import { PropertyType } from './input/property-type'

export type { ExtractPieceAuthPropertyTypeForMethods } from './authentication'
export {
    DEFAULT_CONNECTION_DISPLAY_NAME,
    getAuthPropertyForValue,
    PieceAuth,
    PieceAuthProperty,
} from './authentication'
export { BasicAuthProperty, BasicAuthPropertyValue } from './authentication/basic-auth-prop'
export * from './authentication/custom-auth-prop'
export { CustomAuthProperty } from './authentication/custom-auth-prop'
export {
    OAuth2AuthorizationMethod,
    OAuth2Property,
    OAuth2PropertyValue,
    OAuth2Props,
} from './authentication/oauth2-prop'
export { SecretTextProperty } from './authentication/secret-text-property'
export { Property } from './input'
export { ArrayProperty, ArraySubProps } from './input/array-property'
export { CheckboxProperty } from './input/checkbox-property'
export { BasePropertySchema } from './input/common'
export { DateTimeProperty } from './input/date-time-property'
export { DropdownOption, DropdownState } from './input/dropdown/common'
export { DropdownProperty, MultiSelectDropdownProperty } from './input/dropdown/dropdown-prop'
export { StaticDropdownProperty, StaticMultiSelectDropdownProperty } from './input/dropdown/static-dropdown'
export { DynamicProp, DynamicProperties, DynamicPropsValue } from './input/dynamic-prop'
// EXPORTED
export { ApFile, FileProperty } from './input/file-property'
export { JsonProperty } from './input/json-property'
export { NumberProperty } from './input/number-property'
export { ObjectProperty } from './input/object-property'
export { PropertyType } from './input/property-type'
export { LongTextProperty, ShortTextProperty } from './input/text-property'
export const PieceProperty = z.union([InputProperty, PieceAuthProperty])
export type PieceProperty = InputProperty | PieceAuthProperty
export type { CustomPropertyCodeFunctionParams } from './input/custom-property'
export { CustomProperty } from './input/custom-property'
export const PiecePropertyMap = z.record(z.string(), PieceProperty)
export interface PiecePropertyMap {
    [name: string]: PieceProperty
}
export type { InputProperty } from './input'
export const InputPropertyMap = z.record(z.string(), InputProperty)
export interface InputPropertyMap {
    [name: string]: InputProperty
}
export { piecePropertiesUtils } from './util'

export type PiecePropValueSchema<T extends PieceProperty> = T extends undefined
    ? undefined
    : T extends { required: true }
      ? T['valueSchema']
      : T['valueSchema'] | undefined

export type StaticPropsValue<T extends PiecePropertyMap> = {
    [P in keyof T]: PiecePropValueSchema<T[P]>
}

export type ExecutePropsResult<
    T extends PropertyType.DROPDOWN | PropertyType.MULTI_SELECT_DROPDOWN | PropertyType.DYNAMIC,
> = {
    type: T
    options: T extends PropertyType.DROPDOWN
        ? DropdownState<unknown>
        : T extends PropertyType.MULTI_SELECT_DROPDOWN
          ? DropdownState<unknown>
          : InputPropertyMap
}
