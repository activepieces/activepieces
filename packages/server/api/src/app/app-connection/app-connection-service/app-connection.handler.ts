import { exceptionHandler } from '@activepieces/server-shared'
import { apId, AppConnection, AppConnectionStatus, AppConnectionType, AppConnectionValue, AppConnectionWithoutSensitiveData, flowStructureUtil, FlowVersionState, isNil, LATEST_SCHEMA_VERSION, PopulatedFlow, ProjectId, UserId } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { APArrayContains } from '../../database/database-connection'
import { flowVersionRepo, flowVersionService } from '../../flows/flow-version/flow-version.service'
import { encryptUtils } from '../../helper/encryption'
import { distributedLock } from '../../helper/lock'
import { AppConnectionSchema } from '../app-connection.entity'
import { appConnectionsRepo } from './app-connection-service'
import { oauth2Handler } from './oauth2'
import { oauth2Util } from './oauth2/oauth2-util'


export const appConnectionHandler = (log: FastifyBaseLogger) => ({
    async updateFlowsWithAppConnection(flows: PopulatedFlow[], params: UpdateFlowsWithAppConnectionParams): Promise<PopulatedFlow[]> {
        const { appConnection, newAppConnection, userId } = params

        const updatedFlowVersions = flows.map(flow => flowStructureUtil.transferFlow(flow.version, (step) => {
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
        }))
    
        await Promise.all(updatedFlowVersions.map(async (flowVersion) => {
            const lastVersion = await flowVersionService(log).getFlowVersionOrThrow({
                flowId: flowVersion.flowId,
                versionId: undefined,
            })
            if (lastVersion.state === FlowVersionState.LOCKED) {
                const newVersion = {
                    id: apId(),
                    displayName: flowVersion.displayName,
                    flowId: flowVersion.flowId,
                    trigger: flowVersion.trigger,
                    schemaVersion: isNil(flowVersion.schemaVersion) ? LATEST_SCHEMA_VERSION : flowVersion.schemaVersion + 1,
                    connectionIds: flowStructureUtil.extractConnectionIds(flowVersion),
                    updatedBy: userId,
                    valid: false,
                    state: FlowVersionState.DRAFT,
                }
                return flowVersionRepo().save(newVersion)
            }
            return flowVersionRepo().update(lastVersion.id, {
                trigger: JSON.parse(JSON.stringify(flowVersion.trigger)),
                connectionIds: flowStructureUtil.extractConnectionIds(flowVersion),
            })
        }))

        const updatedFlows = await Promise.all(flows.map(async (flow) => {
            const updatedVersion = updatedFlowVersions.find(v => v.id === flow.version.id)
            return updatedVersion ? { ...flow, version: updatedVersion } : null
        })).then(flows => flows.filter((flow): flow is NonNullable<typeof flow> => flow !== null))

        return updatedFlows
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


type UpdateFlowsWithAppConnectionParams = {
    appConnection: AppConnectionWithoutSensitiveData
    newAppConnection: AppConnectionWithoutSensitiveData
    userId: UserId
}
