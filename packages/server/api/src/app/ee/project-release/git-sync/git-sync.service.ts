import {
    ConfigureRepoRequest,
    GitBranchType,
    GitPushOperationType,
    GitRepo,
    ProjectOperationType,
    ProjectSyncError,
    ProjectSyncPlan,
    ProjectSyncPlanOperation, PushGitRepoRequest,
} from '@activepieces/ee-shared'
import {
    ActivepiecesError,
    ApEdition,
    apId,
    ErrorCode,
    isNil,
    SeekPage,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../../core/db/repo-factory'
import { flowService } from '../../../flows/flow/flow.service'
import { paginationHelper } from '../../../helper/pagination/pagination-utils'
import { system } from '../../../helper/system/system'
import { projectService } from '../../../project/project-service'
import { projectDiffService, ProjectOperation } from '../project-diff/project-diff.service'
import { ProjectMappingState } from '../project-diff/project-mapping-state'
import { projectStateHelper } from '../project-state/project-state-helper'
import { projectStateService } from '../project-state/project-state.service'
import { gitHelper } from './git-helper'
import { gitSyncHelper } from './git-sync-helper'
import { GitRepoEntity } from './git-sync.entity'

const repo = repoFactory(GitRepoEntity)

export const gitRepoService = (log: FastifyBaseLogger) => ({
    async upsert(request: ConfigureRepoRequest): Promise<GitRepo> {
        await gitHelper.validateConnection(request)

        const existingRepo = await repo().findOneBy({ projectId: request.projectId })
        const id = existingRepo?.id ?? apId()
        await repo().upsert(
            {
                id,
                projectId: request.projectId,
                sshPrivateKey: request.sshPrivateKey,
                branch: request.branch,
                branchType: request.branchType,
                remoteUrl: request.remoteUrl,
                slug: request.slug,
            },
            ['projectId'],
        )
        return repo().findOneByOrFail({ id })
    },
    async getOneByProjectOrThrow({ projectId }: { projectId: string }): Promise<GitRepo> {
        const gitRepo = await repo().findOneByOrFail({ projectId })
        if (isNil(gitRepo)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityType: 'git-repo',
                },
            })
        }
        return gitRepo
    },
    async getOrThrow({ id }: { id: string }): Promise<GitRepo> {
        const gitRepo = await repo().findOneByOrFail({ id })
        if (isNil(gitRepo)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityId: id,
                    entityType: 'git-repo',
                },
            })
        }
        return gitRepo
    },
    async list({ projectId }: { projectId: string }): Promise<SeekPage<GitRepo>> {
        const repos = await repo().findBy({ projectId })
        return paginationHelper.createPage<GitRepo>(repos, null)
    },
    async onFlowDeleted({ flowId, userId, projectId }: { flowId: string, userId: string, projectId: string }): Promise<void> {
        const edition = system.getEdition()
        if (![ApEdition.CLOUD, ApEdition.ENTERPRISE].includes(edition)) {
            return
        }
        const gitRepo = await repo().findOneBy({ projectId })
        if (isNil(gitRepo) || gitRepo.branchType === GitBranchType.PRODUCTION) {
            return
        }
        await this.push({
            id: gitRepo.id,
            userId,
            request: {
                type: GitPushOperationType.DELETE_FLOW,
                commitMessage: `chore: deleted flow ${flowId}`,
                flowId,
            },
        })
    },
    async push({ id, userId, request }: PushParams): Promise<void> {
        const gitRepo = await this.getOrThrow({ id })
        const { git, flowFolderPath } = await gitHelper.createGitRepoAndReturnPaths(gitRepo, userId)
        const project = await projectService.getOneOrThrow(gitRepo.projectId)
        const mappingState = project.mapping ? new ProjectMappingState(project.mapping) : ProjectMappingState.empty()
        switch (request.type) {
            case GitPushOperationType.PUSH_FLOW: {
                const flow = await flowService(log).getOnePopulatedOrThrow({
                    id: request.flowId,
                    projectId: project.id,
                    removeConnectionsName: false,
                    removeSampleData: true,
                })
                const flowName = mappingState.findSourceId(request.flowId) ?? request.flowId
                await gitSyncHelper().upsertFlowToGit(flowName, flow, flowFolderPath)
                await projectService.update(project.id, { mapping: mappingState.mapFlow({
                    sourceId: flowName,
                    targetId: flow.id,
                }) })
                await gitHelper.commitAndPush(git, gitRepo, request.commitMessage ?? `chore: updated flow ${flow.id}`)
                break
            }
            case GitPushOperationType.DELETE_FLOW: {
                const mappingState = project.mapping ? new ProjectMappingState(project.mapping) : ProjectMappingState.empty()
                await projectService.update(project.id, { mapping: mappingState.deleteFlow(request.flowId) })

                const sourceFlowId = mappingState.findSourceId(request.flowId)
                if (isNil(sourceFlowId)) {
                    break
                }
                const deleted = await gitSyncHelper().deleteFlowFromGit(sourceFlowId, flowFolderPath)
                if (deleted) {
                    await gitHelper.commitAndPush(git, gitRepo, request.commitMessage ?? `chore: deleted flow ${request.flowId} from user interface`)
                }
                break
            }
        }
    },
    async pull({ gitRepo, dryRun, userId, selectedOperations }: PullGitRepoRequest): Promise<ProjectSyncPlan> {
        const project = await projectService.getOneOrThrow(gitRepo.projectId)
        const { flowFolderPath } = await gitHelper.createGitRepoAndReturnPaths(gitRepo, userId)
        const gitProjectState = await gitSyncHelper().getStateFromGit(flowFolderPath)
        const dbProjectState = await projectStateHelper(log).getStateFromDB(project.id)
        const mappingState = (project.mapping ? new ProjectMappingState(project.mapping) : ProjectMappingState.empty()).clean({
            gitFiles: gitProjectState,
            projectFlows: dbProjectState,
        })
        const operations = projectDiffService.diff({
            newState: gitProjectState,
            oldState: dbProjectState,
            mapping: mappingState,
        })
        if (dryRun) {
            return toResponse(operations)
        }
        const { mappingState: newMapState, errors } = await projectStateService(log).apply({ projectId: gitRepo.projectId, operations, mappingState, selectedOperations })
        await projectService.update(project.id, { mapping: newMapState })
        return toResponse(operations, errors)
    },
    async delete({ id, projectId }: DeleteParams): Promise<void> {
        const gitRepo = await repo().findOneBy({ id, projectId })
        if (isNil(gitRepo)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityId: id,
                    entityType: 'git-repo',
                },
            })
        }
        await repo().delete({ id, projectId })
    },
})

function toResponse(operations: ProjectOperation[], errors: ProjectSyncError[] = []): ProjectSyncPlan {
    const responsePlans: ProjectSyncPlanOperation[] = operations.map((operation) => {
        switch (operation.type) {
            case ProjectOperationType.DELETE_FLOW:
                return {
                    type: operation.type,
                    flow: {
                        id: operation.state.flow.id,
                        displayName: operation.state.flow.version.displayName,
                    },
                }
            case ProjectOperationType.CREATE_FLOW:
                return {
                    type: operation.type,
                    flow: {
                        id: operation.state.baseFilename,
                        displayName: operation.state.flow.version.displayName,
                    },
                }
            case ProjectOperationType.UPDATE_FLOW:
                return {
                    type: operation.type,
                    flow: {
                        id: operation.newStateFile.flow.id,
                        displayName: operation.newStateFile.flow.version.displayName,
                    },
                    targetFlow: {
                        id: operation.oldStateFile.flow.id,
                        displayName: operation.oldStateFile.flow.version.displayName,
                    },
                }
        }
    })
    return {
        errors,
        operations: responsePlans,
    }
}

type PushParams = {
    id: string
    userId: string
    request: PushGitRepoRequest
}
type DeleteParams = {
    id: string
    projectId: string
}
type PullGitRepoRequest = {
    gitRepo: GitRepo
    userId: string
    dryRun: boolean
    selectedOperations?: string[]
}
