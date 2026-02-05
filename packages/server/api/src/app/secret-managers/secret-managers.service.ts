import { isString, getByPath, jsonParseWithCallback, SecretManagerProviderMetaData, ConnectSecretManagerRequest, isNil, apId, GetSecretManagerSecretRequest, tryCatch, SecretManagerProviderId, ActivepiecesError, ErrorCode } from "@activepieces/shared"
import { secretManagerProvider, secretManagerProvidersMetadata } from "./secret-manager-providers/secret-manager-providers"
import { FastifyBaseLogger } from "fastify"
import { databaseConnection } from "../database/database-connection"
import { SecretManagerEntity } from "./secret-manager.entity"
import { repoFactory } from "../core/db/repo-factory"

const secretManagerRepository = repoFactory(SecretManagerEntity)

export const secretManagersService = (log: FastifyBaseLogger) => ({
  list: async ({ platformId }: { platformId: string }): Promise<SecretManagerProviderMetaData[]> => {
    const secretManagers = await secretManagerRepository().find({
      where: {
        platformId,
      },
    })
    return await Promise.all(secretManagerProvidersMetadata().map(async (metadata) => {
      const provider = secretManagerProvider(log, metadata.id)
      const savedConfig = secretManagers.find(secretManager => secretManager.providerId === metadata.id)?.auth

      return {
        ...metadata,
        connected: !isNil(savedConfig) && await provider.checkConnection(savedConfig),
      }
    }))
  },
  connect: async (request: ConnectSecretManagerRequest & { platformId: string }) => {
    const provider = secretManagerProvider(log, request.providerId)
    await provider.connect(request.config)
    const existing = await secretManagerRepository().findOne({
      where: { platformId: request.platformId, providerId: request.providerId },
    })
    if (existing) {
      return secretManagerRepository().update(
        { platformId: request.platformId, providerId: request.providerId },
        { auth: request.config },
      )
    }
    return secretManagerRepository().save({
      id: apId(),
      platformId: request.platformId,
      providerId: request.providerId,
      auth: request.config,
    })
  },

  getSecret: async (request: GetSecretManagerSecretRequest & { platformId: string }) => {
    const provider = secretManagerProvider(log, request.providerId)
    const secretManager = await secretManagerRepository().findOneOrFail({
      where: { platformId: request.platformId, providerId: request.providerId },
    })
    await provider.checkConnection(secretManager.auth)
    return provider.getSecret(request.request, secretManager.auth) 
  },

  async resolve({ key, platformId }: { key: string, platformId: string }) {

    key = checkKeyIsSecret(key)
    let splits = key.split(":")

    if (!Object.values(SecretManagerProviderId).includes(splits[0] as SecretManagerProviderId)) {
      throw new ActivepiecesError({
        code: ErrorCode.VALIDATION,
        params: {
          message: "Invalid provider id",
        },
      })
    }
    const providerId = splits[0] as SecretManagerProviderId

    return secretManagersService(log).getSecret({
      providerId,
      request: await secretManagerProvider(log, providerId).resolve(key),
      platformId,
    } as GetSecretManagerSecretRequest & { platformId: string })
  }
})

const checkKeyIsSecret = (key: string) => {
  key = key.trim()
  if (!(key.startsWith("{{") && key.endsWith("}}"))) {
    throw new ActivepiecesError({
      code: ErrorCode.SECRET_MANAGER_KEY_NOT_SECRET,
      params: {
        message: "Key is not a secret",
      },
    })
  }
  return key.substring(2, key.length - 2)
}
