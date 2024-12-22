import { ProjectOperationType, ProjectSyncError } from '@activepieces/ee-shared'
import { FileCompression, FileId, FileType, FlowStatus, isNil, PopulatedFlow, ProjectId, StateFile } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { fileService } from '../../../file/file.service'
import { flowRepo } from '../../../flows/flow/flow.repo'
import { flowService } from '../../../flows/flow/flow.service'
import { projectService } from '../../../project/project-service'
import { ProjectOperation } from '../project-diff/project-diff.service'
import { ProjectMappingState } from '../project-diff/project-mapping-state'
import { projectStateHelper } from './project-state-helper'

export const projectStateService = (log: FastifyBaseLogger) => ({
    async apply({ projectId, operations, mappingState, selectedOperations }: PullGitRepoRequest): Promise<ApplyProjectStateResponse> {
        let newMapState: ProjectMappingState = mappingState
        const publishJobs: Promise<ProjectSyncError | null>[] = []
        for (const operation of operations) {
            switch (operation.type) {
                case ProjectOperationType.UPDATE_FLOW: {
                    if (!isNil(selectedOperations) && !selectedOperations.includes(operation.newStateFile.flow.id)) {
                        continue
                    }
                    const flowUpdated = await projectStateHelper(log).updateFlowInProject(operation.oldStateFile.flow, operation.newStateFile.flow, projectId)
                    if (flowUpdated.status === FlowStatus.ENABLED) {
                        publishJobs.push(projectStateHelper(log).republishFlow(flowUpdated.id, projectId))
                    }
                    newMapState = newMapState.mapFlow({
                        sourceId: operation.newStateFile.flow.id,
                        targetId: flowUpdated.id,
                    })
                    break
                }
                case ProjectOperationType.CREATE_FLOW: {
                    if (!isNil(selectedOperations) && !selectedOperations.includes(operation.state.flow.id)) {
                        continue
                    }
                    const flowCreated = await projectStateHelper(log).createFlowInProject(operation.state.flow, projectId)
                    newMapState = newMapState.mapFlow({
                        sourceId: operation.state.flow.id,
                        targetId: flowCreated.id,
                    })
                    break
                }
                case ProjectOperationType.DELETE_FLOW: {
                    if (!isNil(selectedOperations) && !selectedOperations.includes(operation.state.flow.id)) {
                        continue
                    }
                    await projectStateHelper(log).deleteFlowFromProject(operation.state.flow.id, projectId)
                    newMapState = newMapState.deleteFlow(operation.state.flow.id)
                    break
                }
            }
        }
        await projectService.update(projectId, { mapping: newMapState })
        console.log('newMapState', newMapState)
        const errors = (await Promise.all(publishJobs)).filter((f): f is ProjectSyncError => f !== null)
        return {
            errors,
        }
    },
    async save(projectId: ProjectId, name: string, log: FastifyBaseLogger): Promise<FileId> {
        const fileToSave: StateFile[] = await this.getCurrentState(projectId, log)
        
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
    async getNewState(projectId: ProjectId, fileId: FileId, log: FastifyBaseLogger): Promise<StateFile[]> {
        const file = await fileService(log).getFileOrThrow({
            projectId,
            fileId,
            type: FileType.PROJECT_RELEASE,
        })
        return JSON.parse(file.data.toString())
    },
    async getCurrentState(projectId: ProjectId, log: FastifyBaseLogger): Promise<StateFile[]> {
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
        return allPopulatedFlows.map((f) => ({
            flow: f,
        }))
    },
    async getMappingState(projectId: ProjectId, stateOne: StateFile[], stateTwo: StateFile[]): Promise<ProjectMappingState> {
        const project = await projectService.getOneOrThrow(projectId)
        const mappingState = (project.mapping ? new ProjectMappingState(project.mapping) : ProjectMappingState.empty()).clean({
            stateOne,
            stateTwo,
        })
        return mappingState
    },
})

type ApplyProjectStateResponse = {
    errors: ProjectSyncError[]
}

type PullGitRepoRequest = {
    projectId: string
    operations: ProjectOperation[]
    mappingState: ProjectMappingState
    selectedOperations?: string[]
}
