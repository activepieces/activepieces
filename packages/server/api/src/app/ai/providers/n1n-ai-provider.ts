import { httpClient, HttpMethod } from '@activepieces/pieces-common'
import { AIProviderModel, AIProviderModelType, BaseAIProviderAuthConfig, N1nAIProviderConfig } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { AIProviderStrategy } from './ai-provider'

export const n1nAIProvider: AIProviderStrategy<BaseAIProviderAuthConfig, N1nAIProviderConfig> = {
    name: 'n1n.ai',
    async validateConnection(authConfig: BaseAIProviderAuthConfig, config: N1nAIProviderConfig, _log: FastifyBaseLogger): Promise<void> {
        await n1nAIProvider.listModels(authConfig, config)
    },
    async listModels(authConfig: BaseAIProviderAuthConfig, _config: N1nAIProviderConfig): Promise<AIProviderModel[]> {
        const res = await httpClient.sendRequest<{ data: N1NModel[] }>({
            url: 'https://api.n1n.ai/v1/models',
            method: HttpMethod.GET,
            headers: {
                'Authorization': `Bearer ${authConfig.apiKey}`,
                'Content-Type': 'application/json',
            },
        })

        const { data } = res.body

        return data.map((model: N1NModel) => ({
            id: model.id,
            name: model.name ?? model.id,
            type: AIProviderModelType.TEXT,
        }))
    },
}

type N1NModel = {
    id: string
    name?: string
}
