import { McpServer, McpToolDefinition } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { storeEntryService } from '../../store-entry/store-entry.service'
import { mcpToolError } from './mcp-utils'
import { formatStoreLocation, formatStoreValue, resolveStoreKey, storeScopeSchema } from './store-utils'

const storePutInput = z.object({
    key: z.string().describe('The store key to create or overwrite.'),
    value: z.unknown().describe('The JSON-serializable value to store.'),
    scope: storeScopeSchema.describe('PROJECT for project-wide storage, FLOW for flow-scoped storage.'),
    flowId: z.string().optional().describe('Required when scope is FLOW. Use ap_list_flows to find the flow ID.'),
})

export const apStorePutTool = (mcp: McpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_store_put',
        description: 'Store or overwrite a persistent value in project- or flow-scoped storage. Use this to save state that later MCP tool calls or flows can reuse.',
        inputSchema: storePutInput.shape,
        annotations: { destructiveHint: false, idempotentHint: false, openWorldHint: false },
        execute: async (args) => {
            try {
                const { key, value, scope, flowId } = storePutInput.parse(args)
                const resolvedKey = await resolveStoreKey({
                    key,
                    scope,
                    flowId,
                    projectId: mcp.projectId,
                    log,
                })

                await storeEntryService.upsert({
                    projectId: mcp.projectId,
                    request: {
                        key: resolvedKey,
                        value,
                    },
                })

                return {
                    content: [{
                        type: 'text',
                        text: `✅ Stored value for ${formatStoreLocation({ key, scope, flowId })}.\nValue:\n${formatStoreValue(value)}`,
                    }],
                }
            }
            catch (err) {
                log.error({ err, projectId: mcp.projectId }, 'ap_store_put failed')
                return mcpToolError('Failed to store value', err)
            }
        },
    }
}
