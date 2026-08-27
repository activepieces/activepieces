import { FlowVersionState } from '../flows/flow-version'

export const DEFAULT_MCP_DATA = {
    flowId: 'mcp-flow-id',
    flowVersionId: 'mcp-flow-version-id',
    flowVersionState: FlowVersionState.LOCKED,
    flowRunId: 'mcp-flow-run-id',
    triggerPieceName: 'mcp-trigger-piece-name',
}

export const ERROR_MESSAGES_TO_REDACT = [
    'HttpClient#sendRequest',
]

export const SENSITIVE_VALUE_REDACTED = '**REDACTED**'

export const SENSITIVE_WHOLE_OUTPUT_PATH = '\\'
