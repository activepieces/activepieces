import { httpClient, HttpMethod } from '@activepieces/pieces-common'
import { AIProviderModel, AIProviderModelType, OpenAIProviderAuthConfig, OpenAIProviderConfig } from '@activepieces/shared'
import { AIProviderStrategy } from './ai-provider'

export const openaiProvider: AIProviderStrategy<OpenAIProviderAuthConfig, OpenAIProviderConfig> = {
    name: 'OpenAI',
    async listModels(authConfig: OpenAIProviderAuthConfig, _config: OpenAIProviderConfig): Promise<AIProviderModel[]> {
        const res = await httpClient.sendRequest<{ data: OpenAIModel[] }>({
            url: 'https://api.openai.com/v1/models',
            method: HttpMethod.GET,
            headers: {
                'Authorization': `Bearer ${authConfig.apiKey}`,
                'Content-Type': 'application/json',
            },
        })

        const { data } = res.body

        const openaiImageModels = [
            'gpt-image-1',
            'dall-e-3',
            'dall-e-2',
        ]

        return data.map((model: OpenAIModel) => ({
            id: model.id,
            name: model.id,
            type: openaiImageModels.includes(model.id) ? AIProviderModelType.IMAGE : AIProviderModelType.TEXT,
        }))
    },
}

type OpenAIModel = {
    id: string
}