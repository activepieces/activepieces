import {
    BranchExecutionType,
    FlowActionType,
    FlowOperationRequest,
    FlowOperationType,
    flowStructureUtil,
    isNil,
    McpToolDefinition,
    Permission,
    ProjectScopedMcpServer,
    RouterExecutionType,
    StepLocationRelativeToParent,
    UpdateActionRequest,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { flowService } from '../../flows/flow/flow.service'
import { projectService } from '../../project/project-service'
import { mcpUtils } from './mcp-utils'

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
    input: z.record(z.string(), z.unknown()).optional(),
    auth: z.string().optional(),
    sourceCode: z.string().optional(),
    packageJson: z.string().optional(),
    loopItems: z.string().optional(),
})

export const apAddStepTool = (mcp: ProjectScopedMcpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_add_step',
        permission: Permission.WRITE_FLOW,
        description: 'Add a new step to a flow. Optionally configure it in the same call by providing input/auth/sourceCode. Prefer PIECE over CODE.',
        inputSchema: {
            flowId: z.string().describe('The id of the flow'),
            parentStepName: z.string().describe('The step name to insert after/into (e.g. "trigger", "step_1"). Use ap_flow_structure to get valid values.'),
            stepLocationRelativeToParent: z.enum(Object.values(StepLocationRelativeToParent) as [string, ...string[]]).describe('Where to place the step: AFTER = after the parent, INSIDE_LOOP = first action inside a loop, INSIDE_BRANCH = first action inside a router branch'),
            branchIndex: z.number().optional().describe('Branch index (required when stepLocationRelativeToParent is INSIDE_BRANCH)'),
            stepType: z.enum([FlowActionType.CODE, FlowActionType.PIECE, FlowActionType.LOOP_ON_ITEMS, FlowActionType.ROUTER]).describe('The type of step to add. Prefer PIECE over CODE — only use CODE when no piece exists for the task.'),
            displayName: z.string().describe('Display name for the step'),
            pieceName: z.string().optional().describe('For PIECE steps: the piece name (e.g. "@activepieces/piece-gmail"). Use ap_list_pieces to get valid values.'),
            pieceVersion: z.string().optional().describe('For PIECE steps: the piece version (e.g. "~0.1.0"). Use ap_list_pieces to get valid values.'),
            actionName: z.string().optional().describe('For PIECE steps: the action name within the piece. Use ap_list_pieces with includeActions=true to get valid values.'),
            input: z.record(z.string(), z.unknown()).optional().describe(`For PIECE/CODE steps: input config (key-value pairs). ${mcpUtils.STEP_REFERENCE_HINT}`),
            auth: z.string().optional().describe('Connection externalId from ap_list_connections. Auto-wrapped as {{connections[\'externalId\']}}.'),
            sourceCode: z.string().optional().describe('For CODE steps: JavaScript/TypeScript source. Must export a `code` function.'),
            packageJson: z.string().optional().describe('For CODE steps: package.json as JSON string. Defaults to "{}".'),
            loopItems: z.string().optional().describe('For LOOP steps: expression for items to iterate (e.g. "{{step_1.items}}").'),
        },
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
        execute: async (args) => {
            const { flowId, parentStepName, stepLocationRelativeToParent, branchIndex, stepType, displayName, pieceName, pieceVersion, actionName, input, auth, sourceCode, packageJson, loopItems } = addStepInput.parse(args)

            const [flow, project] = await Promise.all([
                flowService(log).getOnePopulated({ id: flowId, projectId: mcp.projectId }),
                projectService(log).getOneOrThrow(mcp.projectId),
            ])
            if (isNil(flow)) {
                return { content: [{ type: 'text', text: '❌ Flow not found' }] }
            }

            const stepName = flowStructureUtil.findUnusedName(flow.version.trigger)

            const authError = mcpUtils.validateAuth(auth)
            if (authError) {
                return authError
            }

            const resolvedInput = {
                ...(input ?? {}),
                ...(auth !== undefined && { auth: `{{connections['${auth}']}}` }),
            }

            let skeletonAction: Record<string, unknown>
            switch (stepType) {
                case FlowActionType.CODE:
                    skeletonAction = {
                        type: FlowActionType.CODE,
                        name: stepName,
                        displayName,
                        valid: false,
                        settings: {
                            sourceCode: {
                                code: sourceCode ?? 'export const code = async (inputs) => { return {} }',
                                packageJson: packageJson ?? '{}',
                            },
                            input: resolvedInput,
                            errorHandlingOptions: { continueOnFailure: { value: false }, retryOnFailure: { value: false } },
                        },
                    }
                    break
                case FlowActionType.PIECE: {
                    if (!pieceName || !pieceVersion) {
                        return {
                            content: [{
                                type: 'text',
                                text: '❌ pieceName and pieceVersion are required for PIECE steps. Use ap_list_pieces to get valid values.',
                            }],
                        }
                    }
                    const pieceSettings: Record<string, unknown> = {
                        pieceName,
                        pieceVersion,
                        actionName: actionName ?? '',
                        input: resolvedInput,
                        propertySettings: {},
                        errorHandlingOptions: { continueOnFailure: { value: false }, retryOnFailure: { value: false } },
                    }
                    if (input !== undefined) {
                        await mcpUtils.fillDefaultsForMissingOptionalProps({ settings: pieceSettings, platformId: project.platformId, log })
                    }
                    skeletonAction = {
                        type: FlowActionType.PIECE,
                        name: stepName,
                        displayName,
                        valid: false,
                        settings: pieceSettings,
                    }
                    break
                }
                case FlowActionType.LOOP_ON_ITEMS:
                    skeletonAction = {
                        type: FlowActionType.LOOP_ON_ITEMS,
                        name: stepName,
                        displayName,
                        valid: false,
                        settings: {
                            items: loopItems ?? '',
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
                const updatedFlow = await flowService(log).update({
                    id: flow.id,
                    projectId: mcp.projectId,
                    userId: null,
                    platformId: project.platformId,
                    operation,
                })

                const draftWarning = mcpUtils.publishedFlowWarning(flow.publishedVersionId)
                const hasConfig = input !== undefined || auth !== undefined || sourceCode !== undefined || loopItems !== undefined
                const addedStep = flowStructureUtil.getStep(stepName, updatedFlow.version.trigger)
                const stepValid = hasConfig && addedStep ? addedStep.valid : false
                const structured = { stepName, displayName, valid: stepValid }
                if (hasConfig && addedStep && !addedStep.valid) {
                    return {
                        content: [{
                            type: 'text',
                            text: `⚠️ Step "${displayName}" (${stepName}) added but still invalid. Use ap_get_piece_props to check required fields, then ap_update_step to fix.${draftWarning}`,
                        }],
                        structuredContent: structured,
                    }
                }
                if (hasConfig) {
                    return {
                        content: [{
                            type: 'text',
                            text: `✅ Step "${displayName}" (${stepName}) added and configured.${draftWarning}`,
                        }],
                        structuredContent: { ...structured, valid: true },
                    }
                }
                return {
                    content: [{
                        type: 'text',
                        text: `✅ Step "${displayName}" (${stepName}) added. Now use ap_update_step with stepName="${stepName}" to configure its settings.${draftWarning}`,
                    }],
                    structuredContent: structured,
                }
            }
            catch (err) {
                return mcpUtils.mcpToolError('Step add failed', err)
            }
        },
    }
}
