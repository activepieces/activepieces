import {
    FlowOperationRequest,
    FlowOperationType,
    flowStructureUtil,
    isNil,
    McpServer,
    McpToolDefinition,
    Permission,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { flowService } from '../../flows/flow/flow.service'
import { projectService } from '../../project/project-service'
import { mcpUtils } from './mcp-utils'

const deleteStepInput = z.object({
    flowId: z.string(),
    stepName: z.string(),
})

export const apDeleteStepTool = (mcp: McpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_delete_step',
        permission: Permission.WRITE_FLOW,
        description: 'Delete a step from a flow. Use ap_flow_structure to get valid step names.',
        inputSchema: {
            flowId: z.string().describe('The id of the flow'),
            stepName: z.string().describe('The name of the step to delete. Use ap_flow_structure to get valid values.'),
        },
        annotations: { destructiveHint: true, openWorldHint: false },
        execute: async (args) => {
            const { flowId, stepName } = deleteStepInput.parse(args)

            const [flow, project] = await Promise.all([
                flowService(log).getOnePopulated({ id: flowId, projectId: mcp.projectId }),
                projectService(log).getOneOrThrow(mcp.projectId),
            ])
            if (isNil(flow)) {
                return { content: [{ type: 'text', text: '❌ Flow not found' }] }
            }

            const allSteps = flowStructureUtil.getAllSteps(flow.version.trigger)
            const step = flowStructureUtil.getStep(stepName, flow.version.trigger)
            if (isNil(step)) {
                const stepNames = allSteps.map(s => s.name).join(', ')
                return { content: [{ type: 'text', text: `❌ Step "${stepName}" not found. Available steps: ${stepNames}` }] }
            }
            if (flowStructureUtil.isTrigger(step.type)) {
                return { content: [{ type: 'text', text: `❌ "${stepName}" is the trigger step and cannot be deleted. Use ap_update_trigger to reconfigure it.` }] }
            }

            const operation: FlowOperationRequest = {
                type: FlowOperationType.DELETE_ACTION,
                request: {
                    names: [stepName],
                },
            }

            try {
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
            }
            catch (err) {
                return mcpUtils.mcpToolError('Step delete failed', err)
            }
        },
    }
}
