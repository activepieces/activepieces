import { Static, TObject, TSchema, Type } from "@sinclair/typebox";
import { PropertyType } from "./property-type";
import { ProcessorFn } from "../../processors/types";
import { TypedValidatorFn, ValidationInputType } from "../../validators/types";


export const BasePropertySchema = Type.Object({
    displayName: Type.String(),
    description: Type.Optional(Type.String())
})

export type BasePropertySchema = Static<typeof BasePropertySchema>

export const TPropertyValue = <T extends TSchema, U extends PropertyType>(T: T, propertyType: U): TObject => Type.Object({
    type: Type.Literal(propertyType),
    required: Type.Boolean(),
    valueSchema: T,
    defaultValue: Type.Optional(Type.Any()),
})

export type TPropertyValue<
    T,
    U extends PropertyType,
    VALIDATION_INPUT extends ValidationInputType,
    REQUIRED extends boolean
> = {
    valueSchema: T;
    type: U;
    required: REQUIRED;
    defaultProcessors?: ProcessorFn[];
    processors?: ProcessorFn[];
    validators?: TypedValidatorFn<VALIDATION_INPUT>[];
    defaultValidators?: TypedValidatorFn<VALIDATION_INPUT>[];
    defaultValue?: T
};
