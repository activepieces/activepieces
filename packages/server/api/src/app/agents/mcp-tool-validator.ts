import { safeHttp } from '@activepieces/server-utils'
import { AgentMcpTool, buildAuthHeaders, McpProtocol, ValidateAgentMcpToolResponse } from '@activepieces/shared'

export const mcpToolValidator = {
    async validateAgentMcpTool(tool: AgentMcpTool): Promise<ValidateAgentMcpToolResponse> {
        if (!isValidUrl(tool.serverUrl)) {
            return { toolNames: undefined, error: GENERIC_ERROR }
        }
        try {
            const authHeaders = buildAuthHeaders(tool.auth)
            const toolNames = await probeMcpServer({
                protocol: tool.protocol,
                serverUrl: tool.serverUrl,
                authHeaders,
            })
            return { toolNames, error: undefined }
        }
        catch {
            return { toolNames: undefined, error: GENERIC_ERROR }
        }
    },
}

async function probeMcpServer({ protocol, serverUrl, authHeaders }: ProbeParams): Promise<string[]> {
    const accept = acceptForProtocol(protocol)

    const initResult = await sendJsonRpc({
        url: serverUrl,
        headers: authHeaders,
        accept,
        body: {
            jsonrpc: '2.0',
            id: INITIALIZE_ID,
            method: 'initialize',
            params: {
                protocolVersion: MCP_PROTOCOL_VERSION,
                capabilities: {},
                clientInfo: MCP_CLIENT_INFO,
            },
        },
    })

    const sessionHeaders: Record<string, string> = initResult.sessionId
        ? { ...authHeaders, 'Mcp-Session-Id': initResult.sessionId }
        : authHeaders

    await sendInitializedNotification({ url: serverUrl, headers: sessionHeaders, accept })

    const toolsResult = await sendJsonRpc({
        url: serverUrl,
        headers: sessionHeaders,
        accept,
        body: {
            jsonrpc: '2.0',
            id: TOOLS_LIST_ID,
            method: 'tools/list',
            params: {},
        },
    })
    return extractToolNames(toolsResult.message)
}

function acceptForProtocol(protocol: McpProtocol): string {
    switch (protocol) {
        case McpProtocol.SIMPLE_HTTP:
            return 'application/json'
        case McpProtocol.STREAMABLE_HTTP:
            return 'application/json, text/event-stream'
        case McpProtocol.SSE:
            return 'text/event-stream'
        default:
            throw new Error(`Unsupported MCP protocol: ${String(protocol)}`)
    }
}

async function sendJsonRpc({ url, headers, accept, body }: SendJsonRpcParams): Promise<{ message: JsonRpcResponse, sessionId: string | null }> {
    const response = await safeHttp.retryingAxios.post<string>(url, JSON.stringify(body), {
        headers: {
            'Content-Type': 'application/json',
            Accept: accept,
            ...headers,
        },
        timeout: VALIDATE_TIMEOUT_MS,
        maxRedirects: 0,
        responseType: 'text',
        transformResponse: (raw) => raw,
        maxContentLength: MAX_RESPONSE_BYTES,
        maxBodyLength: MAX_RESPONSE_BYTES,
    })

    const contentType = String(response.headers['content-type'] ?? '').toLowerCase()
    const sessionIdHeader = response.headers['mcp-session-id']
    const sessionId = typeof sessionIdHeader === 'string' ? sessionIdHeader : null

    if (contentType.includes('text/event-stream')) {
        return {
            message: parseFirstMatchingSseJsonRpc({ raw: response.data, matchId: body.id }),
            sessionId,
        }
    }

    const parsed: unknown = JSON.parse(response.data)
    if (!isJsonRpcResponse(parsed)) {
        throw new Error('malformed JSON-RPC response')
    }
    return { message: parsed, sessionId }
}

async function sendInitializedNotification({ url, headers, accept }: SendInitializedNotificationParams): Promise<void> {
    try {
        await safeHttp.retryingAxios.post(url, JSON.stringify({
            jsonrpc: '2.0',
            method: 'notifications/initialized',
            params: {},
        }), {
            headers: {
                'Content-Type': 'application/json',
                Accept: accept,
                ...headers,
            },
            timeout: VALIDATE_TIMEOUT_MS,
            maxRedirects: 0,
            responseType: 'text',
            transformResponse: (raw) => raw,
            maxContentLength: MAX_RESPONSE_BYTES,
            maxBodyLength: MAX_RESPONSE_BYTES,
            validateStatus: () => true,
        })
    }
    catch {
        // Notifications are fire-and-forget. Swallow errors here so a 202 / 204 /
        // short-lived connect hiccup on the notification doesn't fail the whole probe.
    }
}

function parseFirstMatchingSseJsonRpc({ raw, matchId }: ParseSseParams): JsonRpcResponse {
    const parts = raw.split(/\r?\n\r?\n/)
    for (const part of parts) {
        const dataLines = part
            .split(/\r?\n/)
            .filter((line) => line.startsWith('data:'))
            .map((line) => line.slice('data:'.length).replace(/^ /, ''))
        if (dataLines.length === 0) {
            continue
        }
        const event = dataLines.join('\n')
        const parsed = tryParseJsonRpc(event)
        if (parsed && parsed.id === matchId) {
            return parsed
        }
    }
    throw new Error('no matching SSE event')
}

function tryParseJsonRpc(raw: string): JsonRpcResponse | null {
    try {
        const parsed: unknown = JSON.parse(raw)
        return isJsonRpcResponse(parsed) ? parsed : null
    }
    catch {
        return null
    }
}

function isJsonRpcResponse(value: unknown): value is JsonRpcResponse {
    return (
        typeof value === 'object' &&
        value !== null &&
        'jsonrpc' in value &&
        value.jsonrpc === '2.0'
    )
}

function extractToolNames(message: JsonRpcResponse): string[] {
    if (message.error) {
        throw new Error('MCP server rejected tools/list')
    }
    const result = message.result
    if (
        typeof result !== 'object' ||
        result === null ||
        !('tools' in result) ||
        !Array.isArray(result.tools)
    ) {
        throw new Error('tools array missing')
    }
    const names: string[] = []
    for (const tool of result.tools) {
        if (
            typeof tool === 'object' &&
            tool !== null &&
            'name' in tool &&
            typeof tool.name === 'string'
        ) {
            names.push(tool.name)
        }
    }
    return names
}

function isValidUrl(value: string): boolean {
    try {
        const url = new URL(value)
        return url.protocol === 'http:' || url.protocol === 'https:'
    }
    catch {
        return false
    }
}

const VALIDATE_TIMEOUT_MS = 15_000
const MAX_RESPONSE_BYTES = 64 * 1024
const MCP_PROTOCOL_VERSION = '2025-03-26'
const MCP_CLIENT_INFO = {
    name: 'activepieces-validator',
    version: '1.0.0',
}
const INITIALIZE_ID = 1
const TOOLS_LIST_ID = 2
const GENERIC_ERROR = 'Could not validate MCP server. Check the URL, authentication, and that the server is reachable.'

type ProbeParams = {
    protocol: McpProtocol
    serverUrl: string
    authHeaders: Record<string, string>
}

type SendJsonRpcParams = {
    url: string
    headers: Record<string, string>
    accept: string
    body: JsonRpcRequest
}

type SendInitializedNotificationParams = {
    url: string
    headers: Record<string, string>
    accept: string
}

type ParseSseParams = {
    raw: string
    matchId: number | string
}

type JsonRpcRequest = {
    jsonrpc: '2.0'
    id: number | string
    method: string
    params?: unknown
}

type JsonRpcResponse = {
    jsonrpc: '2.0'
    id?: number | string
    result?: unknown
    error?: { code?: number, message?: string, data?: unknown }
}
