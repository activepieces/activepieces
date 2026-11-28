import { AiProviderCredentials, AIProviderName, isNil, observedProviderFetch, ProviderOutcomeReporter } from '@activepieces/core-utils'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { defaultSettingsMiddleware, ImageModel, LanguageModel, LanguageModelMiddleware, wrapLanguageModel } from 'ai'

function createLitellmLanguageModel({ credentials, modelId, onOutcome, extraHeaders }: LitellmModelParams): LanguageModel {
    const chat = litellmClient({ credentials, onOutcome, extraHeaders }).chatModel(modelId)
    const reasons = credentials.config.models?.find((model) => model.modelId === modelId)?.metadata?.supportsReasoning === true
    if (!reasons) {
        return chat
    }
    return wrapLanguageModel({
        model: chat,
        middleware: [
            defaultSettingsMiddleware({ settings: { providerOptions: { [LITELLM_OPTIONS_KEY]: { reasoningEffort: REASONING_EFFORT } } } }),
            withoutTemperature,
        ],
    })
}

function createLitellmImageModel({ credentials, modelId, onOutcome, extraHeaders }: LitellmModelParams): ImageModel {
    return litellmClient({ credentials, onOutcome, extraHeaders }).imageModel(modelId)
}

function litellmClient({ credentials, onOutcome, extraHeaders }: Omit<LitellmModelParams, 'modelId'>): ReturnType<typeof createOpenAICompatible> {
    const { apiKeyHeader, baseUrl, defaultHeaders } = credentials.config
    return createOpenAICompatible({
        name: LITELLM_OPTIONS_KEY,
        baseURL: baseUrl ?? '',
        headers: buildHeaders({ apiKeyHeader, apiKey: credentials.auth.apiKey ?? '', defaultHeaders, extraHeaders }),
        fetch: observedProviderFetch(onOutcome),
    })
}

function buildHeaders({ apiKeyHeader, apiKey, defaultHeaders, extraHeaders }: {
    apiKeyHeader?: string
    apiKey: string
    defaultHeaders?: Record<string, string>
    extraHeaders?: Record<string, string>
}): Record<string, string> {
    const header = isNil(apiKeyHeader) || apiKeyHeader.trim() === '' ? AUTHORIZATION_HEADER : apiKeyHeader
    const isAuthorization = header.trim().toLowerCase() === AUTHORIZATION_HEADER
    return {
        ...(extraHeaders ?? {}),
        ...(defaultHeaders ?? {}),
        [header]: isAuthorization ? `Bearer ${apiKey.trim().replace(/^bearer\s+/i, '')}` : apiKey,
    }
}

const AUTHORIZATION_HEADER = 'authorization'
const LITELLM_OPTIONS_KEY = 'litellm'
const REASONING_EFFORT = 'medium'

const withoutTemperature: LanguageModelMiddleware = {
    transformParams: async ({ params }) => ({ ...params, temperature: undefined }),
}

export const litellm = { createLanguageModel: createLitellmLanguageModel, createImageModel: createLitellmImageModel }

export const litellmAuth = { buildHeaders }

type LitellmModelParams = {
    credentials: Extract<AiProviderCredentials, { provider: AIProviderName.LITELLM }>
    modelId: string
    onOutcome?: ProviderOutcomeReporter
    extraHeaders?: Record<string, string>
}
