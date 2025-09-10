import { AgentOperationType, DiffState, FlowProjectOperationType, ProjectState, TableOperationType } from '@activepieces/shared'
import { agentDiffService } from './diff/agent-diff.service'
import { connectionDiffService } from './diff/connection-diff.service'
import { flowDiffService } from './diff/flow-diff.service'
import { tableDiffService } from './diff/table-diff.service'

export const projectDiffService = {
    async diff({ newState, currentState }: DiffParams): Promise<DiffState> {
        const flowOperations = await flowDiffService.diff({ newState, currentState })
        const connections = connectionDiffService.diff({ newState, currentState })
        const tables = tableDiffService.diff({ newState, currentState })
        const agents = agentDiffService.diff({ newState, currentState })
        return {
            flows: flowOperations,
            connections,
            tables,
            agents,
        }
    },
    async filterFlows(selectedFlowsIds: string[], diffs: DiffState): Promise<DiffState> {
        return {
            flows: diffs.flows.filter(operation => selectedFlowsIds.includes(operation.flowState.id)),
            connections: diffs.connections,
            tables: diffs.tables,
            agents: diffs.agents,
        }
    },
    async filterDeleteOperation(diffs: DiffState): Promise<DiffState> {
        return {
            flows: diffs.flows.filter(f =>![FlowProjectOperationType.DELETE_FLOW].includes(f.type)),
            connections: diffs.connections,
            tables: diffs.tables.filter(t =>![TableOperationType.DELETE_TABLE].includes(t.type)),
            agents: diffs.agents.filter(a =>![AgentOperationType.DELETE_AGENT].includes(a.type)),
        }
    },
}

type DiffParams = {
    currentState: ProjectState
    newState: ProjectState
}

