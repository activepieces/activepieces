import { httpClient, HttpMethod } from '@activepieces/pieces-common'
import { AIProviderModel, AIProviderModelType, AvianProviderAuthConfig, AvianProviderConfig } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { AIProviderStrategy } from './ai-provider'

export const avianProvider: AIProviderStrategy<AvianProviderAuthConfig, AvianProviderConfig> = {
    name: 'Avian',
    async validateConnection(authConfig: AvianProviderAuthConfig, config: AvianProviderConfig, _log: FastifyBaseLogger): Promise<void> {
        await avianProvider.listModels(authConfig, config)
    },
    async listModels(authConfig: AvianProviderAuthConfig, _config: AvianProviderConfig): Promise<AIProviderModel[]> {
        const res = await httpClient.sendRequest<{ data: AvianModel[] }>({
            url: 'https://api.avian.io/v1/models',
            method: HttpMethod.GET,
            headers: {
                'Authorization': `Bearer ${authConfig.apiKey}`,
                'Content-Type': 'application/json',
            },
        })

        const { data } = res.body

        return data.map((model: AvianModel) => ({
            id: model.id,
            name: model.id,
            type: AIProviderModelType.TEXT,
        }))
    },
}

type AvianModel = {
    id: string
}
