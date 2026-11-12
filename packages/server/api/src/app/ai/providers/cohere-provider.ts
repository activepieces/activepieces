import { safeHttp } from '@activepieces/server-utils'
import { AIProviderModel, AIProviderModelType, CohereProviderAuthConfig, CohereProviderConfig } from '@activepieces/shared'
import { AIProviderStrategy } from './ai-provider'

export const cohereProvider: AIProviderStrategy<CohereProviderAuthConfig, CohereProviderConfig> = {
    name: 'Cohere',
    async validateConnection(authConfig: CohereProviderAuthConfig, config: CohereProviderConfig): Promise<void> {
        await cohereProvider.listModels(authConfig, config)
    },
    async listModels(authConfig: CohereProviderAuthConfig): Promise<AIProviderModel[]> {
        const response = await safeHttp.axios.request<CohereModelsResponse>({
            method: 'GET',
            url: COHERE_MODELS_URL,
            params: { endpoint: 'chat', page_size: MAX_PAGE_SIZE },
            timeout: REQUEST_TIMEOUT_MS,
            headers: {
                'Authorization': `Bearer ${authConfig.apiKey}`,
            },
        })
        return (response.data.models ?? [])
            .filter((model) => !model.is_deprecated)
            .map((model) => ({
                id: model.name,
                name: model.name,
                type: AIProviderModelType.TEXT,
            }))
    },
}

const COHERE_MODELS_URL = 'https://api.cohere.com/v1/models'

const MAX_PAGE_SIZE = 1000

const REQUEST_TIMEOUT_MS = 15_000

type CohereModel = {
    name: string
    is_deprecated?: boolean
}

type CohereModelsResponse = {
    models?: CohereModel[]
}
