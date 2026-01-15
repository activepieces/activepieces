import { MCPClient } from '@ai-sdk/mcp'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { Tool } from 'ai'
import { McpAuthConfig, McpAuthType, McpProtocol } from './tools'

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

export function createTransportConfig(
    protocol: McpProtocol,
    serverUrl: string,
    headers: Record<string, string> = {},
) {
    const url = new URL(serverUrl)

    switch (protocol) {
        case McpProtocol.SIMPLE_HTTP: {
            return {
                type: 'http',
                url: serverUrl,
                headers,
            }
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
            }
        }
        default:
            throw new Error(`Unsupported MCP protocol type: ${protocol}`)
    }
}

export type McpServerTools = {
    mcpName: string
    mcpClient: MCPClient
    tools: Record<string, Tool>
}

export type ValidateAgentMcpToolResponse = {
    toolNames?: string[]
    error?: string
}

