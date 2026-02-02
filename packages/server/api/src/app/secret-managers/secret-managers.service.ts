import { isString, getByPath, jsonParseWithCallback, SecretManagerProviderMetaData, ConnectSecretManagerRequest, isNil } from "@activepieces/shared"
import { secretManagerProviders, secretManagerProvidersMetadata } from "./secret-manager-providers/secret-manager-providers"
import { FastifyBaseLogger } from "fastify"
import { databaseConnection } from "../database/database-connection"
import { SecretManagerEntity } from "./secret-manager.entity"

const secretManagerRepository = databaseConnection().getRepository(SecretManagerEntity)

export const secretManagersService = (log: FastifyBaseLogger) => ({
  list: async ({ platformId }: { platformId: string }): Promise<SecretManagerProviderMetaData[]> => {
    const secretManagers = await secretManagerRepository.find({
      where: {
        platformId,
      },
    })
    return await Promise.all(secretManagerProvidersMetadata().map(async (metadata) => {
      const provider = secretManagerProviders(log)[metadata.id]
      const savedConfig = secretManagers.find(secretManager => secretManager.providerId === metadata.id)?.auth

      return {
        ...metadata,
        connected: !isNil(savedConfig) && await provider.checkConnection(savedConfig),
      }
    }))
  },
  connect: async (request: ConnectSecretManagerRequest & { platformId: string }) => {
    const provider = secretManagerProviders(log)[request.providerId]
    return provider.connect(request.config)
  },

  async resolve({ key }: { key: string }) {

    key = checkKeyIsSecret(key)
    const { providerName, secretName, valuePath } = validateSecret(key)

    const provider = await Promise.resolve(mockProvider) // Should return get provider from provider service

    const value = await provider.getSecret(secretName)

    const resolvedValue = jsonParseWithCallback({
      str: value,
      onSuccess: (parsed) => {
        const resolvedValue = getByPath(parsed, valuePath)
        if (!isString(resolvedValue)) {
          throw Error("Value is not a string")
        }
        return resolvedValue
      },
      onError: () => { // this is json parse error
        if (valuePath && valuePath.length > 0) {
          throw Error("Value is not a json object. can't resolve value path")
        }
        return value
      }
    })

    return resolvedValue
  }
})

const checkKeyIsSecret = (key: string) => {
  key = key.trim()
  if (!(key.startsWith("{{") && key.endsWith("}}"))) {
    throw Error("Key is not a secret")
  }
  return key.substring(2, key.length - 2)
}

const validateSecret = (key: string) : {
  providerName: string,
  secretName: string,
  valuePath?: string[]
} => {
  let splits = key.split(":")

  if (splits.length < 2) {
    throw Error("Wrong format . should be providerName:secretName optionally followed by json path")
  }

  splits = splits.map(split => split.trim())

  return {
    providerName: splits[0],
    secretName: splits[1],
    valuePath: splits.slice(2)
  }
}

const mockProvider = {
  getSecret: async (secretName: string) => Promise.resolve("{\"sec\": {\"secret\": [\"secret-1\"] }}")
}
