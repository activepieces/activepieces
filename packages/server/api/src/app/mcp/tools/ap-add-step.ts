import {
    FlowActionType,
    FlowOperationRequest,
    FlowOperationType,
    flowStructureUtil,
    isNil,
    McpServer,
    McpToolDefinition,
    StepLocationRelativeToParent,
    UpdateActionRequest,
} from '@activepieces/shared'
import { TypeCompiler } from '@sinclair/typebox/compiler'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { flowService } from '../../flows/flow/flow.service'
import { projectService } from '../../project/project-service'

const updateActionValidator = TypeCompiler.Compile(UpdateActionRequest)

export const apAddCodeStepTool = (mcp: McpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_add_step',
        description: `Add a new step (code, piece, loop, or router) to a flow. Use ap_flow_structure to get valid parentStepName and insert locations. **Before adding a piece action you must call ap_list_pieces** to get available piece names, piece versions, and action names; use that output to build a valid action so the step is accepted. If the add fails due to invalid config, the error message will indicate what to fix so you can iterate.`,
        inputSchema: {
            flowId: z.string().describe('The id of the flow'),
            parentStepName: z.string().describe('The step name to insert after/into (e.g. "trigger", "step_1"). Use ap_flow_structure to get valid values.'),
            stepLocationRelativeToParent: z.enum(Object.values(StepLocationRelativeToParent)).describe('The location of the step relative to the parent step'),
            branchIndex: z.number().describe('The index of the branch, only required if the parent step is a router branch').optional(),
            action: z.record(z.string(), z.unknown()).describe('Action object: same shape as UpdateActionRequest (type CODE | PIECE | LOOP_ON_ITEMS | ROUTER, displayName, name?, valid?, skip?, settings). For PIECE use pieceName, pieceVersion, actionName from ap_list_pieces.'),
        },
        execute: async (args) => {
            const flowId = args.flowId as string
            const parentStepName = args.parentStepName as string
            const stepLocationRelativeToParent = args.stepLocationRelativeToParent as StepLocationRelativeToParent
            const branchIndex = args.branchIndex as number | undefined
            const rawAction = args.action as Record<string, unknown>

            if (!updateActionValidator.Check(rawAction)) {
                const errors = [...updateActionValidator.Errors(rawAction)].map(e => `${e.path}: ${e.message}`)
                return {
                    content: [{
                        type: 'text',
                        text: `❌ Invalid action: ${errors.join('; ')}. Action must match flow action types (CODE, PIECE, LOOP_ON_ITEMS, ROUTER). Use ap_list_pieces for valid pieceName, pieceVersion, actionName.`,
                    }],
                }
            }

            const flow = await flowService(log).getOnePopulated({
                id: flowId,
                projectId: mcp.projectId,
            })
            if (isNil(flow)) {
                return {
                    content: [{ type: 'text', text: '❌ Flow not found' }],
                }
            }

            const stepName = rawAction.name ?? flowStructureUtil.findUnusedName(flow.version.trigger)
            const action: UpdateActionRequest = {
                ...rawAction,
                name: stepName,
                valid: rawAction.valid ?? true,
            }

            const operation: FlowOperationRequest = {
                type: FlowOperationType.ADD_ACTION,
                request: {
                    parentStep: parentStepName,
                    stepLocationRelativeToParent,
                    ...(branchIndex !== undefined && { branchIndex }),
                    action,
                },
            }

            try {
                const project = await projectService.getOneOrThrow(mcp.projectId)
                const updatedFlow = await flowService(log).update({
                    id: flow.id,
                    projectId: mcp.projectId,
                    userId: null,
                    platformId: project.platformId,
                    operation,
                })
                const addedStep = flowStructureUtil.getAllSteps(updatedFlow.version.trigger).find(s => s.name === stepName)
                if (addedStep && !addedStep.valid) {
                    const hint = action.type === FlowActionType.PIECE
                        ? ' Use ap_list_pieces to get valid pieceName, pieceVersion, and actionName; fix the action and call ap_add_step again.'
                        : ' Fix the action settings and call ap_add_step again.'
                    return {
                        content: [{
                            type: 'text',
                            text: `❌ Step "${action.displayName}" (${stepName}) was added but is invalid.${hint}`,
                        }],
                    }
                }
                return {
                    content: [{ type: 'text', text: `✅ Successfully added step "${action.displayName}" (${stepName}) to flow.` }],
                }
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err)
                const hint = action.type === FlowActionType.PIECE
                    ? ' Call ap_list_pieces to get valid pieceName, pieceVersion, and actionName; fix the action and retry.'
                    : ' Fix the action payload and retry.'
                return {
                    content: [{
                        type: 'text',
                        text: `❌ Step add failed: ${message}.${hint}`,
                    }],
                }
            }
        },
    }
}
