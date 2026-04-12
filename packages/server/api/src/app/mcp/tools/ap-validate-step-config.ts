import {
    McpServer,
    McpToolDefinition,
    RouterActionSettingsWithValidation,
    SourceCode,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { mcpUtils } from './mcp-utils'

export const apValidateStepConfigTool = (mcp: McpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_validate_step_config',
        description: 'Validate a step configuration before applying it. Returns field-level errors without modifying any flow. Use this to check your config is correct before calling ap_update_step or ap_update_trigger.',
        inputSchema: validateStepConfigInput.shape,
        annotations: { readOnlyHint: true, openWorldHint: false },
        execute: async (args) => {
            try {
                const params = validateStepConfigInput.parse(args)

                switch (params.stepType) {
                    case 'PIECE_ACTION':
                    case 'PIECE_TRIGGER': {
                        const componentType = params.stepType === 'PIECE_ACTION' ? 'action' : 'trigger'
                        const componentName = componentType === 'action' ? params.actionName : params.triggerName
                        if (!params.pieceName || !componentName) {
                            const missing = !params.pieceName ? 'pieceName' : (componentType === 'action' ? 'actionName' : 'triggerName')
                            return { content: [{ type: 'text', text: `❌ ${missing} is required for ${componentType} validation.` }] }
                        }
                        return validatePieceComponent({ pieceName: params.pieceName, componentName, componentType, input: params.input ?? {}, auth: params.auth, projectId: mcp.projectId, log })
                    }
                    case 'CODE':
                        return validateWithSchema(codeValidator, { sourceCode: { code: params.sourceCode ?? '', packageJson: params.packageJson ?? '{}' }, input: {} }, 'CODE')
                    case 'LOOP_ON_ITEMS':
                        return validateWithSchema(loopValidator, { items: params.loopItems ?? '' }, 'LOOP_ON_ITEMS')
                    case 'ROUTER':
                        return validateWithSchema(RouterActionSettingsWithValidation, params.settings ?? {}, 'ROUTER')
                }
            }
            catch (err) {
                return mcpUtils.mcpToolError('Validation failed', err)
            }
        },
    }
}

const validateStepConfigInput = z.object({
    stepType: z.enum(['PIECE_ACTION', 'PIECE_TRIGGER', 'CODE', 'LOOP_ON_ITEMS', 'ROUTER'])
        .describe('The type of step to validate.'),
    pieceName: z.string().optional()
        .describe('For PIECE_ACTION/PIECE_TRIGGER: piece name (e.g. "slack" or "@activepieces/piece-slack").'),
    actionName: z.string().optional()
        .describe('For PIECE_ACTION: action name (e.g. "send_channel_message").'),
    triggerName: z.string().optional()
        .describe('For PIECE_TRIGGER: trigger name (e.g. "new_mention").'),
    input: z.record(z.string(), z.unknown()).optional()
        .describe('For PIECE_ACTION/PIECE_TRIGGER: the input config to validate (key-value pairs).'),
    auth: z.string().optional()
        .describe('For PIECE steps requiring auth: any non-empty string indicates auth is provided.'),
    sourceCode: z.string().optional()
        .describe('For CODE: the JavaScript/TypeScript source code.'),
    packageJson: z.string().optional()
        .describe('For CODE: package.json content as JSON string.'),
    loopItems: z.string().optional()
        .describe('For LOOP_ON_ITEMS: expression for items to iterate over.'),
    settings: z.record(z.string(), z.unknown()).optional()
        .describe('For ROUTER: raw router settings including branches and executionType.'),
})

async function validatePieceComponent({ pieceName, componentName, componentType, input, auth, projectId, log }: ValidatePieceParams): Promise<McpResult> {
    const lookup = await mcpUtils.lookupPieceComponent({ pieceName, componentName, componentType, projectId, log })
    if (lookup.error) {
        return lookup.error
    }

    const { component, pieceName: normalized } = lookup
    const inputWithAuth = auth ? { ...input, auth } : input
    const diagnosis = mcpUtils.diagnosePieceProps({
        props: component.props,
        input: inputWithAuth,
        pieceAuth: lookup.piece.auth,
        requireAuth: component.requireAuth,
        componentType,
    })

    if (diagnosis.missing.length === 0) {
        return { content: [{ type: 'text', text: `✅ Valid configuration for ${componentType.toUpperCase()} "${normalized}/${componentName}".` }] }
    }

    return { content: [{ type: 'text', text: `⚠️ Invalid configuration:\n${diagnosis.parts.join('\n')}` }] }
}

function validateWithSchema(schema: z.ZodType, data: unknown, label: string): McpResult {
    const result = schema.safeParse(data)
    if (result.success) {
        return { content: [{ type: 'text', text: `✅ Valid ${label} configuration.` }] }
    }
    const errors = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`)
    return { content: [{ type: 'text', text: `⚠️ Invalid ${label} configuration:\n${errors.join('\n')}` }] }
}

const codeValidator = z.object({
    sourceCode: SourceCode.and(z.object({
        code: z.string().min(1),
        packageJson: z.string().min(1),
    })),
    input: z.record(z.string(), z.any()),
})

const loopValidator = z.object({
    items: z.string().min(1),
})

type McpResult = { content: [{ type: 'text', text: string }] }

type ValidatePieceParams = {
    pieceName: string
    componentName: string
    componentType: 'action' | 'trigger'
    input: Record<string, unknown>
    auth: string | undefined
    projectId: string
    log: FastifyBaseLogger
}
