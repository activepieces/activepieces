import { ActivepiecesError, ApEnvironment, AppConnection, AppConnectionStatus, AppConnectionType, AppConnectionValue, AppConnectionWithoutSensitiveData, assertNotNullOrUndefined, CustomAuthConnectionValue, EngineResponse, EngineResponseStatus, ErrorCode, ExecuteRefreshAuthResponse, Flow, FlowOperationType, flowStructureUtil, FlowVersion, FlowVersionState, isNil, PlatformId, PopulatedFlow, ProjectId, UserId, WorkerJobType } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { ArrayContains } from 'typeorm'
import { distributedLock } from '../../database/redis-connections'
import { flowService } from '../../flows/flow/flow.service'
import { flowVersionService } from '../../flows/flow-version/flow-version.service'
import { encryptUtils } from '../../helper/encryption'
import { exceptionHandler } from '../../helper/exception-handler'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { getPiecePackageWithoutArchive, pieceMetadataService } from '../../pieces/metadata/piece-metadata-service'
import { projectService } from '../../project/project-service'
import { userInteractionWatcher } from '../../workers/user-interaction-watcher'
import { AppConnectionSchema } from '../app-connection.entity'
import { appConnectionsRepo } from './app-connection-service'
import { oauth2Handler } from './oauth2'
import { oauth2Util } from './oauth2/oauth2-util'

export const appConnectionHandler = (log: FastifyBaseLogger) => ({
    async updateFlowsWithAppConnection(flows: PopulatedFlow[], params: UpdateFlowsWithAppConnectionParams): Promise<void> {
        const { appConnection, newAppConnection, userId } = params

        await Promise.all(flows.map(async (flow) => {
            const project = await projectService(log).getOneOrThrow(flow.projectId)
            const lastVersion = await flowVersionService(log).getFlowVersionOrThrow({
                flowId: flow.id,
                versionId: undefined,
            })
            // Don't Change the order of the following two functions
            await handleLockedVersion(flow, userId, flow.projectId, project.platformId, appConnection, newAppConnection, log)
            await handleDraftVersion(flow, lastVersion, userId, flow.projectId, project.platformId, appConnection, newAppConnection, log)
        }))
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
                const refreshResult = await refreshCustomAuth({
                    connection,
                    projectId,
                    log,
                })
                const refreshedProps = (refreshResult.value as CustomAuthConnectionValue).props
                connection.value = {
                    ...connection.value,
                    props: refreshedProps,
                    nextRefreshEpochMs: refreshResult.nextRefreshEpochMs,
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
                    const isCustomAuth = !isNil(appConnection) && appConnection.value.type === AppConnectionType.CUSTOM_AUTH
                    if (!isNil(appConnection) && (oauth2Util(log).isUserError(e) || isCustomAuth)) {
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
            case AppConnectionType.CUSTOM_AUTH:
                return (
                    !isNil(connection.value.nextRefreshEpochMs) &&
                    dayjs().valueOf() >= connection.value.nextRefreshEpochMs - 15 * 60 * 1000
                )
            default:
                return false
        }
    },
})


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

async function handleDraftVersion(flow: Flow, lastVersion: FlowVersion, userId: UserId, projectId: ProjectId, platformId: PlatformId, appConnection: AppConnectionWithoutSensitiveData, newAppConnection: AppConnectionWithoutSensitiveData, log: FastifyBaseLogger) {
    if (lastVersion.state !== FlowVersionState.DRAFT) {
        return
    }

    await flowService(log).update({
        id: flow.id,
        projectId,
        platformId,
        userId,
        operation: {
            type: FlowOperationType.IMPORT_FLOW,
            request: replaceConnectionInFlowVersion(lastVersion, appConnection, newAppConnection),
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

async function refreshCustomAuth({
    connection,
    projectId,
    log,
}: {
    connection: AppConnection
    projectId: ProjectId
    log: FastifyBaseLogger
}): Promise<ExecuteRefreshAuthResponse> {
    const environment = system.getOrThrow(AppSystemProp.ENVIRONMENT)
    if (environment === ApEnvironment.TESTING) {
        return { value: connection.value }
    }

    const pieceMetadata = await pieceMetadataService(log).getOrThrow({
        name: connection.pieceName,
        version: undefined,
        platformId: connection.platformId,
    })

    const engineResponse = await userInteractionWatcher.submitAndWaitForResponse<EngineResponse<ExecuteRefreshAuthResponse>>({
        piece: await getPiecePackageWithoutArchive(log, connection.platformId, {
            pieceName: connection.pieceName,
            pieceVersion: pieceMetadata.version,
        }),
        projectId,
        platformId: connection.platformId,
        connectionValue: connection.value,
        jobType: WorkerJobType.EXECUTE_REFRESH,
    }, log)

    if (engineResponse.status !== EngineResponseStatus.OK) {
        log.error({ engineResponse }, 'Engine refresh auth failed')
        throw new ActivepiecesError({
            code: ErrorCode.ENGINE_OPERATION_FAILURE,
            params: {
                message: 'Failed to run engine refresh auth',
                context: engineResponse,
            },
        })
    }

    return engineResponse.response
}

type UpdateFlowsWithAppConnectionParams = {
    appConnection: AppConnectionWithoutSensitiveData
    newAppConnection: AppConnectionWithoutSensitiveData
    userId: UserId
}
