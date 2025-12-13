import { AIProviderModel, OpenAICompatibleProviderConfig } from '@activepieces/shared'
import { AIProviderStrategy } from './ai-provider'

export const openAICompatibleProvider: AIProviderStrategy<OpenAICompatibleProviderConfig> = {
    name: 'OpenAI Compatible',
    async listModels(config: OpenAICompatibleProviderConfig): Promise<AIProviderModel[]> {
        return config.models.map(m => ({
            id: m.modelId,
            name: m.modelName,
            type: m.modelType,
        }))
    },
}
