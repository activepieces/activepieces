import { tryCatch } from '@activepieces/core-utils'
import { chatToolPhases } from '@activepieces/shared'
import { createMCPClient } from '@ai-sdk/mcp'
import { ToolExecutionOptions } from 'ai'
import { FastifyBaseLogger } from 'fastify'
import { chatWorkerTools } from './chat-worker-tools'

const CONVERSATION_ID_HEADER = 'x-ap-conversation-id'

const MCP_CONNECTOR_NAME_PATTERN = /^mcp__([^_]+)__/
const MCP_AUTH_ERROR_PATTERN = /\b(401|403)\b|unauthorized|forbidden|invalid[_\s-]?(access[_\s-]?)?token|token (has )?(expired|revoked)|\breconnect\b|re-?authenticat|authentication (failed|error|required)|not (authenticated|authorized)|oauth\s*(error|token|expired)/i

async function connectMcpClient({ mcpCredentials, conversationId, log }: {
    mcpCredentials: { mcpServerUrl: string, mcpToken: string } | null
    conversationId: string
    log: FastifyBaseLogger
}): Promise<McpConnection> {
    if (!mcpCredentials) {
        return { mcpClient: null, mcpToolSet: {} }
    }

    const { mcpServerUrl, mcpToken } = mcpCredentials

    const { data: client, error } = await tryCatch(async () => createMCPClient({
        transport: {
            type: 'http',
            url: mcpServerUrl,
            headers: {
                'Authorization': `Bearer ${mcpToken}`,
                [CONVERSATION_ID_HEADER]: conversationId,
            },
        },
    }))

    if (!client) {
        log.warn({ error }, 'Failed to create MCP client — chat will work without MCP tools')
        return { mcpClient: null, mcpToolSet: {} }
    }

    const allMcpTools = await client.tools()
    const mcpToolSet: Record<string, unknown> = {}
    for (const [name, tool] of Object.entries(allMcpTools)) {
        if (!chatToolPhases.isChatHiddenTool(name)) {
            mcpToolSet[name] = tool
        }
    }
    return { mcpClient: client, mcpToolSet }
}

function hasExecute(tool: object): tool is object & { execute: (args: unknown, options?: ToolExecutionOptions) => Promise<unknown> } {
    return 'execute' in tool && typeof tool.execute === 'function'
}

function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null
}

function parseConnectorUuid(toolName: string): string | null {
    const match = MCP_CONNECTOR_NAME_PATTERN.exec(toolName)
    return match ? match[1] : null
}

function extractErrorStatus(error: unknown): number | undefined {
    if (!isObject(error)) {
        return undefined
    }
    for (const key of ['statusCode', 'status', 'code']) {
        const value = error[key]
        if (typeof value === 'number') {
            return value
        }
    }
    const response = error['response']
    if (isObject(response) && typeof response['status'] === 'number') {
        return response['status']
    }
    return undefined
}

function errorMessageText(error: unknown): string {
    if (error instanceof Error) {
        return error.message
    }
    if (typeof error === 'string') {
        return error
    }
    return chatWorkerTools.extractResultText(error)
}

function classifyMcpAuthError({ error, result, toolName }: {
    error?: unknown
    result?: unknown
    toolName: string
}): { isAuthError: boolean, connectorUuid: string | null } {
    const connectorUuid = parseConnectorUuid(toolName)
    if (error !== undefined && error !== null) {
        const status = extractErrorStatus(error)
        const message = errorMessageText(error)
        const isAuthError = status === 401 || status === 403 || MCP_AUTH_ERROR_PATTERN.test(message)
        return { isAuthError, connectorUuid }
    }
    if (isObject(result) && result['isError'] === true) {
        const text = chatWorkerTools.extractResultText(result)
        return { isAuthError: MCP_AUTH_ERROR_PATTERN.test(text), connectorUuid }
    }
    return { isAuthError: false, connectorUuid }
}

function buildReconnectGuidance({ connectorUuid, alreadyFlagged }: { connectorUuid: string | null, alreadyFlagged?: boolean }): unknown {
    const target = connectorUuid
        ? `Call ap_show_mcp_reconnect with connectorUuid "${connectorUuid}"`
        : 'Call ap_show_mcp_reconnect for this integration'
    const text = alreadyFlagged
        ? `❌ This integration's connection is already known to be broken — you saw an auth failure on it moments ago, and this call was NOT sent. Stop calling its tools. ${target} (look up its display name and reconnect link via list_connectors or search_mcp_registry) and wait for the user to reconnect. Do NOT try its other tools, vary the inputs, or work around it — none of that will help until the user reconnects.`
        : `❌ This integration's connection needs to be reconnected — authentication failed. ${target} (look up its display name and reconnect link via list_connectors or search_mcp_registry), then retry this call once after the user reconnects. Do not silently work around it or switch accounts.`
    return {
        isError: true,
        _meta: { authError: true, connectorUuid },
        content: [{ type: 'text', text }],
    }
}

function withToolTimeouts({ mcpToolSet, brokenConnectors }: {
    mcpToolSet: Record<string, unknown>
    brokenConnectors: Set<string>
}): Record<string, unknown> {
    const result: Record<string, unknown> = {}

    for (const [name, tool] of Object.entries(mcpToolSet)) {
        if (typeof tool !== 'object' || tool === null || !hasExecute(tool)) {
            result[name] = tool
            continue
        }

        const originalExecute = tool.execute.bind(tool)
        const toolConnectorUuid = parseConnectorUuid(name)

        result[name] = Object.assign({}, tool, {
            execute: async (args: unknown, options?: ToolExecutionOptions) => {
                if (toolConnectorUuid !== null && brokenConnectors.has(toolConnectorUuid)) {
                    return buildReconnectGuidance({ connectorUuid: toolConnectorUuid, alreadyFlagged: true })
                }
                const { data: toolResult, error } = await tryCatch(() => chatWorkerTools.withToolTimeout({
                    fn: (timeoutSignal) => originalExecute(args, options ? { ...options, abortSignal: timeoutSignal } : undefined),
                    timeoutMs: chatWorkerTools.TOOL_EXECUTION_TIMEOUT_MS,
                    toolName: name,
                }))
                if (error) {
                    const { isAuthError, connectorUuid } = classifyMcpAuthError({ error, toolName: name })
                    if (isAuthError) {
                        if (connectorUuid !== null) {
                            brokenConnectors.add(connectorUuid)
                        }
                        return buildReconnectGuidance({ connectorUuid })
                    }
                    throw error
                }
                const { isAuthError, connectorUuid } = classifyMcpAuthError({ result: toolResult, toolName: name })
                if (isAuthError) {
                    if (connectorUuid !== null) {
                        brokenConnectors.add(connectorUuid)
                    }
                    return buildReconnectGuidance({ connectorUuid })
                }
                return chatWorkerTools.truncateLargeResult(toolResult)
            },
        })
    }

    return result
}

type McpConnection = {
    mcpClient: Awaited<ReturnType<typeof createMCPClient>> | null
    mcpToolSet: Record<string, unknown>
}

export const chatMcpClient = {
    connect: connectMcpClient,
    withToolTimeouts,
    classifyMcpAuthError,
}
