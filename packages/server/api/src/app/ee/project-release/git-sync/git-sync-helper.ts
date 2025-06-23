import fs from 'fs/promises'
import path from 'path'
import { fileExists } from '@activepieces/server-shared'
import { ConnectionState, Flow, flowMigrations, FlowState, PopulatedFlow, ProjectState } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
    
export const gitSyncHelper = (_log: FastifyBaseLogger) => ({
    async getStateFromGit({ flowPath, connectionsFolderPath }: GetStateFromGitParams): Promise<ProjectState> {
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
            return {
                flows,
                connections: connectionStates,
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

    async deleteFlowFromGit({ flowId, flowFolderPath }: DeleteFlowFromProjectParams): Promise<boolean> {
        const flowJsonPath = path.join(flowFolderPath, `${flowId}.json`)
        const exists = await fileExists(flowJsonPath)
        if (exists) {
            await fs.unlink(flowJsonPath)
        }
        return exists
    },
})

type GetStateFromGitParams = {
    flowPath: string
    connectionsFolderPath: string
}

type UpsertFlowIntoProjectParams = {
    fileName: string
    flow: Flow
    flowFolderPath: string
    connections: ConnectionState[]
    connectionsFolderPath: string
}

type DeleteFlowFromProjectParams = {
    flowId: string
    flowFolderPath: string
}

type DeleteFlowFromProjectOperation = {
    type: 'delete_flow_from_project'
    flowId: string
}

type UpsertFlowIntoProjectOperation = {
    type: 'upsert_flow_into_project'
    flow: PopulatedFlow
}

export type FlowSyncOperation =
    | UpsertFlowIntoProjectOperation
    | DeleteFlowFromProjectOperation
