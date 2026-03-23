import { z } from 'zod'
import { BaseModelSchema, Nullable } from '../../core/common'
import { AWSProviderConfigSchema, CyberarkConjurProviderConfigSchema, HashicorpProviderConfigSchema, OnePasswordProviderConfigSchema, SecretManagerConnectionScope, SecretManagerProviderId } from './dto'

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

const SecretManagerConnectionBase = {
    ...BaseModelSchema,
    platformId: z.string(),
    providerId: z.enum(SecretManagerProviderId),
    name: z.string(),
}

export const SecretManagerConnectionPlatformScopeSchema = z.object({
    ...SecretManagerConnectionBase,
    scope: z.literal(SecretManagerConnectionScope.PLATFORM),
})

export const SecretManagerConnectionProjectScopeSchema = z.object({
    ...SecretManagerConnectionBase,
    scope: z.literal(SecretManagerConnectionScope.PROJECT),
    projectIds: z.array(z.string()),
})

export const SecretManagerConnectionSchema = z.discriminatedUnion('scope', [
    SecretManagerConnectionPlatformScopeSchema,
    SecretManagerConnectionProjectScopeSchema,
])
export type SecretManagerConnection = z.infer<typeof SecretManagerConnectionSchema>

export const SecretManagerConnectionWithStatusSchema = z.intersection(
    SecretManagerConnectionSchema,
    z.object({
        connection: z.object({
            configured: z.boolean(),
            connected: z.boolean(),
        }),
    }),
)
export type SecretManagerConnectionWithStatus = z.infer<typeof SecretManagerConnectionWithStatusSchema>

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

export const SECRET_MANAGER_PROVIDERS_METADATA: SecretManagerProviderMetaData[] = [
    {
        id: SecretManagerProviderId.HASHICORP,
        name: 'Hashicorp Vault',
        logo: 'https://cdn.activepieces.com/pieces/hashi-corp-vault.png',
        fields: {
            url: {
                displayName: 'URL',
                placeholder: 'http://localhost:8200',
                type: 'text',
            },
            namespace: {
                displayName: 'Namespace',
                placeholder: 'namespace',
                optional: true,
                type: 'text',
            },
            roleId: {
                displayName: 'Role ID',
                placeholder: 'role-id',
                type: 'password',
            },
            secretId: {
                displayName: 'Secret ID',
                placeholder: 'secret-id',
                type: 'password',
            },
        },
        secretParams: [
            {
                name: 'path',
                displayName: 'Secret Path',
                placeholder: 'eg: secret/data/keys/my-key',
                type: 'text',
            },
        ],
    },
    {
        id: SecretManagerProviderId.AWS,
        name: 'AWS Secrets Manager',
        logo: 'https://cdn.activepieces.com/pieces/amazon-secrets-manager.png',
        fields: {
            accessKeyId: {
                displayName: 'Access Key ID',
                placeholder: 'access-key',
                type: 'text',
            },
            secretAccessKey: {
                displayName: 'Secret Access Key',
                placeholder: 'secret-key',
                type: 'password',
            },
            region: {
                displayName: 'Region',
                placeholder: 'us-east-1',
                type: 'text',
            },
        },
        secretParams: [
            {
                name: 'path',
                displayName: 'Secret Path',
                placeholder: 'secret-name:secret-json-key',
                type: 'text',
            },
        ],
    },
    {
        id: SecretManagerProviderId.CYBERARK,
        name: 'Cyberark Conjur',
        logo: 'https://cdn.activepieces.com/pieces/cyberark.png',
        fields: {
            url: {
                displayName: 'URL',
                placeholder: 'https://conjur.example.com',
                type: 'text',
            },
            organizationAccountName: {
                displayName: 'Organization Account Name',
                placeholder: 'Your Conjur Organization Account Name',
                type: 'text',
            },
            loginId: {
                displayName: 'Login ID',
                placeholder: 'Your Conjur Login ID',
                type: 'text',
            },
            apiKey: {
                displayName: 'API Key',
                placeholder: 'Your Conjur API Key',
                type: 'password',
            },
        },
        secretParams: [
            {
                name: 'secretKey',
                displayName: 'Secret key',
                placeholder: 'Your Conjur Secret Key',
                type: 'text',
            },
        ],
    },
    {
        id: SecretManagerProviderId.ONEPASSWORD,
        name: '1Password',
        logo: 'https://cdn.activepieces.com/pieces/1password.png',
        fields: {
            serviceAccountToken: {
                displayName: 'Service Account Token',
                placeholder: 'ops_...',
                type: 'text',
            },
        },
        secretParams: [
            {
                name: 'path',
                displayName: 'Secret Reference',
                placeholder: 'op://vault/item/field',
                type: 'text',
            },
        ],
    },
]

export const SecretManagerFieldsSeparator = '|ap_sep_v1|'
