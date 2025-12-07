import { AIProviderName } from '@activepieces/common-ai'
import {
    FlowAction,
    FlowActionType,
    flowStructureUtil,
    FlowVersion,
    PieceAction,
} from '@activepieces/shared'
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
            pieceName: '@activepieces/piece-utility-ai',
            pieceVersion: '0.5.11',
            input: {
                ...input,
                ...migrateModel(input.provider as string, input.model as string),
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
       
    if (actionName === 'ask_ai') {
        const webSearchOptions = (input['webSearchOptions'] ?? {}) as Record<string, unknown>
        const includeSources = webSearchOptions.includeSources ?? input?.includeSources

        // Max Tokens is replaced by maxOutputTokens
        // Include Sources is replaced by webSearchOptions.includeSources
        return {
            ...step,
            settings: {
                ...step.settings,
                pieceName: '@activepieces/piece-text-ai',
                actionName: 'askAi',
                pieceVersion: '0.4.10',
                input: {
                    ...input,
                    webSearchOptions: {
                        ...webSearchOptions,
                        includeSources,
                    },
                    ...migrateModel(input.provider as string, input.model as string),
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
            input: {
                ...step.settings.input,
                ...migrateModel(input.provider as string, input.model as string),
                maxOutputTokens: input.maxTokens ?? input?.maxOutputTokens,
                maxTokens: undefined,
            },
            pieceVersion: '0.4.10',
        },
    }
}

function migrateImageai(step: PieceAction): FlowAction {
    const input = step.settings?.input as Record<string, unknown>
    return {
        ...step,
        settings: {
            ...step.settings,
            pieceName: '@activepieces/piece-image-ai',
            pieceVersion: '0.2.18',
            input: {
                ...input,
                ...migrateModel(input.provider as string, input.model as string),
                resolution: undefined,
                advancedOptions: {
                    ...(input?.advancedOptions ?? {}),
                    size: input?.resolution ?? input?.size,
                },
            },
        },
    }
}

function migrateModel(provider: string, modelId: string): { model: string, provider: string } {
    return {
        provider: AIProviderName.ACTIVEPIECES,
        model: `${provider.toLocaleLowerCase()}/${modelId}`,
    }
}