import { SafeFetch, safeHttp } from '@activepieces/server-utils'
import { AgentMcpTool, AgentTool, buildAuthHeaders, McpProtocol, mcpToolNameUtils } from '@activepieces/shared'
import { experimental_createMCPClient as createMCPClient, MCPClient, MCPTransport } from '@ai-sdk/mcp'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { ToolSet } from 'ai'
import { Logger } from 'pino'

/**
 * Worker-side port of the AI piece's MCP tool construction. Connects to each user-configured MCP
 * server and exposes its tools to the agent. CRITICAL: unlike the sandbox, the worker is NOT
 * egress-proxied, so the MCP server URL (user-supplied) is a direct SSRF risk — every transport is
 * given `safeHttp.createSafeFetch()`, which routes the connection through the request-filtering agent
 * (rejecting private/loopback/link-local/metadata IPs). A failed connection to one server is logged
 * and skipped, never aborting the whole run. Returned `mcpClients` MUST be closed on session dispose.
 */
export async function buildMcpTools({ mcpTools, log }: BuildMcpToolsParams): Promise<BuiltMcpTools> {
    const tools: ToolSet = {}
    const toolKeyToAgentTool: Record<string, AgentTool> = {}
    const mcpClients: MCPClient[] = []
    if (mcpTools.length === 0) {
        return { tools, toolKeyToAgentTool, mcpClients }
    }

    const safeFetch = safeHttp.createSafeFetch()

    for (const mcpTool of mcpTools) {
        try {
            const client = await createMCPClient({ transport: createTransport({ mcpTool, safeFetch }) })
            mcpClients.push(client)
            // The MCP SDK tool type is runtime-compatible with the AI SDK `ToolSet` but does not unify
            // with its constrained generic union, so adapt at this boundary (as the AI piece does).
            const serverTools = await client.tools() as unknown as ToolSet
            for (const [toolName, tool] of Object.entries(serverTools)) {
                const key = mcpToolNameUtils.createToolName(toolName)
                tools[key] = tool
                toolKeyToAgentTool[key] = mcpTool
            }
        }
        catch (error) {
            log.warn({ err: error, serverUrl: mcpTool.serverUrl }, '[mcpTools] Failed to connect to MCP server; skipping')
        }
    }

    return { tools, toolKeyToAgentTool, mcpClients }
}

export function closeMcpClients(mcpClients: MCPClient[], log: Logger): void {
    for (const client of mcpClients) {
        void Promise.resolve(client.close()).catch((error) => {
            log.debug({ err: error }, '[mcpTools] Failed to close MCP client')
        })
    }
}

function createTransport({ mcpTool, safeFetch }: CreateTransportParams): MCPTransport {
    const url = new URL(mcpTool.serverUrl)
    const headers = buildAuthHeaders(mcpTool.auth)
    switch (mcpTool.protocol) {
        case McpProtocol.SSE:
            return new SSEClientTransport(url, { requestInit: { headers }, fetch: safeFetch, eventSourceInit: { fetch: safeFetch } })
        case McpProtocol.SIMPLE_HTTP:
        case McpProtocol.STREAMABLE_HTTP:
            return new StreamableHTTPClientTransport(url, { requestInit: { headers }, fetch: safeFetch })
        default:
            throw new Error(`Unsupported MCP protocol type: ${mcpTool.protocol}`)
    }
}

type CreateTransportParams = {
    mcpTool: AgentMcpTool
    safeFetch: SafeFetch
}

type BuildMcpToolsParams = {
    mcpTools: AgentMcpTool[]
    log: Logger
}

export type BuiltMcpTools = {
    tools: ToolSet
    toolKeyToAgentTool: Record<string, AgentTool>
    mcpClients: MCPClient[]
}
