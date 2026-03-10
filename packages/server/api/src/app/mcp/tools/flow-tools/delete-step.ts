import {
    FlowOperationRequest,
    FlowOperationType,
    flowStructureUtil,
    isNil,
    McpToolDefinition,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { flowService } from '../../../flows/flow/flow.service'
import { projectService } from '../../../project/project-service'

const deleteStepInput = z.object({
    projectId: z.string(),
    flowId: z.string(),
    stepName: z.string(),
})

export const deleteStepTool = (log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_delete_step',
        description: 'Delete a step from a flow. Use ap_flow_structure to get valid step names.',
        inputSchema: {
            projectId: z.string().describe('The project ID. Use list_projects to find available projects.'),
            flowId: z.string().describe('The id of the flow'),
            stepName: z.string().describe('The name of the step to delete. Use ap_flow_structure to get valid values.'),
        },
        execute: async (args) => {
            const { flowId, stepName, projectId } = deleteStepInput.parse(args)

            const [flow, project] = await Promise.all([
                flowService(log).getOnePopulated({ id: flowId, projectId }),
                projectService(log).getOneOrThrow(projectId),
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
                    projectId,
                    userId: null,
                    platformId: project.platformId,
                    operation,
                })
                return {
                    content: [{ type: 'text', text: `✅ Successfully deleted step "${stepName}" from flow.` }],
                }
            }
            catch (err) {
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
