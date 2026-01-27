import {
    AIProviderName,
    ApEdition,
    FlowAction,
    FlowActionType,
    flowStructureUtil,
    FlowVersion,
    isNil,
    PieceAction,
} from '@activepieces/shared'
import { system } from '../../../helper/system/system'
import { Migration } from '.'


export const migrateV9AiPieces: Migration = {
    targetSchemaVersion: '9',
    migrate: async (flowVersion: FlowVersion): Promise<FlowVersion> => {
        const newVersion = flowStructureUtil.transferFlow(flowVersion, (step) => {
            if (step.type !== FlowActionType.PIECE) {
                return step
            }
            if (step.settings.pieceName === '@activepieces/piece-text-ai') {
                return migrateTextai(step)
            }
            if (step.settings.pieceName === '@activepieces/piece-utility-ai') {
                return migrateUtilityAction(step)
            }
            if (step.settings.pieceName === '@activepieces/piece-image-ai') {
                return migrateImageai(step)
            }
            return step
        })

        return {
            ...newVersion,
            schemaVersion: '10',
        }
    },
}

function migrateUtilityAction(step: PieceAction): FlowAction {
    const input = step.settings?.input as Record<string, unknown>
    return {
        ...step,
        settings: {
            ...step.settings,
            pieceName: '@activepieces/piece-ai',
            pieceVersion: '0.0.2',
            input: {
                ...input,
                ...migrateModel(input.provider as string, extractModelFromInput(input)),
                // Fix typo in older version
                schema: input?.schama as Record<string, unknown>,
                maxOutputTokens: input.maxTokens ?? input?.maxOutputTokens,
                maxTokens: undefined,
            },
        },
    }
}
function migrateTextai(step: PieceAction): FlowAction {
    const actionName = step.settings.actionName
    const input = step.settings?.input as Record<string, unknown>

    if (actionName === 'askAi') {
        const webSearchOptions = (input['webSearchOptions'] ?? {}) as Record<string, unknown>
        const includeSources = webSearchOptions.includeSources ?? input?.includeSources

        // Max Tokens is replaced by maxOutputTokens
        // Include Sources is replaced by webSearchOptions.includeSources
        return {
            ...step,
            settings: {
                ...step.settings,
                pieceName: '@activepieces/piece-ai',
                actionName: 'askAi',
                pieceVersion: '0.0.2',
                input: {
                    ...input,
                    webSearchOptions: {
                        ...webSearchOptions,
                        includeSources,
                    },
                    ...migrateModel(input.provider as string, extractModelFromInput(input)),
                    maxTokens: undefined,
                    includeSources: undefined,
                },
            },
        }
    }

    return {
        ...step,
        settings: {
            ...step.settings,
            pieceName: '@activepieces/piece-ai',
            pieceVersion: '0.0.2',
            input: {
                ...step.settings.input,
                ...migrateModel(input.provider as string, extractModelFromInput(input)),
                maxOutputTokens: input.maxTokens ?? input?.maxOutputTokens,
                maxTokens: undefined,
            },
        },
    }
}

function migrateImageai(step: PieceAction): FlowAction {
    const input = step.settings?.input as Record<string, unknown>
    const files = 'image' in input && !isNil(input.image) ? [{ file: input.image }] : input.files
    return {
        ...step,
        settings: {
            ...step.settings,
            pieceName: '@activepieces/piece-ai',
            pieceVersion: '0.0.2',
            input: {
                ...input,
                images: files,
                ...migrateModel(input.provider as string, extractModelFromInput(input)),
                resolution: undefined,
                advancedOptions: {
                    ...(input?.advancedOptions ?? {}),
                    size: input?.resolution ?? input?.size,
                },
            },
        },
    }
}

const modelIdToOpenRouter: Record<string, string> = {
    // Anthropic
    'claude-haiku-4-5-20251001': 'claude-haiku-4.5',
    'claude-sonnet-4-5-20250929': 'claude-sonnet-4.5',
    'claude-sonnet-4-20250514': 'claude-sonnet-4.5',
    'claude-3-5-haiku-20241022': 'claude-haiku-4.5',
    'claude-opus-4-1-20250805': 'claude-opus-4.1',
    'claude-3-7-sonnet-20250219': 'claude-sonnet-4.5',
    'claude-3-5-sonnet-latest': 'claude-sonnet-4.5',
    'claude-3-opus-20240229': 'claude-opus-4.1',
    'claude-3-sonnet-20240229': 'claude-sonnet-4.5',
    'claude-3-haiku-20240307': 'claude-haiku-4.5',

    // Google Gemini models
    'gemini-3-pro-preview': 'gemini-3-pro-preview',
    'gemini-2.5-pro': 'gemini-2.5-pro',
    'gemini-2.5-flash': 'gemini-2.5-flash',
    'gemini-2.5-flash-lite': 'gemini-2.5-flash-lite',
    'gemini-2.5-flash-lite-preview-06-17': 'gemini-2.5-flash-lite-preview-09-2025',
    'gemini-2.0-flash-lite': 'gemini-2.0-flash-lite-001',

    // OpenAI models
    'gpt-5-chat-latest': 'gpt-5-chat',
}

function extractModelFromInput(input: Record<string, unknown>): string {
    const model = input?.model as unknown
    if (typeof model === 'string') {
        return model
    }
    return (model as { modelId: string })?.modelId
}

function migrateModel(provider: string | undefined, modelId: string): { model: string | undefined, provider: string | undefined } {
    if (isNil(provider)) {
        return {
            provider,
            model: modelId,
        }
    }
    const edition = system.getEdition()
    if (edition !== ApEdition.CLOUD) {
        return {
            provider,
            model: modelId,
        }
    }
    return {
        provider: AIProviderName.ACTIVEPIECES,
        model: `${provider.toLocaleLowerCase()}/${modelIdToOpenRouter[modelId] ?? modelId}`,
    }
}

