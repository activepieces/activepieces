import { AIProviderName, Nullable } from "@activepieces/core-utils";
import * as z from "zod/mini";

export const TASK_COMPLETION_TOOL_NAME = 'updateTaskStatus'

export enum AgentToolType {
    PIECE = 'PIECE',
    FLOW = 'FLOW',
    MCP = 'MCP',
    KNOWLEDGE_BASE = 'KNOWLEDGE_BASE',
}

export enum FieldControlMode {
    AGENT_DECIDE = 'agent-decide',
    CHOOSE_YOURSELF = 'choose-yourself',
    LEAVE_EMPTY = 'leave-empty',
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

export enum AgentOutputFieldType {
    TEXT = 'text',
    NUMBER = 'number',
    BOOLEAN = 'boolean',
}

export enum AgentTaskStatus {
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    IN_PROGRESS = 'IN_PROGRESS',
}

export enum ContentBlockType {
    MARKDOWN = 'MARKDOWN',
    TOOL_CALL = 'TOOL_CALL',
}

export enum ToolCallStatus {
    IN_PROGRESS = 'in-progress',
    COMPLETED = 'completed',
}

export enum ExecutionToolStatus {
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
}

export enum ToolCallType {
    PIECE = 'PIECE',
    FLOW = 'FLOW',
    MCP = 'MCP',
    KNOWLEDGE_BASE = 'KNOWLEDGE_BASE',
    UNKNOWN = 'UNKNOWN',
}

export enum AgentPieceProps {
    AGENT_TOOLS = 'agentTools',
    STRUCTURED_OUTPUT = 'structuredOutput',
    PROMPT = 'prompt',
    MAX_STEPS = 'maxSteps',
    AI_PROVIDER_MODEL = 'aiProviderModel',
    WEB_SEARCH = 'webSearch',
    WEB_SEARCH_OPTIONS = 'webSearchOptions',
}

export const PredefinedInputField = z.object({
    mode: z.enum(FieldControlMode),
    value: z.unknown(),
})
export type PredefinedInputField = z.infer<typeof PredefinedInputField>

export const PredefinedInputsStructure = z.object({
    auth: z.optional(z.string()),
    fields: z.record(z.string(), PredefinedInputField),
})
export type PredefinedInputsStructure = z.infer<typeof PredefinedInputsStructure>

export const AgentPieceToolMetadata = z.object({
    pieceName: z.string(),
    pieceVersion: z.string(),
    actionName: z.string(),
    predefinedInput: z.optional(PredefinedInputsStructure),
})
export type AgentPieceToolMetadata = z.infer<typeof AgentPieceToolMetadata>

export const AgentPieceTool = z.object({
    type: z.literal(AgentToolType.PIECE),
    toolName: z.string().check(z.minLength(1)),
    pieceMetadata: AgentPieceToolMetadata,
})
export type AgentPieceTool = z.infer<typeof AgentPieceTool>

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

export const AgentFlowTool = z.object({
    type: z.literal(AgentToolType.FLOW),
    toolName: z.string().check(z.minLength(1)),
    externalFlowId: z.string(),
    flowDisplayName: z.optional(z.string()),
})
export type AgentFlowTool = z.infer<typeof AgentFlowTool>

export const AgentMcpTool = z.object({
    type: z.literal(AgentToolType.MCP),
    toolName: z.string().check(z.minLength(1)),
    serverUrl: z.url(),
    protocol: z.enum(McpProtocol),
    auth: McpAuthConfig,
})
export type AgentMcpTool = z.infer<typeof AgentMcpTool>

export const AgentKnowledgeBaseTool = z.object({
    type: z.literal(AgentToolType.KNOWLEDGE_BASE),
    toolName: z.string().check(z.minLength(1)),
    sourceType: z.enum(KnowledgeBaseSourceType),
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

export const AgentOutputField = z.object({
    displayName: z.string(),
    description: z.optional(z.string()),
    type: z.enum(AgentOutputFieldType),
})
export type AgentOutputField = z.infer<typeof AgentOutputField>

export const MarkdownContentBlock = z.object({
    type: z.literal(ContentBlockType.MARKDOWN),
    markdown: z.string(),
})
export type MarkdownContentBlock = z.infer<typeof MarkdownContentBlock>

const toolCallBaseShape = {
    type: z.literal(ContentBlockType.TOOL_CALL),
    input: Nullable(z.record(z.string(), z.unknown())),
    output: z.optional(z.unknown()),
    toolName: z.string(),
    status: z.enum(ToolCallStatus),
    toolCallId: z.string(),
    startTime: z.string(),
    endTime: z.optional(z.string()),
}

const toolCallBaseSchema = z.object(toolCallBaseShape)

export const ToolCallContentBlock = z.discriminatedUnion('toolCallType', [
    z.object({
        ...toolCallBaseShape,
        toolCallType: z.literal(ToolCallType.PIECE),
        pieceName: z.string(),
        pieceVersion: z.string(),
        actionName: z.string(),
    }),
    z.object({
        ...toolCallBaseShape,
        toolCallType: z.literal(ToolCallType.FLOW),
        displayName: z.string(),
        externalFlowId: z.string(),
    }),
    z.object({
        ...toolCallBaseShape,
        toolCallType: z.literal(ToolCallType.MCP),
        displayName: z.string(),
        serverUrl: z.string(),
    }),
    z.object({
        ...toolCallBaseShape,
        toolCallType: z.literal(ToolCallType.KNOWLEDGE_BASE),
        displayName: z.string(),
        sourceType: z.string(),
    }),
    z.object({
        ...toolCallBaseShape,
        toolCallType: z.literal(ToolCallType.UNKNOWN),
        displayName: z.string(),
    }),
])
export type ToolCallContentBlock = z.infer<typeof ToolCallContentBlock>

export const AgentStepBlock = z.union([MarkdownContentBlock, ToolCallContentBlock])
export type AgentStepBlock = z.infer<typeof AgentStepBlock>

export function buildAuthHeaders(authConfig: McpAuthConfig): Record<string, string> {
    let headers: Record<string, string> = {}
    switch (authConfig.type) {
        case McpAuthType.NONE:
            break
        case McpAuthType.HEADERS: {
            headers = authConfig.headers
            break
        }
        case McpAuthType.ACCESS_TOKEN: {
            headers['Authorization'] = `Bearer ${authConfig.accessToken}`
            break
        }
        case McpAuthType.API_KEY: {
            const headerName = authConfig.apiKeyHeader
            headers[headerName] = authConfig.apiKey
            break
        }
    }
    return headers
}

function shortHash(str: string): string {
    let h = 5381
    for (let i = 0; i < str.length; i++) {
        h = (Math.imul(h, 33) ^ str.charCodeAt(i)) >>> 0
    }
    return h.toString(36).padStart(6, '0').slice(-6)
}

function createToolName(name: string): string {
    const sanitized = name
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '')
    const prefix = sanitized.slice(0, MAX_PREFIX_LENGTH)
    const hash = shortHash(sanitized)
    return `${prefix}_${hash}_mcp`
}

function createPieceToolName(pieceName: string, actionName: string): string {
    const PIECE_NAME_PREFIX = 'piece-'
    const idx = pieceName.indexOf(PIECE_NAME_PREFIX)
    const shortPieceName =
        idx >= 0 ? pieceName.substring(idx + PIECE_NAME_PREFIX.length) : pieceName
    return createToolName(`${shortPieceName}-${actionName}`)
}

const MAX_PREFIX_LENGTH = 53

export const mcpToolNameUtils = { createToolName, createPieceToolName }

export type ToolCallBase = z.infer<typeof toolCallBaseSchema>

export type AgentProviderModel = {
    provider: AIProviderName
    model: string
}

export type AgentResult = {
    prompt: string
    steps: AgentStepBlock[]
    status: AgentTaskStatus
    structuredOutput?: unknown
}
