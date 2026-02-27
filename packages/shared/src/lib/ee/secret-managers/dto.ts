import { Static, Type } from '@sinclair/typebox'
import { DiscriminatedUnion } from '../../core/common/base-model'

export enum SecretManagerProviderId {
    HASHICORP = 'hashicorp',
    AWS = 'aws',
    CYBERARK = 'cyberark-conjur',
}

/**
 * Hashicorp Provider Config
 */

export const HashicorpProviderConfigSchema = Type.Object({
    url: Type.String(),
    namespace: Type.Optional(Type.String()),
    roleId: Type.String(),
    secretId: Type.String(),
})
export type HashicorpProviderConfig = Static<typeof HashicorpProviderConfigSchema>

export const HashicorpGetSecretRequestSchema = Type.Object({
    path: Type.String(),
})
export type HashicorpGetSecretRequest = Static<typeof HashicorpGetSecretRequestSchema>


/**
 * AWS Provider Config
 */

export const AWSProviderConfigSchema = Type.Object({
    accessKeyId: Type.String(),
    secretAccessKey: Type.String(),
})
export type AWSProviderConfig = Static<typeof AWSProviderConfigSchema>

export const AWSGetSecretRequestSchema = Type.Object({
    path: Type.String(),
})
export type AWSGetSecretRequest = Static<typeof AWSGetSecretRequestSchema>

/**
 * Cyberark Conjur Provider Config
 */

export const CyberarkConjurProviderConfigSchema = Type.Object({
    organizationAccountName: Type.String(),
    loginId: Type.String(),
    url: Type.String(),
    apiKey: Type.String(),
})
export type CyberarkConjurProviderConfig = Static<typeof CyberarkConjurProviderConfigSchema>

export const CyberarkConjurGetSecretRequestSchema = Type.Object({
    secretKey: Type.String(),
})
export type CyberarkConjurGetSecretRequest = Static<typeof CyberarkConjurGetSecretRequestSchema>


export const ConnectSecretManagerRequestSchema = DiscriminatedUnion('providerId', [
    Type.Object({
        providerId: Type.Literal(SecretManagerProviderId.HASHICORP),
        config: HashicorpProviderConfigSchema,
    }),
    Type.Object({
        providerId: Type.Literal(SecretManagerProviderId.AWS),
        config: AWSProviderConfigSchema,
    }),
    Type.Object({
        providerId: Type.Literal(SecretManagerProviderId.CYBERARK),
        config: CyberarkConjurProviderConfigSchema,
    }),
])

export type ConnectSecretManagerRequest = Static<typeof ConnectSecretManagerRequestSchema>

export const DisconnectSecretManagerRequestSchema = Type.Object({
    providerId: Type.Enum(SecretManagerProviderId),
})
export type DisconnectSecretManagerRequest = Static<typeof DisconnectSecretManagerRequestSchema>
