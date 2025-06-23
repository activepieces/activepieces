import { ConnectionOperationType, DiffState, FileCompression, FileId, FileType, FlowStatus, isNil, ProjectId, ProjectOperationType, ProjectState, ProjectSyncError } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { appConnectionService } from '../../../app-connection/app-connection-service/app-connection-service'
import { fileService } from '../../../file/file.service'
import { flowRepo } from '../../../flows/flow/flow.repo'
import { flowService } from '../../../flows/flow/flow.service'
import { projectStateHelper } from './project-state-helper'

export const projectStateService = (log: FastifyBaseLogger) => ({
    async apply({ projectId, diffs, selectedFlowsIds, platformId }: ApplyProjectStateRequest): Promise<void> {
        const { operations, connections } = diffs
        const publishJobs: Promise<ProjectSyncError | null>[] = []
        for (const operation of operations) {
            switch (operation.type) {
                case ProjectOperationType.UPDATE_FLOW: {
                    if (!isNil(selectedFlowsIds) && !selectedFlowsIds.includes(operation.newFlowState.id)) {
                        continue
                    }
                    const flowUpdated = await projectStateHelper(log).updateFlowInProject(operation.flowState, operation.newFlowState, projectId)
                    if (operation.newFlowState.status === FlowStatus.ENABLED) {
                        publishJobs.push(projectStateHelper(log).republishFlow({ flowId: flowUpdated.id, projectId, status: operation.newFlowState.status }))
                    }
                    break
                }
                case ProjectOperationType.CREATE_FLOW: {
                    if (!isNil(selectedFlowsIds) && !selectedFlowsIds.includes(operation.flowState.id)) {
                        continue
                    }
                    const flowCreated = await projectStateHelper(log).createFlowInProject(operation.flowState, projectId)
                    if (operation.flowState.status === FlowStatus.ENABLED) {
                        publishJobs.push(projectStateHelper(log).republishFlow({ flowId: flowCreated.id, projectId, status: operation.flowState.status }))
                    }
                    break
                }
                case ProjectOperationType.DELETE_FLOW: {
                    if (!isNil(selectedFlowsIds) && !selectedFlowsIds.includes(operation.flowState.id)) {
                        continue
                    }
                    await projectStateHelper(log).deleteFlowFromProject(operation.flowState.id, projectId)
                    break
                }
            }
        }

        for (const state of connections) {
            switch (state.type) {
                case ConnectionOperationType.CREATE_CONNECTION: {
                    await appConnectionService(log).upsertMissingConnection({
                        projectId,
                        platformId,
                        externalId: state.connectionState.externalId,
                        pieceName: state.connectionState.pieceName,
                        displayName: state.connectionState.displayName,
                    })
                    break
                }
                case ConnectionOperationType.UPDATE_CONNECTION: {
                    await appConnectionService(log).upsertMissingConnection({
                        projectId,
                        platformId,
                        externalId: state.newConnectionState.externalId,
                        pieceName: state.newConnectionState.pieceName,
                        displayName: state.newConnectionState.displayName,
                    })
                    break
                }
            }
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
        const connections = await appConnectionService(log).getManyConnectionStates({
            projectId,
        })
        return {
            flows: allPopulatedFlows,
            connections,
        }
    },
})

type ApplyProjectStateRequest = {
    projectId: string
    diffs: DiffState
    selectedFlowsIds: string[] | null
    log: FastifyBaseLogger
    platformId: string
}
