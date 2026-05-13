import { McpToolDefinition, Permission, ProjectScopedMcpServer } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { executeAdhocAction } from './flow-run-utils'
import { mcpUtils } from './mcp-utils'

const runActionInput = z.object({
    pieceName: z.string().describe('Piece name, e.g. "slack" or "@activepieces/piece-slack". Use ap_list_pieces to discover.'),
    actionName: z.string().describe('Action to run, e.g. "send_channel_message". Use ap_get_piece_props for the input shape.'),
    input: z.record(z.string(), z.unknown()).optional().describe('Fully-resolved input for the action. Keys must match the piece action\'s props. Pass raw values — do NOT wrap in {{...}}. Omit if the action has no props.'),
    connectionExternalId: z.string().optional().describe('externalId from ap_list_connections. Required if the piece needs auth. Auto-wrapped as {{connections[\'externalId\']}}.'),
})

export const apRunActionTool = (mcp: ProjectScopedMcpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_run_action',
        permission: Permission.WRITE_RUN,
        description: 'Execute a single piece action once, without building or saving a flow. Use this for one-shot tasks like "check my inbox" or "send one Slack message". For recurring/triggered work, build a flow with ap_build_flow instead.',
        inputSchema: runActionInput.shape,
        annotations: { destructiveHint: true, idempotentHint: false, openWorldHint: true },
        execute: async (args) => {
            try {
                const { pieceName, actionName, input, connectionExternalId } = runActionInput.parse(args)
                return await executeAdhocAction({
                    projectId: mcp.projectId,
                    pieceName,
                    actionName,
                    input,
                    connectionExternalId,
                    log,
                })
            }
            catch (err) {
                log.error({ err, projectId: mcp.projectId }, 'ap_run_action failed')
                return mcpUtils.mcpToolError('Failed to run action', err)
            }
        },
    }
}
