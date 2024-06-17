import { databaseConnection } from '../../database/database-connection'
import { flowService } from '../../flows/flow/flow.service'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { projectService } from '../../project/project-service'
import { gitHelper } from './git-helper'
import { GitRepoEntity } from './git-repo.entity'
import { gitSyncHelper } from './git-sync-helper'
import { projectDiffService, ProjectOperation } from './project-diff/project-diff.service'
import { ProjectMappingState } from './project-diff/project-mapping-state'
import {
    ConfigureRepoRequest,
    GitPushOperationType,
    GitRepo,
    ProjectOperationType,
    ProjectSyncError,
    ProjectSyncPlan,
    ProjectSyncPlanOperation, PushGitRepoRequest,
} from '@activepieces/ee-shared'
import {
    ActivepiecesError,
    apId,
    ErrorCode,
    FlowStatus,
    isNil,
    SeekPage,
} from '@activepieces/shared'

const repo = databaseConnection.getRepository(GitRepoEntity)

export const gitRepoService = {
    async upsert(request: ConfigureRepoRequest): Promise<GitRepo> {
        const existingRepo = await repo.findOneBy({ projectId: request.projectId })
        const id = existingRepo?.id ?? apId()
        await repo.upsert(
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
        return repo.findOneByOrFail({ id })
    },
    async getOneByProjectOrThrow({ projectId }: { projectId: string }): Promise<GitRepo> {
        const gitRepo = await repo.findOneByOrFail({ projectId })
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
        const gitRepo = await repo.findOneByOrFail({ id })
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
        const repos = await repo.findBy({ projectId })
        return paginationHelper.createPage<GitRepo>(repos, null)
    },
    async push({ id, userId, request }: PushParams): Promise<void> {
        const gitRepo = await gitRepoService.getOrThrow({ id })
        const { git, flowFolderPath } = await gitHelper.createGitRepoAndReturnPaths(gitRepo, userId)
        const project = await projectService.getOneOrThrow(gitRepo.projectId)
        const mappingState = gitRepo.mapping ? new ProjectMappingState(gitRepo.mapping) : ProjectMappingState.empty()
        switch (request.type) {
            case GitPushOperationType.PUSH_FLOW: {
                const flow = await flowService.getOnePopulatedOrThrow({
                    id: request.flowId,
                    projectId: project.id,
                })
                const flowName = mappingState.findSourceId(request.flowId) ?? request.flowId
                await gitSyncHelper.upsertFlowToGit(flowName, flow, flowFolderPath)
                await repo.update({ id: gitRepo.id }, {
                    mapping: mappingState.mapFlow({
                        sourceId: flowName,
                        targetId: flow.id,
                    }),
                })
                await gitHelper.commitAndPush(git, gitRepo, request.commitMessage ?? `chore: updated flow ${flow.id}`)
                break
            }
            case GitPushOperationType.DELETE_FLOW: {
                const mappingState = gitRepo.mapping ? new ProjectMappingState(gitRepo.mapping) : ProjectMappingState.empty()
                await repo.update({ id: gitRepo.id }, {
                    mapping: mappingState.deleteFlow(request.flowId),
                })
                await gitSyncHelper.deleteFlowFromGit(request.flowId, flowFolderPath)
                await gitHelper.commitAndPush(git, gitRepo, request.commitMessage ?? `chore: deleted flow ${request.flowId} from user interface`)
                break
            }
        }
    },
    async pull({ gitRepo, dryRun, userId }: PullGitRepoRequest): Promise<ProjectSyncPlan> {
        const project = await projectService.getOneOrThrow(gitRepo.projectId)
        const { flowFolderPath } = await gitHelper.createGitRepoAndReturnPaths(gitRepo, userId)
        const gitProjectState = await gitSyncHelper.getStateFromGit(flowFolderPath)
        const dbProjectState = await gitSyncHelper.getStateFromDB(project.id)
        const mappingState = (gitRepo.mapping ? new ProjectMappingState(gitRepo.mapping) : ProjectMappingState.empty()).clean({
            gitFiles: gitProjectState,
            projectFlows: dbProjectState,
        })
        const operations = projectDiffService.diff({
            gitFiles: gitProjectState,
            projectFlows: dbProjectState,
            mapping: mappingState,
        })
        if (dryRun) {
            return toResponse(operations)
        }
        let newMapState: ProjectMappingState = mappingState
        const publishJobs: Promise<ProjectSyncError | null>[] = []
        for (const operation of operations) {
            switch (operation.type) {
                case ProjectOperationType.UPDATE_FLOW: {
                    const flowUpdated = await gitSyncHelper.updateFlowInProject(operation.projectFlow.id, operation.gitFile.flow, gitRepo.projectId)
                    if (flowUpdated.status === FlowStatus.ENABLED) {
                        publishJobs.push(gitSyncHelper.republishFlow(flowUpdated.id, gitRepo.projectId))
                    }
                    newMapState = newMapState.mapFlow({
                        sourceId: operation.gitFile.baseFilename,
                        targetId: flowUpdated.id,
                    })
                    break
                }
                case ProjectOperationType.CREATE_FLOW: {
                    const flowCreated = await gitSyncHelper.createFlowInProject(operation.gitFile.flow, gitRepo.projectId)
                    newMapState = newMapState.mapFlow({
                        sourceId: operation.gitFile.baseFilename,
                        targetId: flowCreated.id,
                    })
                    break
                }
                case ProjectOperationType.DELETE_FLOW:
                    await gitSyncHelper.deleteFlowFromProject(operation.projectFlow.id, gitRepo.projectId)
                    newMapState = newMapState.deleteFlow(operation.projectFlow.id)
                    break
            }
        }
        await repo.update({ id: gitRepo.id }, { mapping: newMapState })
        const errors = (await Promise.all(publishJobs)).filter((f): f is ProjectSyncError => f !== null)
        return toResponse(operations, errors)
    },
    async delete({ id, projectId }: DeleteParams): Promise<void> {
        const gitRepo = await repo.findOneBy({ id, projectId })
        if (isNil(gitRepo)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityId: id,
                    entityType: 'git-repo',
                },
            })
        }
        await repo.delete({ id, projectId })
    },
}

function toResponse(operations: ProjectOperation[], errors: ProjectSyncError[] = []): ProjectSyncPlan {
    const responsePlans: ProjectSyncPlanOperation[] = operations.map((operation) => {
        switch (operation.type) {
            case ProjectOperationType.DELETE_FLOW:
                return {
                    type: operation.type,
                    flow: {
                        id: operation.projectFlow.id,
                        displayName: operation.projectFlow.version.displayName,
                    },
                }
            case ProjectOperationType.CREATE_FLOW:
                return {
                    type: operation.type,
                    flow: {
                        id: operation.gitFile.baseFilename,
                        displayName: operation.gitFile.flow.version.displayName,
                    },
                }
            case ProjectOperationType.UPDATE_FLOW:
                return {
                    type: operation.type,
                    flow: {
                        id: operation.gitFile.flow.id,
                        displayName: operation.gitFile.flow.version.displayName,
                    },
                    targetFlow: {
                        id: operation.projectFlow.id,
                        displayName: operation.projectFlow.version.displayName,
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
}
