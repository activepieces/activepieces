import { httpClient, HttpMethod } from '@activepieces/pieces-common'
import { AIProviderModel, AIProviderModelType, CloudflareGatewayProviderConfig } from '@activepieces/shared'
import { AIProviderStrategy } from './ai-provider'

export const cloudflareGatewayProvider: AIProviderStrategy<CloudflareGatewayProviderConfig> = {
    name: 'Cloudflare Gateway',
    async listModels(config: CloudflareGatewayProviderConfig): Promise<AIProviderModel[]> {
        return config.models.map(m => ({
            id: m.modelId,
            name: m.modelName,
            type: m.modelType,
        }))
    },
}

type CloudflareGatewayModel = {
    id: string
}