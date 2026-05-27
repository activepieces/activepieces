import { z } from 'zod'

export const TASK_COMPLETION_TOOL_NAME = 'updateTaskStatus'

export enum FieldControlMode {
    AGENT_DECIDE = 'agent-decide',
    CHOOSE_YOURSELF = 'choose-yourself',
    LEAVE_EMPTY = 'leave-empty',
}

export const PredefinedInputField = z.object({
    mode: z.nativeEnum(FieldControlMode),
    value: z.unknown(),
})
export type PredefinedInputField = z.infer<typeof PredefinedInputField>

export const PredefinedInputsStructure = z.object({
    auth: z.string().optional(),
    fields: z.record(z.string(), PredefinedInputField),
})
export type PredefinedInputsStructure = z.infer<typeof PredefinedInputsStructure>

export enum AgentToolType {
    PIECE = 'PIECE',
    FLOW = 'FLOW',
    MCP = 'MCP',
    KNOWLEDGE_BASE = 'KNOWLEDGE_BASE',
}

export enum KnowledgeBaseSourceType {
    FILE = 'FILE',
    TABLE = 'TABLE',
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
    toolName: z.string().min(1),
}

export const McpAuthNone = z.object({
    type: z.literal(McpAuthType.NONE),
})

export const McpAuthAccessToken = z.object({
    type: z.literal(McpAuthType.ACCESS_TOKEN),
    accessToken: z.string(),
})

export const McpAuthApiKey = z.object({
    type: z.literal(McpAuthType.API_KEY),
    apiKey: z.string(),
    apiKeyHeader: z.string(),
})

export const McpAuthHeaders = z.object({
    type: z.literal(McpAuthType.HEADERS),
    headers: z.record(z.string(), z.string()),
})

export const McpAuthConfig = z.discriminatedUnion('type', [
    McpAuthNone,
    McpAuthAccessToken,
    McpAuthApiKey,
    McpAuthHeaders,
])
export type McpAuthConfig = z.infer<typeof McpAuthConfig>

export const AgentPieceToolMetadata = z.object({
    pieceName: z.string(),
    pieceVersion: z.string(),
    actionName: z.string(),
    predefinedInput: PredefinedInputsStructure.optional(),
})
export type AgentPieceToolMetadata = z.infer<typeof AgentPieceToolMetadata>

export const AgentPieceTool = z.object({
    type: z.literal(AgentToolType.PIECE),
    ...AgentToolBase,
    pieceMetadata: AgentPieceToolMetadata,
})
export type AgentPieceTool = z.infer<typeof AgentPieceTool>

export const AgentFlowTool = z.object({
    type: z.literal(AgentToolType.FLOW),
    ...AgentToolBase,
    externalFlowId: z.string(),
    flowDisplayName: z.string().optional(),
})
export type AgentFlowTool = z.infer<typeof AgentFlowTool>

export const AgentMcpTool = z.object({
    type: z.literal(AgentToolType.MCP),
    ...AgentToolBase,
    serverUrl: z.string().url(),
    protocol: z.nativeEnum(McpProtocol),
    auth: McpAuthConfig,
})
export type AgentMcpTool = z.infer<typeof AgentMcpTool>

export const AgentKnowledgeBaseTool = z.object({
    type: z.literal(AgentToolType.KNOWLEDGE_BASE),
    ...AgentToolBase,
    sourceType: z.nativeEnum(KnowledgeBaseSourceType),
    sourceId: z.string(),
    sourceName: z.string(),
})
export type AgentKnowledgeBaseTool = z.infer<typeof AgentKnowledgeBaseTool>

export const AgentTool = z.discriminatedUnion('type', [
    AgentPieceTool,
    AgentFlowTool,
    AgentMcpTool,
    AgentKnowledgeBaseTool,
])
export type AgentTool = z.infer<typeof AgentTool>
