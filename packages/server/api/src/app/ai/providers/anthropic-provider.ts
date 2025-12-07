import { AIProviderModel, AIProviderModelType, AnthropicProviderConfig } from '@activepieces/piece-ai'
import { httpClient, HttpMethod } from '@activepieces/pieces-common'
import { AIProviderStrategy } from './ai-provider'

export const anthropicProvider: AIProviderStrategy<AnthropicProviderConfig> = {
    name: 'Anthropic',
    async listModels(config: AnthropicProviderConfig): Promise<AIProviderModel[]> {
        const res = await httpClient.sendRequest<{ data: AnthropicModel[] }>({
            url: 'https://api.anthropic.com/v1/models',
            method: HttpMethod.GET,
            headers: {
                'x-api-key': config.apiKey,
                'Content-Type': 'application/json',
            },
        })

        const { data } = res.body

        return data.map((model: AnthropicModel) => ({
            id: model.id,
            name: model.display_name,
            type: AIProviderModelType.TEXT,
        }))
    },
}

type AnthropicModel = {
    id: string
    display_name: string
}