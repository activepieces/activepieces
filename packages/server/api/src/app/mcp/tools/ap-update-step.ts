import {
    FlowActionType,
    FlowOperationRequest,
    FlowOperationType,
    flowStructureUtil,
    isNil,
    McpServer,
    McpToolDefinition,
    Permission,
    PieceActionSettings,
    UpdateActionRequest,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { flowService } from '../../flows/flow/flow.service'
import { pieceMetadataService } from '../../pieces/metadata/piece-metadata-service'
import { projectService } from '../../project/project-service'
import { mcpUtils } from './mcp-utils'

const updateStepInput = z.object({
    flowId: z.string(),
    stepName: z.string(),
    displayName: z.string().optional(),
    input: z.record(z.string(), z.unknown()).optional(),
    auth: z.string().optional(),
    actionName: z.string().optional(),
    loopItems: z.string().optional(),
    skip: z.boolean().optional(),
    sourceCode: z.string().optional(),
    packageJson: z.string().optional(),
})

export const apUpdateStepTool = (mcp: McpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_update_step',
        permission: Permission.WRITE_FLOW,
        description: 'Update an existing step\'s settings. Provide only the fields you want to change.',
        inputSchema: {
            flowId: z.string().describe('The id of the flow'),
            stepName: z.string().describe('The name of the step to update (e.g. "step_1"). Use ap_flow_structure to get valid values.'),
            displayName: z.string().optional().describe('New display name for the step'),
            input: z.record(z.string(), z.unknown()).optional().describe(`Input settings for the step (key-value pairs matching the action schema). ${mcpUtils.STEP_REFERENCE_HINT}`),
            auth: z.string().optional().describe('Connection `externalId` from `ap_list_connections`. The tool wraps it automatically as `{{connections[\'externalId\']}}`.'),
            actionName: z.string().optional().describe('For PIECE steps: the action to perform. Use ap_list_pieces to get valid values.'),
            loopItems: z.string().optional().describe('For LOOP steps: expression for the items to iterate over'),
            skip: z.boolean().optional().describe('Whether to skip this step during execution'),
            sourceCode: z.string().optional().describe('For CODE steps only: the JavaScript/TypeScript source code. Must export a `code` function: `export const code = async (inputs) => { ... }`.'),
            packageJson: z.string().optional().describe('For CODE steps only: package.json content as a JSON string for npm dependencies. Defaults to "{}".'),
        },
        annotations: { destructiveHint: false, idempotentHint: true, openWorldHint: false },
        execute: async (args) => {
            const { flowId, stepName, displayName, input, auth, actionName, loopItems, skip, sourceCode, packageJson } = updateStepInput.parse(args)

            const [flow, project] = await Promise.all([
                flowService(log).getOnePopulated({ id: flowId, projectId: mcp.projectId }),
                projectService(log).getOneOrThrow(mcp.projectId),
            ])
            if (isNil(flow)) {
                return { content: [{ type: 'text', text: '❌ Flow not found' }] }
            }

            const step = flowStructureUtil.getStep(stepName, flow.version.trigger)
            if (isNil(step)) {
                const allSteps = flowStructureUtil.getAllSteps(flow.version.trigger).map(s => s.name).join(', ')
                return {
                    content: [{ type: 'text', text: `❌ Step "${stepName}" not found. Available steps: ${allSteps}` }],
                }
            }

            if (flowStructureUtil.isTrigger(step.type)) {
                return {
                    content: [{ type: 'text', text: `❌ "${stepName}" is a trigger step. Use ap_update_trigger to configure triggers.` }],
                }
            }

            const authError = mcpUtils.validateAuth(auth)
            if (authError) {
                return authError
            }

            const currentSettings = step.settings as Record<string, unknown>
            const updatedSettings: Record<string, unknown> = { ...currentSettings }

            if (input !== undefined || auth !== undefined) {
                updatedSettings.input = {
                    ...(currentSettings.input as Record<string, unknown> ?? {}),
                    ...(input ?? {}),
                    ...(auth !== undefined && { auth: `{{connections['${auth}']}}` }),
                }
            }
            if (actionName !== undefined) {
                if (step.type === FlowActionType.PIECE) {
                    updatedSettings.actionName = actionName
                }
                else {
                    return { content: [{ type: 'text', text: `❌ actionName can only be set on PIECE steps, but "${stepName}" is type ${step.type}.` }] }
                }
            }
            if (loopItems !== undefined) {
                if (step.type === FlowActionType.LOOP_ON_ITEMS) {
                    updatedSettings.items = loopItems
                }
                else {
                    return { content: [{ type: 'text', text: `❌ loopItems can only be set on LOOP_ON_ITEMS steps, but "${stepName}" is type ${step.type}.` }] }
                }
            }
            if (sourceCode !== undefined || packageJson !== undefined) {
                if (step.type !== FlowActionType.CODE) {
                    const param = sourceCode !== undefined ? 'sourceCode' : 'packageJson'
                    return { content: [{ type: 'text', text: `❌ ${param} can only be set on CODE steps, but "${stepName}" is type ${step.type}.` }] }
                }
                const existing = currentSettings.sourceCode
                const isObj = typeof existing === 'object' && existing !== null
                const existingCode = isObj && 'code' in existing ? String(existing.code) : ''
                const existingPkg = isObj && 'packageJson' in existing ? String(existing.packageJson) : '{}'
                updatedSettings.sourceCode = {
                    code: sourceCode ?? existingCode,
                    packageJson: packageJson ?? existingPkg,
                }
            }

            if (step.type === FlowActionType.PIECE && input !== undefined) {
                await mcpUtils.fillDefaultsForMissingOptionalProps({
                    settings: updatedSettings,
                    platformId: project.platformId,
                    log,
                })
            }

            const payload = {
                type: step.type,
                name: step.name,
                displayName: displayName ?? step.displayName,
                valid: step.valid,
                settings: updatedSettings,
                ...(skip !== undefined && { skip }),
            }

            const parseResult = UpdateActionRequest.safeParse(payload)
            if (!parseResult.success) {
                const message = parseResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')
                return {
                    content: [{ type: 'text', text: `❌ Invalid step update: ${message}` }],
                }
            }

            const operation: FlowOperationRequest = {
                type: FlowOperationType.UPDATE_ACTION,
                request: parseResult.data,
            }

            try {
                const updatedFlow = await flowService(log).update({
                    id: flow.id,
                    projectId: mcp.projectId,
                    userId: null,
                    platformId: project.platformId,
                    operation,
                })
                const updatedStep = flowStructureUtil.getStep(stepName, updatedFlow.version.trigger)
                const draftWarning = mcpUtils.publishedFlowWarning(flow.publishedVersionId)
                if (updatedStep && !updatedStep.valid) {
                    const diagnosis = updatedStep.type === FlowActionType.PIECE
                        ? await diagnoseMissingInputs({ settings: updatedStep.settings, platformId: project.platformId, log })
                        : null
                    const hint = (diagnosis || null)
                        ?? (step.type === FlowActionType.PIECE
                            ? 'Use ap_list_pieces to verify pieceName, pieceVersion, actionName and required inputs, then retry.'
                            : 'Check the step settings and retry.')
                    return {
                        content: [{
                            type: 'text',
                            text: `⚠️ Step "${stepName}" updated but still invalid. ${hint}${draftWarning}`,
                        }],
                    }
                }
                return {
                    content: [{ type: 'text', text: `✅ Successfully updated step "${stepName}".${draftWarning}` }],
                }
            }
            catch (err) {
                return mcpUtils.mcpToolError('Step update failed', err)
            }
        },
    }
}

async function diagnoseMissingInputs({ settings, platformId, log }: {
    settings: PieceActionSettings
    platformId: string
    log: FastifyBaseLogger
}): Promise<string | null> {
    const { pieceName, pieceVersion, actionName } = settings
    if (isNil(actionName)) {
        return 'Missing actionName.'
    }
    try {
        const piece = await pieceMetadataService(log).getOrThrow({ platformId, name: pieceName, version: pieceVersion })
        const action = piece.actions[actionName]
        if (isNil(action)) {
            return `Action "${actionName}" not found in piece "${pieceName}". Use ap_list_pieces with includeActions=true to get valid action names.`
        }
        const input = settings.input ?? {}
        const { parts } = mcpUtils.diagnosePieceProps({ props: action.props, input, pieceAuth: piece.auth, requireAuth: action.requireAuth, componentType: 'action' })
        return parts.join(' ')
    }
    catch (err) {
        log.warn({ err, pieceName, actionName }, 'diagnoseMissingInputs: failed to fetch piece metadata')
        return null
    }
}
