import { z } from 'zod'

export enum SecretManagerProviderId {
    HASHICORP = 'hashicorp',
    AWS = 'aws',
    CYBERARK = 'cyberark-conjur',
    ONEPASSWORD = 'onepassword',
}

/**
 * Hashicorp Provider Config
 */

export const HashicorpProviderConfigSchema = z.object({
    url: z.string(),
    namespace: z.string().optional(),
    roleId: z.string(),
    secretId: z.string(),
})
export type HashicorpProviderConfig = z.infer<typeof HashicorpProviderConfigSchema>

/**
 * AWS Provider Config
 */

export const AWSProviderConfigSchema = z.object({
    accessKeyId: z.string(),
    secretAccessKey: z.string(),
    region: z.string(),
})
export type AWSProviderConfig = z.infer<typeof AWSProviderConfigSchema>


/**
 * Cyberark Conjur Provider Config
 */

export const CyberarkConjurProviderConfigSchema = z.object({
    organizationAccountName: z.string(),
    loginId: z.string(),
    url: z.string(),
    apiKey: z.string(),
})
export type CyberarkConjurProviderConfig = z.infer<typeof CyberarkConjurProviderConfigSchema>

/**
 * 1Password Provider Config
 */

export const OnePasswordProviderConfigSchema = z.object({
    serviceAccountToken: z.string(),
})
export type OnePasswordProviderConfig = z.infer<typeof OnePasswordProviderConfigSchema>

export const ConnectSecretManagerRequestSchema = z.discriminatedUnion('providerId', [
    z.object({
        providerId: z.literal(SecretManagerProviderId.HASHICORP),
        config: HashicorpProviderConfigSchema,
    }),
    z.object({
        providerId: z.literal(SecretManagerProviderId.AWS),
        config: AWSProviderConfigSchema,
    }),
    z.object({
        providerId: z.literal(SecretManagerProviderId.CYBERARK),
        config: CyberarkConjurProviderConfigSchema,
    }),
    z.object({
        providerId: z.literal(SecretManagerProviderId.ONEPASSWORD),
        config: OnePasswordProviderConfigSchema,
    }),
])

export type ConnectSecretManagerRequest = z.infer<typeof ConnectSecretManagerRequestSchema>

export const DisconnectSecretManagerRequestSchema = z.object({
    providerId: z.nativeEnum(SecretManagerProviderId),
})
export type DisconnectSecretManagerRequest = z.infer<typeof DisconnectSecretManagerRequestSchema>
