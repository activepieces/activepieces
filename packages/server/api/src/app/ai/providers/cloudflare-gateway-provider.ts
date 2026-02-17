import { httpClient, HttpMethod } from '@activepieces/pieces-common'
import { AIProviderModel, AIProviderModelType, CloudflareGatewayProviderAuthConfig, CloudflareGatewayProviderConfig, isNil, splitCloudflareGatewayModelId } from '@activepieces/shared'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateText } from 'ai'
import { FastifyBaseLogger } from 'fastify'
import { AIProviderStrategy } from './ai-provider'
export const cloudflareGatewayProvider: AIProviderStrategy<CloudflareGatewayProviderAuthConfig, CloudflareGatewayProviderConfig> = {
    name: 'Cloudflare Gateway',
    async validateConnection(authConfig: CloudflareGatewayProviderAuthConfig, config: CloudflareGatewayProviderConfig, log: FastifyBaseLogger): Promise<void> {

        const textModels = config.models.filter(m => m.modelType === AIProviderModelType.TEXT)
        const invalidModels: string[] = []
        for (const model of textModels) {
            try {
                const { provider: providerPrefix, model: actualModelId, publisher } = splitCloudflareGatewayModelId(model.modelId)
                if (providerPrefix === 'google-vertex-ai') {
                    if (isNil(config.vertexProject) || isNil(config.vertexRegion)) {
                        throw new Error('Google Vertex ai project and region are required for Google Vertex AI models')
                    }
                    if (isNil(publisher)) {
                        throw new Error('Google Vertex ai publisher is required for Google Vertex AI models')
                    }
                    const providerConstructor = createGoogleGenerativeAI({
                        apiKey: authConfig.apiKey,
                        baseURL: `https://gateway.ai.cloudflare.com/v1/${config.accountId}/${config.gatewayId}/google-vertex-ai/v1/projects/${config.vertexProject}/locations/${config.vertexRegion}/publishers/${publisher}/`,
                        headers: {
                            'cf-aig-authorization': `Bearer ${authConfig.apiKey}`,
                        },
                    })
                    const aiModel = providerConstructor(actualModelId)
                    await generateText({
                        model: aiModel,
                        messages: [{ role: 'user', content: 'Hi, reply only with "ok"' }],
                        maxOutputTokens: 1,
                    })
                }
                else {
                    await httpClient.sendRequest({
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
                    })
                }
            }
            catch (error: unknown) {
                log.error(error)
                invalidModels.push(model.modelId)
            }
        }
               
        
       

        if (invalidModels.length > 0) {
            throw new Error(
                `These models have issues: ${invalidModels.join(', ')}, make sure the model id is correct and in the{provider_name}/{model_name} format, also check that the other inputs are correct.`,
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
