import { anthropicProvider } from './anthropic-provider'
import { googleProvider } from './google-provider'
import { openaiProvider } from './openai-provider'
import { AIProviderStrategy } from './ai-provider'
import { openRouterProvider } from './openrouter-provider'
import { azureProvider } from './azure-provider'
import { AIProviderConfig, AIProviderName } from '@activepieces/common-ai'

export const aiProviders: Record<AIProviderName, AIProviderStrategy<AIProviderConfig>> = {
    [AIProviderName.OPENAI]: openaiProvider,
    [AIProviderName.ANTHROPIC]: anthropicProvider,
    [AIProviderName.OPENROUTER]: openRouterProvider,
    [AIProviderName.AZURE]: azureProvider,
    [AIProviderName.GOOGLE]: googleProvider,
    [AIProviderName.ACTIVEPIECES]: {
        ...openRouterProvider,
        name: 'ActivePieces',
    },
}

export { AIProviderStrategy } from './ai-provider'
