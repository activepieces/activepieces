import { McpServer, McpToolDefinition } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { flowService } from '../../flows/flow/flow.service'

export const apCreateFlowTool = (mcp: McpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_create_flow',
        description: 'Create a new flow in Activepieces',
        inputSchema: {
            flowName: z.string().describe('The name of the flow'),
        },
        annotations: { destructiveHint: false, idempotentHint: false },
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
                        text: `✅ Successfully created flow ${flow.version.displayName} with id ${flow.id}`,
                    }],
                }
            }
            catch (err) {
                const message = err instanceof Error ? err.message : String(err)
                return {
                    content: [{
                        type: 'text',
                        text: `❌ Flow creation failed: ${message}`,
                    }],
                }
            }
        },
    }
}