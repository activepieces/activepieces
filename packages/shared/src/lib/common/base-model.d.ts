import { Kind, SchemaOptions, Static, TEnum, TLiteral, TObject, TSchema, TUnion } from '@sinclair/typebox';
export type BaseModel<T> = {
    id: T;
    created: string;
    updated: string;
};
export declare const BaseModelSchema: {
    id: import("@sinclair/typebox").TString;
    created: import("@sinclair/typebox").TString;
    updated: import("@sinclair/typebox").TString;
};
export declare const Nullable: <T extends TSchema>(schema: T) => import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<Static<T>>>;
export declare function NullableEnum<T extends TEnum<any>>(schema: T): import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<Static<T>>>;
type TDiscriminatedUnionProperties<Discriminator extends string> = {
    [_ in Discriminator]: TLiteral;
};
type TDiscriminatedUnionObject<Discriminator extends string> = TObject<TDiscriminatedUnionProperties<Discriminator>>;
export type TDiscriminatedUnion<Types extends TObject[] = TObject[]> = {
    [Kind]: 'DiscriminatedUnion';
    static: Static<TUnion<Types>>;
    anyOf: Types;
    discriminator: {
        propertyName: string;
        mapping?: Record<string, string>;
    };
} & TSchema;
/** Creates a DiscriminatedUnion that works with OpenAPI. */
export declare function DiscriminatedUnion<Discriminator extends string, Types extends TDiscriminatedUnionObject<Discriminator>[]>(discriminator: Discriminator, types: [...Types], options?: SchemaOptions): TDiscriminatedUnion<Types>;
export {};
