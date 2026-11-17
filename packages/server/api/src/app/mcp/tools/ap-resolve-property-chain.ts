import { McpToolDefinition, ProjectScopedMcpServer } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { mcpUtils } from './mcp-utils'
import { propertyChainResolver } from './property-chain-resolver'

export const apResolvePropertyChainTool = (mcp: ProjectScopedMcpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_resolve_property_chain',
        description: 'Resolve dropdown/dynamic properties in order (one field, or a dependent chain like Spreadsheet → Sheet → Columns) in ONE call, feeding each chosen value into the next. Give each field a `selectedValue` when known or a `match` name (e.g. the sheet the user mentioned); the tool stops and returns options only where nothing (or several things) match. Always use `value` from returned options, not `label`.',
        inputSchema: resolvePropertyChainInput.shape,
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
        execute: async (args) => {
            try {
                const { pieceName, actionOrTriggerName, type, propertyChain, auth, currentInput } = resolvePropertyChainInput.parse(args)
                return await propertyChainResolver.resolve({ mcp, log, pieceName, actionOrTriggerName, type, propertyChain, auth, currentInput })
            }
            catch (err) {
                return mcpUtils.mcpToolError('Property chain resolution failed', err)
            }
        },
    }
}

const resolvePropertyChainInput = z.object({
    pieceName: z.string().describe('The piece name (e.g. "@activepieces/piece-google-sheets").'),
    actionOrTriggerName: z.string().describe('The action or trigger name (e.g. "insert_row").'),
    type: z.enum(['action', 'trigger']).describe('Whether this is an action or trigger.'),
    propertyChain: z.array(z.object({
        propertyName: z.string().describe('The property name to resolve (e.g. "spreadsheet_id", "sheet_id", "columns").'),
        selectedValue: z.unknown().optional().describe('Value to use for this property. If provided, the tool uses it and continues to the next property.'),
        match: z.string().optional().describe('A name to look for when you don\'t know the value yet (e.g. "Leads", "Sales"). If one option clearly matches it, or there is only one option, the tool picks it and continues; if several match equally, it stops and returns those.'),
        searchValue: z.string().optional().describe('Search term the piece uses to narrow a large dropdown list.'),
    })).min(1).max(10).describe('Ordered list of properties to resolve (max 10). Each property is resolved using the values of all prior properties as context.'),
    auth: z.string().optional().describe('Connection externalId. Required when the piece loads options from a connected account; omit for pieces with no auth.'),
    currentInput: z.record(z.string(), z.unknown()).optional().describe('Additional input values already known (e.g. from prior configuration).'),
})
