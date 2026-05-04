import { httpClient, HttpMethod } from '@activepieces/pieces-common'
import { AIProviderModel, AIProviderModelType, MistralProviderAuthConfig, MistralProviderConfig } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { AIProviderStrategy } from './ai-provider'

export const mistralProvider: AIProviderStrategy<MistralProviderAuthConfig, MistralProviderConfig> = {
    name: 'Mistral AI',
    async validateConnection(authConfig: MistralProviderAuthConfig, config: MistralProviderConfig, _log: FastifyBaseLogger): Promise<void> {
        await mistralProvider.listModels(authConfig, config)
    },
    async listModels(authConfig: MistralProviderAuthConfig, _config: MistralProviderConfig): Promise<AIProviderModel[]> {
        const res = await httpClient.sendRequest<{ data: MistralModel[] }>({
            url: 'https://api.mistral.ai/v1/models',
            method: HttpMethod.GET,
            headers: {
                'Authorization': `Bearer ${authConfig.apiKey}`,
                'Content-Type': 'application/json',
            },
        })

        const { data } = res.body

        return data
            .filter((model) => model.capabilities?.completion_chat)
            .map((model) => ({
                id: model.id,
                name: model.id,
                type: AIProviderModelType.TEXT,
            }))
    },
}

type MistralModel = {
    id: string
    capabilities?: {
        completion_chat: boolean
    }
}
