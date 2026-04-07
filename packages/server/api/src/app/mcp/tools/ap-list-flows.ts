import { McpServer, McpToolDefinition, Permission } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { flowService } from '../../flows/flow/flow.service'
import { mcpToolError } from './mcp-utils'

export const apListFlowsTool = (mcp: McpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_list_flows',
        permission: Permission.READ_FLOW,
        description: 'List all flows in the current project',
        inputSchema: {},
        annotations: { readOnlyHint: true, openWorldHint: false },
        execute: async () => {
            try {
                const flows = await flowService(log).list({
                    projectIds: [mcp.projectId],
                    cursorRequest: null,
                    limit: 1000000,
                })
                return {
                    content: [{
                        type: 'text',
                        text: `✅ Successfully listed flows:\n${flows.data.map((flow) => `- ${flow.version.displayName} (${flow.id})`).join('\n')}`,
                    }],
                }
            }
            catch (err) {
                return mcpToolError('Failed to list flows', err)
            }
        },
    }
}