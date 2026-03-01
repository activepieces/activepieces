import { httpClient, HttpMethod } from '@activepieces/pieces-common'
import { AIProviderModel, AIProviderModelType, X_AIProviderAuthConfig, X_AIProviderConfig } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { AIProviderStrategy } from './ai-provider'

const X_AI_BASE_URL = 'https://api.x.ai/v1'

const X_AI_FALLBACK_MODELS: AIProviderModel[] = [
    { id: 'grok-4.1-fast', name: 'Grok 4.1 Fast', type: AIProviderModelType.TEXT },
    { id: 'grok-4-fast', name: 'Grok 4 Fast', type: AIProviderModelType.TEXT },
    { id: 'grok-4', name: 'Grok 4', type: AIProviderModelType.TEXT },
    { id: 'grok-code-fast-1', name: 'Grok Code Fast 1', type: AIProviderModelType.TEXT },
    { id: 'grok-3', name: 'Grok 3', type: AIProviderModelType.TEXT },
    { id: 'grok-3-mini', name: 'Grok 3 Mini', type: AIProviderModelType.TEXT },
]

type X_AIModel = {
    id: string
}

export const xAiProvider: AIProviderStrategy<X_AIProviderAuthConfig, X_AIProviderConfig> = {
    name: 'xAI (Grok)',
    async validateConnection(authConfig: X_AIProviderAuthConfig, config: X_AIProviderConfig, _log: FastifyBaseLogger): Promise<void> {
        await xAiProvider.listModels(authConfig, config)
    },
    async listModels(authConfig: X_AIProviderAuthConfig, _config: X_AIProviderConfig): Promise<AIProviderModel[]> {
        try {
            const res = await httpClient.sendRequest<{ data: X_AIModel[] }>({
                url: `${X_AI_BASE_URL}/models`,
                method: HttpMethod.GET,
                headers: {
                    'Authorization': `Bearer ${authConfig.apiKey}`,
                    'Content-Type': 'application/json',
                },
            })

            const { data } = res.body
            if (!Array.isArray(data)) {
                return X_AI_FALLBACK_MODELS
            }

            return data.map((model: X_AIModel) => ({
                id: model.id,
                name: model.id,
                type: AIProviderModelType.TEXT,
            }))
        }
        catch {
            return X_AI_FALLBACK_MODELS
        }
    },
}
