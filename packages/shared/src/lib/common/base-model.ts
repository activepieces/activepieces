import { Static, TSchema, Type } from '@sinclair/typebox'

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