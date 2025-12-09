import { httpClient, HttpMethod } from '@activepieces/pieces-common'
import { AIProviderModel, AIProviderModelType, AnthropicProviderConfig } from '@activepieces/shared'
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
                'anthropic-version': '2023-06-01',
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