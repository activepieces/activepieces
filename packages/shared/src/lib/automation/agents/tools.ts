import { Static, Type } from '@sinclair/typebox'
import { DiscriminatedUnion } from '../../core/common'

export const TASK_COMPLETION_TOOL_NAME = 'updateTaskStatus'

const PIECE_NAME_PREFIX = 'piece-'

/**
 * Normalizes a string for use as an agent tool name: safe characters only,
 * collapsed underscores, max 60 chars, lowercase, and appends '_mcp'.
 * Idempotent: if the result would already end with '_mcp', it is not appended again.
 */
export function createToolName(name: string): string {
    const normalized = String(name)
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .replace(/_+/g, '_')
        .slice(0, 60)
        .toLowerCase()
    return normalized.endsWith('_mcp') ? normalized : normalized + '_mcp'
}

/**
 * Canonical name for a piece action tool. Use this whenever building or comparing
 * tool names for piece actions so all call sites stay in sync.
 * Strips the @scope/piece- prefix from pieceName (e.g. @activepieces/piece-slack → slack)
 * then delegates to createToolName.
 */
export function createPieceToolName(pieceName: string, actionName: string): string {
    const shortPieceName = pieceName.includes(PIECE_NAME_PREFIX)
        ? pieceName.split(PIECE_NAME_PREFIX)[1] ?? pieceName
        : pieceName
    return createToolName(`${shortPieceName}-${actionName}`)
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
    auth: Type.Optional(Type.String()),
    fields: Type.Record(Type.String(), PredefinedInputField),
})
export type PredefinedInputsStructure = Static<typeof PredefinedInputsStructure>

export enum AgentToolType {
    PIECE = 'PIECE',
    FLOW = 'FLOW',
    MCP = 'MCP',
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

export const AgentFlowTool = Type.Object({
    type: Type.Literal(AgentToolType.FLOW),
    ...AgentToolBase,
    externalFlowId: Type.String(),
    flowDisplayName: Type.Optional(Type.String()),
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