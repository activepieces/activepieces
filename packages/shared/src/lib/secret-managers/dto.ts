import { Static, Type } from '@sinclair/typebox'
import { DiscriminatedUnion } from '../common'

export enum SecretManagerProviderId {
    HASHICORP = 'hashicorp',
    AWS = 'aws',
}

/**
 * Hashicorp Provider Config
 */

export const HashicorpProviderConfigSchema = Type.Object({
    url: Type.String(),
    token: Type.String(),
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
    secretPath: Type.String(),
})
export type AWSGetSecretRequest = Static<typeof AWSGetSecretRequestSchema>


export const ConnectSecretManagerRequestSchema = DiscriminatedUnion('providerId', [
    Type.Object({
        providerId: Type.Literal(SecretManagerProviderId.HASHICORP),
        config: HashicorpProviderConfigSchema,
    }),
    Type.Object({
        providerId: Type.Literal(SecretManagerProviderId.AWS),
        config: AWSProviderConfigSchema,
    }),
])

export type ConnectSecretManagerRequest = Static<typeof ConnectSecretManagerRequestSchema>

export const DisconnectSecretManagerRequestSchema = Type.Object({
    providerId: Type.Enum(SecretManagerProviderId),
})
export type DisconnectSecretManagerRequest = Static<typeof DisconnectSecretManagerRequestSchema>


export const GetSecretManagerSecretRequestSchema = DiscriminatedUnion('providerId', [
    Type.Object({
        providerId: Type.Literal(SecretManagerProviderId.HASHICORP),
        request: HashicorpGetSecretRequestSchema,
    }),
    Type.Object({
        providerId: Type.Literal(SecretManagerProviderId.AWS),
        request: AWSGetSecretRequestSchema,
    }),
])

export type GetSecretManagerSecretRequest = Static<typeof GetSecretManagerSecretRequestSchema>