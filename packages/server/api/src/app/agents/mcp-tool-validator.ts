import { mcpTransport } from '@activepieces/server-utils'
import { AgentMcpTool, ValidateAgentMcpToolResponse } from '@activepieces/shared'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'

export const mcpToolValidator = {
    async validateAgentMcpTool(tool: AgentMcpTool): Promise<ValidateAgentMcpToolResponse> {
        if (!mcpTransport.isHttpUrl(tool.serverUrl)) {
            return { toolNames: undefined, error: GENERIC_ERROR }
        }
        const transport = mcpTransport.createTransport({
            protocol: tool.protocol,
            serverUrl: tool.serverUrl,
            auth: tool.auth,
            timeoutMs: VALIDATE_TIMEOUT_MS,
            maxResponseBytes: MAX_RESPONSE_BYTES,
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

const VALIDATE_TIMEOUT_MS = 15_000
const MAX_RESPONSE_BYTES = 64 * 1024
const MCP_CLIENT_INFO = { name: 'activepieces-validator', version: '1.0.0' }
const GENERIC_ERROR = 'Could not validate MCP server. Check the URL, authentication, and that the server is reachable.'
