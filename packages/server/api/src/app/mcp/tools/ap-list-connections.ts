import {
    AppConnectionStatus,
    McpServer,
    McpToolDefinition,
    Permission,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { appConnectionService } from '../../app-connection/app-connection-service/app-connection-service'
import { projectService } from '../../project/project-service'
import { mcpUtils } from './mcp-utils'

const statusEnum = z.enum(Object.values(AppConnectionStatus) as [AppConnectionStatus, ...AppConnectionStatus[]])

const listConnectionsSchema = z.object({
    pieceName: z
        .string()
        .optional()
        .describe(
            'Filter by piece name. Short names like "slack" or "google-drive" are auto-expanded to full format (e.g. "@activepieces/piece-slack"). You can also pass the full name directly.',
        ),
    displayName: z
        .string()
        .optional()
        .describe(
            'Filter by connection display name (partial, case-insensitive match). Use to find a connection by its label, e.g. "My Gmail" or "Slack workspace".',
        ),
    status: z
        .array(statusEnum)
        .optional()
        .describe(
            'Filter by status: ACTIVE (working), MISSING (deleted or inaccessible), ERROR (auth/refresh failed). Omit to return all statuses.',
        ),
})

export const apListConnectionsTool = (mcp: McpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_list_connections',
        permission: Permission.READ_APP_CONNECTION,
        description:
            'List OAuth/app connections in the project. Returns externalId needed for the auth parameter on steps.',
        inputSchema: {
            pieceName: listConnectionsSchema.shape.pieceName,
            displayName: listConnectionsSchema.shape.displayName,
            status: listConnectionsSchema.shape.status,
        },
        annotations: { readOnlyHint: true, openWorldHint: false },
        execute: async (args) => {
            try {
                const params = listConnectionsSchema.parse(args ?? {})
                const project = await projectService(log).getOneOrThrow(mcp.projectId)
                const connections = await appConnectionService(log).list({
                    projectId: mcp.projectId,
                    platformId: project.platformId,
                    cursorRequest: null,
                    scope: undefined,
                    displayName: params.displayName,
                    status: params.status,
                    pieceName: mcpUtils.normalizePieceName(params.pieceName),
                    limit: 200,
                    externalIds: undefined,
                })
                const lines = connections.data.map(c => `- externalId: ${c.externalId} | displayName: "${c.displayName}" | piece: ${c.pieceName} | status: ${c.status} | scope: ${c.scope}`)
                return {
                    content: [{
                        type: 'text',
                        text: `✅ Listed ${lines.length} connection(s):\n${lines.join('\n')}`,
                    }],
                }
            }
            catch (err) {
                return mcpUtils.mcpToolError('Failed to list connections', err)
            }
        },
    }
}