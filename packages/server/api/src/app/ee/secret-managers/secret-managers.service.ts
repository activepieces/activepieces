import { ConnectSecretManagerRequest, SecretManagerConfig, SecretManagerProviderId, SecretManagerProviderMetaData } from '@activepieces/shared'
import { ActivepiecesError, apId, ErrorCode, isEnumValue, isNil, isObject, isString, SeekPage } from '@activepieces/shared'
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

    getSecret: async (request: { path: string, platformId: string, providerId: SecretManagerProviderId }) => {
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
                    request,
                },
            })
        }
        return provider.getSecret(request, decryptedConfig) 
    },

    async resolveString({ key, platformId, throwOnFailure = true }: { key: string, platformId: string, throwOnFailure?: boolean }) {
        const { providerId, path } = extractProviderIdAndPathFromKey(key)
        try {
            return await this.getSecret({
                platformId,
                providerId,
                path,
            }) 
        }
        catch (error) {
            return handleResolveError(error, throwOnFailure, key)
        }
    },
    async resolveObject<T extends Record<string, unknown>>({ value, platformId, throwOnFailure = true }: { value: T, platformId: string, throwOnFailure?: boolean }): Promise<T> {
        const entries = await Promise.all(
            Object.entries(value).map(async ([field, fieldValue]) => [
                field,
                await this.resolveUnknownValue({ value: fieldValue, platformId, throwOnFailure }),
            ]),
        )
        return Object.fromEntries(entries) as T
    },
    async resolveUnknownValue({ value, platformId, throwOnFailure }: { value: unknown, platformId: string, throwOnFailure: boolean }): Promise<unknown> {
        if (isObject(value)) {
            return this.resolveObject({
                value,
                platformId,
                throwOnFailure,
            })
        }
        if (isString(value)) {
            try {
                return await this.resolveString({ key: value, platformId, throwOnFailure })
            }
            catch (error) {
                return handleResolveError(error, throwOnFailure, value)
            }
        }
        return value
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

function handleResolveError(error: unknown, throwOnFailure: boolean, originalValue: unknown): unknown {
    if (!throwOnFailure) {
        return originalValue
    }
    if (error instanceof ActivepiecesError) {
        if (error.error.code === ErrorCode.SECRET_MANAGER_KEY_NOT_SECRET) {
            return originalValue
        }
        throw error
    }
    const message = error instanceof Error ? error.message : 'Failed to resolve secret'
    throw new ActivepiecesError({
        code: ErrorCode.VALIDATION,
        params: { message },
    })
}

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
 * key is {{providerId:secret-path}}
 * returns providerId and path
 */
const extractProviderIdAndPathFromKey = (key: string): {
    providerId: SecretManagerProviderId
    path: string
} => {
    const keyWithoutBraces = trimKeyBraces(key)
    const splits = keyWithoutBraces.split(':')
    const providerId = splits[0]
    const path = splits[1]
    if (!isEnumValue(SecretManagerProviderId, providerId)) {
        throw new ActivepiecesError({
            code: ErrorCode.SECRET_MANAGER_KEY_NOT_SECRET,
            params: {
                message: 'Invalid provider id',
            },
        })
    }
    return {
        providerId,
        path,
    }
}


