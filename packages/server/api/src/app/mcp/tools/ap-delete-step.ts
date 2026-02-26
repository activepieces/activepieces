import {
    FlowOperationRequest,
    FlowOperationType,
    isNil,
    McpServer,
    McpToolDefinition,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { flowService } from '../../flows/flow/flow.service'
import { projectService } from '../../project/project-service'

export const apDeleteStepTool = (mcp: McpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_delete_step',
        description: `Delete a step from a flow. Use ap_flow_structure to get valid step names.`,
        inputSchema: {
            flowId: z.string().describe('The id of the flow'),
            stepName: z.string().describe('The name of the step to delete. Use ap_flow_structure to get valid values.'),
        },
        execute: async (args) => {
            const flowId = args.flowId as string
            const stepName = args.stepName as string

            const flow = await flowService(log).getOnePopulated({
                id: flowId,
                projectId: mcp.projectId,
            })
            if (isNil(flow)) {
                return {
                    content: [{ type: 'text', text: '❌ Flow not found' }],
                }
            }

            const operation: FlowOperationRequest = {
                type: FlowOperationType.DELETE_ACTION,
                request: {
                    names: [stepName],
                },
            }

            try {
                const project = await projectService.getOneOrThrow(mcp.projectId)
                await flowService(log).update({
                    id: flow.id,
                    projectId: mcp.projectId,
                    userId: null,
                    platformId: project.platformId,
                    operation,
                })
                return {
                    content: [{ type: 'text', text: `✅ Successfully deleted step "${stepName}" from flow.` }],
                }
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err)
                return {
                    content: [{
                        type: 'text',
                        text: `❌ Step delete failed: ${message}`,
                    }],
                }
            }
        },
    }
}
