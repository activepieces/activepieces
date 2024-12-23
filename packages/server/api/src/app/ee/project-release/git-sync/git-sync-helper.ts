import fs from 'fs/promises'
import path from 'path'
import { fileExists } from '@activepieces/server-shared'
import { Flow, flowMigrations, FlowState, PopulatedFlow } from '@activepieces/shared'
import { ProjectMappingState } from '../project-diff/project-mapping-state'

export const gitSyncHelper = () => ({
    async getMappingStateFromGit(
        stateFolderPath: string,
        projectId: string,
    ): Promise<ProjectMappingState> {
        const _statePath = path.join(stateFolderPath, projectId + '.json')
        try {
            const state = await fs.readFile(_statePath, 'utf-8')
            return new ProjectMappingState(JSON.parse(state))
        }
        catch (e) {
            return ProjectMappingState.empty()
        }
    },

    async getStateFromGit(flowPath: string): Promise<FlowState[]> {
        const flowFiles = await fs.readdir(flowPath)
        const parsedFlows: FlowState[] = []
        for (const file of flowFiles) {
            const flow: PopulatedFlow = JSON.parse(
                await fs.readFile(path.join(flowPath, file), 'utf-8'),
            )
            const migratedFlowVersion = flowMigrations.apply(flow.version)
            parsedFlows.push({
                ...flow,
                version: migratedFlowVersion,
            })
        }
        return parsedFlows
    },

    async upsertFlowToGit(fileName: string, flow: Flow, flowFolderPath: string): Promise<void> {
        const flowJsonPath = path.join(flowFolderPath, `${fileName}.json`)
        await fs.writeFile(flowJsonPath, JSON.stringify(flow, null, 2))
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
