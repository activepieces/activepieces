import { McpToolDefinition } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { flowService } from '../../../flows/flow/flow.service'

export const listFlowsTool = (log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_list_flows',
        description: 'List all flows in the current project',
        inputSchema: {
            projectId: z.string().describe('The project ID. Use list_projects to find available projects.'),
        },
        execute: async (args) => {
            try {
                const flows = await flowService(log).list({
                    projectIds: [args.projectId as string],
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
                const message = err instanceof Error ? err.message : String(err)
                return {
                    content: [{
                        type: 'text',
                        text: `❌ Failed to list flows: ${message}`,
                    }],
                }
            }
        },
    }
}
