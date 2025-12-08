import { AIProviderConfig, AIProviderName } from '@activepieces/shared'
import { AIProviderStrategy } from './ai-provider'
import { anthropicProvider } from './anthropic-provider'
import { azureProvider } from './azure-provider'
import { googleProvider } from './google-provider'
import { openaiProvider } from './openai-provider'
import { openRouterProvider } from './openrouter-provider'

export const aiProviders: Record<AIProviderName, AIProviderStrategy<AIProviderConfig>> = {
    [AIProviderName.OPENAI]: openaiProvider,
    [AIProviderName.ANTHROPIC]: anthropicProvider,
    [AIProviderName.OPENROUTER]: openRouterProvider,
    [AIProviderName.AZURE]: azureProvider,
    [AIProviderName.GOOGLE]: googleProvider,
    [AIProviderName.ACTIVEPIECES]: {
        ...openRouterProvider,
        name: 'Activepieces',
    },
}

export { AIProviderStrategy } from './ai-provider'
