import { AppConnectionScope, AppConnectionStatus, AppConnectionType, ConnectionOperationType, DiffState, FileCompression, FileId, FileType, FlowStatus, isNil, ProjectId, ProjectOperationType, ProjectState, ProjectSyncError } from '@activepieces/shared'
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
                    publishJobs.push(projectStateHelper(log).republishFlow({ flowId: flowUpdated.id, projectId, status: FlowStatus.ENABLED }))
                    break
                }
                case ProjectOperationType.CREATE_FLOW: {
                    if (!isNil(selectedFlowsIds) && !selectedFlowsIds.includes(operation.flowState.id)) {
                        continue
                    }
                    const flowCreated = await projectStateHelper(log).createFlowInProject(operation.flowState, projectId)
                    publishJobs.push(projectStateHelper(log).republishFlow({ flowId: flowCreated.id, projectId, status: FlowStatus.ENABLED }))
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
                    await appConnectionService(log).upsert({
                        scope: AppConnectionScope.PROJECT,
                        platformId,
                        projectIds: [projectId],
                        externalId: state.connectionState.externalId,
                        displayName: state.connectionState.displayName,
                        pieceName: state.connectionState.pieceName,
                        type: AppConnectionType.CUSTOM_AUTH,
                        status: AppConnectionStatus.MISSING,
                        value: {
                            type: AppConnectionType.CUSTOM_AUTH,
                            props: {},
                        },
                        ownerId: null,
                    })
                    break
                }
                case ConnectionOperationType.UPDATE_CONNECTION: {
                    const existingConnection = await appConnectionService(log).getOne({
                        externalId: state.newConnectionState.externalId,
                        platformId,
                        projectId,
                    })
                    if (!isNil(existingConnection)) {
                        await appConnectionService(log).update({
                            projectIds: [projectId],
                            platformId,
                            id: existingConnection.id,
                            scope: AppConnectionScope.PROJECT,
                            request: {
                                displayName: state.newConnectionState.displayName,
                                projectIds: null,
                            },
                        })
                    }
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
