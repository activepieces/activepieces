import { ProjectOperationType, ProjectSyncError } from '@activepieces/ee-shared'
import { Action, ActionType, ConnectionState, FileCompression, FileId, FileType, FlowStatus, isNil, LoopOnItemsAction, PieceActionSettings, PieceTriggerSettings, ProjectId, ProjectState, RouterAction, Trigger, TriggerType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { appConnectionService } from '../../../app-connection/app-connection-service/app-connection-service'
import { fileService } from '../../../file/file.service'
import { flowRepo } from '../../../flows/flow/flow.repo'
import { flowService } from '../../../flows/flow/flow.service'
import { ProjectOperation } from './project-diff.service'
import { projectStateHelper } from './project-state-helper'

export const projectStateService = (log: FastifyBaseLogger) => ({
    async apply({ projectId, operations, selectedFlowsIds, platformId }: ApplyProjectStateRequest): Promise<ApplyProjectStateResponse> {
        const publishJobs: Promise<ProjectSyncError | null>[] = []
        for (const operation of operations) {
            switch (operation.type) {
                case ProjectOperationType.UPDATE_FLOW: {
                    if (selectedFlowsIds.length > 0 && !selectedFlowsIds.includes(operation.newFlowState.id)) {
                        continue
                    }
                    const flowUpdated = await projectStateHelper(log).updateFlowInProject(operation.flowState, operation.newFlowState, projectId)
                    if (flowUpdated.status === FlowStatus.ENABLED) {
                        publishJobs.push(projectStateHelper(log).republishFlow(flowUpdated.id, projectId))
                    }
                    break
                }
                case ProjectOperationType.CREATE_FLOW: {
                    if (selectedFlowsIds.length > 0 && !selectedFlowsIds.includes(operation.flowState.id)) {
                        continue
                    }
                    await projectStateHelper(log).createFlowInProject(operation.flowState, projectId)
                    break
                }
                case ProjectOperationType.DELETE_FLOW: {
                    if (selectedFlowsIds.length > 0 && !selectedFlowsIds.includes(operation.flowState.id)) {
                        continue
                    }
                    await projectStateHelper(log).deleteFlowFromProject(operation.flowState.id, projectId)
                    break
                }
            }
        }

        const connectionStates = await this.getFlowConnections(operations)

        for (const connection of connectionStates) {
            await appConnectionService(log).createPlaceholder({
                projectId,
                platformId,
                externalId: connection.externalId,
                pieceName: connection.pieceName,
                displayName: connection.displayName,
            })
        }
    
        return {
            errors: [],
        }
    },
    async save(projectId: ProjectId, name: string, log: FastifyBaseLogger): Promise<FileId> {
        const fileToSave: ProjectState = await this.getCurrentState(projectId, log)

        const fileData = Buffer.from(JSON.stringify(fileToSave))

        const file = await fileService(log).save({
            projectId,
            type: FileType.PROJECT_RELEASE,
            fileName: `${name}.json`,
            size: fileData.byteLength,
            data: fileData,
            compression: FileCompression.NONE,
        })
        return file.id
    },
    async getStateFromRelease(projectId: ProjectId, fileId: FileId, log: FastifyBaseLogger): Promise<ProjectState> {
        const file = await fileService(log).getFileOrThrow({
            projectId,
            fileId,
            type: FileType.PROJECT_RELEASE,
        })
        return JSON.parse(file.data.toString()) as ProjectState
    },
    async getCurrentState(projectId: ProjectId, log: FastifyBaseLogger): Promise<ProjectState> {
        const flows = await flowRepo().find({
            where: {
                projectId,
            },
        })
        const allPopulatedFlows = await Promise.all(flows.map(async (flow) => {
            return flowService(log).getOnePopulatedOrThrow({
                id: flow.id,
                projectId,
            })
        }))
        return {
            flows: allPopulatedFlows,
        }
    },
    async getFlowConnections(operations: ProjectOperation[]): Promise<ConnectionState[]> {
        const connectionStates = await Promise.all(operations.map(async (operation) => {
            switch (operation.type) {
                case ProjectOperationType.CREATE_FLOW:
                    return getFlowConnections(operation.flowState.version.trigger)
                case ProjectOperationType.UPDATE_FLOW:
                    return getFlowConnections(operation.newFlowState.version.trigger)
                case ProjectOperationType.DELETE_FLOW:
                    return []
            }
        })).then(arrays => arrays.flat())

        const uniqueConnections = new Map<string, ConnectionState>()
        connectionStates.forEach(connection => {
            uniqueConnections.set(connection.externalId, connection)
        })

        return Array.from(uniqueConnections.values())
    },

})

async function getFlowConnections(step: Action | Trigger): Promise<ConnectionState[]> {
    if (step === null) {
        return []
    }
    const connectionsIds: ConnectionState[] = []

    switch (step.type) {
        case ActionType.CODE: {
            break
        }
        case ActionType.LOOP_ON_ITEMS: {
            const firstLoopAction = (step as LoopOnItemsAction).firstLoopAction
            if (firstLoopAction) {
                connectionsIds.push(...(await getFlowConnections(firstLoopAction)))
            }
            break
        }
        case ActionType.ROUTER:{
            const children = (step as RouterAction).children
            for (const child of children) {
                if (isNil(child)) {
                    continue
                }
                connectionsIds.push(...(await getFlowConnections(child)))
            }
            break
        }
        case ActionType.PIECE:{
            const input = (step.settings as PieceActionSettings).input as Record<string, unknown>
            const pieceName = (step.settings as PieceActionSettings).pieceName
            Object.values(input).forEach(value => {
                if (typeof value === 'string') {
                    const match = value.match(/{{connections\['([^']+)']}}/)
                    if (match) {
                        connectionsIds.push({
                            externalId: match[1],
                            pieceName,
                            displayName: step.displayName,
                        })
                    }
                }
            })
            break
        }
        case TriggerType.EMPTY:{
            break
        }
        case TriggerType.PIECE: {
            const triggerInput = (step.settings as PieceTriggerSettings).input as Record<string, unknown>
            const triggerPieceName = (step.settings as PieceTriggerSettings).pieceName
            Object.values(triggerInput).forEach(value => {
                if (typeof value === 'string') {
                    const match = value.match(/{{connections\['([^']+)']}}/)
                    if (match) {
                        connectionsIds.push({
                            externalId: match[1],
                            pieceName: triggerPieceName,
                            displayName: step.displayName,
                        })
                    }
                }
            }) 
            break
        }
    }
    if (step.nextAction) {
        connectionsIds.push(...(await getFlowConnections(step.nextAction)))
    }

    return connectionsIds
}

type ApplyProjectStateResponse = {
    errors: ProjectSyncError[]
}

type ApplyProjectStateRequest = {
    projectId: string
    operations: ProjectOperation[]
    selectedFlowsIds: string[]
    log: FastifyBaseLogger
    platformId: string
}
