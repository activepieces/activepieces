import * as z from 'zod/mini'

export type BaseModel<T> = {
    id: T
    created: string
    updated: string
}

export const DateOrString = z.pipe(
    z.transform((val) => (val instanceof Date ? val.toISOString() : val)),
    z.string(),
)

export const BaseModelSchema = {
    id: z.string(),
    created: DateOrString,
    updated: DateOrString,
}

// Used to generate valid nullable in OpenAPI Schema
export const Nullable = <T extends z.ZodMiniType>(schema: T) => z.optional(z.nullable(schema))

export function NullableEnum<T extends Record<string, string | number>>(enumObj: T) {
    return z.optional(z.nullable(z.enum(enumObj)))
}

export const OptionalBooleanFromQuery = z.pipe(
    z.transform((val) => val === 'true' || val === true ? true : val === 'false' || val === false ? false : undefined),
    z.optional(z.boolean()),
)

export const OptionalArrayFromQuery = <T extends z.ZodMiniType>(schema: T) =>
    z.pipe(
        z.transform((val) => (Array.isArray(val) ? val : val !== undefined ? [val] : undefined)),
        z.optional(z.array(schema)),
    )
