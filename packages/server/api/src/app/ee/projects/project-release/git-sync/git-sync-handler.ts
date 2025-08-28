import { PushAgentsGitRepoRequest, PushFlowsGitRepoRequest, PushTablesGitRepoRequest } from '@activepieces/ee-shared'
import {
    FlowState,
    FlowVersionState,
    PopulatedAgent,
    PopulatedTable,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { agentsService } from '../../../../agents/agents-service'
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

            const flows = await listFlowsByExternalIds(log, gitRepo.projectId, request.externalFlowIds)
            

            for (const flow of flows) {
                const flowName = flow.externalId
                await gitSyncHelper(log).upsertFlowToGit({
                    fileName: flowName,
                    flow,
                    flowFolderPath,
                })
            }
            await gitHelper.commitAndPush(git, gitRepo, request.commitMessage ?? `chore: updated flows ${request.externalFlowIds.join(', ')}`)

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

            const flows = await listFlowsByExternalIds(log, gitRepo.projectId, request.externalFlowIds)

            for (const flow of flows) {
                const fileName = flow.externalId || flow.id
                await gitSyncHelper(log).deleteFromGit({
                    fileName,
                    folderPath: flowFolderPath,
                })
            }
            await gitHelper.commitAndPush(git, gitRepo, request.commitMessage ?? `chore: deleted flow ${request.externalFlowIds.join(', ')} from user interface`)
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

            const populatedTables: PopulatedTable[] = await listTablesByExternalIds(gitRepo.projectId, request.externalTableIds)

            for (const table of populatedTables) {
                const tableName = table.externalId || table.id
                await gitSyncHelper(log).upsertTableToGit({
                    fileName: tableName,
                    table,
                    tablesFolderPath,
                })
            }

            await gitHelper.commitAndPush(git, gitRepo, request.commitMessage ?? `chore: updated tables ${request.externalTableIds.join(', ')}`)
        },

        async delete({ id, userId, request }: TableOperationParams): Promise<void> {
            const gitRepo = await gitRepoService(log).getOrThrow({ id })
            const { git, tablesFolderPath } = await gitHelper.createGitRepoAndReturnPaths(gitRepo, userId)

            const populatedTables = await listTablesByExternalIds(gitRepo.projectId, request.externalTableIds)
            for (const table of populatedTables) {
                await gitSyncHelper(log).deleteFromGit({
                    fileName: table.externalId,
                    folderPath: tablesFolderPath,
                })
            }

            await gitHelper.commitAndPush(git, gitRepo, request.commitMessage ?? `chore: deleted tables ${request.externalTableIds.join(', ')}`)
        },
    },

    agents: {
        async push({ id, userId, request }: AgentOperationParams): Promise<void> {
            const gitRepo = await gitRepoService(log).getOrThrow({ id })
            const { git, agentsFolderPath } = await gitHelper.createGitRepoAndReturnPaths(gitRepo, userId)

            const agents = await listAgentsByExternalIds(log, gitRepo.projectId, request.externalAgentIds)
            for (const agent of agents) {
                await gitSyncHelper(log).upsertAgentToGit({
                    fileName: agent.externalId,
                    agent,
                    agentsFolderPath,
                })
            }
            await gitHelper.commitAndPush(git, gitRepo, request.commitMessage ?? `chore: updated agents ${request.externalAgentIds.join(', ')}`)
        },

        async delete({ id, userId, request }: AgentOperationParams): Promise<void> {
            const gitRepo = await gitRepoService(log).getOrThrow({ id })
            const { git, agentsFolderPath } = await gitHelper.createGitRepoAndReturnPaths(gitRepo, userId)

            const agents = await listAgentsByExternalIds(log, gitRepo.projectId, request.externalAgentIds)
            for (const agent of agents) {
                await gitSyncHelper(log).deleteFromGit({
                    fileName: agent.externalId,
                    folderPath: agentsFolderPath,
                })
            }
            await gitHelper.commitAndPush(git, gitRepo, request.commitMessage ?? `chore: deleted agents ${request.externalAgentIds.join(', ')}`)
        },
    },

})

function listAgentsByExternalIds(log: FastifyBaseLogger, projectId: string, externalIds: string[]): Promise<PopulatedAgent[]> {
    return agentsService(log).list({
        projectId,
        limit: 10000,
        cursorRequest: null,
    }).then((page) => page.data.filter((agent) => externalIds.includes(agent.externalId)))
}

async function listTablesByExternalIds(projectId: string, externalIds: string[]): Promise<PopulatedTable[]> {
    const tables = await tableService.list({
        projectId,
        limit: 10000,
        cursor: undefined,
        name: undefined,
        externalIds: undefined,
    }).then((page) => page.data.filter((table) => externalIds.includes(table.externalId)))

    const populatedTables = await Promise.all(tables.map(async (table) => {
        const fields = await fieldService.getAll({
            projectId,
            tableId: table.id,
        })
        return {
            ...table,
            fields,
        }
    }))
    return populatedTables
}

function listFlowsByExternalIds(log: FastifyBaseLogger, projectId: string, externalIds: string[]): Promise<FlowState[]> {
    return flowService(log).list({
        projectId,
        limit: 10000,
        cursorRequest: null,
        folderId: undefined,
        status: undefined,
        name: undefined,
        connectionExternalIds: undefined,
        versionState: FlowVersionState.LOCKED,
    }).then((page) => page.data.filter((flow) => externalIds.includes(flow.externalId)))
}

type FlowOperationParams = {
    id: string
    platformId: string
    userId: string
    request: PushFlowsGitRepoRequest
}

type AgentOperationParams = {
    id: string
    userId: string
    request: PushAgentsGitRepoRequest
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