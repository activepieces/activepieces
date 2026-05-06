import { McpServer, McpToolDefinition } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { storeEntryService } from '../../store-entry/store-entry.service'
import { mcpToolError } from './mcp-utils'
import { formatStoreLocation, resolveStoreKey, storeScopeSchema } from './store-utils'

const storeDeleteInput = z.object({
    key: z.string().describe('The store key to delete.'),
    scope: storeScopeSchema.describe('PROJECT for project-wide storage, FLOW for flow-scoped storage.'),
    flowId: z.string().optional().describe('Required when scope is FLOW. Use ap_list_flows to find the flow ID.'),
})

export const apStoreDeleteTool = (mcp: McpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_store_delete',
        description: 'Delete a persistent value from project- or flow-scoped storage. This permanently removes the stored value for the selected key.',
        inputSchema: storeDeleteInput.shape,
        annotations: { destructiveHint: true, openWorldHint: false },
        execute: async (args) => {
            try {
                const { key, scope, flowId } = storeDeleteInput.parse(args)
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

                await storeEntryService.delete({
                    projectId: mcp.projectId,
                    key: resolvedKey,
                })

                return {
                    content: [{
                        type: 'text',
                        text: `✅ Deleted value for ${formatStoreLocation({ key, scope, flowId })}.`,
                    }],
                }
            }
            catch (err) {
                log.error({ err, projectId: mcp.projectId }, 'ap_store_delete failed')
                return mcpToolError('Failed to delete store value', err)
            }
        },
    }
}
