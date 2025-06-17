import { anthropicProvider } from './anthropic'
import { openaiProvider } from './openai'
import { replicateProvider } from './replicate'
import { AIProviderStrategy } from './types'

export const aiProvidersStrategies: Record<string, AIProviderStrategy> = {
    openai: openaiProvider,
    anthropic: anthropicProvider,
    replicate: replicateProvider,
}

export { AIProviderStrategy, Usage } from './types'
export { getProviderConfig, calculateTokensCost } from './utils' 
