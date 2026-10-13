import { isNil } from '@activepieces/core-utils'
import { buildAuthHeaders, McpAuthConfig, McpProtocol } from '@activepieces/shared'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js'
import { Readable } from 'node:stream'
import { safeHttp } from './safe-http'

function normalizeRequestHeaders(headers: RequestInit['headers']): Record<string, string> {
    if (!headers) {
        return {}
    }
    if (headers instanceof Headers) {
        const result: Record<string, string> = {}
        headers.forEach((value, key) => {
            result[key] = value
        })
        return result
    }
    if (Array.isArray(headers)) {
        return Object.fromEntries(headers)
    }
    const result: Record<string, string> = {}
    for (const [key, value] of Object.entries(headers)) {
        if (typeof value === 'string') {
            result[key] = value
        }
    }
    return result
}

function normalizeResponseHeaders(headers: Record<string, unknown>): Record<string, string> {
    const result: Record<string, string> = {}
    for (const [key, value] of Object.entries(headers)) {
        if (typeof value === 'string') {
            result[key] = value
        }
        else if (Array.isArray(value)) {
            result[key] = value.join(', ')
        }
    }
    return result
}

function createSafeMcpFetch({ extraHeaders, timeoutMs, maxResponseBytes }: {
    extraHeaders: Record<string, string>
    timeoutMs: number
    maxResponseBytes: number
}): typeof fetch {
    return async (input, init) => {
        const url = input instanceof URL ? input.toString() : (typeof input === 'string' ? input : input.url)
        const headers = { ...extraHeaders, ...normalizeRequestHeaders(init?.headers) }
        const method = init?.method ?? 'GET'
        const wantsEventStream = Object.entries(headers).some(([key, value]) => key.toLowerCase() === 'accept' && value.includes(EVENT_STREAM_MEDIA_TYPE))

        const response = await safeHttp.axios.request<Readable | ArrayBuffer>({
            method, url, headers, data: init?.body,
            validateStatus: () => true,
            ...(wantsEventStream
                ? { responseType: 'stream', timeout: 0, ...(isNil(init?.signal) ? {} : { signal: init.signal }) }
                : { responseType: 'arraybuffer', timeout: timeoutMs, maxContentLength: maxResponseBytes, maxBodyLength: maxResponseBytes }),
        })
        const body = response.data instanceof Readable ? Readable.toWeb(response.data) : Buffer.from(response.data)
        return new Response(body, {
            status: response.status,
            headers: normalizeResponseHeaders(response.headers),
        })
    }
}

function isHttpUrl(value: string): boolean {
    try {
        const url = new URL(value)
        return url.protocol === 'http:' || url.protocol === 'https:'
    }
    catch {
        return false
    }
}

function toHttpUrl(value: string): URL {
    if (!isHttpUrl(value)) {
        throw new Error('An MCP server must be reached over http or https')
    }
    return new URL(value)
}

function createSafeMcpTransport({ protocol, serverUrl, auth, timeoutMs = DEFAULT_MCP_TIMEOUT_MS, maxResponseBytes = DEFAULT_MCP_MAX_RESPONSE_BYTES }: {
    protocol: McpProtocol
    serverUrl: string
    auth: McpAuthConfig
    timeoutMs?: number
    maxResponseBytes?: number
}): Transport {
    const headers = buildAuthHeaders(auth)
    const url = toHttpUrl(serverUrl)
    const fetch = createSafeMcpFetch({ extraHeaders: headers, timeoutMs, maxResponseBytes })
    if (protocol === McpProtocol.SSE) {
        return new SSEClientTransport(url, { requestInit: { headers }, fetch })
    }
    return new StreamableHTTPClientTransport(url, { requestInit: { headers }, fetch })
}

export const mcpTransport = {
    isHttpUrl,
    createTransport: createSafeMcpTransport,
}

const EVENT_STREAM_MEDIA_TYPE = 'text/event-stream'

export const DEFAULT_MCP_TIMEOUT_MS = 30_000
export const DEFAULT_MCP_MAX_RESPONSE_BYTES = 5 * 1024 * 1024
