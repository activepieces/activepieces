import { FastifyBaseLogger } from "fastify"
import { HASHICORP_PROVIDER_METADATA, hashicorpProvider } from "./hashicorp-provider"
import { SecretManagerProviderId, SecretManagerProviderMetaData } from "@activepieces/shared"

export interface SecretManagerProvider<T> {
  checkConnection: (config: T) => Promise<boolean>
  connect: (config: T) => Promise<void>
  disconnect: () => Promise<void>
  getSecret: (secretName: string) => Promise<string>
}

export const secretManagerProviders = (log: FastifyBaseLogger): Record<SecretManagerProviderId, SecretManagerProvider<any>> => {
  return {
    [SecretManagerProviderId.HASHICORP]: hashicorpProvider(log),
  }
}

export const secretManagerProvidersMetadata = (): SecretManagerProviderMetaData[] => [
  HASHICORP_PROVIDER_METADATA,
]