import { OPENAI_COMPATIBLE_VENDOR_BASE_URLS, OpenAiCompatibleVendor } from '@activepieces/core-piece-types'
import { AIProviderName } from '@activepieces/core-utils'
import { safeHttp } from '@activepieces/server-utils'
import { AIProviderModel, AIProviderModelType, aiProviderUtils, BaseAIProviderAuthConfig, isNil, OpenAiCompatibleVendorConfig, tryCatch } from '@activepieces/shared'
import { AIProviderStrategy } from './ai-provider'

export function openAiCompatibleVendor({ name, provider }: {
    name: string
    provider: OpenAiCompatibleVendor
}): AIProviderStrategy<BaseAIProviderAuthConfig, OpenAiCompatibleVendorConfig> {
    return {
        name,
        async validateConnection(authConfig: BaseAIProviderAuthConfig): Promise<void> {
            await listVendorModels({ authConfig, provider, name })
        },
        async listModels(authConfig: BaseAIProviderAuthConfig): Promise<AIProviderModel[]> {
            return listVendorModels({ authConfig, provider, name })
        },
    }
}

async function listVendorModels({ authConfig, provider, name }: {
    authConfig: BaseAIProviderAuthConfig
    provider: OpenAiCompatibleVendor
    name: string
}): Promise<AIProviderModel[]> {
    const declaredModels = VENDORS_DECLARING_MODALITIES.includes(provider)
        ? await listModelsByDeclaredModality({ authConfig, provider })
        : undefined
    if (!isNil(declaredModels)) {
        return declaredModels
    }

    const { data: response, error } = await tryCatch(() => safeHttp.axios.request<OpenAiCompatibleModelsResponse>({
        method: 'GET',
        url: vendorEndpoint({ provider, path: 'models' }),
        timeout: REQUEST_TIMEOUT_MS,
        headers: vendorHeaders({ authConfig }),
    }))

    if (!isNil(error) || isNil(response)) {
        throw new Error(`[${name}] failed to list models: ${error instanceof Error ? error.message : String(error)}`)
    }

    return (response.data.data ?? []).map((model) => ({
        id: model.id,
        name: model.id,
        type: AIProviderModelType.TEXT,
    }))
}

async function listModelsByDeclaredModality({ authConfig, provider }: {
    authConfig: BaseAIProviderAuthConfig
    provider: OpenAiCompatibleVendor
}): Promise<AIProviderModel[] | undefined> {
    const { data: response, error } = await tryCatch(() => safeHttp.axios.request<VendorLanguageModelsResponse>({
        method: 'GET',
        url: vendorEndpoint({ provider, path: 'language-models' }),
        timeout: REQUEST_TIMEOUT_MS,
        headers: vendorHeaders({ authConfig }),
    }))

    const declaredModels = response?.data.models
    if (!isNil(error) || isNil(declaredModels) || declaredModels.length === 0) {
        return undefined
    }

    return declaredModels
        .filter((model) => outputsText(model))
        .map((model) => ({
            id: model.id,
            name: model.id,
            type: AIProviderModelType.TEXT,
        }))
}

function outputsText(model: VendorLanguageModel): boolean {
    return isNil(model.output_modalities)
        ? aiProviderUtils.isChatModelId({ modelId: model.id })
        : model.output_modalities.includes(TEXT_OUTPUT_MODALITY)
}

function vendorEndpoint({ provider, path }: { provider: OpenAiCompatibleVendor, path: string }): string {
    return `${OPENAI_COMPATIBLE_VENDOR_BASE_URLS[provider].replace(/\/+$/, '')}/${path}`
}

function vendorHeaders({ authConfig }: { authConfig: BaseAIProviderAuthConfig }): Record<string, string> {
    return {
        'Authorization': `Bearer ${authConfig.apiKey}`,
        'Content-Type': 'application/json',
    }
}

const REQUEST_TIMEOUT_MS = 15_000

const TEXT_OUTPUT_MODALITY = 'text'

const VENDORS_DECLARING_MODALITIES: OpenAiCompatibleVendor[] = [AIProviderName.XAI]

type OpenAiCompatibleModelsResponse = {
    data?: { id: string }[]
}

type VendorLanguageModel = {
    id: string
    output_modalities?: string[]
}

type VendorLanguageModelsResponse = {
    models?: VendorLanguageModel[]
}
