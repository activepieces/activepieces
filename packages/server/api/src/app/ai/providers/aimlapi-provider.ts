import { AIMLAPIProviderAuthConfig, AIMLAPIProviderConfig, AIProviderModel, AIProviderModelType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { AIProviderStrategy } from './ai-provider'

const AIMLAPI_CHAT_MODELS: AIProviderModel[] = [
    { id: 'gpt-5-chat', name: 'GPT-5 Chat', type: AIProviderModelType.TEXT },
    { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', type: AIProviderModelType.TEXT },
    { id: 'openai/gpt-4o', name: 'GPT-4o', type: AIProviderModelType.TEXT },
    { id: 'anthropic/claude-sonnet-4.5', name: 'Claude Sonnet 4.5', type: AIProviderModelType.TEXT },
    { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', type: AIProviderModelType.TEXT },
    { id: 'google/gemini-3-flash-preview', name: 'Gemini 3 Flash Preview', type: AIProviderModelType.TEXT },
    { id: 'deepseek/deepseek-chat', name: 'DeepSeek Chat', type: AIProviderModelType.TEXT },
    { id: 'x-ai/grok-4', name: 'Grok 4', type: AIProviderModelType.TEXT },
]

export const aimlapiProvider: AIProviderStrategy<AIMLAPIProviderAuthConfig, AIMLAPIProviderConfig> = {
    name: 'AI/ML API',
    async validateConnection(_authConfig: AIMLAPIProviderAuthConfig, _config: AIMLAPIProviderConfig, _log: FastifyBaseLogger): Promise<void> {
        // AI/ML API uses a curated starter catalog here; avoid requiring /models discovery for setup.
    },
    async listModels(_authConfig: AIMLAPIProviderAuthConfig, _config: AIMLAPIProviderConfig): Promise<AIProviderModel[]> {
        return AIMLAPI_CHAT_MODELS
    },
}
