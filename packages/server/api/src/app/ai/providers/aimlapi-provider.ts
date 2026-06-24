import { httpClient, HttpMethod } from '@activepieces/pieces-common'
import { AIMLAPI_CHAT_MODELS, AIMLAPIProviderAuthConfig, AIMLAPIProviderConfig, AIProviderModel, AIProviderModelType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { AIProviderStrategy } from './ai-provider'

const AIMLAPI_CHAT_MODEL_NAMES: Record<(typeof AIMLAPI_CHAT_MODELS)[number], string> = {
    'gpt-5-chat': 'GPT-5 Chat',
    'openai/gpt-4o-mini': 'GPT-4o Mini',
    'openai/gpt-4o': 'GPT-4o',
    'anthropic/claude-sonnet-4.5': 'Claude Sonnet 4.5',
    'google/gemini-2.5-flash': 'Gemini 2.5 Flash',
    'google/gemini-3-flash-preview': 'Gemini 3 Flash Preview',
    'deepseek/deepseek-chat': 'DeepSeek Chat',
    'x-ai/grok-4': 'Grok 4',
}

export const aimlapiProvider: AIProviderStrategy<AIMLAPIProviderAuthConfig, AIMLAPIProviderConfig> = {
    name: 'AI/ML API',
    async validateConnection(authConfig: AIMLAPIProviderAuthConfig, _config: AIMLAPIProviderConfig, _log: FastifyBaseLogger): Promise<void> {
        await httpClient.sendRequest({
            url: 'https://api.aimlapi.com/v2/billing',
            method: HttpMethod.GET,
            headers: {
                'Authorization': `Bearer ${authConfig.apiKey}`,
                'Content-Type': 'application/json',
            },
        })
    },
    async listModels(_authConfig: AIMLAPIProviderAuthConfig, _config: AIMLAPIProviderConfig): Promise<AIProviderModel[]> {
        return AIMLAPI_CHAT_MODELS.map((model) => ({
            id: model,
            name: AIMLAPI_CHAT_MODEL_NAMES[model],
            type: AIProviderModelType.TEXT,
        }))
    },
}
