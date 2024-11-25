import { Static, TObject, TSchema, Type } from "@sinclair/typebox";
import { ApFile } from "./file-property";
import { PropertyType } from "./property-type";


export const BasePropertySchema = Type.Object({
    displayName: Type.String(),
    description: Type.Optional(Type.String())
})

export type BasePropertySchema = Static<typeof BasePropertySchema>

export const TPropertyValue = <T extends TSchema, U extends PropertyType>(T: T, propertyType: U): TObject => Type.Object({
    type: Type.Literal(propertyType),
    required: Type.Boolean(),
    defaultValue: Type.Optional(Type.Any()),
})

export type TPropertyValue<
  T,
  U extends PropertyType,
  REQUIRED extends boolean
> = {
  valueSchema: T;
  type: U;
  required: REQUIRED;
  // TODO this should be T or undefined
  defaultValue?: U extends PropertyType.ARRAY
    ? unknown[]
    : U extends PropertyType.JSON
    ? object
    : U extends PropertyType.CHECKBOX
    ? boolean
    : U extends PropertyType.LONG_TEXT
    ? string
    : U extends PropertyType.SHORT_TEXT
    ? string
    : U extends PropertyType.NUMBER
    ? number
    : U extends PropertyType.DROPDOWN
    ? unknown
    : U extends PropertyType.MULTI_SELECT_DROPDOWN
    ? unknown[]
    : U extends PropertyType.STATIC_MULTI_SELECT_DROPDOWN
    ? unknown[]
    : U extends PropertyType.STATIC_DROPDOWN
    ? unknown
    : U extends PropertyType.DATE_TIME
    ? string
    : U extends PropertyType.FILE
    ? ApFile
    : unknown;
};