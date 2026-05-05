import { safeHttp } from '@activepieces/server-utils'
import { AgentMcpTool, buildAuthHeaders, ValidateAgentMcpToolResponse } from '@activepieces/shared'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'

export const mcpToolValidator = {
    async validateAgentMcpTool(tool: AgentMcpTool): Promise<ValidateAgentMcpToolResponse> {
        if (!isValidUrl(tool.serverUrl)) {
            return { toolNames: undefined, error: GENERIC_ERROR }
        }
        const headers = buildAuthHeaders(tool.auth)
        const transport = new StreamableHTTPClientTransport(new URL(tool.serverUrl), {
            requestInit: { headers },
            fetch: createSafeFetch(headers),
        })
        const client = new Client(MCP_CLIENT_INFO)
        try {
            await withTimeout(client.connect(transport), VALIDATE_TIMEOUT_MS)
            const result = await withTimeout(client.listTools(), VALIDATE_TIMEOUT_MS)
            return { toolNames: result.tools.map((t) => t.name), error: undefined }
        }
        catch {
            return { toolNames: undefined, error: GENERIC_ERROR }
        }
        finally {
            await transport.close().catch(() => undefined)
        }
    },
}

function createSafeFetch(extraHeaders: Record<string, string>): typeof fetch {
    return async (input, init) => {
        const url = input instanceof URL ? input.toString() : (typeof input === 'string' ? input : input.url)
        const response = await safeHttp.axios.request<ArrayBuffer>({
            method: init?.method ?? 'GET',
            url,
            headers: { ...extraHeaders, ...(init?.headers as Record<string, string> | undefined) },
            data: init?.body,
            responseType: 'arraybuffer',
            validateStatus: () => true,
            timeout: VALIDATE_TIMEOUT_MS,
            maxContentLength: MAX_RESPONSE_BYTES,
            maxBodyLength: MAX_RESPONSE_BYTES,
        })
        return new Response(Buffer.from(response.data), {
            status: response.status,
            headers: response.headers as Record<string, string>,
        })
    }
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    let timer: NodeJS.Timeout | undefined
    const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('mcp validation timeout')), ms)
    })
    try {
        return await Promise.race([promise, timeout])
    }
    finally {
        if (timer) clearTimeout(timer)
    }
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
const MCP_CLIENT_INFO = { name: 'activepieces-validator', version: '1.0.0' }
const GENERIC_ERROR = 'Could not validate MCP server. Check the URL, authentication, and that the server is reachable.'
