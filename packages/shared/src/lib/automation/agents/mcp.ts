import { McpAuthConfig, McpAuthType } from './tools'

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

export type ValidateAgentMcpToolResponse = {
    toolNames?: string[]
    error?: string
}

