import { AIProviderName, extractMustacheTokens, isNil } from '@activepieces/core-utils'
import { AgentPieceProps, AI_PIECE_NAME, FlowActionType, flowStructureUtil, FlowVersion, PropertyExecutionType, PropertySettings } from '@activepieces/shared'
import semver from 'semver'
import { Migration } from '.'

export const migrateV28AiPieceModelPicker: Migration = {
    targetSchemaVersion: '28',
    migrate: async (flowVersion: FlowVersion): Promise<FlowVersion> => {
        const newVersion = flowStructureUtil.transferFlow(flowVersion, (step) => {
            if (step.type !== FlowActionType.PIECE || step.settings.pieceName !== AI_PIECE_NAME) {
                return step
            }
            const { actionName, input, propertySettings, pieceVersion } = step.settings
            const moved = TEXT_ACTIONS.has(actionName ?? '') ? movedToPicker({ input, propertySettings }) : null
            if (!isNil(moved)) {
                return {
                    ...step,
                    settings: {
                        ...step.settings,
                        pieceVersion: atLeastPickerVersion(pieceVersion),
                        input: moved.input,
                        propertySettings: moved.propertySettings,
                    },
                }
            }
            if (actionName === IMAGE_ACTION) {
                return step
            }
            const pick = withTierSlug(input[AgentPieceProps.AI_PROVIDER_MODEL])
            if (isNil(pick)) {
                return step
            }
            return {
                ...step,
                settings: {
                    ...step.settings,
                    input: { ...input, [AgentPieceProps.AI_PROVIDER_MODEL]: pick },
                },
            }
        })
        return { ...newVersion, schemaVersion: '29' }
    },
}

function movedToPicker({ input, propertySettings }: { input: Record<string, unknown>, propertySettings: Record<string, PropertySettings> }): MovedInput | null {
    if (AgentPieceProps.AI_PROVIDER_MODEL in input) {
        return null
    }
    const storedProvider = input[LEGACY_PROVIDER]
    const storedModel = input[LEGACY_MODEL]
    if (holdsExpression({ value: storedProvider, settings: propertySettings[LEGACY_PROVIDER] }) || holdsExpression({ value: storedModel, settings: propertySettings[LEGACY_MODEL] })) {
        return null
    }
    const selection = providerSelectionOf(storedProvider)
    if (isNil(selection) || typeof storedModel !== 'string' || storedModel.length === 0) {
        return null
    }
    const { [LEGACY_PROVIDER]: _provider, [LEGACY_MODEL]: _model, ...rest } = input
    const { [LEGACY_PROVIDER]: _providerSettings, [LEGACY_MODEL]: _modelSettings, ...restSettings } = propertySettings
    return {
        input: {
            ...rest,
            [AgentPieceProps.AI_PROVIDER_MODEL]: {
                provider: selection.provider,
                model: tierSlugFor({ provider: selection.provider, model: storedModel }) ?? storedModel,
                ...(isNil(selection.configId) ? {} : { configId: selection.configId }),
            },
        },
        propertySettings: restSettings,
    }
}

function withTierSlug(pick: unknown): Record<string, unknown> | null {
    if (!isRecord(pick)) {
        return null
    }
    const slug = tierSlugFor({ provider: pick['provider'], model: pick['model'] })
    return isNil(slug) ? null : { ...pick, model: slug }
}

function tierSlugFor({ provider, model }: { provider: unknown, model: unknown }): string | undefined {
    if (provider !== AIProviderName.ACTIVEPIECES || typeof model !== 'string') {
        return undefined
    }
    return LEGACY_CREDITS_MODEL_TO_TIER[model]
}

function providerSelectionOf(value: unknown): { provider: AIProviderName, configId?: string } | undefined {
    const raw = isRecord(value) ? value['provider'] : value
    const provider = Object.values(AIProviderName).find((name) => name === raw)
    if (isNil(provider)) {
        return undefined
    }
    const configId = isRecord(value) && typeof value['configId'] === 'string' && value['configId'].length > 0 ? value['configId'] : undefined
    return { provider, ...(isNil(configId) ? {} : { configId }) }
}

function holdsExpression({ value, settings }: { value: unknown, settings: PropertySettings | undefined }): boolean {
    if (settings?.type === PropertyExecutionType.DYNAMIC) {
        return true
    }
    return typeof value === 'string' && extractMustacheTokens(value).length > 0
}

function atLeastPickerVersion(pieceVersion: string): string {
    const current = semver.coerce(pieceVersion)
    if (isNil(current) || semver.lt(current, AI_PIECE_MODEL_PICKER_VERSION)) {
        return AI_PIECE_MODEL_PICKER_VERSION
    }
    return pieceVersion
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const AI_PIECE_MODEL_PICKER_VERSION = '0.15.0'
const LEGACY_PROVIDER = 'provider'
const LEGACY_MODEL = 'model'
const IMAGE_ACTION = 'generateImage'
const TEXT_ACTIONS: ReadonlySet<string> = new Set(['askAi', 'summarizeText', 'classifyText', 'extractStructuredData'])
const LEGACY_CREDITS_MODEL_TO_TIER: Record<string, string> = {
    'anthropic/claude-haiku-4.5': 'fast',
    'anthropic/claude-sonnet-4.6': 'smart',
    'anthropic/claude-opus-4.8': 'premium',
}

type MovedInput = {
    input: Record<string, unknown>
    propertySettings: Record<string, PropertySettings>
}
