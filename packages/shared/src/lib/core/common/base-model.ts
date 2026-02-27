import { CreateType, Kind, SchemaOptions, Static, TEnum, TLiteral, TObject, TSchema, TUnion, Type, TypeRegistry } from '@sinclair/typebox'
import { Value } from '@sinclair/typebox/value'

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
    oneOf: Types
    discriminator: {
        propertyName: string
        mapping?: Record<string, string>
    }
} & TSchema

/** Creates a DiscriminatedUnion that works with AJV's discriminator and OpenAPI. */
export function DiscriminatedUnion<Discriminator extends string, Types extends TDiscriminatedUnionObject<Discriminator>[]>(
    discriminator: Discriminator,
    types: [...Types],
    options?: SchemaOptions,
): TDiscriminatedUnion<Types> {
    return CreateType({
        [Kind]: 'DiscriminatedUnion',
        oneOf: types,
        discriminator: {
            propertyName: discriminator,
        },
    }, options) as never
}

// Register the DiscriminatedUnion kind so TypeCompiler can compile schemas containing it.
if (!TypeRegistry.Has('DiscriminatedUnion')) {
    TypeRegistry.Set('DiscriminatedUnion', (schema: TDiscriminatedUnion, value: unknown): boolean => {
        if (typeof value !== 'object' || value === null) return false
        const record = value as Record<string, unknown>
        const discriminatorProp = schema.discriminator.propertyName
        const discriminatorValue = record[discriminatorProp]
        const matchingSchema = schema.oneOf.find((s: TObject) => {
            const prop = s.properties[discriminatorProp]
            return prop && 'const' in prop && prop['const'] === discriminatorValue
        })
        if (!matchingSchema) return false
        return Value.Check(matchingSchema, record)
    })
}