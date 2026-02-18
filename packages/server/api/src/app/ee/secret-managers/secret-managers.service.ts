import { ConnectSecretManagerRequest, GetSecretManagerSecretRequest, SecretManagerConfig, SecretManagerProviderId, SecretManagerProviderMetaData } from '@activepieces/ee-shared'
import { ActivepiecesError, ApErrorParams, apId, ErrorCode, isEnumValue, isNil, isObject, isString, SeekPage } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../core/db/repo-factory'
import { encryptUtils } from '../../helper/encryption'
import { secretManagerProvider, secretManagerProvidersMetadata } from './secret-manager-providers/secret-manager-providers'
import { SecretManagerEntity } from './secret-manager.entity'

const secretManagerRepository = repoFactory(SecretManagerEntity)

export const secretManagersService = (log: FastifyBaseLogger) => ({
    list: async ({ platformId }: { platformId: string }): Promise<SeekPage<SecretManagerProviderMetaData>> => {
        const secretManagers = await secretManagerRepository().find({
            where: {
                platformId,
            },
        })
        const providers = await Promise.all(secretManagerProvidersMetadata().map(async (metadata) => {
            const provider = secretManagerProvider(log, metadata.id)
            const savedConfig = secretManagers.find(secretManager => secretManager.providerId === metadata.id)?.auth
            const decryptedConfig = savedConfig ? await encryptUtils.decryptObject<SecretManagerConfig>(savedConfig) : undefined
            const isConnected = !isNil(decryptedConfig) && Boolean(await provider.checkConnection(decryptedConfig).catch(() => false))

            return {
                ...metadata,
                connected: isConnected,
            }
        }))
        return {
            data: providers,
            next: null,
            previous: null,
        }
    },
    connect: async (request: ConnectSecretManagerRequest & { platformId: string }) => {
        const provider = secretManagerProvider(log, request.providerId)
        await provider.connect(request.config)
        const existing = await secretManagerRepository().findOne({
            where: { platformId: request.platformId, providerId: request.providerId },
        })
        const encryptedConfig = await encryptUtils.encryptObject(request.config)
        if (existing) {
            await secretManagerRepository().update(
                { platformId: request.platformId, providerId: request.providerId },
                { auth: encryptedConfig },
            )
            return
        }
        await secretManagerRepository().save({
            id: apId(),
            platformId: request.platformId,
            providerId: request.providerId,
            auth: encryptedConfig,
        })
    },

    getSecret: async (request: GetSecretManagerSecretRequest & { platformId: string }) => {
        const provider = secretManagerProvider(log, request.providerId)
        const secretManager = await secretManagerRepository().findOneOrFail({
            where: { platformId: request.platformId, providerId: request.providerId },
        })
        const decryptedConfig = secretManager.auth ? await encryptUtils.decryptObject<SecretManagerConfig>(secretManager.auth) : undefined
        if (!decryptedConfig) {
            throw new ActivepiecesError({
                code: ErrorCode.SECRET_MANAGER_GET_SECRET_FAILED,
                params: {
                    message: 'Secret manager configuration is not valid',
                    provider: request.providerId,
                    request: request.request,
                },
            })
        }
        return provider.getSecret(request.request, decryptedConfig) 
    },

    async resolve({ key, platformId }: { key: string, platformId: string }) {
        const trimmedKey = trimKeyBraces(key)
        const providerId = extractProviderId(trimmedKey)

        return secretManagersService(log).getSecret({
            providerId,
            request: await secretManagerProvider(log, providerId).resolve(trimmedKey),
            platformId,
        } as GetSecretManagerSecretRequest & { platformId: string })
    },

    async resolveObject<T extends Record<string, unknown>>(value: T, platformId: string, throwOnFailure: boolean = true): Promise<T> {
        const newValue = JSON.parse(JSON.stringify(value)) as T
        await Promise.all(
            Object.keys(value).map(async (field: keyof T) => {
                if (isObject(value[field])) {
                    Object.assign(newValue, {
                        [field]: await secretManagersService(log).resolveObject(value[field], platformId),
                    })
                }
                else if (isString(value[field])) {
                    const resolvedValue = await secretManagersService(log).resolve({ key: value[field], platformId }).catch((error) => {
                        const apError = error.error as ApErrorParams
                        if (!throwOnFailure || (apError && apError.code === ErrorCode.SECRET_MANAGER_KEY_NOT_SECRET)) {
                            return value[field]
                        }
                        
                        if (apError) {
                            throw error
                        }
                        throw new ActivepiecesError({
                            code: ErrorCode.VALIDATION,
                            params: {
                                message: error.message ?? 'Failed to resolve secret',
                            },
                        })
                    })
                    Object.assign(newValue, {
                        [field]: resolvedValue,
                    })
                }
            }),
        )

        return newValue
    },

    disconnect: async ({ platformId, providerId }: { platformId: string, providerId: SecretManagerProviderId }) => {
        const provider = secretManagerProvider(log, providerId)
        await provider.disconnect()
        await secretManagerRepository().delete({
            platformId,
            providerId,
        })
    },
})

/**
 * takes key in the format of {{providerId:secret-path}}
 * returns trimmed key in the format of providerId:secret-path
 */
const trimKeyBraces = (key: string) => {
    const trimmedKey = key.trim()
    if (!(trimmedKey.startsWith('{{') && trimmedKey.endsWith('}}'))) {
        throw new ActivepiecesError({
            code: ErrorCode.SECRET_MANAGER_KEY_NOT_SECRET,
            params: {
                message: 'Key is not a secret',
            },
        })
    }
    return trimmedKey.substring(2, trimmedKey.length - 2)
}

/**
 * takes trimmed key in the format of providerId:secret-path
 * returns providerId
 */
const extractProviderId = (key: string): SecretManagerProviderId => {
    const splits = key.split(':')
    if (!isEnumValue(SecretManagerProviderId, splits[0])) {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: {
                message: 'Invalid provider id',
            },
        })
    }
    return splits[0]
}

