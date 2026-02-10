import { httpClient, HttpMethod } from '@activepieces/pieces-common'
import { AIProviderModel, CloudflareGatewayProviderAuthConfig, CloudflareGatewayProviderConfig } from '@activepieces/shared'
import { AIProviderStrategy } from './ai-provider'

export const cloudflareGatewayProvider: AIProviderStrategy<CloudflareGatewayProviderAuthConfig, CloudflareGatewayProviderConfig> = {
    name: 'Cloudflare Gateway',
    async validateConnection(authConfig: CloudflareGatewayProviderAuthConfig, config: CloudflareGatewayProviderConfig): Promise<void> {
        // Step 1: Validate the gateway exists and the API token has access
        await httpClient.sendRequest({
            url: `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/ai-gateway/gateways/${config.gatewayId}`,
            method: HttpMethod.GET,
            headers: {
                'Authorization': `Bearer ${authConfig.apiKey}`,
            },
        })

        // Step 2: Validate each configured model by sending a minimal request
        // through the gateway. Using max_tokens: 1 keeps cost/latency negligible.
        const invalidModels: string[] = []
        for (const model of config.models) {
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
    async listModels(authConfig: CloudflareGatewayProviderAuthConfig, config: CloudflareGatewayProviderConfig): Promise<AIProviderModel[]> {
        return config.models.map(m => ({
            id: m.modelId,
            name: m.modelName,
            type: m.modelType,
        }))
    },
}
