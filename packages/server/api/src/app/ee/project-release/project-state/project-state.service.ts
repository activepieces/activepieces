import { ProjectOperationType, ProjectSyncError } from '@activepieces/ee-shared'
import { FlowStatus, isNil } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { ProjectOperation } from '../project-diff/project-diff.service'
import { ProjectMappingState } from '../project-diff/project-mapping-state'
import { projectStateHelper } from './project-state-helper'

export const projectStateService = (log: FastifyBaseLogger) => ({
    async apply({ projectId, operations, mappingState, selectedOperations }: PullGitRepoRequest): Promise<PullGitRepoResponse> {
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
                        sourceId: operation.newStateFile.baseFilename,
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
                        sourceId: operation.state.baseFilename,
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
        const errors = (await Promise.all(publishJobs)).filter((f): f is ProjectSyncError => f !== null)
        return {
            mappingState: newMapState,
            errors,
        }
    },
})
type PullGitRepoResponse = {
    mappingState: ProjectMappingState
    errors: ProjectSyncError[]
}
type PullGitRepoRequest = {
    projectId: string
    operations: ProjectOperation[]
    mappingState: ProjectMappingState
    selectedOperations?: string[]
}
