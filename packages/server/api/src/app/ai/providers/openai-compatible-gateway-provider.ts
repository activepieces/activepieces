import { AIProviderModel, OpenAICompatibleProviderAuthConfig, OpenAICompatibleProviderConfig } from '@activepieces/shared'
import { AIProviderStrategy } from './ai-provider'

export const openAICompatibleProvider: AIProviderStrategy<OpenAICompatibleProviderAuthConfig, OpenAICompatibleProviderConfig> = {
    name: 'OpenAI Compatible',
    async listModels(_authConfig: OpenAICompatibleProviderAuthConfig, config: OpenAICompatibleProviderConfig): Promise<AIProviderModel[]> {
        return config.models.map(m => ({
            id: m.modelId,
            name: m.modelName,
            type: m.modelType,
        }))
    },
}
