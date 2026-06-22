import { assertNotNullOrUndefined, FlowVersionId, isNil, PlatformId, ProjectId, UserId } from '@activepieces/core-utils'
import { AppConnection, AppConnectionStatus, AppConnectionType, AppConnectionValue, AppConnectionWithoutSensitiveData, EngineResponse, EngineResponseStatus, ExecuteRefreshTokenAuthResponse, Flow, FlowOperationType, flowStructureUtil, FlowVersion, FlowVersionState, PopulatedFlow, WorkerJobType } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { ArrayContains, In } from 'typeorm'
import { distributedLock } from '../../database/redis-connections'
import { flowService } from '../../flows/flow/flow.service'
import { flowVersionRepo, flowVersionService } from '../../flows/flow-version/flow-version.service'
import { encryptUtils } from '../../helper/encryption'
import { exceptionHandler } from '../../helper/exception-handler'
import { getPiecePackageWithoutArchive } from '../../pieces/metadata/piece-metadata-service'
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

    async countPublishedFlowsReferencingConnection(flows: PopulatedFlow[], externalId: string): Promise<number> {
        const publishedVersionIds = flows
            .map((flow) => flow.publishedVersionId)
            .filter((id): id is FlowVersionId => !isNil(id))
        if (publishedVersionIds.length === 0) {
            return 0
        }
        return flowVersionRepo().createQueryBuilder('flow_version')
            .where({ id: In(publishedVersionIds) })
            .andWhere('flow_version."connectionIds" && :externalIds', { externalIds: [externalId] })
            .getCount()
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
                if (engineResponse.status !== EngineResponseStatus.OK) {
                    throw new Error(`Custom auth token refresh failed: ${engineResponse.error}`)
                }
                const refreshResult = engineResponse.response
                if (refreshResult.skipped) {
                    log.info({ pieceName: connection.pieceName }, '[custom-auth-refresh] piece has no refresh callback — skipping future refreshes')
                    connection.value = { ...connection.value, has_refresh_callback: false }
                }
                else {
                    log.info({ pieceName: connection.pieceName, expiresIn: refreshResult.expires_in }, '[custom-auth-refresh] token refreshed successfully')
                    connection.value = {
                        ...connection.value,
                        access_token: refreshResult.access_token,
                        token_expires_at: dayjs().unix() + refreshResult.expires_in,
                        has_refresh_callback: true,
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
        projectId,
        externalId,
        log,
    }: {
        projectId: ProjectId
        externalId: string
        log: FastifyBaseLogger
    }) {

        return distributedLock(log).runExclusive({
            key: `${projectId}_${externalId}`,
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
                    if (!this.needRefresh(appConnection, log)) {
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
                    const isCustomAuthError = !isNil(appConnection) && appConnection.value.type === AppConnectionType.CUSTOM_AUTH
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
    needRefresh(connection: AppConnection, log: FastifyBaseLogger): boolean {
        if (connection.status === AppConnectionStatus.ERROR) {
            return false
        }
        switch (connection.value.type) {
            case AppConnectionType.PLATFORM_OAUTH2:
            case AppConnectionType.CLOUD_OAUTH2:
            case AppConnectionType.OAUTH2:
                return oauth2Util(log).isExpired(connection.value)
            case AppConnectionType.CUSTOM_AUTH: {
                const stale = isCustomAuthTokenStale(connection.value)
                log.info({
                    pieceName: connection.pieceName,
                    externalId: connection.externalId,
                    hasRefreshCallback: connection.value.has_refresh_callback,
                    hasAccessToken: !!connection.value.access_token,
                    tokenExpiresAt: connection.value.token_expires_at,
                    stale,
                }, '[custom-auth-refresh] needRefresh check')
                return stale
            }
            default:
                return false
        }
    },
})


const TOKEN_REFRESH_BUFFER_SECONDS = 15 * 60

export function isCustomAuthTokenStale(value: { has_refresh_callback?: boolean, access_token?: string, token_expires_at?: number }): boolean {
    if (value.has_refresh_callback === false) {
        return false
    }
    if (isNil(value.access_token)) {
        return true
    }
    if (isNil(value.token_expires_at)) {
        return false
    }
    return dayjs().unix() + TOKEN_REFRESH_BUFFER_SECONDS >= value.token_expires_at
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
