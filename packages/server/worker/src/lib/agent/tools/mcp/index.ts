import { AgentMcpTool, buildAuthHeaders, McpProtocol } from '@activepieces/shared'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { experimental_createMCPClient as createMCPClient, MCPClient, MCPTransport } from '@ai-sdk/mcp'
import { Tool } from 'ai'

export type McpServerTools = {
    mcpName: string
    mcpClient: MCPClient
    tools: Record<string, Tool>
}

type FlattenedMcpResult = {
    mcpClients: MCPClient[]
    tools: Record<string, Tool>
}

function createTransportConfig(
    protocol: McpProtocol,
    serverUrl: string,
    headers: Record<string, string> = {},
): MCPTransport {
    const url = new URL(serverUrl)

    switch (protocol) {
        case McpProtocol.SIMPLE_HTTP: {
            return {
                type: 'http',
                url: serverUrl,
                headers,
            } as unknown as MCPTransport
        }
        case McpProtocol.STREAMABLE_HTTP: {
            const sessionId = crypto.randomUUID()
            return new StreamableHTTPClientTransport(url, {
                sessionId,
                requestInit: {
                    headers,
                },
            })
        }
        case McpProtocol.SSE: {
            return {
                type: 'sse',
                url: serverUrl,
                headers,
            } as unknown as MCPTransport
        }
        default:
            throw new Error(`Unsupported MCP protocol type: ${protocol}`)
    }
}

function flattenMcpServers(servers: McpServerTools[]): FlattenedMcpResult {
    const mcpClients: MCPClient[] = []
    const tools: Record<string, Tool> = {}

    for (const server of servers) {
        mcpClients.push(server.mcpClient)

        for (const [toolName, fn] of Object.entries(server.tools)) {
            tools[`${toolName}_${server.mcpName}`] = fn
        }
    }

    return { mcpClients, tools }
}

async function constructMcpServersTools(tools: AgentMcpTool[]): Promise<McpServerTools[]> {
    const collected: McpServerTools[] = []

    for (const tool of tools) {
        try {
            const mcpClient = await createMCPClient({
                transport: createTransportConfig(
                    tool.protocol,
                    tool.serverUrl,
                    buildAuthHeaders(tool.auth),
                ),
            })

            const mcpTools = await mcpClient.tools()

            collected.push({
                mcpName: tool.toolName,
                mcpClient,
                tools: mcpTools as Record<string, Tool>,
            })
        }
        catch (error) {
            console.error(
                `Failed to connect to MCP server ${tool.serverUrl}:`,
                error,
            )
        }
    }

    return collected
}

export async function createMcpTools(tools: AgentMcpTool[]): Promise<FlattenedMcpResult> {
    const mcpServerTools = await constructMcpServersTools(tools)
    return flattenMcpServers(mcpServerTools)
}
