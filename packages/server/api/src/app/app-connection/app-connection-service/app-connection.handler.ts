import { exceptionHandler } from '@activepieces/server-shared'
import { AppConnection, AppConnectionStatus, AppConnectionType, AppConnectionValue, AppConnectionWithoutSensitiveData, assertNotNullOrUndefined, FlowOperationType, flowStructureUtil, FlowVersion, FlowVersionState, isNil, PlatformId, PopulatedFlow, ProjectId, UserId } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { APArrayContains } from '../../database/database-connection'
import { flowService } from '../../flows/flow/flow.service'
import { flowVersionRepo, flowVersionService } from '../../flows/flow-version/flow-version.service'
import { encryptUtils } from '../../helper/encryption'
import { distributedLock } from '../../helper/lock'
import { projectService } from '../../project/project-service'
import { AppConnectionSchema } from '../app-connection.entity'
import { appConnectionsRepo } from './app-connection-service'
import { oauth2Handler } from './oauth2'
import { oauth2Util } from './oauth2/oauth2-util'

export const appConnectionHandler = (log: FastifyBaseLogger) => ({
    async updateFlowsWithAppConnection(flows: PopulatedFlow[], params: UpdateFlowsWithAppConnectionParams): Promise<void> {
        const { appConnection, newAppConnection, userId } = params

        await Promise.all(flows.map(async (flow) => {
            const project = await projectService.getOneOrThrow(flow.projectId)
            const lastVersion = await flowVersionService(log).getFlowVersionOrThrow({
                flowId: flow.id,
                versionId: undefined,
            })
            const lastDraftVersion = await flowVersionService(log).getLatestVersion(flow.id, FlowVersionState.DRAFT)

            // Don't Change the order of the following two functions
            await handleLockedVersion(flow, lastVersion, userId, flow.projectId, project.platformId, appConnection, newAppConnection, log)
            await handleDraftVersion(flow, lastVersion, lastDraftVersion, userId, flow.projectId, project.platformId, appConnection, newAppConnection, log)
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
            default:
                break
        }
        return connection
    },

    /**
 * We should make sure this is accessed only once, as a race condition could occur where the token needs to be
 * refreshed and it gets accessed at the same time, which could result in the wrong request saving incorrect data.
 */
    async  lockAndRefreshConnection({
        projectId,
        externalId,
        log,
    }: {
        projectId: ProjectId
        externalId: string
        log: FastifyBaseLogger
    }) {
        const refreshLock = await distributedLock.acquireLock({
            key: `${projectId}_${externalId}`,
            timeout: 20000,
            log,
        })

        let appConnection: AppConnection | null = null

        try {
            const encryptedAppConnection = await appConnectionsRepo().findOneBy({
                ...APArrayContains('projectIds', [projectId]),
                externalId,
            })
            if (isNil(encryptedAppConnection)) {
                return encryptedAppConnection
            }
            appConnection = this.decryptConnection(encryptedAppConnection)
            if (!this.needRefresh(appConnection, log)) {
                return appConnection
            }
            const refreshedAppConnection = await this.refresh(appConnection, projectId, log)

            await appConnectionsRepo().update(refreshedAppConnection.id, {
                status: AppConnectionStatus.ACTIVE,
                value: encryptUtils.encryptObject(refreshedAppConnection.value),
            })
            return refreshedAppConnection
        }
        catch (e) {
            exceptionHandler.handle(e, log)
            if (!isNil(appConnection) && oauth2Util(log).isUserError(e)) {
                appConnection.status = AppConnectionStatus.ERROR
                await appConnectionsRepo().update(appConnection.id, {
                    status: appConnection.status,
                    updated: dayjs().toISOString(),
                })
            }
        }
        finally {
            await refreshLock.release()
        }
        return appConnection
    },
    decryptConnection(
        encryptedConnection: AppConnectionSchema,
    ): AppConnection {
        const value = encryptUtils.decryptObject<AppConnectionValue>(encryptedConnection.value)
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
            default:
                return false
        }
    },
})


async function handleLockedVersion(flow: PopulatedFlow, lastVersion: FlowVersion, userId: UserId, projectId: ProjectId, platformId: PlatformId, appConnection: AppConnectionWithoutSensitiveData, newAppConnection: AppConnectionWithoutSensitiveData, log: FastifyBaseLogger) {
    if (isNil(flow.publishedVersionId)) {
        return
    }

    let newLastVersion = lastVersion
    if (lastVersion.state === FlowVersionState.LOCKED) {
        newLastVersion = await flowVersionService(log).createEmptyVersion(flow.id, {
            displayName: lastVersion.displayName,
        })
    }

    const lastPublishedVersion = lastVersion.state === FlowVersionState.LOCKED ? 
        lastVersion :
        await flowVersionService(log).getLatestVersion(flow.id, FlowVersionState.LOCKED)
    assertNotNullOrUndefined(lastPublishedVersion, `Last published version not found for flow ${flow.id}`)

    const updatedFlowVersion = getUpdatedTriggerFlowVersion(lastPublishedVersion, appConnection, newAppConnection)
    const updatedConnectionIds = flowStructureUtil.extractConnectionIds(updatedFlowVersion)

    const lastVersionWithArtifacts = {
        ...lastPublishedVersion,
        trigger: updatedFlowVersion.trigger,
        connectionIds: updatedConnectionIds,
    }
    await flowVersionService(log).applyOperation({
        userId,
        projectId,
        platformId,
        flowVersion: newLastVersion,
        userOperation: {
            type: FlowOperationType.IMPORT_FLOW,
            request: lastVersionWithArtifacts,
        },
    })

    await flowService(log).update({
        id: flow.id,
        projectId,
        platformId,
        lock: true,
        userId,
        operation: {
            type: FlowOperationType.LOCK_AND_PUBLISH,
            request: {},
        },
    })
}

async function handleDraftVersion(flow: PopulatedFlow, oldLastVersion: FlowVersion, lastDraftVersion: FlowVersion | null, userId: UserId, projectId: ProjectId, platformId: PlatformId, appConnection: AppConnectionWithoutSensitiveData, newAppConnection: AppConnectionWithoutSensitiveData, log: FastifyBaseLogger) {
    if (isNil(lastDraftVersion)) {
        return
    }

    if (oldLastVersion.state === FlowVersionState.LOCKED) {
        await flowVersionRepo().update(lastDraftVersion.id, {
            trigger: JSON.parse(JSON.stringify(oldLastVersion.trigger)),
            connectionIds: flowStructureUtil.extractConnectionIds(oldLastVersion),
        })
        return
    }
    const newLastVersion = await flowVersionService(log).createEmptyVersion(flow.id, {
        displayName: lastDraftVersion.displayName,
    })
    
    const updatedFlowVersion = getUpdatedTriggerFlowVersion(lastDraftVersion, appConnection, newAppConnection)
    const updatedConnectionIds = flowStructureUtil.extractConnectionIds(updatedFlowVersion)

    const lastDraftVersionWithArtifacts = {
        ...lastDraftVersion,
        trigger: updatedFlowVersion.trigger,
        connectionIds: updatedConnectionIds,
    }
    await flowVersionService(log).applyOperation({
        userId,
        projectId,
        platformId,
        flowVersion: newLastVersion,
        userOperation: {
            type: FlowOperationType.IMPORT_FLOW,
            request: lastDraftVersionWithArtifacts,
        },
    })
}

function getUpdatedTriggerFlowVersion(flowVersion: FlowVersion, appConnection: AppConnectionWithoutSensitiveData, newAppConnection: AppConnectionWithoutSensitiveData) {
    return flowStructureUtil.transferFlow(flowVersion, (step) => {
        if (step.settings?.input?.auth?.includes(appConnection.externalId)) {
            return {
                ...step,
                settings: {
                    ...step.settings,
                    input: {
                        ...step.settings?.input,
                        auth: step.settings.input.auth.replaceAll(appConnection.externalId, newAppConnection.externalId),
                    },
                },
            }
        }
        return step
    })
}

type UpdateFlowsWithAppConnectionParams = {
    appConnection: AppConnectionWithoutSensitiveData
    newAppConnection: AppConnectionWithoutSensitiveData
    userId: UserId
}
