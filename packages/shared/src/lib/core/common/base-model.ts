import { z } from 'zod'

export type BaseModel<T> = {
    id: T
    created: string
    updated: string
}

export const DateOrString = z.preprocess(
    (val) => (val instanceof Date ? val.toISOString() : val),
    z.string(),
)

export const BaseModelSchema = {
    id: z.string(),
    created: DateOrString,
    updated: DateOrString,
}

// Used to generate valid nullable in OpenAPI Schema
export const Nullable = <T extends z.ZodType>(schema: T) => schema.nullable().optional()

export function NullableEnum<T extends Record<string, string | number>>(enumObj: T) {
    return z.nativeEnum(enumObj).nullable().optional()
}

export const OptionalBooleanFromQuery = z.preprocess(
    (val) => val === 'true' || val === true ? true : val === 'false' || val === false ? false : undefined,
    z.boolean().optional(),
)

export const OptionalArrayFromQuery = <T extends z.ZodType>(schema: T) =>
    z.preprocess(
        (val) => (Array.isArray(val) ? val : val !== undefined ? [val] : undefined),
        z.array(schema).optional(),
    )
