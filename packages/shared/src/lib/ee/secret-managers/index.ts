import { z } from 'zod'
import { BaseModelSchema, Nullable } from '../../core/common'
import { AWSProviderConfigSchema, CyberarkConjurProviderConfigSchema, HashicorpProviderConfigSchema, OnePasswordProviderConfigSchema, SecretManagerProviderId } from './dto'

export * from './dto'

export const SecretManagerConfigSchema = z.union([
    HashicorpProviderConfigSchema,
    AWSProviderConfigSchema,
    CyberarkConjurProviderConfigSchema,
    OnePasswordProviderConfigSchema,
])
export type SecretManagerConfig = z.infer<typeof SecretManagerConfigSchema>


export const SecretManagerEntitySchema = z.object({
    ...BaseModelSchema,
    platformId: z.string(),
    providerId: z.string(),
    auth: Nullable(SecretManagerConfigSchema),
})

export type SecretManager = z.infer<typeof SecretManagerEntitySchema>

export const SecretManagerFieldSchema = z.object({
    displayName: z.string(),
    placeholder: z.string(),
    optional: z.boolean().optional(),
    type: z.union([z.literal('text'), z.literal('password')]),
})

export const SecretManagerSecretParamSchema = z.object({
    name: z.string(),
    displayName: z.string(),
    placeholder: z.string(),
    optional: z.boolean().optional(),
    type: z.union([z.literal('text'), z.literal('password')]),
})

export const SecretManagerProviderMetaDataBaseSchema = z.object({
    id: z.nativeEnum(SecretManagerProviderId),
    name: z.string(),
    logo: z.string(),
    connection: z.object({
        configured: z.boolean(),
        connected: z.boolean(),
    }).optional(),
})

export const SecretManagerProviderMetaDataSchema = z.discriminatedUnion('id', [
    z.object({
        ...SecretManagerProviderMetaDataBaseSchema.shape,
        id: z.literal(SecretManagerProviderId.HASHICORP),
        fields: z.record(z.enum(Object.keys(HashicorpProviderConfigSchema.shape) as [string, ...string[]]), SecretManagerFieldSchema),
        secretParams: z.array(SecretManagerSecretParamSchema),
    }),
    z.object({
        ...SecretManagerProviderMetaDataBaseSchema.shape,
        id: z.literal(SecretManagerProviderId.AWS),
        fields: z.record(z.enum(Object.keys(AWSProviderConfigSchema.shape) as [string, ...string[]]), SecretManagerFieldSchema),
        secretParams: z.array(SecretManagerSecretParamSchema),
    }),
    z.object({
        ...SecretManagerProviderMetaDataBaseSchema.shape,
        id: z.literal(SecretManagerProviderId.CYBERARK),
        fields: z.record(z.enum(Object.keys(CyberarkConjurProviderConfigSchema.shape) as [string, ...string[]]), SecretManagerFieldSchema),
        secretParams: z.array(SecretManagerSecretParamSchema),
    }),
    z.object({
        ...SecretManagerProviderMetaDataBaseSchema.shape,
        id: z.literal(SecretManagerProviderId.ONEPASSWORD),
        fields: z.record(z.enum(Object.keys(OnePasswordProviderConfigSchema.shape) as [string, ...string[]]), SecretManagerFieldSchema),
        secretParams: z.array(SecretManagerSecretParamSchema),
    }),
])

export type SecretManagerProviderMetaData = z.infer<typeof SecretManagerProviderMetaDataSchema>

export const SecretManagerFieldsSeparator = '|ap_sep_v1|'
