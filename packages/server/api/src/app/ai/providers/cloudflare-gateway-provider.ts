import { httpClient, HttpMethod } from '@activepieces/pieces-common'
import { AIProviderModel, AIProviderModelType, CloudflareGatewayProviderAuthConfig, CloudflareGatewayProviderConfig } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { AIProviderStrategy } from './ai-provider'

export const cloudflareGatewayProvider: AIProviderStrategy<CloudflareGatewayProviderAuthConfig, CloudflareGatewayProviderConfig> = {
    name: 'Cloudflare Gateway',
    async validateConnection(authConfig: CloudflareGatewayProviderAuthConfig, config: CloudflareGatewayProviderConfig, _: FastifyBaseLogger): Promise<void> {

        const textModels = config.models.filter(m => m.modelType === AIProviderModelType.TEXT)
        const results = await Promise.allSettled(
            textModels.map(model =>
                httpClient.sendRequest({
                    url: `https://gateway.ai.cloudflare.com/v1/${config.accountId}/${config.gatewayId}/compat/chat/completions`,
                    method: HttpMethod.POST,
                    headers: {
                        'cf-aig-authorization': `Bearer ${authConfig.apiKey}`,
                        'Content-Type': 'application/json',
                    },
                    body: {
                        model: model.modelId,
                        messages: [{ role: 'user', content: 'Hi, reply only with "ok"' }],
                    },
                }),
            ),
        )
        const invalidModels = textModels
            .filter((_, index) => results[index].status === 'rejected')
            .map(model => model.modelId)

        if (invalidModels.length > 0) {
            throw new Error(
                `The following models failed validation through the gateway: ${invalidModels.join(', ')}, make sure the model id is correct and in the{provider_name}/{model_name} format, also check that the other inputs are correct.`,
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
