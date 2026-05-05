import { isNil, tryCatch } from '@activepieces/shared'
import { createMCPClient } from '@ai-sdk/mcp'
import { FastifyBaseLogger } from 'fastify'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { mcpOAuthTokenService } from '../../mcp/oauth/token/mcp-oauth-token.service'

async function getMcpCredentials({ platformId, userId, log }: {
    platformId: string
    userId: string
    log: FastifyBaseLogger
}): Promise<McpCredentials> {
    const { data: accessToken, error } = await tryCatch(() =>
        mcpOAuthTokenService.issueInternalAccessToken({ userId, platformId, projectId: null }),
    )
    if (error) {
        log.warn({ err: error, platformId }, 'Failed to get MCP credentials — chat will work without MCP tools')
        return { mcpServerUrl: null, mcpToken: null }
    }
    const frontendUrl = system.getOrThrow(AppSystemProp.FRONTEND_URL)
    return {
        mcpServerUrl: `${frontendUrl}/mcp/platform`,
        mcpToken: accessToken,
    }
}

async function connectMcpClient({ mcpCredentials, log }: {
    mcpCredentials: McpCredentials
    log: FastifyBaseLogger
}): Promise<McpConnection> {
    if (isNil(mcpCredentials.mcpServerUrl) || isNil(mcpCredentials.mcpToken)) {
        return { mcpClient: null, mcpToolSet: {} }
    }
    const { data: client, error } = await tryCatch(async () => createMCPClient({
        transport: {
            type: 'http',
            url: mcpCredentials.mcpServerUrl!,
            headers: { 'Authorization': `Bearer ${mcpCredentials.mcpToken}` },
        },
    }))
    if (isNil(client)) {
        log.warn({ err: error }, 'Failed to create MCP client — chat will work without MCP tools')
        return { mcpClient: null, mcpToolSet: {} }
    }
    const mcpToolSet = await client.tools()
    return { mcpClient: client, mcpToolSet }
}

type McpCredentials = {
    mcpServerUrl: string | null
    mcpToken: string | null
}

type McpConnection = {
    mcpClient: Awaited<ReturnType<typeof createMCPClient>> | null
    mcpToolSet: Record<string, unknown>
}

export const chatMcp = {
    getCredentials: getMcpCredentials,
    connectClient: connectMcpClient,
}
