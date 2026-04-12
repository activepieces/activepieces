import { PropertyType } from '@activepieces/pieces-framework'
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
import { diagnosePieceProps, mcpToolError } from './mcp-utils'

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
        description: 'Update an existing step\'s settings in a flow. Use ap_flow_structure to get step names. Use ap_list_pieces to get valid pieceName, pieceVersion, actionName. If you are about to configure a CODE step, first verify with ap_list_pieces that no existing piece can accomplish the task. Provide only the fields you want to change.',
        inputSchema: {
            flowId: z.string().describe('The id of the flow'),
            stepName: z.string().describe('The name of the step to update (e.g. "step_1"). Use ap_flow_structure to get valid values.'),
            displayName: z.string().optional().describe('New display name for the step'),
            input: z.record(z.string(), z.unknown()).optional().describe('Input settings for the step (key-value pairs matching the action schema). Use `{{stepName.output.field}}` to reference data from previous steps (e.g. `{{trigger.output.body.email}}`, `{{step_1.output.id}}`).'),
            auth: z.string().optional().describe('Connection `externalId` from `ap_list_connections`. The tool wraps it automatically as `{{connections[\'externalId\']}}`.'),
            actionName: z.string().optional().describe('For PIECE steps: the action to perform. Use ap_list_pieces to get valid values.'),
            loopItems: z.string().optional().describe('For LOOP steps: expression for the items to iterate over'),
            skip: z.boolean().optional().describe('Whether to skip this step during execution'),
            sourceCode: z.string().optional().describe('For CODE steps only: the JavaScript/TypeScript source code. Must export a `run` function: `export const run = async (inputs) => { ... }`.'),
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

            if (auth !== undefined && auth.includes('\'')) {
                return {
                    content: [{ type: 'text', text: '❌ auth value must not contain single quotes. Use the exact externalId from ap_list_connections.' }],
                }
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
                await fillDefaultsForMissingOptionalProps({
                    settings: updatedSettings,
                    platformId: project.platformId,
                    log,
                })
            }

            const payload = {
                type: step.type,
                name: step.name,
                displayName: displayName ?? step.displayName,
                valid: true,
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
                            text: `⚠️ Step "${stepName}" updated but still invalid. ${hint}`,
                        }],
                    }
                }
                return {
                    content: [{ type: 'text', text: `✅ Successfully updated step "${stepName}".` }],
                }
            }
            catch (err) {
                return mcpToolError('Step update failed', err)
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
        const { parts } = diagnosePieceProps({ props: action.props, input, pieceAuth: piece.auth, requireAuth: action.requireAuth, componentType: 'action' })
        return parts.join(' ')
    }
    catch (err) {
        log.warn({ err, pieceName, actionName }, 'diagnoseMissingInputs: failed to fetch piece metadata')
        return null
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
        const piece = await pieceMetadataService(log).getOrThrow({
            platformId,
            name: pieceName,
            version: pieceVersion,
        })
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
        log.warn({ err, pieceName, actionName }, 'fillDefaultsForMissingOptionalProps: failed to fetch piece metadata, skipping defaults')
    }
}
