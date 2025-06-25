import { PushFlowsGitRepoRequest, PushTablesGitRepoRequest } from '@activepieces/ee-shared'
import { 
    FieldType, 
    FlowVersionState, 
    isNil, 
    PopulatedFlow, 
    TableState, 
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { flowService } from '../../../../flows/flow/flow.service'
import { fieldService } from '../../../../tables/field/field.service'
import { tableService } from '../../../../tables/table/table.service'
import { gitHelper } from './git-helper'
import { gitSyncHelper } from './git-sync-helper'
import { gitRepoService } from './git-sync.service'

export const gitSyncHandler = (log: FastifyBaseLogger) => ({
    flows: {
        async push({ id, platformId, userId, request }: FlowOperationParams): Promise<void> {
            const gitRepo = await gitRepoService(log).getOrThrow({ id })
            const { git, flowFolderPath } = await gitHelper.createGitRepoAndReturnPaths(gitRepo, userId)
            
            const flows: PopulatedFlow[] = []
            await Promise.all(request.flowIds.map(async (flowId) => {
                const flow = await flowService(log).getOnePopulatedOrThrow({
                    id: flowId,
                    projectId: gitRepo.projectId,
                    removeConnectionsName: false,
                    removeSampleData: true,
                })
                if (!isNil(flow.publishedVersionId) && flow.version.state === FlowVersionState.LOCKED) {
                    flows.push(flow)
                }
            }))
            for (const flow of flows) {
                const flowName = flow.externalId
                await gitSyncHelper(log).upsertFlowToGit({
                    fileName: flowName,
                    flow,
                    flowFolderPath,
                })
            }
            await gitHelper.commitAndPush(git, gitRepo, request.commitMessage ?? `chore: updated flows ${request.flowIds.join(', ')}`)

            // This is important to make sure no connections are left behind
            await gitSyncHandler(log).connections.push({
                id,
                platformId,
                userId,
            })
        },
        
        async delete({ id, platformId, userId, request }: FlowOperationParams): Promise<void> {
            const gitRepo = await gitRepoService(log).getOrThrow({ id })
            const { git, flowFolderPath } = await gitHelper.createGitRepoAndReturnPaths(gitRepo, userId)
            
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
            
            // This is important to make sure no connections are left behind
            await gitSyncHandler(log).connections.push({
                id,
                platformId,
                userId,
            })
        },
    },

    connections: {
        async push({ id, platformId, userId }: ConnectionOperationParams): Promise<void> {
            const gitRepo = await gitRepoService(log).getOrThrow({ id })
            const { git, connectionsFolderPath, flowFolderPath } = await gitHelper.createGitRepoAndReturnPaths(gitRepo, userId)

            await gitSyncHelper(log).updateConectionStateOnGit({
                flowFolderPath,
                connectionsFolderPath,
                git,
                gitRepo,
                platformId,
                log,
            })
        },
    },  
    
    tables: {
        async push({ id, userId, request }: TableOperationParams): Promise<void> {
            const gitRepo = await gitRepoService(log).getOrThrow({ id })
            const { git, tablesFolderPath } = await gitHelper.createGitRepoAndReturnPaths(gitRepo, userId)
            
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
        },
        
        async delete({ id, userId, request }: TableOperationParams): Promise<void> {
            const gitRepo = await gitRepoService(log).getOrThrow({ id })
            const { git, tablesFolderPath } = await gitHelper.createGitRepoAndReturnPaths(gitRepo, userId)
            
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
        },
    },
})

type FlowOperationParams = {
    id: string
    platformId: string  
    userId: string
    request: PushFlowsGitRepoRequest
}

type TableOperationParams = {
    id: string
    userId: string
    request: PushTablesGitRepoRequest
}

type ConnectionOperationParams = {
    id: string
    platformId: string
    userId: string
}