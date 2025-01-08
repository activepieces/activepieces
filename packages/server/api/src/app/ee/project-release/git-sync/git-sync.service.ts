import {
    ConfigureRepoRequest,
    GitBranchType,
    GitPushOperationType,
    GitRepo,
    PushGitRepoRequest,
} from '@activepieces/ee-shared'
import {
    ActivepiecesError,
    ApEdition,
    apId,
    ErrorCode,
    isNil,
    ProjectState,
    SeekPage,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../../core/db/repo-factory'
import { flowService } from '../../../flows/flow/flow.service'
import { paginationHelper } from '../../../helper/pagination/pagination-utils'
import { system } from '../../../helper/system/system'
import { gitHelper } from './git-helper'
import { gitSyncHelper } from './git-sync-helper'
import { GitRepoEntity } from './git-sync.entity'

const repo = repoFactory(GitRepoEntity)

export const gitRepoService = (_log: FastifyBaseLogger) => ({
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
    async onFlowDeleted({ flowId, userId, projectId, log }: { flowId: string, userId: string, projectId: string, log: FastifyBaseLogger }): Promise<void> {
        const edition = system.getEdition()
        if (![ApEdition.CLOUD, ApEdition.ENTERPRISE].includes(edition)) {
            return
        }
        const gitRepo = await repo().findOneBy({ projectId })
        if (isNil(gitRepo) || gitRepo.branchType === GitBranchType.PRODUCTION) {
            return
        }
        await gitRepoService(log).push({
            id: gitRepo.id,
            userId,
            request: {
                type: GitPushOperationType.DELETE_FLOW,
                commitMessage: `chore: deleted flow ${flowId}`,
                flowIds: [flowId],
            },
            log,
        })
    },
    async push({ id, userId, request, log }: PushParams): Promise<void> {
        const gitRepo = await gitRepoService(log).getOrThrow({ id })
        const { git, flowFolderPath } = await gitHelper.createGitRepoAndReturnPaths(gitRepo, userId)
        switch (request.type) {
            case GitPushOperationType.PUSH_FLOW: {
                for (const flowId of request.flowIds) {
                    const flow = await flowService(log).getOnePopulatedOrThrow({
                        id: flowId,
                        projectId: gitRepo.projectId,
                        removeConnectionsName: false,
                        removeSampleData: true,
                    })
                    const flowName = flowId
                    await gitSyncHelper(log).upsertFlowToGit(flowName, flow, flowFolderPath)
                }
                await gitHelper.commitAndPush(git, gitRepo, request.commitMessage ?? `chore: updated flows ${request.flowIds.join(', ')}`)
                break
            }
            case GitPushOperationType.DELETE_FLOW: {
                const flow = await flowService(log).getOnePopulatedOrThrow({
                    id: request.flowIds[0],
                    projectId: gitRepo.projectId,
                })
                const externalId = flow.externalId
                if (isNil(externalId)) {
                    break
                }
                const deleted = await gitSyncHelper(log).deleteFlowFromGit(externalId, flowFolderPath)
                if (deleted) {
                    await gitHelper.commitAndPush(git, gitRepo, request.commitMessage ?? `chore: deleted flow ${request.flowIds[0]} from user interface`)
                }
                break
            }
        }
    },
    async getState({ gitRepo, userId, log }: PullGitRepoRequest): Promise<ProjectState> {
        const { flowFolderPath } = await gitHelper.createGitRepoAndReturnPaths(gitRepo, userId)
        return gitSyncHelper(log).getStateFromGit(flowFolderPath)
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

type PushParams = {
    id: string
    userId: string
    request: PushGitRepoRequest
    log: FastifyBaseLogger
}
type DeleteParams = {
    id: string
    projectId: string
}
type PullGitRepoRequest = {
    gitRepo: GitRepo
    userId: string
    log: FastifyBaseLogger
}
