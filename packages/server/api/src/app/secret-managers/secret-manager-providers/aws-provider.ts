import { FastifyBaseLogger } from "fastify";
import { SecretManagerProvider } from "./secret-manager-providers";
import {AWSProviderConfig, SecretManagerProviderMetaData, SecretManagerProviderId, AWSGetSecretRequest } from "@activepieces/shared";


export const AWS_PROVIDER_METADATA: SecretManagerProviderMetaData = {
  id: SecretManagerProviderId.AWS,
  name: "AWS",
  logo: "https://www.aws.com/logo.png",
  fields: {
    accessKeyId: {
      displayName: "Access Key ID",
      placeholder: "accessKeyId",
    },
    secretAccessKey: {
      displayName: "Secret Access Key",
      placeholder: "secretAccessKey",
    },
  },
}

export const awsProvider = (log: FastifyBaseLogger) : SecretManagerProvider<AWSProviderConfig, AWSGetSecretRequest> => ({
  checkConnection: async (config) => {
   
    return Promise.resolve(true)
  },
  connect: async (config) => {
    return Promise.resolve()
  },
  disconnect: async () => {
    return Promise.resolve()
  },
  getSecret: async (request: AWSGetSecretRequest, config: AWSProviderConfig) => {
    return Promise.resolve("secret")
  }
})
