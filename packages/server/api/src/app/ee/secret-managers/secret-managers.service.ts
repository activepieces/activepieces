import { ActivepiecesError, apId, ConnectSecretManagerRequest, ErrorCode, isNil, isObject, isString, SecretManagerConfig, SecretManagerConnectionScope, SecretManagerConnectionWithStatus, SecretManagerFieldsSeparator, SecretManagerProviderId, SeekPage } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../core/db/repo-factory'
import { encryptUtils } from '../../helper/encryption'
import { secretManagerCache } from './secret-manager-cache'
import { secretManagerProvider } from './secret-manager-providers/secret-manager-providers'
import { SecretManagerEntity } from './secret-manager.entity'

const secretManagerRepository = repoFactory(SecretManagerEntity)

export const secretManagersService = (log: FastifyBaseLogger) => ({
    list: async ({ platformId, projectId }: { platformId: string, projectId?: string }): Promise<SeekPage<SecretManagerConnectionWithStatus>> => {
        const qb = secretManagerRepository()
            .createQueryBuilder('sm')
            .where('sm.platformId = :platformId', { platformId })

        if (projectId) {
            qb.andWhere(
                '(sm.scope = :platformScope OR (sm.scope = :projectScope AND sm.projectIds @> :projectIds::jsonb))',
                {
                    platformScope: SecretManagerConnectionScope.PLATFORM,
                    projectScope: SecretManagerConnectionScope.PROJECT,
                    projectIds: JSON.stringify([projectId]),
                },
            )
        }

        const filtered = await qb.getMany()

        const data: SecretManagerConnectionWithStatus[] = await Promise.all(filtered.map(async (connection) => {
            const decryptedConfig = connection.auth
                ? await encryptUtils.decryptObject<SecretManagerConfig>(connection.auth)
                : undefined
            const connected = await checkConnection(log, decryptedConfig, platformId, connection.id, connection.providerId)

            const { auth: _auth, scope, projectIds, ...rest } = connection
            const connectionStatus = { configured: !isNil(connection.auth), connected }

            if (scope === SecretManagerConnectionScope.PROJECT) {
                return { ...rest, scope, projectIds: projectIds ?? [], connection: connectionStatus }
            }
            return { ...rest, scope, connection: connectionStatus }
        }))

        return {
            data,
            next: null,
            previous: null,
        }
    },

    create: async (request: ConnectSecretManagerRequest & { platformId: string }): Promise<SecretManagerConnectionWithStatus> => {
        const provider = secretManagerProvider(log, request.providerId)
        await provider.connect(request.config)
        const encryptedConfig = await encryptUtils.encryptObject(request.config)
        const saved = await secretManagerRepository().save({
            id: apId(),
            platformId: request.platformId,
            providerId: request.providerId,
            name: request.name,
            scope: request.scope,
            projectIds: request.scope === SecretManagerConnectionScope.PROJECT ? request.projectIds : undefined,
            auth: encryptedConfig,
        })

        await secretManagerCache.invalidateConnectionEntries({ platformId: request.platformId })
        const { auth: _auth, scope, projectIds, ...savedRest } = saved
        if (scope === SecretManagerConnectionScope.PROJECT) {
            return { ...savedRest, scope, projectIds: projectIds ?? [], connection: { configured: true, connected: true } }
        }
        return { ...savedRest, scope, connection: { configured: true, connected: true } }
    },

    update: async ({ id, platformId, request }: { id: string, platformId: string, request: ConnectSecretManagerRequest }): Promise<SecretManagerConnectionWithStatus> => {
        const existing = await secretManagerRepository().findOneOrFail({
            where: { id, platformId },
        })
        const provider = secretManagerProvider(log, request.providerId)
        await provider.connect(request.config)
        const encryptedConfig = await encryptUtils.encryptObject(request.config)
        await secretManagerRepository().update({ id, platformId }, {
            providerId: request.providerId,
            name: request.name,
            scope: request.scope,
            projectIds: request.scope === SecretManagerConnectionScope.PROJECT ? request.projectIds : undefined,
            auth: encryptedConfig,
        })
        await secretManagerCache.invalidateConnectionEntries({ platformId, connectionId: existing.id })
        const updated = await secretManagerRepository().findOneOrFail({ where: { id, platformId } })
        const { auth: _auth, scope, projectIds, ...updatedRest } = updated
        if (scope === SecretManagerConnectionScope.PROJECT) {
            return { ...updatedRest, scope, projectIds: projectIds ?? [], connection: { configured: true, connected: true } }
        }
        return { ...updatedRest, scope, connection: { configured: true, connected: true } }
    },

    delete: async ({ id, platformId }: { id: string, platformId: string }): Promise<void> => {
        const connection = await secretManagerRepository().findOneOrFail({
            where: { id, platformId },
        })
        const provider = secretManagerProvider(log, connection.providerId)
        await provider.disconnect()
        await secretManagerRepository().delete({ id, platformId })
        await secretManagerCache.invalidateConnectionEntries({ platformId, connectionId: id })
    },

    getSecret: async ({ connectionId, path, platformId, projectIds }: { connectionId: string, path: string, platformId: string, projectIds?: string[] }): Promise<string> => {
        const qb = secretManagerRepository()
            .createQueryBuilder('sm')
            .where('sm.id = :connectionId', { connectionId })
            .andWhere('sm.platformId = :platformId', { platformId })
            .andWhere(
                '(sm.scope = :platformScope OR (sm.scope = :projectScope AND sm.projectIds @> :projectIds::jsonb))',
                {
                    platformScope: SecretManagerConnectionScope.PLATFORM,
                    projectScope: SecretManagerConnectionScope.PROJECT,
                    projectIds: JSON.stringify(projectIds ?? []),
                },
            )

        const connection = await qb.getOne()
        if (isNil(connection)) {
            throw new ActivepiecesError({
                code: ErrorCode.SECRET_MANAGER_GET_SECRET_FAILED,
                params: {
                    message: 'Connection is not accessible',
                    provider: connectionId,
                    request: { connectionId, path },
                },
            })
        }
        const decryptedConfig = connection.auth
            ? await encryptUtils.decryptObject<SecretManagerConfig>(connection.auth)
            : undefined
        if (!decryptedConfig) {
            throw new ActivepiecesError({
                code: ErrorCode.SECRET_MANAGER_GET_SECRET_FAILED,
                params: {
                    message: 'Secret manager configuration is not valid',
                    provider: connection.providerId,
                    request: { connectionId, path },
                },
            })
        }
        const cached = await secretManagerCache.getSecretValue({ platformId, connectionId, path })
        if (cached !== undefined) {
            return cached
        }
        const provider = secretManagerProvider(log, connection.providerId)
        const secret = await provider.getSecret({ path }, decryptedConfig)
        await secretManagerCache.setSecretValue({ platformId, connectionId, path, value: secret })
        return secret
    },

    async resolveString({ key, platformId, projectIds, throwOnFailure = true }: { key: string, platformId: string, projectIds?: string[], throwOnFailure?: boolean }): Promise<string> {
        try {
            const { connectionId, path } = extractConnectionIdAndPath(key)
            return await this.getSecret({ connectionId, path, platformId, projectIds })
        }
        catch (error) {
            return handleResolveError({ error, throwOnFailure, originalValue: key })
        }
    },

    async resolveObject<T extends Record<string, unknown>>({ value, platformId, projectIds, throwOnFailure = true }: { value: T, platformId: string, projectIds?: string[], throwOnFailure?: boolean }): Promise<T> {
        const entries = await Promise.all(
            Object.entries(value).map(async ([field, fieldValue]) => [
                field,
                await this.resolveUnknownValue({ value: fieldValue, platformId, projectIds, throwOnFailure }),
            ]),
        )
        return Object.fromEntries(entries) as T
    },

    async resolveUnknownValue({ value, platformId, projectIds, throwOnFailure }: { value: unknown, platformId: string, projectIds?: string[], throwOnFailure: boolean }): Promise<unknown> {
        if (isObject(value)) {
            return this.resolveObject({
                value,
                platformId,
                projectIds,
                throwOnFailure,
            })
        }
        if (isString(value)) {
            try {
                return await this.resolveString({ key: value, platformId, projectIds, throwOnFailure })
            }
            catch (error) {
                return handleResolveError({ error, throwOnFailure, originalValue: value })
            }
        }
        return value
    },
})

async function checkConnection(log: FastifyBaseLogger, config: SecretManagerConfig | undefined, platformId: string, connectionId: string, providerId: SecretManagerProviderId): Promise<boolean> {
    if (isNil(config)) {
        return false
    }
    const cached = await secretManagerCache.getConnectionStatus({ platformId, connectionId })
    if (cached !== undefined) {
        return cached
    }
 
    const provider = secretManagerProvider(log, providerId)
    const connected = Boolean(await provider.checkConnection(config).catch(() => false))
    if (connected) {
        await secretManagerCache.setConnectionStatus({ platformId, connectionId, value: true })
    }
    return connected
}

function handleResolveError<T>({ error, throwOnFailure, originalValue }: { error: unknown, throwOnFailure: boolean, originalValue: T }): T {
    
    
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

const trimKeyBraces = (key: string): string => {
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

const extractConnectionIdAndPath = (key: string): { connectionId: string, path: string } => {
    const keyWithoutBraces = trimKeyBraces(key)
    const firstSepIdx = keyWithoutBraces.indexOf(SecretManagerFieldsSeparator)
    if (firstSepIdx === -1) {
        throw new ActivepiecesError({
            code: ErrorCode.SECRET_MANAGER_KEY_NOT_SECRET,
            params: {
                message: 'Key is not in the expected secret format',
            },
        })
    }
    const connectionId = keyWithoutBraces.substring(0, firstSepIdx)
    const path = keyWithoutBraces.substring(firstSepIdx + SecretManagerFieldsSeparator.length)
    if (!connectionId || !path) {
        throw new ActivepiecesError({
            code: ErrorCode.SECRET_MANAGER_KEY_NOT_SECRET,
            params: {
                message: 'Invalid secret key: missing connectionId or path',
            },
        })
    }
    return { connectionId, path }
}

export function containsSecretManagerReference(value: unknown): boolean {
    if (typeof value === 'string') {
        const trimmed = value.trim()
        return trimmed.startsWith('{{') && trimmed.includes(SecretManagerFieldsSeparator) && trimmed.endsWith('}}')
    }
    if (typeof value === 'object' && value !== null) {
        return Object.values(value).some(containsSecretManagerReference)
    }
    return false
}
