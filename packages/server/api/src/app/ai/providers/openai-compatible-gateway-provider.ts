import { AIProviderModel, OpenAICompatibleProviderAuthConfig, OpenAICompatibleProviderConfig } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { AIProviderStrategy } from './ai-provider'

export const openAICompatibleProvider: AIProviderStrategy<OpenAICompatibleProviderAuthConfig, OpenAICompatibleProviderConfig> = {
    name: 'OpenAI Compatible',
    async validateConnection(_: OpenAICompatibleProviderAuthConfig, _providerConfig: OpenAICompatibleProviderConfig, _log: FastifyBaseLogger): Promise<void> {
        // No validation needed for OpenAI Compatible provider
    },
    async listModels(_authConfig: OpenAICompatibleProviderAuthConfig, config: OpenAICompatibleProviderConfig): Promise<AIProviderModel[]> {
        return config.models.map(m => ({
            id: m.modelId,
            name: m.modelName,
            type: m.modelType,
        }))
    },
}
