import { McpToolDefinition, ProjectScopedMcpServer } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { mcpUtils } from './mcp-utils'
import { propertyChainResolver } from './property-chain-resolver'

export const apResolvePropertyOptionsTool = (mcp: ProjectScopedMcpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_resolve_property_options',
        description: 'List the options (label + value ID) of ONE dropdown/dynamic property. For fields that depend on others (spreadsheet → sheet → columns) use ap_resolve_property_chain instead. Always use `value`, not `label`.',
        inputSchema: resolvePropertyOptionsInput.shape,
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
        execute: async (args) => {
            try {
                const { pieceName, actionOrTriggerName, type, propertyName, auth, input, searchValue } = resolvePropertyOptionsInput.parse(args)
                return await propertyChainResolver.resolve({
                    mcp,
                    log,
                    pieceName,
                    actionOrTriggerName,
                    type,
                    propertyChain: [{ propertyName, searchValue }],
                    auth,
                    currentInput: input,
                })
            }
            catch (err) {
                return mcpUtils.mcpToolError('Property option resolution failed', err)
            }
        },
    }
}

const resolvePropertyOptionsInput = z.object({
    pieceName: z.string().describe('The piece name (e.g. "@activepieces/piece-slack").'),
    actionOrTriggerName: z.string().describe('The action or trigger name (e.g. "send_channel_message").'),
    type: z.enum(['action', 'trigger']).describe('Whether this is an action or trigger.'),
    propertyName: z.string().describe('The exact property name to resolve options for (e.g. "channel").'),
    auth: z.string().optional().describe('Connection externalId. Required for pieces that resolve options from a connected account; omit for pieces with no auth.'),
    input: z.record(z.string(), z.unknown()).optional().describe('Values for parent properties that this field depends on (refreshers).'),
    searchValue: z.string().optional().describe('Search term to narrow a large dropdown list (e.g. "sales").'),
})
