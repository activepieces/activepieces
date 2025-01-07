import fs from 'fs/promises'
import path from 'path'
import { fileExists } from '@activepieces/server-shared'
import { Flow, flowMigrations, FlowState, PopulatedFlow, ProjectState } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
    
export const gitSyncHelper = (_log: FastifyBaseLogger) => ({
    async getStateFromGit(flowPath: string): Promise<ProjectState> {
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
        return {
            flows,
        }
    },

    async upsertFlowToGit(fileName: string, flow: Flow, flowFolderPath: string): Promise<void> {
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

    async deleteFlowFromGit(flowId: string, flowFolderPath: string): Promise<boolean> {
        const flowJsonPath = path.join(flowFolderPath, `${flowId}.json`)
        const exists = await fileExists(flowJsonPath)
        if (exists) {
            await fs.unlink(flowJsonPath)
        }
        return exists
    },
})

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
