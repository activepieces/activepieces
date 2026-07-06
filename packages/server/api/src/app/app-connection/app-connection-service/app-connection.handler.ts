import { assertNotNullOrUndefined, isNil, PlatformId, ProjectId, UserId } from '@activepieces/core-utils'
import { PropertyType } from '@activepieces/pieces-framework'
import { AppConnection, AppConnectionStatus, AppConnectionType, AppConnectionValue, AppConnectionWithoutSensitiveData, EngineResponse, EngineResponseStatus, ExecuteRefreshTokenAuthResponse, Flow, FlowOperationType, flowStructureUtil, FlowVersion, FlowVersionState, PopulatedFlow, WorkerJobType } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { lru, LRU } from 'tiny-lru'
import { ArrayContains } from 'typeorm'
import { distributedLock } from '../../database/redis-connections'
import { flowService } from '../../flows/flow/flow.service'
import { flowVersionRepo, flowVersionService } from '../../flows/flow-version/flow-version.service'
import { encryptUtils } from '../../helper/encryption'
import { exceptionHandler } from '../../helper/exception-handler'
import { getPiecePackageWithoutArchive, pieceMetadataService } from '../../pieces/metadata/piece-metadata-service'
import { projectService } from '../../project/project-service'
import { userInteractionWatcher } from '../../workers/user-interaction-watcher'
import { AppConnectionSchema } from '../app-connection.entity'
import { appConnectionsRepo } from './app-connection-service'
import { oauth2Handler } from './oauth2'
import { oauth2Util } from './oauth2/oauth2-util'

export const appConnectionHandler = (log: FastifyBaseLogger) => ({
    async updateFlowsWithAppConnection(flows: PopulatedFlow[], params: UpdateFlowsWithAppConnectionParams): Promise<void> {
        const { appConnection, newAppConnection, userId, applyToPublishedVersions } = params

        await Promise.all(flows.map(async (flow) => {
            const project = await projectService(log).getOneOrThrow(flow.projectId)
            // Don't change the order: republish first (when opted in), then make sure the
            // draft also points to the new connection.
            if (applyToPublishedVersions) {
                await handleLockedVersion(flow, userId, flow.projectId, project.platformId, appConnection, newAppConnection, log)
            }
            await handleDraftVersion(flow, userId, flow.projectId, project.platformId, appConnection, newAppConnection, log)
        }))
    },

    // Queries published versions directly rather than relying on the flows fetched
    // for the replace, since flowService.list filters by the latest (draft) version's
    // connectionIds. A flow whose published version still uses the connection but whose
    // newer draft dropped it would be missing from that list, so deleting the source
    // would silently orphan the published version.
    // When applyToPublishedVersions is set, the replace republishes the published
    // versions of the flows it can see (those whose latest version references the
    // connection), so only published versions whose flow's latest version dropped the
    // connection stay untouched and count as blocking.
    async countPublishedFlowsReferencingConnection({ projectId, externalId, applyToPublishedVersions }: CountPublishedFlowsParams): Promise<number> {
        const query = flowVersionRepo()
            .createQueryBuilder('flow_version')
            .innerJoin('flow', 'flow', 'flow.id = flow_version."flowId"')
            .where('flow."projectId" = :projectId', { projectId })
            .andWhere('flow_version.id = flow."publishedVersionId"')
            .andWhere('flow_version."connectionIds" && :externalIds', { externalIds: [externalId] })
        if (applyToPublishedVersions) {
            const latestVersionConnectionIds = flowVersionRepo()
                .createQueryBuilder('fv_latest')
                .select('fv_latest."connectionIds"')
                .where('fv_latest."flowId" = flow.id')
                .orderBy('fv_latest.created', 'DESC')
                .limit(1)
            query.andWhere(`NOT ((${latestVersionConnectionIds.getQuery()}) && :externalIds)`)
        }
        return query.getCount()
    },

    async refresh(connection: AppConnection, projectId: ProjectId, log: FastifyBaseLogger): Promise<AppConnection> {
        switch (connection.value.type) {
            case AppConnectionType.PLATFORM_OAUTH2:
                connection.value = await oauth2Handler[connection.value.type](log).refresh({
                    pieceName: connection.pieceName,
                    platformId: connection.platformId,
                    projectId,
                    connectionValue: connection.value,
                })
                break
            case AppConnectionType.CLOUD_OAUTH2:
                connection.value = await oauth2Handler[connection.value.type](log).refresh({
                    pieceName: connection.pieceName,
                    platformId: connection.platformId,
                    projectId,
                    connectionValue: connection.value,
                })
                break
            case AppConnectionType.OAUTH2:
                connection.value = await oauth2Handler[connection.value.type](log).refresh({
                    pieceName: connection.pieceName,
                    platformId: connection.platformId,
                    projectId,
                    connectionValue: connection.value,
                })
                break
            case AppConnectionType.CUSTOM_AUTH: {
                const piece = await getPiecePackageWithoutArchive(log, connection.platformId, {
                    pieceName: connection.pieceName,
                    pieceVersion: connection.pieceVersion,
                })
                log.info({ pieceName: connection.pieceName, externalId: connection.externalId }, '[custom-auth-refresh] submitting token refresh job')
                const engineResponse = await userInteractionWatcher.submitAndWaitForResponse<EngineResponse<ExecuteRefreshTokenAuthResponse>>({
                    piece,
                    platformId: connection.platformId,
                    connectionValue: connection.value,
                    jobType: WorkerJobType.EXECUTE_TOKEN_REFRESH,
                }, log)
                if (engineResponse.status === EngineResponseStatus.TIMEOUT) {
                    log.warn({ pieceName: connection.pieceName }, '[custom-auth-refresh] token refresh timed out — using existing credentials')
                    return connection
                }
                if (engineResponse.status !== EngineResponseStatus.OK) {
                    throw new CustomAuthRefreshError(`Custom auth token refresh failed: ${engineResponse.error ?? 'unknown engine error'}`)
                }
                const refreshResult = engineResponse.response
                if (refreshResult.skipped) {
                    // Piece no longer has onRefreshToken (e.g. piece was updated) — clear
                    // the token so the next needRefresh call re-checks piece metadata.
                    log.info({ pieceName: connection.pieceName }, '[custom-auth-refresh] piece has no refresh callback — clearing stale token')
                    pieceRefreshSupportCache.set(pieceRefreshSupportCacheKey(connection), false)
                    connection.value = {
                        ...connection.value,
                        access_token: undefined,
                        token_refresh_at: undefined,
                    }
                }
                else {
                    log.info({ pieceName: connection.pieceName, expiresIn: refreshResult.expires_in }, '[custom-auth-refresh] token refreshed successfully')
                    connection.value = {
                        ...connection.value,
                        access_token: refreshResult.access_token,
                        token_refresh_at: computeTokenRefreshAt(refreshResult.expires_in),
                    }
                }
                break
            }
            default:
                break
        }
        return connection
    },

    /**
 * We should make sure this is accessed only once, as a race condition could occur where the token needs to be
 * refreshed and it gets accessed at the same time, which could result in the wrong request saving incorrect data.
 */
    async lockAndRefreshConnection({
        platformId,
        projectId,
        externalId,
        log,
    }: {
        platformId: PlatformId
        projectId: ProjectId
        externalId: string
        log: FastifyBaseLogger
    }) {

        return distributedLock(log).runExclusive({
            key: `${platformId}_${externalId}`,
            timeoutInSeconds: 60,
            fn: async () => {
                let appConnection: AppConnection | null = null

                try {
                    const encryptedAppConnection = await appConnectionsRepo().findOneBy({
                        projectIds: ArrayContains([projectId]),
                        externalId,
                    })
                    if (isNil(encryptedAppConnection)) {
                        return encryptedAppConnection
                    }
                    appConnection = await this.decryptConnection(encryptedAppConnection)
                    if (!await this.needRefresh(appConnection, log)) {
                        return appConnection
                    }
                    const refreshedAppConnection = await this.refresh(appConnection, projectId, log)
        
                    await appConnectionsRepo().update(refreshedAppConnection.id, {
                        status: AppConnectionStatus.ACTIVE,
                        value: await encryptUtils.encryptObject(refreshedAppConnection.value),
                    })
                    return refreshedAppConnection
                }
                catch (e) {
                    exceptionHandler.handle(e, log)
                    const isOAuth2Error = oauth2Util(log).isUserError(e)
                    const isCustomAuthError = e instanceof CustomAuthRefreshError
                    if (!isNil(appConnection) && (isOAuth2Error || isCustomAuthError)) {
                        appConnection.status = AppConnectionStatus.ERROR
                        await appConnectionsRepo().update(appConnection.id, {
                            status: appConnection.status,
                            updated: dayjs().toISOString(),
                        })
                    }
                }
                return appConnection
            },
        })
    },
    async decryptConnection(
        encryptedConnection: AppConnectionSchema,
    ): Promise<AppConnection> {
        const value = await encryptUtils.decryptObject<AppConnectionValue>(encryptedConnection.value)
        const connection: AppConnection = {
            ...encryptedConnection,
            value,
        }
        return connection
    },
    async needRefresh(connection: AppConnection, log: FastifyBaseLogger): Promise<boolean> {
        if (connection.status === AppConnectionStatus.ERROR) {
            return false
        }
        switch (connection.value.type) {
            case AppConnectionType.PLATFORM_OAUTH2:
            case AppConnectionType.CLOUD_OAUTH2:
            case AppConnectionType.OAUTH2:
                return oauth2Util(log).isExpired(connection.value)
            case AppConnectionType.CUSTOM_AUTH: {
                // Once a token exists, check expiry without a metadata lookup.
                if (!isNil(connection.value.access_token)) {
                    return isCustomAuthTokenStale(connection.value)
                }
                // No token yet — only dispatch a refresh job if the piece implements onRefreshToken.
                // Cache the result per piece version to avoid a metadata round-trip on every execution.
                const cacheKey = pieceRefreshSupportCacheKey(connection)
                const cached = pieceRefreshSupportCache.get(cacheKey)
                if (!isNil(cached)) {
                    return cached
                }
                const pieceMetadata = await pieceMetadataService(log).getOrThrow({
                    name: connection.pieceName,
                    version: connection.pieceVersion,
                    platformId: connection.platformId,
                })
                const auth = Array.isArray(pieceMetadata.auth) ? pieceMetadata.auth[0] : pieceMetadata.auth
                const hasRefresh = auth?.type === PropertyType.CUSTOM_AUTH && !isNil(auth.refresh)
                pieceRefreshSupportCache.set(cacheKey, hasRefresh)
                return hasRefresh
            }
            default:
                return false
        }
    },
})


const TOKEN_REFRESH_BUFFER_SECONDS = 15 * 60
const pieceRefreshSupportCache: LRU<boolean> = lru(1000, 0)

export function isCustomAuthTokenStale(value: { access_token?: string, token_refresh_at?: number }): boolean {
    if (isNil(value.access_token)) return true
    if (isNil(value.token_refresh_at)) return false
    return dayjs().unix() >= value.token_refresh_at
}

// Returns the unix timestamp at which the token should be refreshed: 15 minutes
// before expiry, but never earlier than half the token's lifetime — otherwise a
// token whose TTL is shorter than the buffer would be considered stale the instant
// it is minted, refreshing on every fetch and defeating the cache. `expiresIn <= 0`
// means the token never expires, so it never needs refreshing.
export function computeTokenRefreshAt(expiresIn: number): number | undefined {
    if (expiresIn <= 0) {
        return undefined
    }
    const buffer = Math.min(TOKEN_REFRESH_BUFFER_SECONDS, Math.floor(expiresIn / 2))
    return dayjs().unix() + expiresIn - buffer
}

function pieceRefreshSupportCacheKey(connection: Pick<AppConnection, 'platformId' | 'pieceName' | 'pieceVersion'>): string {
    return `${connection.platformId}:${connection.pieceName}@${connection.pieceVersion}`
}

class CustomAuthRefreshError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'CustomAuthRefreshError'
    }
}

async function handleLockedVersion(flow: PopulatedFlow, userId: UserId, projectId: ProjectId, platformId: PlatformId, appConnection: AppConnectionWithoutSensitiveData, newAppConnection: AppConnectionWithoutSensitiveData, log: FastifyBaseLogger) {
    if (isNil(flow.publishedVersionId)) {
        return
    }

    const lastPublishedVersion = await flowVersionService(log).getLatestVersion(flow.id, FlowVersionState.LOCKED)
    assertNotNullOrUndefined(lastPublishedVersion, `Last published version not found for flow ${flow.id}`)

    await flowService(log).update({
        id: flow.id,
        projectId,
        platformId,
        userId,
        operation: {
            type: FlowOperationType.IMPORT_FLOW,
            request: replaceConnectionInFlowVersion(lastPublishedVersion, appConnection, newAppConnection),
        },
    })

    await flowService(log).update({
        id: flow.id,
        projectId,
        platformId,
        userId,
        operation: {
            type: FlowOperationType.LOCK_AND_PUBLISH,
            request: {},
        },
    })
}

async function handleDraftVersion(flow: Flow, userId: UserId, projectId: ProjectId, platformId: PlatformId, appConnection: AppConnectionWithoutSensitiveData, newAppConnection: AppConnectionWithoutSensitiveData, log: FastifyBaseLogger) {
    const latestVersion = await flowVersionService(log).getFlowVersionOrThrow({
        flowId: flow.id,
        versionId: undefined,
    })

    // Nothing to do if the latest version no longer references the old connection
    // (e.g. it was just republished onto the new one). Otherwise IMPORT_FLOW will
    // transparently create a draft from a published version and rewrite it, so the
    // draft always ends up on the new connection even for never-edited published flows.
    if (!latestVersion.connectionIds.includes(appConnection.externalId)) {
        return
    }

    await flowService(log).update({
        id: flow.id,
        projectId,
        platformId,
        userId,
        operation: {
            type: FlowOperationType.IMPORT_FLOW,
            request: replaceConnectionInFlowVersion(latestVersion, appConnection, newAppConnection),
        },
    })
}
function replaceConnectionInFlowVersion(flowVersion: FlowVersion, appConnection: AppConnectionWithoutSensitiveData, newAppConnection: AppConnectionWithoutSensitiveData) {
    return flowStructureUtil.transferFlow(flowVersion, (step) => {
        if (step.settings?.input?.auth?.includes(appConnection.externalId)) {
            return {
                ...step,
                settings: {
                    ...step.settings,
                    input: {
                        ...step.settings?.input,
                        auth: replaceConnectionIdInAuth(step.settings.input.auth, appConnection.externalId, newAppConnection.externalId),
                    },
                },
            }
        }
        return step
    })
}

function replaceConnectionIdInAuth(auth: string, oldConnectionId: string, newConnectionId: string): string {
    return auth.replace(
        new RegExp(`connections\\['${oldConnectionId}'\\]`, 'g'),
        `connections['${newConnectionId}']`,
    )
}

type UpdateFlowsWithAppConnectionParams = {
    appConnection: AppConnectionWithoutSensitiveData
    newAppConnection: AppConnectionWithoutSensitiveData
    userId: UserId
    applyToPublishedVersions: boolean
}

type CountPublishedFlowsParams = {
    projectId: ProjectId
    externalId: string
    applyToPublishedVersions: boolean
}
