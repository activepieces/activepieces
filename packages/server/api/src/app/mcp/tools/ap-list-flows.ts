import { McpServer, McpToolDefinition } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { flowService } from '../../flows/flow/flow.service'

export const apListFlowsTool = (mcp: McpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_list_flows',
        description: 'List all flows in the current project',
        inputSchema: {},
        execute: async () => {
            const flows = await flowService(log).list({
                projectIds: [mcp.projectId],
            })
            return {
                content: [{
                    type: 'text',
                    text: `✅ Successfully listed flows:\n${flows.data.map((flow) => `- ${flow.version.displayName} (${flow.id})`).join('\n')}`,
                }],
            }
        },
    }
}