import { FlowVersionState } from '../flows/flow-version'

export const DEFAULT_MCP_DATA = {
    flowId: 'mcp-flow-id',
    flowVersionId: 'mcp-flow-version-id',
    flowVersionState: FlowVersionState.LOCKED,
    flowRunId: 'mcp-flow-run-id',
    triggerPieceName: 'mcp-trigger-piece-name',
}