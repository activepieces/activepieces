import { anthropicProvider, AnthropicProviderConfig } from './anthropic-provider'
import { googleProvider, GoogleProviderConfig } from './google-provider'
import { openaiProvider, OpenAIProviderConfig } from './openai-provider'
import { AIProviderStrategy } from './ai-provider'
import { openRouterProvider, OpenRouterProviderConfig } from './openrouter-provider'
import { azureProvider, AzureProviderConfig } from './azure-provider'

export type AiProviderConfig = {
    openai: OpenAIProviderConfig;
    anthropic: AnthropicProviderConfig;
    openrouter: OpenRouterProviderConfig;
    azure: AzureProviderConfig;
    google: GoogleProviderConfig;
}

export const aiProviders: Record<string, AIProviderStrategy<any>> = {
    openai: openaiProvider,
    anthropic: anthropicProvider,
    openrouter: openRouterProvider,
    azure: azureProvider,
    google: googleProvider,
}

export { AIProviderStrategy } from './ai-provider'
