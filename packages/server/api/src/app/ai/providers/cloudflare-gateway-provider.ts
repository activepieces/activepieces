import { httpClient, HttpMethod } from '@activepieces/pieces-common'
import { AIProviderModel, AIProviderModelType, CloudflareGatewayProviderAuthConfig, CloudflareGatewayProviderConfig } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { AIProviderStrategy } from './ai-provider'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateText } from 'ai'
export const cloudflareGatewayProvider: AIProviderStrategy<CloudflareGatewayProviderAuthConfig, CloudflareGatewayProviderConfig> = {
    name: 'Cloudflare Gateway',
    async validateConnection(authConfig: CloudflareGatewayProviderAuthConfig, config: CloudflareGatewayProviderConfig, log: FastifyBaseLogger): Promise<void> {

        const textModels = config.models.filter(m => m.modelType === AIProviderModelType.TEXT)
        const invalidModels: string[] = []
        for(const model of textModels) {
                try {
                    if(model.modelId.split('/')[0] === 'google-vertex-ai') {
                        const publisher = model.modelId.split('/')[1]
                        const modelId = model.modelId.split('/')[2]
                        const gatewayBaseUrl = `https://gateway.ai.cloudflare.com/v1/${config.accountId}/${config.gatewayId}`
                        const headers = {
                            'cf-aig-authorization': `Bearer ${authConfig.apiKey}`,
                        }
                        // Use createGoogleGenerativeAI instead of createVertex to avoid
                        // local Google service account auth — Cloudflare Gateway handles upstream auth.
                        const provider = createGoogleGenerativeAI({
                            apiKey: authConfig.apiKey,
                            baseURL: `${gatewayBaseUrl}/google-vertex-ai/v1/projects/${config.vertexProject}/locations/${config.vertexRegion}/publishers/${publisher}/`,
                            headers,
                        })
                        const aiModel = provider(modelId)
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
                } catch (error: unknown) {
                    log.error(error)
                    invalidModels.push(model.modelId)
                }
            }
               
        
       

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
