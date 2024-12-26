import { ProjectOperationType, ProjectSyncError } from '@activepieces/ee-shared'
import { assertNotNullOrUndefined, FileCompression, FileId, FileType, FlowStatus, ProjectId, ProjectReleaseType, ProjectState } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { fileService } from '../../../file/file.service'
import { flowRepo } from '../../../flows/flow/flow.repo'
import { flowService } from '../../../flows/flow/flow.service'
import { projectService } from '../../../project/project-service'
import { ProjectOperation } from '../project-diff/project-diff.service'
import { ProjectMappingState } from '../project-diff/project-mapping-state'
import { projectStateHelper } from './project-state-helper'
import { projectReleaseService } from '../project-release.service'

export const projectStateService = (log: FastifyBaseLogger) => ({
    async apply({ projectId, operations, mappingState, selectedFlowsIds, type, releaseId  }: ApplyProjectStateRequest): Promise<ApplyProjectStateResponse> {
        let newMapState: ProjectMappingState = mappingState
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
                    newMapState = newMapState.mapFlow({
                        sourceId: operation.newFlowState.id,
                        targetId: flowUpdated.id,
                    })
                    break
                }
                case ProjectOperationType.CREATE_FLOW: {
                    if (selectedFlowsIds.length > 0 && !selectedFlowsIds.includes(operation.flowState.id)) {
                        continue
                    }
                    const flowCreated = await projectStateHelper(log).createFlowInProject(operation.flowState, projectId)
                    newMapState = newMapState.mapFlow({
                        sourceId: operation.flowState.id,
                        targetId: flowCreated.id,
                    })
                    break
                }
                case ProjectOperationType.DELETE_FLOW: {
                    if (selectedFlowsIds.length > 0 && !selectedFlowsIds.includes(operation.flowState.id)) {
                        continue
                    }
                    await projectStateHelper(log).deleteFlowFromProject(operation.flowState.id, projectId)
                    newMapState = newMapState.deleteFlow(operation.flowState.id)
                    break
                }
            }
        }
        await updateProjectState(projectId, newMapState, type, log, releaseId)
        const errors = (await Promise.all(publishJobs)).filter((f): f is ProjectSyncError => f !== null)
        return {
            errors,
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
    async getProjectMappingState(projectId: ProjectId): Promise<ProjectMappingState> {
        const project = await projectService.getOneOrThrow(projectId)
        return project.mapping ? new ProjectMappingState(project.mapping) : ProjectMappingState.empty()
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
            mapping: await this.getProjectMappingState(projectId)
        }
    },
})

    async function updateProjectState(projectId: ProjectId, newMapState: ProjectMappingState, type: ProjectReleaseType, log: FastifyBaseLogger, releaseId?: string): Promise<void> {
    if (type === ProjectReleaseType.ROLLBACK) {
        assertNotNullOrUndefined(releaseId, 'releaseId is required for rollback')
        const projectRelease = await projectReleaseService.getOneOrThrow({
            projectId,
            id: releaseId,
        })
        const projectReleaseState = await projectStateService(log).getStateFromRelease(projectId, projectRelease.fileId, log)
        await projectService.update(projectId, { mapping: projectReleaseState.mapping })
        return
    }
    const cleanedMapState: ProjectMappingState = new ProjectMappingState({
        flows: Object.fromEntries(Object.entries(newMapState.flows).filter(([flowId, _]) => flowRepo().existsBy( { id: flowId }))),
    })
    await projectService.update(projectId, { mapping: cleanedMapState })
}

type ApplyProjectStateResponse = {
    errors: ProjectSyncError[]
}

type ApplyProjectStateRequest = {
    projectId: string
    operations: ProjectOperation[]
    mappingState: ProjectMappingState
    selectedFlowsIds: string[]
    type: ProjectReleaseType
    releaseId?: string
    log: FastifyBaseLogger
}
