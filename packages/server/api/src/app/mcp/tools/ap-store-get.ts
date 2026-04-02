import { McpServer, McpToolDefinition } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { storeEntryService } from '../../store-entry/store-entry.service'
import { mcpToolError } from './mcp-utils'
import { formatStoreLocation, formatStoreValue, resolveStoreKey, storeScopeSchema } from './store-utils'

const storeGetInput = z.object({
    key: z.string().describe('The store key to retrieve.'),
    scope: storeScopeSchema.describe('PROJECT for project-wide storage, FLOW for flow-scoped storage.'),
    flowId: z.string().optional().describe('Required when scope is FLOW. Use ap_list_flows to find the flow ID.'),
})

export const apStoreGetTool = (mcp: McpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_store_get',
        description: 'Get a persistent value from project- or flow-scoped storage. Use PROJECT scope for shared state across the project, or FLOW scope for state scoped to a specific flow.',
        inputSchema: storeGetInput.shape,
        annotations: { readOnlyHint: true, openWorldHint: false },
        execute: async (args) => {
            try {
                const { key, scope, flowId } = storeGetInput.parse(args)
                const resolvedKey = await resolveStoreKey({
                    key,
                    scope,
                    flowId,
                    projectId: mcp.projectId,
                    log,
                })

                const storeEntry = await storeEntryService.getOne({
                    projectId: mcp.projectId,
                    key: resolvedKey,
                })

                if (!storeEntry) {
                    return {
                        content: [{
                            type: 'text',
                            text: `No value found for ${formatStoreLocation({ key, scope, flowId })}.`,
                        }],
                    }
                }

                return {
                    content: [{
                        type: 'text',
                        text: `✅ Retrieved value for ${formatStoreLocation({ key, scope, flowId })}.\nValue:\n${formatStoreValue(storeEntry.value)}`,
                    }],
                }
            }
            catch (err) {
                log.error({ err, projectId: mcp.projectId }, 'ap_store_get failed')
                return mcpToolError('Failed to get store value', err)
            }
        },
    }
}
