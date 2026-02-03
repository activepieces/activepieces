import { FastifyBaseLogger } from "fastify"
import { HASHICORP_PROVIDER_METADATA, hashicorpProvider } from "./hashicorp-provider"
import { ConnectSecretManagerRequest, GetSecretManagerSecretRequest, SecretManagerProviderId, SecretManagerProviderMetaData } from "@activepieces/shared"
import { awsProvider } from "./aws-provider"

export interface SecretManagerProvider<T, P> {
  checkConnection: (config: T) => Promise<boolean>
  connect: (config: T) => Promise<void>
  disconnect: () => Promise<void>
  getSecret: (params: P, config: T) => Promise<string>
}

export type SecretManagerConfigFor<K extends SecretManagerProviderId> =
  Extract<ConnectSecretManagerRequest, { providerId: K }>['config']

export type GetSecretManagerSecretRequestFor<K extends SecretManagerProviderId> =
  Extract<GetSecretManagerSecretRequest, { providerId: K }>['request']

export type SecretManagerProvidersMap = {
  [K in SecretManagerProviderId]: SecretManagerProvider<SecretManagerConfigFor<K>, GetSecretManagerSecretRequestFor<K>>
}

const secretManagerProvidersMap = (log: FastifyBaseLogger): SecretManagerProvidersMap => {
  return {
    [SecretManagerProviderId.HASHICORP]: hashicorpProvider(log),
    [SecretManagerProviderId.AWS]: awsProvider(log),
  }
}

export const secretManagerProvider = (log: FastifyBaseLogger, providerId: SecretManagerProviderId): SecretManagerProvider<SecretManagerConfigFor<typeof providerId>, GetSecretManagerSecretRequestFor<typeof providerId>> => {
  return secretManagerProvidersMap(log)[providerId] as SecretManagerProvider<SecretManagerConfigFor<typeof providerId>, GetSecretManagerSecretRequestFor<typeof providerId>>
}

export const secretManagerProvidersMetadata = (): SecretManagerProviderMetaData[] => [
  HASHICORP_PROVIDER_METADATA,
  // AWS_PROVIDER_METADATA, // not shown in the UI yet
]
