import { McpServer, McpToolDefinition, Permission } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { flowService } from '../../flows/flow/flow.service'
import { mcpUtils } from './mcp-utils'

export const apCreateFlowTool = (mcp: McpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_create_flow',
        permission: Permission.WRITE_FLOW,
        description: 'Create a new flow in Activepieces',
        inputSchema: {
            flowName: z.string().describe('The name of the flow'),
        },
        annotations: { destructiveHint: false, idempotentHint: false, openWorldHint: false },
        execute: async (args) => {
            const { flowName } = z.object({ flowName: z.string() }).parse(args)
            try {
                const flow = await flowService(log).create({
                    projectId: mcp.projectId,
                    request: {
                        displayName: flowName,
                        projectId: mcp.projectId,
                    },
                })
                return {
                    content: [{
                        type: 'text',
                        text: `✅ Created flow "${flow.version.displayName}" (id: ${flow.id}). The flow has an empty trigger. Next steps:\n1. Use ap_update_trigger to set the trigger (e.g. webhook, schedule, or a piece trigger)\n2. Use ap_add_step to add action steps after the trigger\n3. Use ap_update_step to configure each step's inputs`,
                    }],
                }
            }
            catch (err) {
                return mcpUtils.mcpToolError('Flow creation failed', err)
            }
        },
    }
}