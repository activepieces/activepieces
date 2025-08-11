import fs from 'fs/promises'
import path from 'path'
import { GitRepo } from '@activepieces/ee-shared'
import { fileExists } from '@activepieces/server-shared'
import { AgentState, AppConnectionScope, ConnectionState, Flow, flowMigrations, FlowState, PopulatedFlow, ProjectState, TableState } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { SimpleGit } from 'simple-git'
import { appConnectionService } from '../../../../app-connection/app-connection-service/app-connection-service'
import { gitHelper } from './git-helper'

export const gitSyncHelper = (_log: FastifyBaseLogger) => ({
    async getStateFromGit({ flowPath, connectionsFolderPath, tablesFolderPath }: GetStateFromGitParams): Promise<ProjectState> {
        try {
            const flows = await readFlowsFromGit(flowPath)
            const connections = await readConnectionsFromGit(connectionsFolderPath)
            const tables = await readTablesFromGit(tablesFolderPath)
            return {
                flows,
                connections,
                tables,
            }
        }
        catch (error) {
            _log.error(`Failed to read flow files: ${error}`)
            throw error
        }
    },

    async upsertFlowToGit({ fileName, flow, flowFolderPath }: UpsertFlowIntoProjectParams): Promise<void> {
        try {
            const flowJsonPath = path.join(flowFolderPath, `${fileName}.json`)
            await fs.mkdir(path.dirname(flowJsonPath), { recursive: true })
            await fs.writeFile(flowJsonPath, JSON.stringify(flow, null, 2))
        }
        catch (error) {
            _log.error(`Failed to write flow file ${fileName}: ${error}`)
            throw error
        }
    },

    async upsertTableToGit({ fileName, table, tablesFolderPath }: UpsertTableIntoProjectParams): Promise<void> {
        const tableJsonPath = path.join(tablesFolderPath, `${fileName}.json`)
        await fs.mkdir(path.dirname(tableJsonPath), { recursive: true })
        await fs.writeFile(tableJsonPath, JSON.stringify(table, null, 2))
    },

    async upsertConnectionToGit({ fileName, connection, folderPath }: UpsertConnectionIntoProjectParams): Promise<void> {
        const connectionJsonPath = path.join(folderPath, `${fileName}.json`)
        await fs.mkdir(path.dirname(connectionJsonPath), { recursive: true })
        await fs.writeFile(connectionJsonPath, JSON.stringify(connection, null, 2))
    },

    async upsertAgentToGit({ fileName, agent, agentsFolderPath }: UpsertAgentIntoProjectParams): Promise<void> {
        const agentJsonPath = path.join(agentsFolderPath, `${fileName}.json`)
        await fs.mkdir(path.dirname(agentJsonPath), { recursive: true })
        await fs.writeFile(agentJsonPath, JSON.stringify(agent, null, 2))
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

        const flows = await readFlowsFromGit(flowFolderPath)
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

async function readFlowsFromGit(flowFolderPath: string): Promise<FlowState[]> {
    const flowFiles = await fs.readdir(flowFolderPath)
    const flows: FlowState[] = []
    for (const file of flowFiles) {
        const flow: PopulatedFlow = JSON.parse(
            await fs.readFile(path.join(flowFolderPath, file), 'utf-8'),
        )
        const migratedFlowVersion = flowMigrations.apply(flow.version)
        flows.push({
            ...flow,
            externalId: flow.externalId ?? flow.id,
            version: migratedFlowVersion,
        })
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

async function readTablesFromGit(tablesFolderPath: string): Promise<TableState[]> {
    const tableFiles = await fs.readdir(tablesFolderPath)
    const tables: TableState[] = []
    for (const file of tableFiles) {
        const table: TableState = JSON.parse(
            await fs.readFile(path.join(tablesFolderPath, file), 'utf-8'),
        )
        tables.push(table)
    }
    return tables
}

type GetStateFromGitParams = {
    flowPath: string
    connectionsFolderPath: string
    tablesFolderPath: string
}

type UpsertFlowIntoProjectParams = {
    fileName: string
    flow: Flow
    flowFolderPath: string
}

type UpsertConnectionIntoProjectParams = {
    fileName: string
    connection: ConnectionState
    folderPath: string
}

type UpsertTableIntoProjectParams = {
    fileName: string
    table: TableState
    tablesFolderPath: string
}

type UpsertAgentIntoProjectParams = {
    fileName: string
    agent: AgentState
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
