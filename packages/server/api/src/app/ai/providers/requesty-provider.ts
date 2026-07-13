import { httpClient, HttpMethod } from '@activepieces/pieces-common'
import { AIProviderModel, AIProviderModelType, RequestyProviderAuthConfig, RequestyProviderConfig } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { AIProviderStrategy } from './ai-provider'

export const requestyProvider: AIProviderStrategy<RequestyProviderAuthConfig, RequestyProviderConfig> = {
    name: 'Requesty',
    async validateConnection(authConfig: RequestyProviderAuthConfig, _config: RequestyProviderConfig, _log: FastifyBaseLogger): Promise<void> {
        await httpClient.sendRequest({
            url: 'https://router.requesty.ai/v1/models',
            method: HttpMethod.GET,
            headers: {
                'Authorization': `Bearer ${authConfig.apiKey}`,
                'Content-Type': 'application/json',
            },
        })
    },
    async listModels(authConfig: RequestyProviderAuthConfig, _config: RequestyProviderConfig): Promise<AIProviderModel[]> {
        const res = await httpClient.sendRequest<{ data: RequestyModel[] }>({
            url: 'https://router.requesty.ai/v1/models',
            method: HttpMethod.GET,
            headers: {
                'Authorization': `Bearer ${authConfig.apiKey}`,
                'Content-Type': 'application/json',
            },
        })

        const { data } = res.body

        return data.map((model: RequestyModel) => ({
            id: model.id,
            name: model.id,
            type: model.supports_image_generation ? AIProviderModelType.IMAGE : AIProviderModelType.TEXT,
        }))
    },
}

type RequestyModel = {
    id: string
    supports_image_generation?: boolean
}
