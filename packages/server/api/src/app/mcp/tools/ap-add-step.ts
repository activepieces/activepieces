import { FlowActionType, FlowOperationRequest, FlowOperationType, flowStructureUtil, isNil, McpServer, McpToolDefinition, StepLocationRelativeToParent } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { flowService } from '../../flows/flow/flow.service'
import { projectService } from '../../project/project-service'

export const apAddCodeStepTool = (mcp: McpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_add_code_step',
        description: 'Add a new code step to a flow in Activepieces',
        inputSchema: {
            flowId: z.string().describe('The id of the flow'),
            parentStepName: z.string().describe('The step name to insert after/into (e.g. "trigger", "step_1"). Use ap_flow_structure to get valid values.'),
            actionName: z.string().describe('The name of the action displayed in the flow'),
            stepLocationRelativeToParent: z.enum(Object.values(StepLocationRelativeToParent)).describe('The location of the step relative to the parent step'),
            branchIndex: z.number().describe('The index of the branch, only required if the parent step is a branch').optional(),
        },
        execute: async (args) => {
            const flowId = args.flowId as string
            const parentStepName = args.parentStepName as string
            const stepLocationRelativeToParent = args.stepLocationRelativeToParent as StepLocationRelativeToParent
            const branchIndex = args.branchIndex as number
            const actionName = args.actionName as string
            const flow = await flowService(log).getOnePopulated({
                id: flowId,
                projectId: mcp.projectId,
            })
            if (isNil(flow)) {
                return {
                    content: [{ type: 'text', text: '❌ Flow not found' }],
                }
            }
            const stepName = flowStructureUtil.findUnusedName(flow.version.trigger)
            const operation: FlowOperationRequest = {
                type: FlowOperationType.ADD_ACTION,
                request: {
                    parentStep: parentStepName,
                    stepLocationRelativeToParent,
                    branchIndex,
                    action: {
                        type: FlowActionType.CODE,
                        settings: {
                            input: {},
                            sourceCode: {
                                packageJson: '',
                                code: `console.log("Hello, world! ${actionName} + ${stepName}")`,
                            },
                        },
                        displayName: actionName,
                        name: stepName,
                        valid: true,
                    },
                },
            }
            const project = await projectService.getOneOrThrow(mcp.projectId)
            await flowService(log).update({
                id: flow.id,
                projectId: mcp.projectId,
                userId: null,
                platformId: project.platformId,
                operation,
            })
            return {
                content: [{ type: 'text', text: `✅ Successfully added ${stepName} ${actionName} to flow.` }],
            }
        },
    }
}