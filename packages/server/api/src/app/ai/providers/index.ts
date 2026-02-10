import { AIProviderAuthConfig, AIProviderConfig, AIProviderName } from '@activepieces/shared'
import { AIProviderStrategy } from './ai-provider'
import { anthropicProvider } from './anthropic-provider'
import { azureProvider } from './azure-provider'
import { cloudflareGatewayProvider } from './cloudflare-gateway-provider'
import { googleProvider } from './google-provider'
import { openAICompatibleProvider } from './openai-compatible-gateway-provider'
import { openaiProvider } from './openai-provider'
import { openRouterProvider } from './openrouter-provider'

export const aiProviders: Record<AIProviderName, AIProviderStrategy<AIProviderAuthConfig, AIProviderConfig>> = {
    [AIProviderName.OPENAI]: openaiProvider,
    [AIProviderName.ANTHROPIC]: anthropicProvider,
    [AIProviderName.OPENROUTER]: openRouterProvider,
    [AIProviderName.AZURE]: azureProvider,
    [AIProviderName.GOOGLE]: googleProvider,
    [AIProviderName.CLOUDFLARE_GATEWAY]: cloudflareGatewayProvider,
    [AIProviderName.CUSTOM]: openAICompatibleProvider,
    [AIProviderName.ACTIVEPIECES]: {
        ...openRouterProvider,
        name: 'Activepieces',
    },
}

export { AIProviderStrategy } from './ai-provider'
