import {
    BranchExecutionType,
    FlowActionType,
    FlowOperationRequest,
    FlowOperationType,
    flowStructureUtil,
    isNil,
    McpServer,
    McpToolDefinition,
    Permission,
    RouterExecutionType,
    StepLocationRelativeToParent,
    UpdateActionRequest,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { flowService } from '../../flows/flow/flow.service'
import { projectService } from '../../project/project-service'
import { mcpToolError } from './mcp-utils'

const addStepInput = z.object({
    flowId: z.string(),
    parentStepName: z.string(),
    stepLocationRelativeToParent: z.enum(Object.values(StepLocationRelativeToParent) as [StepLocationRelativeToParent, ...StepLocationRelativeToParent[]]),
    branchIndex: z.number().optional(),
    stepType: z.enum([FlowActionType.CODE, FlowActionType.PIECE, FlowActionType.LOOP_ON_ITEMS, FlowActionType.ROUTER]),
    displayName: z.string(),
    pieceName: z.string().optional(),
    pieceVersion: z.string().optional(),
    actionName: z.string().optional(),
})

export const apAddStepTool = (mcp: McpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_add_step',
        permission: Permission.WRITE_FLOW,
        description: 'Add a new step to a flow (skeleton only - configure it afterwards with ap_update_step or ap_update_trigger). Use ap_flow_structure to get valid parentStepName and insert locations. Use ap_list_pieces to get pieceName, pieceVersion, and actionName for PIECE steps.',
        inputSchema: {
            flowId: z.string().describe('The id of the flow'),
            parentStepName: z.string().describe('The step name to insert after/into (e.g. "trigger", "step_1"). Use ap_flow_structure to get valid values.'),
            stepLocationRelativeToParent: z.enum(Object.values(StepLocationRelativeToParent) as [string, ...string[]]).describe('Where to place the step: AFTER = after the parent, INSIDE_LOOP = first action inside a loop, INSIDE_BRANCH = first action inside a router branch'),
            branchIndex: z.number().optional().describe('Branch index (required when stepLocationRelativeToParent is INSIDE_BRANCH)'),
            stepType: z.enum([FlowActionType.CODE, FlowActionType.PIECE, FlowActionType.LOOP_ON_ITEMS, FlowActionType.ROUTER]).describe('The type of step to add'),
            displayName: z.string().describe('Display name for the step'),
            pieceName: z.string().optional().describe('For PIECE steps: the piece name (e.g. "@activepieces/piece-gmail"). Use ap_list_pieces to get valid values.'),
            pieceVersion: z.string().optional().describe('For PIECE steps: the piece version (e.g. "~0.1.0"). Use ap_list_pieces to get valid values.'),
            actionName: z.string().optional().describe('For PIECE steps: the action name within the piece. Use ap_list_pieces with includeActions=true to get valid values.'),
        },
        annotations: { destructiveHint: false, idempotentHint: false, openWorldHint: false },
        execute: async (args) => {
            const { flowId, parentStepName, stepLocationRelativeToParent, branchIndex, stepType, displayName, pieceName, pieceVersion, actionName } = addStepInput.parse(args)

            const [flow, project] = await Promise.all([
                flowService(log).getOnePopulated({ id: flowId, projectId: mcp.projectId }),
                projectService(log).getOneOrThrow(mcp.projectId),
            ])
            if (isNil(flow)) {
                return { content: [{ type: 'text', text: '❌ Flow not found' }] }
            }

            const stepName = flowStructureUtil.findUnusedName(flow.version.trigger)

            let skeletonAction: Record<string, unknown>
            switch (stepType) {
                case FlowActionType.CODE:
                    skeletonAction = {
                        type: FlowActionType.CODE,
                        name: stepName,
                        displayName,
                        valid: false,
                        settings: {
                            sourceCode: { code: 'export const run = async (inputs) => { return {} }', packageJson: '{}' },
                            input: {},
                            errorHandlingOptions: { continueOnFailure: { value: false }, retryOnFailure: { value: false } },
                        },
                    }
                    break
                case FlowActionType.PIECE:
                    if (!pieceName || !pieceVersion) {
                        return {
                            content: [{
                                type: 'text',
                                text: '❌ pieceName and pieceVersion are required for PIECE steps. Use ap_list_pieces to get valid values.',
                            }],
                        }
                    }
                    skeletonAction = {
                        type: FlowActionType.PIECE,
                        name: stepName,
                        displayName,
                        valid: false,
                        settings: {
                            pieceName,
                            pieceVersion,
                            actionName: actionName ?? '',
                            input: {},
                            propertySettings: {},
                            errorHandlingOptions: { continueOnFailure: { value: false }, retryOnFailure: { value: false } },
                        },
                    }
                    break
                case FlowActionType.LOOP_ON_ITEMS:
                    skeletonAction = {
                        type: FlowActionType.LOOP_ON_ITEMS,
                        name: stepName,
                        displayName,
                        valid: false,
                        settings: {
                            items: '',
                        },
                    }
                    break
                case FlowActionType.ROUTER:
                    skeletonAction = {
                        type: FlowActionType.ROUTER,
                        name: stepName,
                        displayName,
                        valid: false,
                        settings: {
                            branches: [
                                { branchName: 'Branch 1', branchType: BranchExecutionType.CONDITION, conditions: [[]] },
                                { branchName: 'Otherwise', branchType: BranchExecutionType.FALLBACK },
                            ],
                            executionType: RouterExecutionType.EXECUTE_FIRST_MATCH,
                        },
                    }
                    break
                default:
                    return {
                        content: [{ type: 'text', text: `❌ Unknown step type: ${stepType}` }],
                    }
            }

            if (stepLocationRelativeToParent === StepLocationRelativeToParent.INSIDE_BRANCH && branchIndex === undefined) {
                return {
                    content: [{ type: 'text', text: '❌ branchIndex is required when stepLocationRelativeToParent is INSIDE_BRANCH. Use ap_flow_structure to get valid branch indices.' }],
                }
            }

            const parseResult = UpdateActionRequest.safeParse(skeletonAction)
            if (!parseResult.success) {
                const message = parseResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')
                return {
                    content: [{ type: 'text', text: `❌ Invalid step: ${message}` }],
                }
            }

            const operation: FlowOperationRequest = {
                type: FlowOperationType.ADD_ACTION,
                request: {
                    parentStep: parentStepName,
                    stepLocationRelativeToParent,
                    ...(branchIndex !== undefined && { branchIndex }),
                    action: parseResult.data,
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
                    content: [{
                        type: 'text',
                        text: `✅ Step "${displayName}" (${stepName}) added. Now use ap_update_step with stepName="${stepName}" to configure its settings.`,
                    }],
                }
            }
            catch (err) {
                return mcpToolError('Step add failed', err)
            }
        },
    }
}
