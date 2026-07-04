import { isNil } from '@activepieces/core-utils'
import { PropertyType } from '@activepieces/pieces-framework'
import { McpToolDefinition, ProjectScopedMcpServer } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { mcpUtils } from './mcp-utils'

export const apResolvePropertyOptionsTool = (mcp: ProjectScopedMcpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_resolve_property_options',
        description: 'Resolve dropdown options for a single piece property. Returns the available options with labels and values (IDs). Use this to discover valid values for DROPDOWN fields (e.g. Slack channels, Google Sheets, email labels). Always use the `value` from the returned options, not the `label`.',
        inputSchema: resolvePropertyOptionsInput.shape,
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
        execute: async (args) => {
            const { pieceName, actionOrTriggerName, type, propertyName, auth, input: providedInput, searchValue } = resolvePropertyOptionsInput.parse(args)

            const platformId = await mcpUtils.resolvePlatformId({ mcp, log })

            const lookup = await mcpUtils.lookupPieceComponent({
                pieceName,
                componentName: actionOrTriggerName,
                componentType: type,
                projectId: mcp.projectId,
                platformId,
                log,
            })
            if (lookup.error) {
                return lookup.error
            }

            const { piece, component, pieceName: normalized } = lookup
            const propDef = component.props[propertyName]
            if (isNil(propDef)) {
                return {
                    content: [{ type: 'text', text: `❌ Property "${propertyName}" not found on ${normalized}/${actionOrTriggerName}. Use ap_get_piece_props to see available properties.` }],
                }
            }

            const result = await mcpUtils.executePropertyResolution({
                pieceName: normalized,
                pieceVersion: piece.version,
                actionOrTriggerName,
                propertyName,
                auth,
                input: providedInput,
                searchValue,
                projectId: mcp.projectId,
                platformId,
                log,
            })

            if (result.status === 'dynamic' && propDef.type === PropertyType.DYNAMIC) {
                const dynamicFields = mcpUtils.buildPropSummaries(result.props)
                return {
                    content: [{ type: 'text', text: `✅ Dynamic fields for "${propertyName}":\n${JSON.stringify(dynamicFields, null, 2)}` }],
                    structuredContent: { propertyName, options: dynamicFields, count: dynamicFields.length },
                }
            }

            if (result.status === 'options') {
                if (result.options.length === 0) {
                    const requiresAuth = !isNil(piece.auth)
                    const emptyReason = requiresAuth
                        ? (isNil(auth) || auth.trim().length === 0
                            ? `⚠️ No options for "${propertyName}" — this dropdown loads from a connected account but no connection was passed. Pass the connectionExternalId from ap_show_connection_picker as \`auth\` and retry. Only treat this as "no items" once a valid connection is attached.`
                            : `⚠️ No options for "${propertyName}". This usually means the connection is wrong/expired or a parent field is unresolved — confirm \`auth\` is the exact connectionExternalId from ap_show_connection_picker and that any parent inputs are set, then retry. If the account genuinely has no items, you may use the user's value directly (the dropdown will appear unset).`)
                        : `⚠️ No options found for "${propertyName}". The account may have no items. You may use the value the user provided directly, but the dropdown in the flow editor will appear unset.`
                    return {
                        content: [{ type: 'text', text: emptyReason }],
                        structuredContent: { propertyName, options: [], count: 0 },
                    }
                }
                return {
                    content: [{ type: 'text', text: `✅ Options for "${propertyName}" (${result.options.length} found). IMPORTANT: Use the "value" field (the ID), NOT the "label", when setting this property.\n${JSON.stringify(result.options, null, 2)}` }],
                    structuredContent: { propertyName, options: result.options, count: result.options.length },
                }
            }

            const failureDetail = result.status === 'failed' ? `: ${result.message}` : ''
            log.warn({ propertyName, result }, 'ap_resolve_property_options: could not resolve options')
            return {
                content: [{ type: 'text', text: `⚠️ Could not resolve options for "${propertyName}"${failureDetail}. You may use the value the user provided directly — it may work at runtime. However, the dropdown in the flow editor will appear unset. Mention this to the user.` }],
            }
        },
    }
}

const resolvePropertyOptionsInput = z.object({
    pieceName: z.string().describe('The piece name (e.g. "@activepieces/piece-slack").'),
    actionOrTriggerName: z.string().describe('The action or trigger name (e.g. "send_channel_message").'),
    type: z.enum(['action', 'trigger']).describe('Whether this is an action or trigger.'),
    propertyName: z.string().describe('The exact property name to resolve options for (e.g. "channel").'),
    auth: z.string().optional().describe('Connection externalId. Required for pieces that resolve options from a connected account (e.g. Slack channels, Gmail labels). Omit for pieces that have no auth (e.g. Tables table_id) — passing a value there is unnecessary.'),
    input: z.record(z.string(), z.unknown()).optional().describe('Values for parent properties that this field depends on (refreshers).'),
    searchValue: z.string().optional().describe('Search/filter term to narrow results for large dropdown lists (e.g., "sales" to find sales-related channels).'),
})
