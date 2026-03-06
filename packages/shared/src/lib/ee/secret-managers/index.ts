import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema, DiscriminatedUnion } from '../../core/common'
import { AWSProviderConfigSchema, CyberarkConjurProviderConfigSchema, HashicorpProviderConfigSchema, OnePasswordProviderConfigSchema, SecretManagerConnectionScope, SecretManagerProviderId } from './dto'

export * from './dto'

export const SecretManagerConfigSchema = Type.Union([
    HashicorpProviderConfigSchema,
    AWSProviderConfigSchema,
    CyberarkConjurProviderConfigSchema,
    OnePasswordProviderConfigSchema,
])
export type SecretManagerConfig = Static<typeof SecretManagerConfigSchema>

const SecretManagerConnectionBase = {
    ...BaseModelSchema,
    platformId: Type.String(),
    providerId: Type.Enum(SecretManagerProviderId),
    name: Type.String(),
    auth: SecretManagerConfigSchema,
}

export const SecretManagerConnectionPlatformScopeSchema = Type.Object({
    ...SecretManagerConnectionBase,
    scope: Type.Literal(SecretManagerConnectionScope.PLATFORM),
})

export const SecretManagerConnectionProjectScopeSchema = Type.Object({
    ...SecretManagerConnectionBase,
    scope: Type.Literal(SecretManagerConnectionScope.PROJECT),
    projectIds: Type.Array(Type.String()),
})

export const SecretManagerConnectionSchema = DiscriminatedUnion('scope', [
    Type.Omit(SecretManagerConnectionPlatformScopeSchema, ['auth']),
    Type.Omit(SecretManagerConnectionProjectScopeSchema, ['auth']),
])
export type SecretManagerConnection = Static<typeof SecretManagerConnectionSchema>

export const SecretManagerConnectionWithStatusSchema = Type.Intersect([
    SecretManagerConnectionSchema,
    Type.Object({
        connection: Type.Object({
            configured: Type.Boolean(),
            connected: Type.Boolean(),
        }),
    }),
])
export type SecretManagerConnectionWithStatus = Static<typeof SecretManagerConnectionWithStatusSchema>

export const SecretManagerFieldSchema = Type.Object({
    displayName: Type.String(),
    placeholder: Type.String(),
    optional: Type.Optional(Type.Boolean()),
    type: Type.Union([Type.Literal('text'), Type.Literal('password')]),
})

export const SecretManagerSecretParamSchema = Type.Object({
    name: Type.String(),
    displayName: Type.String(),
    placeholder: Type.String(),
    optional: Type.Optional(Type.Boolean()),
    type: Type.Union([Type.Literal('text'), Type.Literal('password')]),
})

export const SecretManagerProviderMetaDataBaseSchema = Type.Object({
    id: Type.Enum(SecretManagerProviderId),
    name: Type.String(),
    logo: Type.String(),
})

export const SecretManagerProviderMetaDataSchema = DiscriminatedUnion('id', [
    Type.Object({
        ...SecretManagerProviderMetaDataBaseSchema.properties,
        id: Type.Literal(SecretManagerProviderId.HASHICORP),
        fields: Type.Record(Type.KeyOf(HashicorpProviderConfigSchema), SecretManagerFieldSchema),
        secretParams: Type.Array(SecretManagerSecretParamSchema),
    }),
    Type.Object({
        ...SecretManagerProviderMetaDataBaseSchema.properties,
        id: Type.Literal(SecretManagerProviderId.AWS),
        fields: Type.Record(Type.KeyOf(AWSProviderConfigSchema), SecretManagerFieldSchema),
        secretParams: Type.Array(SecretManagerSecretParamSchema),
    }),
    Type.Object({
        ...SecretManagerProviderMetaDataBaseSchema.properties,
        id: Type.Literal(SecretManagerProviderId.CYBERARK),
        fields: Type.Record(Type.KeyOf(CyberarkConjurProviderConfigSchema), SecretManagerFieldSchema),
        secretParams: Type.Array(SecretManagerSecretParamSchema),
    }),
    Type.Object({
        ...SecretManagerProviderMetaDataBaseSchema.properties,
        id: Type.Literal(SecretManagerProviderId.ONEPASSWORD),
        fields: Type.Record(Type.KeyOf(OnePasswordProviderConfigSchema), SecretManagerFieldSchema),
        secretParams: Type.Array(SecretManagerSecretParamSchema),
    }),
])

export type SecretManagerProviderMetaData = Static<typeof SecretManagerProviderMetaDataSchema>

export const SecretManagerFieldsSeparator = '|ap_sep_v1|'
