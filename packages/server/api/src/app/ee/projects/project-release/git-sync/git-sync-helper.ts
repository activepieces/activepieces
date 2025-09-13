import fs from 'fs/promises'
import path from 'path'
import { GitRepo } from '@activepieces/ee-shared'
import { fileExists } from '@activepieces/server-shared'
import { AgentState, AppConnectionScope, ConnectionState, FlowState, PopulatedAgent, PopulatedFlow, PopulatedTable, ProjectState, TableState } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { SimpleGit } from 'simple-git'
import { appConnectionService } from '../../../../app-connection/app-connection-service/app-connection-service'
import { projectStateService } from '../project-state/project-state.service'
import { gitHelper } from './git-helper'

export const gitSyncHelper = (log: FastifyBaseLogger) => ({
    async getStateFromGit({ flowPath, connectionsFolderPath, tablesFolderPath, agentsFolderPath }: GetStateFromGitParams): Promise<ProjectState> {
        try {
            const flows = await readFlowsFromGit(flowPath, log)
            const connections = await readConnectionsFromGit(connectionsFolderPath)
            const tables = await readTablesFromGit(tablesFolderPath, log)
            const agents = await readAgentsFromGit(agentsFolderPath, log)
            return {
                flows,
                connections,
                tables,
                agents,
            }
        }
        catch (error) {
            log.error(`Failed to read flow files: ${error}`)
            throw error
        }
    },

    async upsertFlowToGit({ fileName, flow, flowFolderPath }: UpsertFlowIntoProjectParams): Promise<void> {
        try {
            const flowJsonPath = path.join(flowFolderPath, `${fileName}.json`)
            await fs.mkdir(path.dirname(flowJsonPath), { recursive: true })
            const flowState = projectStateService(log).getFlowState(flow)
            await fs.writeFile(flowJsonPath, JSON.stringify(flowState, null, 2))
        }
        catch (error) {
            log.error(`Failed to write flow file ${fileName}: ${error}`)
            throw error
        }
    },

    async upsertTableToGit({ fileName, table, tablesFolderPath }: UpsertTableIntoProjectParams): Promise<void> {
        const tableJsonPath = path.join(tablesFolderPath, `${fileName}.json`)
        await fs.mkdir(path.dirname(tableJsonPath), { recursive: true })
        const tableState = projectStateService(log).getTableState(table)
        await fs.writeFile(tableJsonPath, JSON.stringify(tableState, null, 2))
    },

    async upsertConnectionToGit({ fileName, connection, folderPath }: UpsertConnectionIntoProjectParams): Promise<void> {
        const connectionJsonPath = path.join(folderPath, `${fileName}.json`)
        await fs.mkdir(path.dirname(connectionJsonPath), { recursive: true })
        await fs.writeFile(connectionJsonPath, JSON.stringify(connection, null, 2))
    },

    async upsertAgentToGit({ fileName, agent, agentsFolderPath }: UpsertAgentIntoProjectParams): Promise<void> {
        const agentJsonPath = path.join(agentsFolderPath, `${fileName}.json`)
        await fs.mkdir(path.dirname(agentJsonPath), { recursive: true })
        const agentState = projectStateService(log).getAgentState(agent)
        await fs.writeFile(agentJsonPath, JSON.stringify(agentState, null, 2))
    },

    async deleteFromGit({ fileName, folderPath }: DeleteFromProjectParams): Promise<boolean> {
        const jsonPath = path.join(folderPath, `${fileName}.json`)
        const exists = await fileExists(jsonPath)
        if (exists) {
            await fs.unlink(jsonPath)
        }
        return exists
    },

    async updateConectionStateOnGit({ flowFolderPath, connectionsFolderPath, git, gitRepo, platformId, log }: ClearUnusedConnectionsFromGitParams): Promise<void> {
        const oldConnections = await readConnectionsFromGit(connectionsFolderPath)
        await Promise.all(oldConnections.map((connection) => this.deleteFromGit({ fileName: connection.externalId, folderPath: connectionsFolderPath })))

        const flows = await readFlowsFromGit(flowFolderPath, log)
        const connectionsInFlows = flows.flatMap((flow) => flow.version.connectionIds)
        const currentConnections = await appConnectionService(log).list({
            projectId: gitRepo.projectId,
            externalIds: connectionsInFlows,
            platformId,
            scope: AppConnectionScope.PROJECT,
            cursorRequest: null,
            limit: 10000,
            pieceName: undefined,
            displayName: undefined,
            status: undefined,
        })
        await Promise.all(currentConnections.data.map(async (connection) => {
            await this.upsertConnectionToGit({
                fileName: connection.externalId,
                connection: {
                    externalId: connection.externalId,
                    displayName: connection.displayName,
                    pieceName: connection.pieceName,
                },
                folderPath: connectionsFolderPath,
            })
        }))

        await gitHelper.commitAndPush(git, gitRepo, 'chore: update and remove unused connections')
    },

})

async function readFlowsFromGit(flowFolderPath: string, log: FastifyBaseLogger): Promise<FlowState[]> {
    const flowFiles = await fs.readdir(flowFolderPath)
    const flows: FlowState[] = []
    for (const file of flowFiles) {
        const flow: PopulatedFlow = JSON.parse(await fs.readFile(path.join(flowFolderPath, file), 'utf-8'))
        const flowState = projectStateService(log).getFlowState(flow)
        flows.push(flowState)
    }
    return flows
}

async function readConnectionsFromGit(connectionsFolderPath: string): Promise<ConnectionState[]> {
    const connectionFiles = await fs.readdir(connectionsFolderPath)
    const connections: ConnectionState[] = []
    for (const file of connectionFiles) {
        const connection: ConnectionState = JSON.parse(
            await fs.readFile(path.join(connectionsFolderPath, file), 'utf-8'),
        )
        connections.push(connection)
    }
    return connections
}

async function readTablesFromGit(tablesFolderPath: string, log: FastifyBaseLogger): Promise<TableState[]> {
    const tableFiles = await fs.readdir(tablesFolderPath)
    const tables: TableState[] = []
    for (const file of tableFiles) {
        const table = JSON.parse(
            await fs.readFile(path.join(tablesFolderPath, file), 'utf-8'),
        )
        const tableState = projectStateService(log).getTableState(table)
        tables.push(tableState)
    }
    return tables
}

async function readAgentsFromGit(agentsFolderPath: string, log: FastifyBaseLogger): Promise<AgentState[]> {
    const agentFiles = await fs.readdir(agentsFolderPath)
    const agents: AgentState[] = []
    for (const file of agentFiles) {
        const agent: PopulatedAgent = JSON.parse(await fs.readFile(path.join(agentsFolderPath, file), 'utf-8'))
        agents.push(projectStateService(log).getAgentState(agent))
    }
    return agents
}

type GetStateFromGitParams = {
    flowPath: string
    connectionsFolderPath: string
    tablesFolderPath: string
    agentsFolderPath: string
}

type UpsertFlowIntoProjectParams = {
    fileName: string
    flow: FlowState
    flowFolderPath: string
}

type UpsertConnectionIntoProjectParams = {
    fileName: string
    connection: ConnectionState
    folderPath: string
}

type UpsertTableIntoProjectParams = {
    fileName: string
    table: PopulatedTable
    tablesFolderPath: string
}

type UpsertAgentIntoProjectParams = {
    fileName: string
    agent: PopulatedAgent
    agentsFolderPath: string
}

type DeleteFromProjectParams = {
    fileName: string
    folderPath: string
}

type DeleteFlowFromProjectOperation = {
    type: 'delete_flow_from_project'
    fileName: string
}

type UpsertFlowIntoProjectOperation = {
    type: 'upsert_flow_into_project'
    flow: PopulatedFlow
}

export type FlowSyncOperation =
    | UpsertFlowIntoProjectOperation
    | DeleteFlowFromProjectOperation

type ClearUnusedConnectionsFromGitParams = {
    flowFolderPath: string
    connectionsFolderPath: string
    platformId: string
    git: SimpleGit
    gitRepo: GitRepo
    log: FastifyBaseLogger
}
