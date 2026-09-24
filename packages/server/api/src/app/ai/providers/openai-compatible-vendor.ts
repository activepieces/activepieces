import { OPENAI_COMPATIBLE_VENDOR_BASE_URLS, OpenAiCompatibleVendor } from '@activepieces/core-piece-types'
import { safeHttp } from '@activepieces/server-utils'
import { AIProviderModel, AIProviderModelType, BaseAIProviderAuthConfig, isNil, OpenAiCompatibleVendorConfig, tryCatch } from '@activepieces/shared'
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
    const baseUrl = OPENAI_COMPATIBLE_VENDOR_BASE_URLS[provider]
    const { data: response, error } = await tryCatch(() => safeHttp.axios.request<OpenAiCompatibleModelsResponse>({
        method: 'GET',
        url: `${baseUrl.replace(/\/+$/, '')}/models`,
        timeout: REQUEST_TIMEOUT_MS,
        headers: {
            'Authorization': `Bearer ${authConfig.apiKey}`,
            'Content-Type': 'application/json',
        },
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

const REQUEST_TIMEOUT_MS = 15_000

type OpenAiCompatibleModelsResponse = {
    data?: { id: string }[]
}
