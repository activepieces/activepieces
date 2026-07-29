import { httpClient, HttpMethod } from '@activepieces/pieces-common'
import { AIProviderModel, AIProviderModelType, OpenAIProviderAuthConfig, OpenAIProviderConfig } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { AIProviderStrategy } from './ai-provider'

export const openaiProvider: AIProviderStrategy<OpenAIProviderAuthConfig, OpenAIProviderConfig> = {
    name: 'OpenAI',
    async validateConnection(authConfig: OpenAIProviderAuthConfig, config: OpenAIProviderConfig, _log: FastifyBaseLogger): Promise<void> {
        await openaiProvider.listModels(authConfig, config)
    },
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

        return data.map((model: OpenAIModel) => ({
            id: model.id,
            name: model.id,
            type: isImageModel({ modelId: model.id }) ? AIProviderModelType.IMAGE : AIProviderModelType.TEXT,
        }))
    },
}

function isImageModel({ modelId }: { modelId: string }): boolean {
    return modelId.startsWith('gpt-image') || DALL_E_MODELS.includes(modelId)
}

const DALL_E_MODELS = ['dall-e-3', 'dall-e-2']

type OpenAIModel = {
    id: string
}