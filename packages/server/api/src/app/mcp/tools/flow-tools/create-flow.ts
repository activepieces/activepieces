import { McpToolDefinition } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { flowService } from '../../../flows/flow/flow.service'

export const createFlowTool = (log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_create_flow',
        description: 'Create a new flow in Activepieces',
        inputSchema: {
            projectId: z.string().describe('The project ID. Use list_projects to find available projects.'),
            flowName: z.string().describe('The name of the flow'),
        },
        execute: async (args) => {
            const { flowName, projectId } = z.object({ flowName: z.string(), projectId: z.string() }).parse(args)
            try {
                const flow = await flowService(log).create({
                    projectId,
                    request: {
                        displayName: flowName,
                        projectId,
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
