import { CreateType, Kind, SchemaOptions, Static, TEnum, TLiteral, TObject, TSchema, TUnion, Type } from '@sinclair/typebox'

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