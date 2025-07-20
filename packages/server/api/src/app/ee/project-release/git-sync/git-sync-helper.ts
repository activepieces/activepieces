import fs from 'fs/promises'
import path from 'path'
import { fileExists } from '@activepieces/server-shared'
import { ConnectionState, Flow, flowMigrations, FlowState, PopulatedFlow, ProjectState, TableState } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'

export const gitSyncHelper = (_log: FastifyBaseLogger) => ({
    async getStateFromGit({ flowPath, connectionsFolderPath, tablesFolderPath }: GetStateFromGitParams): Promise<ProjectState> {
        try {
            const flowFiles = await fs.readdir(flowPath)
            const flows: FlowState[] = []
            for (const file of flowFiles) {
                const flow: PopulatedFlow = JSON.parse(
                    await fs.readFile(path.join(flowPath, file), 'utf-8'),
                )
                const migratedFlowVersion = flowMigrations.apply(flow.version)
                flows.push({
                    ...flow,
                    version: migratedFlowVersion,
                })
            }

            const connections = await fs.readdir(connectionsFolderPath)
            const connectionStates: ConnectionState[] = []
            for (const connection of connections) {
                const connectionState = JSON.parse(
                    await fs.readFile(path.join(connectionsFolderPath, connection), 'utf-8'),
                )
                connectionStates.push(connectionState)
            }

            const tables = await fs.readdir(tablesFolderPath)
            const tableStates: TableState[] = []
            for (const table of tables) {
                const tableState = JSON.parse(
                    await fs.readFile(path.join(tablesFolderPath, table), 'utf-8'),
                )
                tableStates.push(tableState)
            }

            return {
                flows,
                connections: connectionStates,
                tables: tableStates,
            }
        }
        catch (error) {
            _log.error(`Failed to read flow files: ${error}`)
            throw error
        }
    },

    async upsertFlowToGit({ fileName, flow, flowFolderPath, connections, connectionsFolderPath }: UpsertFlowIntoProjectParams): Promise<void> {
        try {
            const flowJsonPath = path.join(flowFolderPath, `${fileName}.json`)
            await fs.mkdir(path.dirname(flowJsonPath), { recursive: true })
            await fs.writeFile(flowJsonPath, JSON.stringify(flow, null, 2))

            for (const connection of connections) {
                const connectionJsonPath = path.join(connectionsFolderPath, `${connection.externalId}.json`)
                await fs.mkdir(path.dirname(connectionJsonPath), { recursive: true })
                await fs.writeFile(connectionJsonPath, JSON.stringify(connection, null, 2))
            }
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
    async deleteFromGit({ fileName, folderPath }: DeleteFromProjectParams): Promise<boolean> {
        const jsonPath = path.join(folderPath, `${fileName}.json`)
        const exists = await fileExists(jsonPath)
        if (exists) {
            await fs.unlink(jsonPath)
        }
        return exists
    },
})

type GetStateFromGitParams = {
    flowPath: string
    connectionsFolderPath: string
    tablesFolderPath: string
}

type UpsertFlowIntoProjectParams = {
    fileName: string
    flow: Flow
    flowFolderPath: string
    connections: ConnectionState[]
    connectionsFolderPath: string
}

type UpsertTableIntoProjectParams = {
    fileName: string
    table: TableState
    tablesFolderPath: string
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
