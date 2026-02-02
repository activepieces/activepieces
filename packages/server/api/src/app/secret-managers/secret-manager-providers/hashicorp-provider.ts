import { FastifyBaseLogger } from "fastify";
import { SecretManagerProvider } from "./secret-manager-providers";
import { HashicorpProviderConfig, SecretManagerProviderMetaData, SecretManagerProviderId } from "@activepieces/shared";

export const HASHICORP_PROVIDER_METADATA: SecretManagerProviderMetaData = {
  id: SecretManagerProviderId.HASHICORP,
  name: "Hashicorp",
  logo: "https://www.hashicorp.com/logo.png",
  fields: {
    url: {
      displayName: "URL",
      placeholder: "https://www.hashicorp.com",
    },
    token: {
      displayName: "Token",
      placeholder: "token",
    },
  },
  connected: false,
}

export const hashicorpProvider = (log: FastifyBaseLogger) : SecretManagerProvider<HashicorpProviderConfig> => ({
  checkConnection: async (config: HashicorpProviderConfig) => {
    return Promise.resolve(true)
  },
  connect: async (config: HashicorpProviderConfig) => {
    return Promise.resolve()
  },
  disconnect: async () => {
    return Promise.resolve()
  },
  getSecret: async (secretName: string) => {
    return Promise.resolve("secret")
  }
})