import {
    isNil,
    McpServer,
    McpToolDefinition,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { mcpUtils } from './mcp-utils'

export const apGetPiecePropsTool = (mcp: McpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_get_piece_props',
        description: 'Get the input property schema for a piece action or trigger. Returns field names, types, required/optional, defaults, and options.',
        inputSchema: getPiecePropsInput.shape,
        annotations: { readOnlyHint: true, openWorldHint: false },
        execute: async (args) => {
            try {
                const { pieceName, actionOrTriggerName, type } = getPiecePropsInput.parse(args)

                const lookup = await mcpUtils.lookupPieceComponent({
                    pieceName,
                    componentName: actionOrTriggerName,
                    componentType: type,
                    projectId: mcp.projectId,
                    log,
                })
                if (lookup.error) {
                    return lookup.error
                }

                const { piece, component, pieceName: normalized } = lookup
                const label = type === 'action' ? 'Action' : 'Trigger'
                const props = mcpUtils.buildPropSummaries(component.props)
                const requiresAuth = component.requireAuth && !isNil(piece.auth)

                const result = {
                    piece: normalized,
                    name: component.name,
                    displayName: component.displayName,
                    description: component.description,
                    requiresAuth,
                    props,
                }

                return {
                    content: [{ type: 'text', text: `✅ ${label} schema for "${normalized}/${actionOrTriggerName}":\n${JSON.stringify(result, null, 2)}` }],
                }
            }
            catch (err) {
                return mcpUtils.mcpToolError('Failed to get piece props', err)
            }
        },
    }
}

const getPiecePropsInput = z.object({
    pieceName: z.string().describe('The piece name (e.g. "@activepieces/piece-slack"). Use ap_list_pieces to get valid values.'),
    actionOrTriggerName: z.string().describe('The action or trigger name (e.g. "send_channel_message"). Use ap_list_pieces with includeActions=true or includeTriggers=true to get valid values.'),
    type: z.enum(['action', 'trigger']).describe('Whether to look up an action or a trigger.'),
})
