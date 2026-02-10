import { httpClient, HttpMethod } from '@activepieces/pieces-common'
import { AIProviderModel, OpenAICompatibleProviderAuthConfig, OpenAICompatibleProviderConfig } from '@activepieces/shared'
import { AIProviderStrategy } from './ai-provider'

export const openAICompatibleProvider: AIProviderStrategy<OpenAICompatibleProviderAuthConfig, OpenAICompatibleProviderConfig> = {
    name: 'OpenAI Compatible',
    async validateConnection(authConfig: OpenAICompatibleProviderAuthConfig, config: OpenAICompatibleProviderConfig): Promise<void> {
        const response = await httpClient.sendRequest<{ data: { id: string }[] }>({
            url: `${config.baseUrl}/models`,
            method: HttpMethod.GET,
            headers: {
                [config.apiKeyHeader]: authConfig.apiKey,
            },
        })

        if (config.models && config.models.length > 0 && response.body?.data) {
            const availableModelIds = new Set(response.body.data.map(m => m.id))
            const invalidModels = config.models.filter(m => !availableModelIds.has(m.modelId))

            if (invalidModels.length > 0) {
                const invalidNames = invalidModels.map(m => m.modelId).join(', ')
                throw new Error(
                    `The following model IDs are not available on this provider: ${invalidNames}`,
                )
            }
        }
    },
    async listModels(_authConfig: OpenAICompatibleProviderAuthConfig, config: OpenAICompatibleProviderConfig): Promise<AIProviderModel[]> {
        return config.models.map(m => ({
            id: m.modelId,
            name: m.modelName,
            type: m.modelType,
        }))
    },
}
