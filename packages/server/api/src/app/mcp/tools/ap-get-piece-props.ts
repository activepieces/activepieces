import {
    isNil,
    McpServer,
    McpToolDefinition,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { pieceMetadataService } from '../../pieces/metadata/piece-metadata-service'
import { mcpUtils } from './mcp-utils'

export const apGetPiecePropsTool = (mcp: McpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_get_piece_props',
        description: 'Get the detailed input property schema for a specific piece action or trigger. Returns field names, types, required/optional, descriptions, default values, and dropdown options. Use this before ap_update_step or ap_update_trigger to know exactly which fields to set and what values are accepted.',
        inputSchema: getPiecePropsInput.shape,
        annotations: { readOnlyHint: true, openWorldHint: false },
        execute: async (args) => {
            try {
                const { pieceName, actionOrTriggerName, type } = getPiecePropsInput.parse(args)

                const piece = await pieceMetadataService(log).get({
                    name: pieceName,
                    projectId: mcp.projectId,
                })

                if (isNil(piece)) {
                    return { content: [{ type: 'text', text: `❌ Piece "${pieceName}" not found. Use ap_list_pieces to get valid piece names.` }] }
                }

                const componentMap = type === 'action' ? piece.actions : piece.triggers
                const label = type === 'action' ? 'Action' : 'Trigger'
                const component = componentMap[actionOrTriggerName]
                if (isNil(component)) {
                    return {
                        content: [{
                            type: 'text',
                            text: `❌ ${label} "${actionOrTriggerName}" not found in "${pieceName}". Available: ${Object.keys(componentMap).join(', ')}`,
                        }],
                    }
                }

                const props = mcpUtils.buildPropSummaries(component.props)
                const requiresAuth = component.requireAuth && !isNil(piece.auth)

                const result = {
                    piece: pieceName,
                    name: component.name,
                    displayName: component.displayName,
                    description: component.description,
                    requiresAuth,
                    props,
                }

                return {
                    content: [{ type: 'text', text: `✅ ${label} schema for "${pieceName}/${actionOrTriggerName}":\n${JSON.stringify(result, null, 2)}` }],
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
