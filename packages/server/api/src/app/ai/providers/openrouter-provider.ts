import { httpClient, HttpMethod } from '@activepieces/pieces-common'
import { AIProviderModel, AIProviderModelType, OpenRouterProviderConfig } from '@activepieces/shared'
import { AIProviderStrategy } from './ai-provider'

export const openRouterProvider: AIProviderStrategy<OpenRouterProviderConfig> = {
    name: 'OpenRouter',
    async listModels(config: OpenRouterProviderConfig): Promise<AIProviderModel[]> {
        const res = await httpClient.sendRequest<{ data: OpenRouterModel[] }>({
            url: 'https://openrouter.ai/api/v1/models/user',
            method: HttpMethod.GET,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`,
            },
        })

        const { data } = res.body

        return data.map((model: OpenRouterModel) => ({
            id: model.id,
            name: model.name,
            type: model.architecture.output_modalities.includes('image') ? AIProviderModelType.IMAGE : AIProviderModelType.TEXT,
        }))
    },
}

type OpenRouterModel = {
    id: string
    name: string
    architecture: {
        output_modalities: string[]
    }
}