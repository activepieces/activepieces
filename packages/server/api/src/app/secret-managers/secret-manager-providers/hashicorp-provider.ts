import { FastifyBaseLogger } from "fastify";
import { SecretManagerProvider } from "./secret-manager-providers";
import { HashicorpProviderConfig, SecretManagerProviderMetaData, SecretManagerProviderId, ActivepiecesError, ErrorCode, HashicorpGetSecretRequest } from "@activepieces/shared";
import vault from "node-vault"
import dotenv from "dotenv"
import { apAxios } from "@activepieces/server-shared";

export const HASHICORP_PROVIDER_METADATA: SecretManagerProviderMetaData = {
  id: SecretManagerProviderId.HASHICORP,
  name: "Hashicorp",
  logo: "https://www.hashicorp.com/logo.png",
  fields: {
    url: {
      displayName: "URL",
      placeholder: "http://localhost:8200",
    },
    token: {
      displayName: "Token",
      placeholder: "token",
    },
  },
}

export const hashicorpProvider = (log: FastifyBaseLogger) : SecretManagerProvider<HashicorpProviderConfig, HashicorpGetSecretRequest> => ({
  checkConnection: async (config) => {
    await vaultApi({
      url: `${config.url}/v1/sys/mounts`,
      token: config.token,
      method: "GET",
    }).catch((error) => {
      throw new ActivepiecesError({
        code: ErrorCode.SECRET_MANAGER_CONNECTION_FAILED,
        params: {
          message: error.message,
          provider: SecretManagerProviderId.HASHICORP,
        },
      })
    })
    return true
  },
  connect: async (config) => {
    await hashicorpProvider(log).checkConnection(config)
  },
  disconnect: async () => {
    return Promise.resolve()
  },
  getSecret: async (request: HashicorpGetSecretRequest, config: HashicorpProviderConfig) => {

    const response = await vaultApi({
      url: `${config.url}/v1/${request.mountPath}`,
      token: config.token,
      method: "GET",
    }).catch((error) => {
      console.error(error)
      throw new ActivepiecesError({
        code: ErrorCode.SECRET_MANAGER_GET_SECRET_FAILED,
        params: {
          message: error.message,
          provider: SecretManagerProviderId.HASHICORP,
          request: request,
        },
      })
    })
    const data = response.data?.data?.data
    if (!data || !data[request.secretPath]) {
      throw new ActivepiecesError({
        code: ErrorCode.SECRET_MANAGER_GET_SECRET_FAILED,
        params: {
          message: "No secret found at requested path",
          provider: SecretManagerProviderId.HASHICORP,
          request: request,
        },
      })
    }
    return data[request.secretPath]
  }
})

const vaultApi = async ({
  url,
  token,
  method,
  body,
}: {
  url: string,
  token: string,
  method: string,
  body?: Record<string, unknown>,
}) => {
  return await apAxios.request({
    url,
    method,
    headers: {
      "X-Vault-Token": token,
      "X-Vault-Request": "true",
    },
    data: body,
  })
}