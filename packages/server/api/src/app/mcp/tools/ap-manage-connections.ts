import { apId, Permission } from '@activepieces/core-utils'
import { AppConnectionStatus, McpToolDefinition, ProjectScopedMcpServer } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { appConnectionService } from '../../app-connection/app-connection-service/app-connection-service'
import { connectTokenService } from '../../helper/connect-token-service'
import { domainHelper } from '../../helper/domain-helper'
import { projectService } from '../../project/project-service'
import { mcpUtils } from './mcp-utils'

const manageConnectionsSchema = z.object({
    pieceName: z
        .string()
        .describe('Piece to connect, e.g. "gmail" or "@activepieces/piece-gmail". Use ap_research_pieces to find the exact name.'),
    externalId: z
        .string()
        .optional()
        .describe('A stable id for the connection (e.g. "gmail_personal"). Reused on later runs. A new one is generated if omitted.'),
    displayName: z
        .string()
        .optional()
        .describe('A short, context-aware human-readable label for this connection, e.g. "Gmail (work — john@acme.com)" or "Slack (Acme workspace)". Use what you know about the user and the task to make it recognizable at a glance. Falls back to the externalId if omitted.'),
})

export const apManageConnectionsTool = (mcp: ProjectScopedMcpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_manage_connections',
        permission: Permission.WRITE_APP_CONNECTION,
        description:
            'Check whether a piece is connected and, if not, return a branded link the user opens to authenticate (OAuth, API key, or any auth type). Never run a piece action without an ACTIVE connection — call this first when ap_research_pieces shows a piece is not connected. This tool never accepts secrets; the user enters credentials on the secure hosted page.',
        inputSchema: manageConnectionsSchema.shape,
        annotations: { destructiveHint: false, idempotentHint: false, openWorldHint: true },
        execute: async (args) => {
            try {
                const params = manageConnectionsSchema.parse(args)
                const pieceName = mcpUtils.normalizePieceName(params.pieceName)
                if (pieceName === undefined) {
                    return mcpUtils.mcpToolError('A valid pieceName is required', new Error('pieceName missing'))
                }
                const project = await projectService(log).getOneOrThrow(mcp.projectId)

                const existing = await appConnectionService(log).list({
                    projectId: mcp.projectId,
                    platformId: project.platformId,
                    cursorRequest: null,
                    scope: undefined,
                    displayName: undefined,
                    status: [AppConnectionStatus.ACTIVE],
                    pieceName,
                    limit: 200,
                    externalIds: undefined,
                })

                const activeMatch = existing.data.find(connection =>
                    params.externalId === undefined || connection.externalId === params.externalId)
                if (activeMatch !== undefined) {
                    return {
                        content: [{
                            type: 'text',
                            text: `✅ Already connected. Use connectionExternalId "${activeMatch.externalId}" when running actions for ${pieceName}.`,
                        }],
                        structuredContent: {
                            status: 'CONNECTED',
                            externalId: activeMatch.externalId,
                            displayName: activeMatch.displayName,
                            pieceName,
                        },
                    }
                }

                const externalId = params.externalId ?? apId()
                const { token, expiresAt } = await connectTokenService(log).issue({
                    platformId: project.platformId,
                    projectId: mcp.projectId,
                    pieceName,
                    externalId,
                    displayName: params.displayName,
                })
                const redirectUrl = await domainHelper.getPublicUrl({ path: `/connect?token=${encodeURIComponent(token)}` })

                return {
                    content: [{
                        type: 'text',
                        text: `🔗 ${pieceName} is not connected yet. Share this link with the user to connect:\n${redirectUrl}\n\nAfter they finish, run actions with connectionExternalId "${externalId}".`,
                    }],
                    structuredContent: {
                        status: 'PENDING',
                        externalId,
                        displayName: params.displayName ?? externalId,
                        pieceName,
                        redirectUrl,
                        expiresAt,
                    },
                }
            }
            catch (err) {
                return mcpUtils.mcpToolError('Failed to manage connection', err)
            }
        },
    }
}
