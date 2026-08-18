import { httpClient, HttpMethod } from '@activepieces/pieces-common'
import { AIProviderModel, AIProviderModelType, OrcaRouterProviderAuthConfig, OrcaRouterProviderConfig } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { AIProviderStrategy } from './ai-provider'

export const orcarouterProvider: AIProviderStrategy<OrcaRouterProviderAuthConfig, OrcaRouterProviderConfig> = {
    name: 'OrcaRouter',
    async validateConnection(authConfig: OrcaRouterProviderAuthConfig, config: OrcaRouterProviderConfig, _log: FastifyBaseLogger): Promise<void> {
        await orcarouterProvider.listModels(authConfig, config)
    },
    async listModels(authConfig: OrcaRouterProviderAuthConfig, _config: OrcaRouterProviderConfig): Promise<AIProviderModel[]> {
        const res = await httpClient.sendRequest<{ data: OrcaRouterModel[] }>({
            url: 'https://api.orcarouter.ai/v1/models',
            method: HttpMethod.GET,
            headers: {
                'Authorization': `Bearer ${authConfig.apiKey}`,
                'Content-Type': 'application/json',
            },
        })

        const { data } = res.body

        return data.map((model: OrcaRouterModel) => ({
            id: model.id,
            name: model.id,
            type: isImageModel({ modelId: model.id }) ? AIProviderModelType.IMAGE : AIProviderModelType.TEXT,
        }))
    },
}

function isImageModel({ modelId }: { modelId: string }): boolean {
    return modelId.includes('image') || DALL_E_MODELS.includes(modelId)
}

const DALL_E_MODELS = ['dall-e-3', 'dall-e-2']

type OrcaRouterModel = {
    id: string
}
