import { Static, Type } from '@sinclair/typebox'
import { DiscriminatedUnion } from '../common'
import { AgentOutputField } from './types'

export const agentToolsName = {
    SEARCH_TRIGGERS_TOOL_NAME: 'search_triggers',
    SEARCH_TOOLS_TOOL_NAME: 'search_tools',
    LIST_FLOWS_TOOL_NAME: 'list_flows',
    SUGGEST_FLOW_TOOL_NAME: 'suggest_flow',
    TASK_COMPLETION_TOOL_NAME: 'updateTaskStatus',
}

export const agentStateKeys = {
    FLOWS: 'flows',
}

export enum FieldControlMode {
    AGENT_DECIDE = 'agent-decide',
    CHOOSE_YOURSELF = 'choose-yourself',
    LEAVE_EMPTY = 'leave-empty',
}

export const PredefinedInputField = Type.Object({
    mode: Type.Enum(FieldControlMode),
    value: Type.Unknown(),
})
export type PredefinedInputField = Static<typeof PredefinedInputField>

export const PredefinedInputsStructure = Type.Object({
    auth: Type.Optional(Type.Unknown()),
    fields: Type.Record(Type.String(), PredefinedInputField),
})
export type PredefinedInputsStructure = Static<typeof PredefinedInputsStructure>

export enum AgentToolType {
    PIECE = 'PIECE',
    MCP = 'MCP',
    FLOW_MAKER = 'FLOW_MAKER',
    TASK_UPDATE = 'TASK_UPDATE',
}

export enum McpProtocol {
    SSE = 'sse',
    STREAMABLE_HTTP = 'streamable-http',
    SIMPLE_HTTP = 'http',
}

export enum McpAuthType {
    NONE = 'none',
    ACCESS_TOKEN = 'access_token',
    API_KEY = 'api_key',
    HEADERS = 'headers',
}

const AgentToolBase = {
    toolName: Type.String({ minLength: 1 }),
}

export const McpAuthNone = Type.Object({
    type: Type.Literal(McpAuthType.NONE),
})

export const McpAuthAccessToken = Type.Object({
    type: Type.Literal(McpAuthType.ACCESS_TOKEN),
    accessToken: Type.String(),
})

export const McpAuthApiKey = Type.Object({
    type: Type.Literal(McpAuthType.API_KEY),
    apiKey: Type.String(),
    apiKeyHeader: Type.String(),
})

export const McpAuthHeaders = Type.Object({
    type: Type.Literal(McpAuthType.HEADERS),
    headers: Type.Record(Type.String(), Type.String()),
})

export const McpAuthConfig = DiscriminatedUnion('type', [
    McpAuthNone,
    McpAuthAccessToken,
    McpAuthApiKey,
    McpAuthHeaders,
])
export type McpAuthConfig = Static<typeof McpAuthConfig>

export const AgentPieceToolMetadata = Type.Object({
    pieceName: Type.String(),
    pieceVersion: Type.String(),
    actionName: Type.String(),
    predefinedInput: Type.Optional(PredefinedInputsStructure),
})
export type AgentPieceToolMetadata = Static<typeof AgentPieceToolMetadata>

export const AgentPieceTool = Type.Object({
    type: Type.Literal(AgentToolType.PIECE),
    ...AgentToolBase,
    pieceMetadata: AgentPieceToolMetadata,
})
export type AgentPieceTool = Static<typeof AgentPieceTool>

export const AgentMcpTool = Type.Object({
    type: Type.Literal(AgentToolType.MCP),
    ...AgentToolBase,
    serverUrl: Type.String({ format: 'uri' }),
    protocol: Type.Enum(McpProtocol),
    auth: McpAuthConfig,
})
export type AgentMcpTool = Static<typeof AgentMcpTool>

export const AgentFlowMakerTool = Type.Object({
    type: Type.Literal(AgentToolType.FLOW_MAKER),
})
export type AgentFlowMakerTool = Static<typeof AgentFlowMakerTool>

export const AgentTaskUpdateTool = Type.Object({
    type: Type.Literal(AgentToolType.TASK_UPDATE),
    structuredOutput: Type.Optional(Type.Array(AgentOutputField)),
})
export type AgentTaskUpdateTool = Static<typeof AgentTaskUpdateTool>

export const AgentTool = DiscriminatedUnion('type', [
    AgentPieceTool,
    AgentMcpTool,
    AgentFlowMakerTool,
    AgentTaskUpdateTool,
])
export type AgentTool = Static<typeof AgentTool>