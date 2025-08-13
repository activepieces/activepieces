import { ImportSolutionResponse, Solution } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { agentsService } from '../../agents/agents-service'
import { appConnectionService } from '../../app-connection/app-connection-service/app-connection-service'
import { appConnectionHandler } from '../../app-connection/app-connection-service/app-connection.handler'
import { flowService } from '../../flows/flow/flow.service'
import { tableService } from '../../tables/table/table.service'
import { projectDiffService } from '../projects/project-release/project-state/project-diff.service'
import { projectStateService } from '../projects/project-release/project-state/project-state.service'

export const solutionService = (log: FastifyBaseLogger) => ({
    export: async (params: ExportParams): Promise<Solution> => {
        const state = await projectStateService(log).getCurrentState(params.projectId, log)
        return {
            state,
            name: params.name,
            description: params.description ?? '',
        }
    },
    import: async (params: ImportParams): Promise<ImportSolutionResponse> => {
        const currentState = await projectStateService(log).getCurrentState(params.projectId, log)
        const diffs = await projectDiffService.diff({
            newState: params.solution.state,
            currentState,
        })
        const filteredDiffs = await projectDiffService.filterDeleteOperation(diffs)
        await projectStateService(log).apply({
            projectId: params.projectId,
            diffs: filteredDiffs,
            platformId: params.platformId,
            log,
        })

        await migrateConnections(params.connectionsMap, params.projectId, params.userId, log)

        const flows = await getFlows(params.solution.state.flows.map((flow) => flow.externalId), params.projectId, log)
        const connections = await getConnections(params.solution.state.connections?.map((connection) => connection.externalId) ?? [], params.platformId, params.projectId, log)
        const agents = await getAgents(params.solution.state.agents?.map((agent) => agent.externalId) ?? [], params.projectId, log)
        const tables = await getTables(params.solution.state.tables?.map((table) => table.externalId) ?? [], params.projectId, log)


        return {
            flows: flows.data,
            connections: connections.data,
            agents: agents.data,
            tables: tables.data,
        }
    },
})

async function migrateConnections(connectionsMap: Record<string, string>, projectId: string, userId: string, log: FastifyBaseLogger) {
    const flows = await getFlows(Object.keys(connectionsMap), projectId, log)
    for (const [oldExternalId, newExternalId] of Object.entries(connectionsMap)) {
        await appConnectionHandler(log).updateFlowsWithAppConnection(flows.data, {
            appConnectionExternalId: oldExternalId,
            newAppConnectionExternalId: newExternalId,
            userId,
        })
    }
}

async function getTables(externalIds: string[], projectId: string, log: FastifyBaseLogger) {
    return tableService.list({
        projectId,
        externalIds,
        limit: 1000,
        name: undefined,
        cursor: undefined,
    })
}

async function getFlows(externalIds: string[], projectId: string, log: FastifyBaseLogger) {
    return flowService(log).list({
        projectId,
        externalIds,
        cursorRequest: null,
        name: undefined,
        limit: 1000,
        folderId: undefined,
        status: undefined,
    })
}

async function getConnections(externalIds: string[], platformId: string, projectId: string, log: FastifyBaseLogger) {
    return appConnectionService(log).list({
        platformId,
        projectId,
        externalIds,
        cursorRequest: null,
        limit: 1000,
        displayName: undefined,
        pieceName: undefined,
        scope: undefined,
        status: undefined,
    })
}

async function getAgents(externalIds: string[], projectId: string, log: FastifyBaseLogger) {
    return agentsService(log).list({
        projectId,
        externalIds,
        cursorRequest: null,
        limit: 1000,
    })
}


type ExportParams = {
    projectId: string
    name: string
    description?: string
}

type ImportParams = {
    solution: Solution
    projectId: string
    userId: string
    platformId: string
    connectionsMap: Record<string, string>
}
