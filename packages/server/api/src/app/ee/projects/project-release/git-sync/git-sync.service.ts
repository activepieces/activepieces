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
    AppConnectionScope,
    ErrorCode,
    FieldType,
    FlowVersionState,
    isNil,
    PopulatedFlow,
    ProjectState,
    SeekPage,
    TableState,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { appConnectionService } from '../../../../app-connection/app-connection-service/app-connection-service'
import { repoFactory } from '../../../../core/db/repo-factory'
import { flowService } from '../../../../flows/flow/flow.service'
import { paginationHelper } from '../../../../helper/pagination/pagination-utils'
import { system } from '../../../../helper/system/system'
import { fieldService } from '../../../../tables/field/field.service'
import { tableService } from '../../../../tables/table/table.service'
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
            case GitPushOperationType.DELETE_CONNECTION: {
                await gitRepoService(log).push({
                    id: gitRepo.id,
                    platformId,
                    userId,
                    request: {
                        type: GitPushOperationType.DELETE_CONNECTION,
                        commitMessage: `chore: deleted connection ${idOrExternalId}`,
                        connectionExternalIds: [idOrExternalId],
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
        const gitRepo = await gitRepoService(log).getOrThrow({ id })
        const { git, flowFolderPath, connectionsFolderPath, tablesFolderPath } = await gitHelper.createGitRepoAndReturnPaths(gitRepo, userId)
        switch (request.type) {
            case GitPushOperationType.PUSH_FLOW: {
                const flows: PopulatedFlow[] = []
                const notPublishedFlowsNames: string[] = []
                await Promise.all(request.flowIds.map(async (flowId) => {
                    const flow = await flowService(log).getOnePopulatedOrThrow({
                        id: flowId,
                        projectId: gitRepo.projectId,
                        removeConnectionsName: false,
                        removeSampleData: true,
                    })
                    flows.push(flow)
                    if (isNil(flow.publishedVersionId) || flow.version.state === FlowVersionState.DRAFT) {
                        notPublishedFlowsNames.push(flow.version.displayName)
                    }
                }))
                if (notPublishedFlowsNames.length > 0) {
                    throw new ActivepiecesError({
                        code: ErrorCode.FLOW_OPERATION_INVALID,
                        params: {
                            message: `These flows must be published before pushing to Git: ${notPublishedFlowsNames.join(', ')}`,
                        },
                    })
                }
                for (const flow of flows) {
                    const flowName = flow.externalId
                    await gitSyncHelper(log).upsertFlowToGit({
                        fileName: flowName,
                        flow,
                        flowFolderPath,
                    })
                }
                await gitHelper.commitAndPush(git, gitRepo, request.commitMessage ?? `chore: updated flows ${request.flowIds.join(', ')}`)
                break
            }
            case GitPushOperationType.DELETE_FLOW: {
                const flow = await flowService(log).getOnePopulatedOrThrow({
                    id: request.flowIds[0],
                    projectId: gitRepo.projectId,
                })
                const fileName = flow.externalId || flow.id
                const deleted = await gitSyncHelper(log).deleteFromGit({
                    fileName,
                    folderPath: flowFolderPath,
                })
                if (deleted) {
                    await gitHelper.commitAndPush(git, gitRepo, request.commitMessage ?? `chore: deleted flow ${request.flowIds[0]} from user interface`)
                }
                break
            }
            case GitPushOperationType.PUSH_TABLE: {
                const tables: TableState[] = await Promise.all(request.tableIds.map(async (tableId) => {
                    const table = await tableService.getById({
                        id: tableId,
                        projectId: gitRepo.projectId,
                    })
                    const fields = await fieldService.getAll({
                        projectId: gitRepo.projectId,
                        tableId: table.id,
                    })
                    const tableState: TableState = {
                        id: table.id,
                        name: table.name,
                        externalId: table.externalId,
                        fields: fields.map((field) => ({
                            name: field.name,
                            type: field.type,
                            data: field.type === FieldType.STATIC_DROPDOWN ? field.data : undefined,
                            externalId: field.externalId,
                        })),
                    }
                    return tableState
                }))

                for (const table of tables) {
                    const tableName = table.externalId || table.id
                    await gitSyncHelper(log).upsertTableToGit({
                        fileName: tableName,
                        table,
                        tablesFolderPath,
                    })
                }
                
                await gitHelper.commitAndPush(git, gitRepo, request.commitMessage ?? `chore: updated tables ${request.tableIds.join(', ')}`)
                break
            }
            case GitPushOperationType.DELETE_TABLE: {
                const table = await tableService.getById({
                    id: request.tableIds[0],
                    projectId: gitRepo.projectId,
                })
                const fileName = table.externalId || table.id
                const deleted = await gitSyncHelper(log).deleteFromGit({
                    fileName,
                    folderPath: tablesFolderPath,
                })
                if (deleted) {
                    await gitHelper.commitAndPush(git, gitRepo, request.commitMessage ?? `chore: deleted table ${request.tableIds[0]} from user interface`)
                }
                break
            }
            case GitPushOperationType.DELETE_CONNECTION: {
                await Promise.all(request.connectionExternalIds.map(async (connection) => {
                    await gitSyncHelper(log).deleteFromGit({
                        fileName: connection,
                        folderPath: connectionsFolderPath,
                    })
                }))
                await gitHelper.commitAndPush(git, gitRepo, request.commitMessage ?? `chore: deleted connections ${request.connectionExternalIds.join(', ')}`)
                break
            }
            case GitPushOperationType.PUSH_CONNECTION: {
                const connections = await appConnectionService(log).list({
                    projectId: gitRepo.projectId,
                    externalIds: request.connectionExternalIds,
                    platformId,
                    scope: AppConnectionScope.PROJECT,
                    cursorRequest: null,
                    limit: 10000,
                    pieceName: undefined,
                    displayName: undefined,
                    status: undefined,
                })
                await Promise.all(connections.data.map(async (connection) => {
                    await gitSyncHelper(log).upsertConnectionToGit({
                        fileName: connection.externalId,
                        connection: {
                            externalId: connection.externalId,
                            displayName: connection.displayName,
                            pieceName: connection.pieceName,
                        },
                        folderPath: connectionsFolderPath,
                    })
                }))
                await gitHelper.commitAndPush(git, gitRepo, request.commitMessage ?? `chore: updated connections ${request.connectionExternalIds.join(', ')}`)
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
