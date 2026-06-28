import { tryCatch, tryCatchSync } from '@activepieces/core-utils'
import { chatAiUtils } from '@activepieces/server-utils'
import { chatCodeModeUtils, ChatContextCompression, ChatContextCompressionMethod, chatToolPhases } from '@activepieces/shared'
import { createMCPClient } from '@ai-sdk/mcp'
import { ToolExecutionOptions } from 'ai'
import { FastifyBaseLogger } from 'fastify'
import { chatWorkerTools } from './chat-worker-tools'

const CONVERSATION_ID_HEADER = 'x-ap-conversation-id'
const MCP_OFFLOAD_BYTES = 64 * 1024
// Only badge a reduction the user would actually care about: skip sub-512-byte savings and
// reductions under ~10%, so a trivial trim never advertises itself as "Context compression".
const COMPRESSION_MIN_SAVED_BYTES = 512
const COMPRESSION_MIN_SAVED_RATIO = 0.1
const PIECE_PROPS_TOOL_NAME = 'ap_get_piece_props'
const RESOLVE_OPTIONS_TOOL_NAME = 'ap_resolve_property_options'
const RESOLVE_CHAIN_TOOL_NAME = 'ap_resolve_property_chain'
const CACHEABLE_TOOL_NAMES = new Set<string>([PIECE_PROPS_TOOL_NAME, RESOLVE_OPTIONS_TOOL_NAME, RESOLVE_CHAIN_TOOL_NAME])
const RESOLVE_TOOL_NAMES = new Set<string>([RESOLVE_OPTIONS_TOOL_NAME, RESOLVE_CHAIN_TOOL_NAME])
const RESOLVE_FAILED_PREFIX = '⚠️ Options could not be loaded'
const TRANSIENT_RESOLVE_MARKERS = ['Could not resolve', 'Timed out', RESOLVE_FAILED_PREFIX]
const PROP_VERBOSE_KEYS = new Set<string>(['description', 'defaultValue', 'sampleData', 'examples', 'sampleOutput'])
const PROP_RECURSE_KEYS = new Set<string>(['items', 'dynamicFields', 'children', 'listItems'])
const SCHEMA_ROOT_VERBOSE_KEYS = new Set<string>(['sampleData', 'examples', 'sampleOutput'])

const TOOL_RESULT_CACHE_TTL_MS = 10 * 60 * 1_000
const TOOL_RESULT_CACHE_MAX_ENTRIES = 200
const toolResultCache = new Map<string, { result: unknown, expiresAt: number }>()

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

function serializedByteSize(value: unknown): number {
    const { data: serialized } = tryCatchSync(() => JSON.stringify(value))
    return typeof serialized === 'string' ? Buffer.byteLength(serialized, 'utf8') : 0
}

// Decide whether a before→after reduction is worth surfacing as a "Context compression" badge.
// Returns null for no-ops and trivial trims so the UI only ever shows a genuine win.
function measureCompression({ method, originalBytes, returnedBytes }: {
    method: ChatContextCompressionMethod
    originalBytes: number
    returnedBytes: number
}): ChatContextCompression | null {
    if (originalBytes <= 0 || returnedBytes <= 0 || returnedBytes >= originalBytes) {
        return null
    }
    const savedBytes = originalBytes - returnedBytes
    if (savedBytes < COMPRESSION_MIN_SAVED_BYTES || savedBytes / originalBytes < COMPRESSION_MIN_SAVED_RATIO) {
        return null
    }
    return { method, originalBytes, returnedBytes }
}

// Rides the compression metadata alongside the result on `structuredContent.contextCompression`,
// mirroring how Code Mode threads its structured payload to the UI. The model still reads the
// (already-reduced) content/text; this only adds a few numbers + a short method string.
function attachCompressionMetadata({ result, compression }: {
    result: unknown
    compression: ChatContextCompression | null
}): unknown {
    if (compression === null || !isObject(result)) {
        return result
    }
    const existingStructured = isObject(result['structuredContent']) ? result['structuredContent'] : {}
    return {
        ...result,
        structuredContent: { ...existingStructured, contextCompression: compression },
    }
}

function withToolTimeouts({ mcpToolSet, conversationId, brokenConnectors, getSelectedAuth, saveLargeResult }: {
    mcpToolSet: Record<string, unknown>
    conversationId: string
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
                // Code Mode bridged call: the in-VM code consumes the FULL result, so the digest/
                // offload/truncate reductions (which exist to keep the MODEL's context lean) must NOT
                // run. Strip the marker so it never reaches the MCP tool's own input.
                const wantsRawResult = chatCodeModeUtils.isRawArgs(rawArgs)
                const args = injectSelectedAuth({ name, args: chatCodeModeUtils.stripRawArgs(rawArgs), getSelectedAuth })
                if (toolConnectorUuid !== null && brokenConnectors.has(toolConnectorUuid)) {
                    return buildReconnectGuidance({ connectorUuid: toolConnectorUuid, alreadyFlagged: true })
                }
                // Raw (Code Mode) calls bypass the cache: it stores results already reduced for the
                // model, and the raw path must never serve or seed a reduced entry.
                const cacheKey = !wantsRawResult && CACHEABLE_TOOL_NAMES.has(name)
                    ? buildToolCacheKey({ conversationId, toolName: name, args })
                    : null
                if (cacheKey !== null) {
                    const cached = readToolResultCache(cacheKey)
                    if (cached.hit) {
                        return cached.result
                    }
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
                    if (RESOLVE_TOOL_NAMES.has(name)) {
                        return buildResolveFailFastResult({ args })
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
                // Hand Code Mode the FULL, un-reduced result by reference (the bridge injects it into
                // the vm context as-is — no file, no JSON round-trip). The reductions below are only
                // for the model's context. Caching is also skipped: the cacheable tools are small
                // schema reads, not the big payloads Code Mode pulls, so there is nothing to gain.
                if (wantsRawResult) {
                    return toolResult
                }
                const originalBytes = serializedByteSize(toolResult)
                const digested = digestMcpResult({ toolName: name, result: toolResult })
                const offloaded = await maybeOffloadMcpResult({ result: digested, toolName: name, saveLargeResult })
                const reduced = offloaded !== null ? offloaded : chatWorkerTools.truncateLargeResult(digested)
                const method: ChatContextCompressionMethod = offloaded !== null
                    ? 'offloaded'
                    : reduced !== digested
                        ? 'truncated'
                        : 'condensed'
                const compression = measureCompression({ method, originalBytes, returnedBytes: serializedByteSize(reduced) })
                const finalResult = attachCompressionMetadata({ result: reduced, compression })
                if (cacheKey !== null) {
                    writeToolResultCache({ key: cacheKey, result: finalResult })
                }
                return finalResult
            },
        })
    }

    return result
}

function buildToolCacheKey({ conversationId, toolName, args }: { conversationId: string, toolName: string, args: unknown }): string | null {
    if (!isObject(args)) {
        return null
    }
    const pieceName = typeof args['pieceName'] === 'string' ? args['pieceName'] : null
    const actionOrTriggerName = typeof args['actionOrTriggerName'] === 'string' ? args['actionOrTriggerName'] : null
    const type = typeof args['type'] === 'string' ? args['type'] : null
    if (pieceName === null || actionOrTriggerName === null || type === null) {
        return null
    }
    const keyParts = {
        pieceName,
        actionOrTriggerName,
        type,
        auth: typeof args['auth'] === 'string' && args['auth'].length > 0,
        flowId: typeof args['flowId'] === 'string' ? args['flowId'] : null,
        propertyName: typeof args['propertyName'] === 'string' ? args['propertyName'] : null,
        propertyChain: Array.isArray(args['propertyChain']) ? JSON.stringify(args['propertyChain']) : null,
        searchValue: typeof args['searchValue'] === 'string' ? args['searchValue'] : null,
        input: isObject(args['input']) ? JSON.stringify(args['input']) : null,
        currentInput: isObject(args['currentInput']) ? JSON.stringify(args['currentInput']) : null,
    }
    return `${conversationId}::${toolName}::${JSON.stringify(keyParts)}`
}

function readToolResultCache(key: string): { hit: boolean, result: unknown } {
    const entry = toolResultCache.get(key)
    if (!entry) {
        return { hit: false, result: undefined }
    }
    if (entry.expiresAt <= Date.now()) {
        toolResultCache.delete(key)
        return { hit: false, result: undefined }
    }
    toolResultCache.delete(key)
    toolResultCache.set(key, entry)
    return { hit: true, result: entry.result }
}

function writeToolResultCache({ key, result }: { key: string, result: unknown }): void {
    if (isResultUncacheable(result)) {
        return
    }
    toolResultCache.set(key, { result, expiresAt: Date.now() + TOOL_RESULT_CACHE_TTL_MS })
    while (toolResultCache.size > TOOL_RESULT_CACHE_MAX_ENTRIES) {
        const oldestKey = toolResultCache.keys().next().value
        if (oldestKey === undefined) {
            break
        }
        toolResultCache.delete(oldestKey)
    }
}

function isResultUncacheable(result: unknown): boolean {
    if (!isObject(result)) {
        return false
    }
    if (result['isError'] === true) {
        return true
    }
    if (!Array.isArray(result['content'])) {
        return false
    }
    const combinedText = result['content']
        .map((entry) => isObject(entry) && typeof entry['text'] === 'string' ? entry['text'] : '')
        .join('\n')
    return TRANSIENT_RESOLVE_MARKERS.some((marker) => combinedText.includes(marker))
}

function buildResolveFailFastResult({ args }: { args: unknown }): unknown {
    const propertyName = isObject(args) && typeof args['propertyName'] === 'string' ? args['propertyName'] : null
    const target = propertyName ? `for "${propertyName}" ` : ''
    return {
        content: [{
            type: 'text',
            text: `${RESOLVE_FAILED_PREFIX} ${target}(the resolver is slow right now). Do not keep retrying — proceed by setting a manual value the user provided, or retry this once at most. The flow-editor dropdown may appear unset; mention that to the user if relevant.`,
        }],
    }
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
