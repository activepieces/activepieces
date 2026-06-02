import { tryCatch } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { mcpOAuthTokenService } from '../../../mcp/oauth/token/mcp-oauth-token.service'

const CONVERSATION_ID_HEADER = 'x-ap-conversation-id'

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

type McpCredentials = {
    mcpServerUrl: string | null
    mcpToken: string | null
}

export { CONVERSATION_ID_HEADER }

export const chatMcp = {
    getCredentials: getMcpCredentials,
}
