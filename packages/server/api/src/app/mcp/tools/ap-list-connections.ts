import {
    AppConnectionScope,
    AppConnectionStatus,
    McpServer,
    McpToolDefinition,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { appConnectionService } from '../../app-connection/app-connection-service/app-connection-service'
import { projectService } from '../../project/project-service'
import { mcpToolError } from './mcp-utils'

const statusEnum = z.nativeEnum(AppConnectionStatus)

const listConnectionsSchema = z.object({
    onlyProjectConnections: z
        .boolean()
        .optional()
        .describe(
            'If true, list only connections belonging to the current project. If false or omitted, list platform-wide connections (shared across projects). Use true when need only project connections.',
        ),
    pieceName: z
        .string()
        .optional()
        .describe(
            'Filter by piece/app name (exact match). Examples: "google_drive", "slack", "notion". Use when you need connections for a specific integration.',
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
        description:
            'List OAuth/app connections in the current project or platform. Use this to discover available connections before adding steps that require auth (e.g. Google Drive, Slack). Filter by pieceName to find connections for a specific app, or by displayName to find a named connection. Use the `externalId` (not `id`) with the `auth` parameter of `ap_update_step`/`ap_update_trigger`.',
        inputSchema: {
            onlyProjectConnections: listConnectionsSchema.shape.onlyProjectConnections,
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
                    projectId: params.onlyProjectConnections ? mcp.projectId : null,
                    platformId: project.platformId,
                    cursorRequest: null,
                    scope: params.onlyProjectConnections ? AppConnectionScope.PROJECT : undefined,
                    displayName: params.displayName,
                    status: params.status,
                    pieceName: params.pieceName,
                    limit: 200,
                    externalIds: undefined,
                })
                const lines = connections.data.map(c => `- externalId: ${c.externalId} | displayName: "${c.displayName}" | piece: ${c.pieceName} | status: ${c.status}`)
                return {
                    content: [{
                        type: 'text',
                        text: `✅ Listed ${lines.length} connection(s):\n${lines.join('\n')}`,
                    }],
                }
            }
            catch (err) {
                return mcpToolError('Failed to list connections', err)
            }
        },
    }
}