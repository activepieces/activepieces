import { Static, Type } from '@sinclair/typebox'
import { DiscriminatedUnion } from '../common'
import { BaseModelSchema } from '../common/base-model'
import { AWSGetSecretRequestSchema, AWSProviderConfigSchema, HashicorpGetSecretRequestSchema, HashicorpProviderConfigSchema, SecretManagerProviderId } from './dto'

export * from './dto'

export const SecretManagerConfigSchema = Type.Union([
    HashicorpProviderConfigSchema,
    AWSProviderConfigSchema,
])
export type SecretManagerConfig = Static<typeof SecretManagerConfigSchema>


export const SecretManagerEntitySchema = Type.Object({
    ...BaseModelSchema,
    platformId: Type.String(),
    providerId: Type.String(),
    auth: SecretManagerConfigSchema,
})

export type SecretManager = Static<typeof SecretManagerEntitySchema>

export const SecretManagerFieldSchema =  Type.Object({
    displayName: Type.String(),
    placeholder: Type.String(),
    optional: Type.Optional(Type.Boolean()),
})


export const SecretManagerProviderMetaDataBaseSchema = Type.Object({
    id: Type.Enum(SecretManagerProviderId),
    name: Type.String(),
    logo: Type.String(),
    connected: Type.Optional(Type.Boolean()),
})

export const SecretManagerProviderMetaDataSchema = DiscriminatedUnion('id', [
    Type.Object({
        ...SecretManagerProviderMetaDataBaseSchema.properties,
        id: Type.Literal(SecretManagerProviderId.HASHICORP),
        fields: Type.Record(Type.KeyOf(HashicorpProviderConfigSchema), SecretManagerFieldSchema),
        getSecretParams: Type.Record(Type.KeyOf(HashicorpGetSecretRequestSchema), SecretManagerFieldSchema),
    }),
    Type.Object({
        ...SecretManagerProviderMetaDataBaseSchema.properties,
        id: Type.Literal(SecretManagerProviderId.AWS),
        fields: Type.Record(Type.KeyOf(AWSProviderConfigSchema), SecretManagerFieldSchema),
        getSecretParams: Type.Record(Type.KeyOf(AWSGetSecretRequestSchema), SecretManagerFieldSchema),
    }),
])

export type SecretManagerProviderMetaData = Static<typeof SecretManagerProviderMetaDataSchema>
