import { tryCatch, tryCatchSync } from '@activepieces/core-utils'
import { chatAiUtils } from '@activepieces/server-utils'
import { chatToolPhases } from '@activepieces/shared'
import { createMCPClient } from '@ai-sdk/mcp'
import { ToolExecutionOptions } from 'ai'
import { FastifyBaseLogger } from 'fastify'
import { chatWorkerTools } from './chat-worker-tools'

const CONVERSATION_ID_HEADER = 'x-ap-conversation-id'
const MCP_OFFLOAD_BYTES = 64 * 1024
const PIECE_PROPS_TOOL_NAME = 'ap_get_piece_props'
const PROP_VERBOSE_KEYS = new Set<string>(['description', 'defaultValue', 'sampleData', 'examples', 'sampleOutput'])
const PROP_RECURSE_KEYS = new Set<string>(['items', 'dynamicFields', 'children', 'listItems'])
const SCHEMA_ROOT_VERBOSE_KEYS = new Set<string>(['sampleData', 'examples', 'sampleOutput'])

const MCP_CONNECTOR_NAME_PATTERN = /^mcp__([^_]+)__/
// High-precision: matched against tool RESULT text (which can contain user/CRM data), so it
// only fires on explicit auth signals. Low-precision alternations that match ordinary prose —
// bare "reconnect", generic "invalid token", bare "oauth" — are deliberately excluded.
const MCP_AUTH_ERROR_PATTERN = /\b(401|403)\b|unauthorized|forbidden|token (has )?(expired|revoked)|re-?authenticat|authentication (failed|error|required)|not (authenticated|authorized)|oauth\s*error/i

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

// Piece-introspection tools accept an `auth` (connection externalId). Once the user has
// picked a connection for a piece, that pick is authoritative — inject it so the model can
// never resolve dropdowns/props against a guessed or stale externalId (which silently yields
// empty options and pushes the agent off the native path onto raw custom_api_call).
const AUTH_INJECTABLE_TOOLS = new Set(['ap_get_piece_props', 'ap_resolve_property_options', 'ap_resolve_property_chain'])

function injectSelectedAuth({ name, args, getSelectedAuth }: {
    name: string
    args: unknown
    getSelectedAuth?: (params: { pieceName: string }) => string | undefined
}): unknown {
    if (getSelectedAuth === undefined || !AUTH_INJECTABLE_TOOLS.has(name) || !isObject(args)) {
        return args
    }
    const pieceName = args['pieceName']
    if (typeof pieceName !== 'string') {
        return args
    }
    const externalId = getSelectedAuth({ pieceName: chatWorkerTools.normalizePieceName(pieceName) })
    if (externalId === undefined || args['auth'] === externalId) {
        return args
    }
    return { ...args, auth: externalId }
}

// A large mcp__ tool result is persisted to a file and replaced with a compact preview + fileId,
// so the agent processes it in ap_run_code (inputs.data) instead of the blob flooding context —
// the same contract as the native-action offload. Returns null to fall through to truncation.
async function maybeOffloadMcpResult({ result, toolName, saveLargeResult }: {
    result: unknown
    toolName: string
    saveLargeResult?: (args: { json: string, fileName: string }) => Promise<string | null>
}): Promise<unknown> {
    if (saveLargeResult === undefined) {
        return null
    }
    let serialized: string
    try {
        serialized = JSON.stringify(result)
    }
    catch {
        return null
    }
    const byteSize = Buffer.byteLength(serialized, 'utf8')
    if (byteSize <= MCP_OFFLOAD_BYTES) {
        return null
    }
    const fileId = await saveLargeResult({ json: serialized, fileName: `${toolName}-result.json` })
    if (fileId === null) {
        return null
    }
    return { content: [{ type: 'text', text: chatAiUtils.buildLargeResultPreview({ payload: result, byteSize, fileId, label: toolName }) }] }
}

function withToolTimeouts({ mcpToolSet, brokenConnectors, getSelectedAuth, saveLargeResult }: {
    mcpToolSet: Record<string, unknown>
    brokenConnectors: Set<string>
    getSelectedAuth?: (params: { pieceName: string }) => string | undefined
    saveLargeResult?: (args: { json: string, fileName: string }) => Promise<string | null>
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
            execute: async (rawArgs: unknown, options?: ToolExecutionOptions) => {
                const args = injectSelectedAuth({ name, args: rawArgs, getSelectedAuth })
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
                const digested = digestMcpResult({ toolName: name, result: toolResult })
                const offloaded = await maybeOffloadMcpResult({ result: digested, toolName: name, saveLargeResult })
                if (offloaded !== null) {
                    return offloaded
                }
                return chatWorkerTools.truncateLargeResult(digested)
            },
        })
    }

    return result
}

function digestMcpResult({ toolName, result }: {
    toolName: string
    result: unknown
}): unknown {
    return toolName === PIECE_PROPS_TOOL_NAME ? condensePiecePropsResult(result) : result
}

function condensePiecePropsResult(result: unknown): unknown {
    if (!isObject(result)) {
        return result
    }
    const structuredContent = isObject(result['structuredContent'])
        ? condenseSchemaObject(result['structuredContent'])
        : result['structuredContent']
    const content = Array.isArray(result['content'])
        ? result['content'].map(condenseContentEntry)
        : result['content']
    return { ...result, content, structuredContent }
}

function condenseContentEntry(entry: unknown): unknown {
    if (!isObject(entry) || entry['type'] !== 'text' || typeof entry['text'] !== 'string') {
        return entry
    }
    return { ...entry, text: condenseEmbeddedSchemaJson(entry['text']) }
}

function condenseEmbeddedSchemaJson(text: string): string {
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    if (start === -1 || end <= start) {
        return text
    }
    const before = text.slice(0, start)
    const jsonBlock = text.slice(start, end + 1)
    const after = text.slice(end + 1)
    const { data: parsed, error } = tryCatchSync(() => JSON.parse(jsonBlock))
    if (error || !isObject(parsed)) {
        return text
    }
    return `${before}${JSON.stringify(condenseSchemaObject(parsed), null, 2)}${after}`
}

function condenseSchemaObject(schema: Record<string, unknown>): Record<string, unknown> {
    const condensed: Record<string, unknown> = { ...schema }
    if (Array.isArray(schema['props'])) {
        condensed['props'] = schema['props'].map(condensePropSummary)
    }
    if (isObject(schema['outputSchema'])) {
        condensed['outputSchema'] = condenseOutputSchema(schema['outputSchema'])
    }
    for (const key of Object.keys(condensed)) {
        if (SCHEMA_ROOT_VERBOSE_KEYS.has(key)) {
            delete condensed[key]
        }
    }
    return condensed
}

function condensePropSummary(prop: unknown): unknown {
    if (!isObject(prop)) {
        return prop
    }
    const kept: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(prop)) {
        if (PROP_VERBOSE_KEYS.has(key)) {
            continue
        }
        kept[key] = PROP_RECURSE_KEYS.has(key) && Array.isArray(value)
            ? value.map(condensePropSummary)
            : value
    }
    return kept
}

function condenseOutputSchema(outputSchema: Record<string, unknown>): Record<string, unknown> {
    const condensed: Record<string, unknown> = { ...outputSchema }
    if (Array.isArray(outputSchema['fields'])) {
        condensed['fields'] = outputSchema['fields'].map(condensePropSummary)
    }
    return condensed
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
