import { ConnectSecretManagerRequest, GetSecretManagerSecretRequest, SecretManagerProviderId, SecretManagerProviderMetaData } from '@activepieces/ee-shared'
import { FastifyBaseLogger } from 'fastify'
import { awsProvider } from './aws-provider'
import { HASHICORP_PROVIDER_METADATA, hashicorpProvider } from './hashicorp-provider'
import { CYBERARK_PROVIDER_METADATA, cyberarkConjurProvider } from './cyberark-conjur-provider'

export type SecretManagerProvider<K extends SecretManagerProviderId> = {
    checkConnection: (config: SecretManagerConfigFor<K>) => Promise<unknown>
    connect: (config: SecretManagerConfigFor<K>) => Promise<void>
    disconnect: () => Promise<void>
    getSecret: (params: GetSecretManagerSecretRequestFor<K>, config: SecretManagerConfigFor<K>) => Promise<string>
    resolve: (key: string) => Promise<GetSecretManagerSecretRequestFor<K>>

}

export type SecretManagerConfigFor<K extends SecretManagerProviderId> =
  Extract<ConnectSecretManagerRequest, { providerId: K }>['config']

export type GetSecretManagerSecretRequestFor<K extends SecretManagerProviderId> =
  Extract<GetSecretManagerSecretRequest, { providerId: K }>['request']

export type SecretManagerProvidersMap = {
    [K in SecretManagerProviderId]: SecretManagerProvider<K>
}

const secretManagerProvidersMap = (log: FastifyBaseLogger): SecretManagerProvidersMap => {
    return {
        [SecretManagerProviderId.HASHICORP]: hashicorpProvider(log),
        [SecretManagerProviderId.AWS]: awsProvider(log),
        [SecretManagerProviderId.CYBERARK]: cyberarkConjurProvider(log),
    }
}

export const secretManagerProvider = <K extends SecretManagerProviderId>(log: FastifyBaseLogger, providerId: K): SecretManagerProvider<K> => {
    return secretManagerProvidersMap(log)[providerId]
}

export const secretManagerProvidersMetadata = (): SecretManagerProviderMetaData[] => [
    HASHICORP_PROVIDER_METADATA,
    // AWS_PROVIDER_METADATA, // not shown in the UI yet
    CYBERARK_PROVIDER_METADATA,
]
