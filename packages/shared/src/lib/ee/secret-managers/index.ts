import { BaseModelSchema, DiscriminatedUnion } from '../../core/common/base-model'
import { Static, Type } from '@sinclair/typebox'
import { AWSGetSecretRequestSchema, AWSProviderConfigSchema, CyberarkConjurGetSecretRequestSchema, CyberarkConjurProviderConfigSchema, HashicorpGetSecretRequestSchema, HashicorpProviderConfigSchema, SecretManagerProviderId } from './dto'

export * from './dto'

export const SecretManagerConfigSchema = Type.Union([
    HashicorpProviderConfigSchema,
    AWSProviderConfigSchema,
    CyberarkConjurProviderConfigSchema,
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
    type: Type.Union([Type.Literal('text'), Type.Literal('password')]),
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
        secretParams: Type.Record(Type.KeyOf(HashicorpGetSecretRequestSchema), SecretManagerFieldSchema),
    }),
    Type.Object({
        ...SecretManagerProviderMetaDataBaseSchema.properties,
        id: Type.Literal(SecretManagerProviderId.AWS),
        fields: Type.Record(Type.KeyOf(AWSProviderConfigSchema), SecretManagerFieldSchema),
        secretParams: Type.Record(Type.KeyOf(AWSGetSecretRequestSchema), SecretManagerFieldSchema),
    }),
    Type.Object({
        ...SecretManagerProviderMetaDataBaseSchema.properties,
        id: Type.Literal(SecretManagerProviderId.CYBERARK),
        fields: Type.Record(Type.KeyOf(CyberarkConjurProviderConfigSchema), SecretManagerFieldSchema),
        secretParams: Type.Record(Type.KeyOf(CyberarkConjurGetSecretRequestSchema), SecretManagerFieldSchema),
    }),
])

export type SecretManagerProviderMetaData = Static<typeof SecretManagerProviderMetaDataSchema>
