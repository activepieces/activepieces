import { Static, TEnum, TSchema, Type } from '@sinclair/typebox'

export type BaseModel<T> = {
    id: T
    created: string
    updated: string
}

export const BaseModelSchema = {
    id: Type.String(),
    created: Type.String(),
    updated: Type.String(),
}

// Used to generate valid nullable in OpenAPI Schema
export const Nullable = <T extends TSchema>(schema: T) => Type.Optional(Type.Unsafe<Static<T> | null>({
    ...schema, nullable: true,
}))

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function NullableEnum<T extends TEnum<any>>(schema: T) {
    const values = schema.anyOf.map(f => f.const)
    return Type.Optional(Type.Unsafe<Static<T> | null>({ type: 'string', enum: values, nullable: true }))
}