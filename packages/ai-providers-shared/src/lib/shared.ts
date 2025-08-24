// this will be deleted with version 0.1.0

import { CreateType, Kind, SchemaOptions, Static, TLiteral, TObject, TSchema, TUnion, Type } from '@sinclair/typebox'



export type Cursor = string | null

export const Nullable = <T extends TSchema>(schema: T) => Type.Optional(Type.Unsafe<Static<T> | null>({
    ...schema, nullable: true,
}))

export type SeekPage<T> = {
    next: Cursor
    previous: Cursor
    data: T[]
}


export const SeekPage = (t: TSchema): TSchema => Type.Object({
    data: Type.Array(t),
    next: Nullable(Type.String({ description: 'Cursor to the next page' })),
    previous: Nullable(Type.String({ description: 'Cursor to the previous page' })),
})  

function isNil<T>(value: T | null | undefined): value is null | undefined {
    return value === null || value === undefined
}

export const spreadIfDefined = <T>(key: string, value: T | undefined | null): Record<string, T> => {
    if (isNil(value)) {
        return {}
    }
    return {
        [key]: value,
    }
}


// ------------------------------------------------------------------
// TDiscriminatedUnionObject
//
// Constructs a base TObject type requiring 1 discriminator property
// ------------------------------------------------------------------
// prettier-ignore
type TDiscriminatedUnionProperties<Discriminator extends string> = {
    [_ in Discriminator]: TLiteral
}
// prettier-ignore
type TDiscriminatedUnionObject<Discriminator extends string> = TObject<TDiscriminatedUnionProperties<Discriminator>>

// ------------------------------------------------------------------
// DiscriminatedUnion
// ------------------------------------------------------------------
export type TDiscriminatedUnion<Types extends TObject[] = TObject[]> = {
    [Kind]: 'DiscriminatedUnion'
    static: Static<TUnion<Types>>
    anyOf: Types
    discriminator: {
        propertyName: string
        mapping?: Record<string, string>
    }
} & TSchema

/** Creates a DiscriminatedUnion that works with OpenAPI. */
export function DiscriminatedUnion<Discriminator extends string, Types extends TDiscriminatedUnionObject<Discriminator>[]>(
    discriminator: Discriminator,
    types: [...Types],
    options?: SchemaOptions,
): TDiscriminatedUnion<Types> {
    return CreateType({
        [Kind]: 'DiscriminatedUnion',
        anyOf: types,
        discriminator: {
            propertyName: discriminator,
        },
    }, options) as never
}


export const BaseModelSchema = {
    id: Type.String(),
    created: Type.String(),
    updated: Type.String(), 
}