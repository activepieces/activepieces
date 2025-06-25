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
    FlowVersionState,
    isNil,
    ProjectState,
    SeekPage,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../../../core/db/repo-factory'
import { flowService } from '../../../../flows/flow/flow.service'
import { paginationHelper } from '../../../../helper/pagination/pagination-utils'
import { system } from '../../../../helper/system/system'
import { tableService } from '../../../../tables/table/table.service'
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
    async onDeleted({ type, idOrExternalId, userId, projectId, platformId, log }: { type: GitPushOperationType, idOrExternalId: string, userId: string, projectId: string, platformId: string, log: FastifyBaseLogger }): Promise<void> {
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
                        commitMessage: `chore: deleted flow ${idOrExternalId}`,
                        flowIds: [idOrExternalId],
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
                        commitMessage: `chore: deleted table ${idOrExternalId}`,
                        tableIds: [idOrExternalId],
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
                const flows = await flowService(log).list({
                    projectId: gitRepo.projectId,
                    cursorRequest: null,
                    limit: 10000,
                    folderId: undefined,
                    status: undefined,
                    name: undefined,
                    versionState: FlowVersionState.LOCKED,
                    connectionExternalIds: undefined,
                })
                const tables = await tableService.list({
                    projectId: gitRepo.projectId,
                    limit: 10000,
                    cursor: undefined,
                    name: undefined,
                    externalIds: undefined,
                })

                await gitSyncHandler(log).flows.push({
                    id,
                    platformId,
                    userId,
                    request: {
                        type: GitPushOperationType.PUSH_FLOW,
                        commitMessage: request.commitMessage ?? `chore: push all flows ${flows.data.map((flow) => flow.version.displayName).join(', ')}`,
                        flowIds: flows.data.map((flow) => flow.id),
                    },
                })
                await gitSyncHandler(log).tables.push({
                    id,
                    userId,
                    request: {  
                        type: GitPushOperationType.PUSH_TABLE,
                        commitMessage: request.commitMessage ?? `chore: push all tables ${tables.data.map((table) => table.name).join(', ')}`,
                        tableIds: tables.data.map((table) => table.id),
                    },
                })
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
        }
    },
    async getState({ gitRepo, userId, log }: PullGitRepoRequest): Promise<ProjectState> {
        const { flowFolderPath, connectionsFolderPath, tablesFolderPath } = await gitHelper.createGitRepoAndReturnPaths(gitRepo, userId)
        return gitSyncHelper(log).getStateFromGit({
            flowPath: flowFolderPath,
            connectionsFolderPath,
            tablesFolderPath,
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
