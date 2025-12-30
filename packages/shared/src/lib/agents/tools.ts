import { Static, Type } from '@sinclair/typebox'
import { DiscriminatedUnion } from '../common'

export const TASK_COMPLETION_TOOL_NAME = 'updateTaskStatus'

export enum AgentToolType {
    PIECE = 'PIECE',
    FLOW = 'FLOW',
    MCP = 'MCP',
}

export enum McpProtocol {
    SSE = 'sse',
    STREAMABLE_HTTP = 'streamble-http',
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

export const McpAuthConfig = Type.Union([
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
    predefinedInput: Type.Record(Type.String(), Type.Unknown()),
})
export type AgentPieceToolMetadata = Static<typeof AgentPieceToolMetadata>

export const AgentPieceTool = Type.Object({
    type: Type.Literal(AgentToolType.PIECE),
    ...AgentToolBase,
    pieceMetadata: AgentPieceToolMetadata,
})
export type AgentPieceTool = Static<typeof AgentPieceTool>

export const AgentFlowTool = Type.Object({
    type: Type.Literal(AgentToolType.FLOW),
    ...AgentToolBase,
    externalFlowId: Type.String(),
})
export type AgentFlowTool = Static<typeof AgentFlowTool>

export const AgentMcpTool = Type.Object({
    type: Type.Literal(AgentToolType.MCP),
    ...AgentToolBase,
    serverUrl: Type.String({ format: 'uri' }),
    protocol: Type.Enum(McpProtocol),
    auth: McpAuthConfig,
})
export type AgentMcpTool = Static<typeof AgentMcpTool>

export const AgentTool = DiscriminatedUnion('type', [
    AgentPieceTool,
    AgentFlowTool,
    AgentMcpTool,
])
export type AgentTool = Static<typeof AgentTool>