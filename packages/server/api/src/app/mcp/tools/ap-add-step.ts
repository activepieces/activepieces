import { PropertyType } from '@activepieces/pieces-framework'
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
import { pieceMetadataService } from '../../pieces/metadata/piece-metadata-service'
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

export const apAddStepTool = (mcp: McpServer, log: FastifyBaseLogger): McpToolDefinition => {
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
        annotations: { destructiveHint: false, idempotentHint: false, openWorldHint: false },
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

            if (auth !== undefined && auth.includes('\'')) {
                return {
                    content: [{ type: 'text', text: '❌ auth value must not contain single quotes. Use the exact externalId from ap_list_connections.' }],
                }
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
                            input: input ?? {},
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
                        await fillDefaultsForMissingOptionalProps({ settings: pieceSettings, platformId: project.platformId, log })
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

                const hasConfig = input !== undefined || sourceCode !== undefined || loopItems !== undefined
                const addedStep = flowStructureUtil.getStep(stepName, updatedFlow.version.trigger)
                if (hasConfig && addedStep && !addedStep.valid) {
                    return {
                        content: [{
                            type: 'text',
                            text: `⚠️ Step "${displayName}" (${stepName}) added but still invalid. Use ap_get_piece_props to check required fields, then ap_update_step to fix.`,
                        }],
                    }
                }
                if (hasConfig) {
                    return {
                        content: [{
                            type: 'text',
                            text: `✅ Step "${displayName}" (${stepName}) added and configured.`,
                        }],
                    }
                }
                return {
                    content: [{
                        type: 'text',
                        text: `✅ Step "${displayName}" (${stepName}) added. Now use ap_update_step with stepName="${stepName}" to configure its settings.`,
                    }],
                }
            }
            catch (err) {
                return mcpUtils.mcpToolError('Step add failed', err)
            }
        },
    }
}

async function fillDefaultsForMissingOptionalProps({ settings, platformId, log }: {
    settings: Record<string, unknown>
    platformId: string
    log: FastifyBaseLogger
}): Promise<void> {
    const pieceName = settings.pieceName
    const pieceVersion = settings.pieceVersion
    const actionName = settings.actionName
    if (typeof pieceName !== 'string' || typeof pieceVersion !== 'string' || typeof actionName !== 'string') {
        return
    }
    try {
        const piece = await pieceMetadataService(log).getOrThrow({ platformId, name: pieceName, version: pieceVersion })
        const action = piece.actions[actionName]
        if (isNil(action)) {
            return
        }
        const defaults: Record<string, unknown> = {}
        for (const [propName, prop] of Object.entries(action.props)) {
            if (prop.type === PropertyType.ARRAY && !prop.required) {
                defaults[propName] = []
            }
            else if (prop.type === PropertyType.DYNAMIC && !prop.required) {
                defaults[propName] = {}
            }
            else if (prop.type === PropertyType.CHECKBOX && !prop.required) {
                defaults[propName] = prop.defaultValue ?? false
            }
        }
        settings.input = { ...defaults, ...(typeof settings.input === 'object' && settings.input !== null ? settings.input : {}) }
    }
    catch (err) {
        log.warn({ err, pieceName, actionName }, 'fillDefaultsForMissingOptionalProps: failed, skipping defaults')
    }
}
