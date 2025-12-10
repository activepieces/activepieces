import { httpClient, HttpMethod } from '@activepieces/pieces-common'
import { AIProviderModel, AIProviderModelType, CloudflareGatewayProviderConfig } from '@activepieces/shared'
import { AIProviderStrategy } from './ai-provider'

export const cloudflareGatewayProvider: AIProviderStrategy<CloudflareGatewayProviderConfig> = {
    name: 'Cloudflare Gateway',
    async listModels(config: CloudflareGatewayProviderConfig): Promise<AIProviderModel[]> {
        return [
            {
                id: 'openai/gpt-5-image',
                name: 'Gpt 5 image',
                type: AIProviderModelType.IMAGE
            },
            {
                id: "openai/gpt-5-pro",
                name: "Gpt 5 pro",
                type: AIProviderModelType.TEXT
            },
            {
                id: 'anthropic/claude-haiku-4.5',
                name: 'anthropic/claude-haiku-4.5',
                type: AIProviderModelType.TEXT
            },
            {
                id: 'google-ai-studio/gemini-2.5-pro-preview-tts',
                name: 'google-ai-studio/gemini-2.5-pro-preview-tts',
                type: AIProviderModelType.TEXT
            }
        ]
    },
}

type CloudflareGatewayModel = {
    id: string
}