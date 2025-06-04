import { Type } from "@sinclair/typebox";
import { BasePropertySchema, TPropertyValue } from "./common";
import { PropertyType } from "./property-type";


// Code should be a valid javascript function that takes a single argument which is an object 
/*
(ctx: {containerId:string, value: unknown, onChange: (value: unknown) => void, isEmbeded: boolean, projectId:string}) => void
*/
export const CustomProperty = Type.Composite([
  BasePropertySchema,
  TPropertyValue(Type.Unknown(), PropertyType.CUSTOM),
  Type.Object({
    code: Type.String(),
  })
])

export type CustomProperty<R extends boolean> = BasePropertySchema &
  TPropertyValue<unknown, PropertyType.CUSTOM, R> & {
    code:string;
  }

export type CustomPropertyCodeFunctionParams = 
  { 
    containerId:string,
    value: unknown,
    onChange: (value: unknown) => void,
    isEmbeded: boolean,
    projectId:string,
    property: Pick<CustomProperty<boolean>, 'displayName' | 'description' | 'required'>,
    disabled: boolean
  }
