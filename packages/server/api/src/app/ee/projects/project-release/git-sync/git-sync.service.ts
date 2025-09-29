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
import { repoFactory } from '../../../../core/db/repo-factory'
import { paginationHelper } from '../../../../helper/pagination/pagination-utils'
import { system } from '../../../../helper/system/system'
import { projectStateService } from '../project-state/project-state.service'
import { gitHelper } from './git-helper'
import { gitSyncHandler } from './git-sync-handler'
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
        const gitRepo = await repo().findOneBy({ projectId })
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
    async onDeleted({ type, externalId, userId, projectId, platformId, log }: { type: GitPushOperationType, externalId: string, userId: string, projectId: string, platformId: string, log: FastifyBaseLogger }): Promise<void> {
        const edition = system.getEdition()
        if (![ApEdition.CLOUD, ApEdition.ENTERPRISE].includes(edition)) {
            return
        }
        const gitRepo = await repo().findOneBy({ projectId })
        if (isNil(gitRepo) || gitRepo.branchType === GitBranchType.PRODUCTION) {
            return
        }
        switch (type) {
            case GitPushOperationType.DELETE_FLOW: {
                await gitRepoService(log).push({
                    id: gitRepo.id,
                    platformId,
                    userId,
                    request: {
                        type: GitPushOperationType.DELETE_FLOW,
                        commitMessage: `chore: deleted flow ${externalId}`,
                        externalFlowIds: [externalId],
                    },
                    log,
                })
                break
            }
            case GitPushOperationType.DELETE_TABLE: {
                await gitRepoService(log).push({
                    id: gitRepo.id,
                    platformId,
                    userId,
                    request: {
                        type: GitPushOperationType.DELETE_TABLE,
                        commitMessage: `chore: deleted table ${externalId}`,
                        externalTableIds: [externalId],
                    },
                    log,
                })
                break
            }
            case GitPushOperationType.DELETE_AGENT: {
                await gitRepoService(log).push({
                    id: gitRepo.id,
                    platformId,
                    userId,
                    request: {
                        type: GitPushOperationType.DELETE_AGENT,
                        commitMessage: `chore: deleted agent ${externalId}`,
                        externalAgentIds: [externalId],
                    },
                    log,
                })
                break
            }
            default:
                throw new ActivepiecesError({
                    code: ErrorCode.VALIDATION,
                    params: {
                        message: `Only supported operations are ${GitPushOperationType.DELETE_FLOW} and ${GitPushOperationType.DELETE_TABLE}`,
                    },
                })
        }
    },
    async push({ id, platformId, userId, request, log }: PushParams): Promise<void> {

        switch (request.type) {
            case GitPushOperationType.PUSH_EVERYTHING: {
                const gitRepo = await gitRepoService(log).getOrThrow({ id })
                const projectState = await projectStateService(log).getProjectState(gitRepo.projectId, log)
                const operations: PushGitRepoRequest[] = []
                if (!isNil(projectState.flows)) {
                    operations.push({
                        type: GitPushOperationType.PUSH_FLOW,
                        commitMessage: request.commitMessage ?? `chore: push all flows ${projectState.flows.map((flow) => flow.version.displayName).join(', ')}`,
                        externalFlowIds: projectState.flows.map((flow) => flow.externalId),
                    })
                }
                if (!isNil(projectState.tables)) {
                    operations.push({
                        type: GitPushOperationType.PUSH_TABLE,
                        commitMessage: request.commitMessage ?? `chore: push all tables ${projectState.tables.map((table) => table.name).join(', ')}`,
                        externalTableIds: projectState.tables.map((table) => table.externalId),
                    })
                }
                if (!isNil(projectState.agents)) {
                    operations.push({
                        type: GitPushOperationType.PUSH_AGENT,
                        commitMessage: request.commitMessage ?? `chore: push all agents ${projectState.agents.map((agent) => agent.displayName).join(', ')}`,
                        externalAgentIds: projectState.agents.map((agent) => agent.externalId),
                    })
                }
                for (const operation of operations) {
                    await gitRepoService(log).push({
                        id,
                        platformId,
                        userId,
                        request: operation,
                        log,
                    })
                }
                break
            }
            case GitPushOperationType.PUSH_FLOW: {
                await gitSyncHandler(log).flows.push({
                    id,
                    platformId,
                    userId,
                    request,
                })
                break
            }
            case GitPushOperationType.DELETE_FLOW: {
                await gitSyncHandler(log).flows.delete({
                    id,
                    platformId,
                    userId,
                    request,
                })
                break
            }
            case GitPushOperationType.PUSH_TABLE: {
                await gitSyncHandler(log).tables.push({
                    id,
                    userId,
                    request,
                })
                break
            }
            case GitPushOperationType.DELETE_TABLE: {
                await gitSyncHandler(log).tables.delete({
                    id,
                    userId,
                    request,
                })
                break
            }
            case GitPushOperationType.PUSH_AGENT: {
                await gitSyncHandler(log).agents.push({
                    id,
                    userId,
                    request,
                })
                break
            }
            case GitPushOperationType.DELETE_AGENT: {
                await gitSyncHandler(log).agents.delete({
                    id,
                    userId,
                    request,
                })
                break
            }
        }
    },
    async getState({ gitRepo, userId, log }: PullGitRepoRequest): Promise<ProjectState> {
        const { flowFolderPath, connectionsFolderPath, tablesFolderPath, agentsFolderPath } = await gitHelper.createGitRepoAndReturnPaths(gitRepo, userId)
        return gitSyncHelper(log).getStateFromGit({
            flowPath: flowFolderPath,
            connectionsFolderPath,
            tablesFolderPath,
            agentsFolderPath,
        })
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
    platformId: string
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
