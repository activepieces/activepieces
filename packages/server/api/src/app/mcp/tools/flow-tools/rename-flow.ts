import {
    FlowOperationRequest,
    FlowOperationType,
    isNil,
    McpToolDefinition,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { flowService } from '../../../flows/flow/flow.service'
import { projectService } from '../../../project/project-service'

const renameFlowInput = z.object({
    projectId: z.string(),
    flowId: z.string(),
    displayName: z.string(),
})

export const renameFlowTool = (log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_rename_flow',
        description: 'Rename a flow. Use ap_list_flows to get valid flow IDs.',
        inputSchema: {
            projectId: z.string().describe('The project ID. Use list_projects to find available projects.'),
            flowId: z.string().describe('The id of the flow to rename'),
            displayName: z.string().describe('The new display name for the flow'),
        },
        execute: async (args) => {
            const { flowId, displayName, projectId } = renameFlowInput.parse(args)

            const [flow, project] = await Promise.all([
                flowService(log).getOnePopulated({ id: flowId, projectId }),
                projectService(log).getOneOrThrow(projectId),
            ])
            if (isNil(flow)) {
                return { content: [{ type: 'text', text: '❌ Flow not found' }] }
            }

            const operation: FlowOperationRequest = {
                type: FlowOperationType.CHANGE_NAME,
                request: { displayName },
            }

            try {
                await flowService(log).update({
                    id: flow.id,
                    projectId,
                    userId: null,
                    platformId: project.platformId,
                    operation,
                })
                return {
                    content: [{ type: 'text', text: `✅ Flow renamed to "${displayName}".` }],
                }
            }
            catch (err) {
                const message = err instanceof Error ? err.message : String(err)
                return {
                    content: [{ type: 'text', text: `❌ Flow rename failed: ${message}` }],
                }
            }
        },
    }
}
