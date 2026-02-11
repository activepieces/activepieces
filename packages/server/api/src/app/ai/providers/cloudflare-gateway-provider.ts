import { httpClient, HttpMethod } from '@activepieces/pieces-common'
import { AIProviderModel, AIProviderModelType, CloudflareGatewayProviderAuthConfig, CloudflareGatewayProviderConfig } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { AIProviderStrategy } from './ai-provider'

export const cloudflareGatewayProvider: AIProviderStrategy<CloudflareGatewayProviderAuthConfig, CloudflareGatewayProviderConfig> = {
    name: 'Cloudflare Gateway',
    async validateConnection(authConfig: CloudflareGatewayProviderAuthConfig, config: CloudflareGatewayProviderConfig, _: FastifyBaseLogger): Promise<void> {

        const textModels = config.models.filter(m => m.modelType === AIProviderModelType.TEXT)
        const invalidModels: string[] = []
        for (const model of textModels) {
            try {
                await httpClient.sendRequest({
                    url: `https://gateway.ai.cloudflare.com/v1/${config.accountId}/${config.gatewayId}/compat/chat/completions`,
                    method: HttpMethod.POST,
                    headers: {
                        'cf-aig-authorization': `Bearer ${authConfig.apiKey}`,
                        'Content-Type': 'application/json',
                    },
                    body: {
                        model: model.modelId,
                        messages: [{ role: 'user', content: 'Hi' }],
                        max_tokens: 1,
                    },
                })
            }
            catch {
                invalidModels.push(model.modelId)
            }
        }
        
        if (invalidModels.length > 0) {
            throw new Error(
                `The following models failed validation through the gateway: ${invalidModels.join(', ')}`,
            )
        }
    },
    async listModels(_: CloudflareGatewayProviderAuthConfig, config: CloudflareGatewayProviderConfig): Promise<AIProviderModel[]> {
        return config.models.map(m => ({
            id: m.modelId,
            name: m.modelName,
            type: m.modelType,
        }))
    },
}
