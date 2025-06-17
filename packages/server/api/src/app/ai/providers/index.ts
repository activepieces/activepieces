import { anthropicProvider } from './anthropic'
import { openaiProvider } from './openai'
import { replicateProvider } from './replicate'
import { AIProviderParser } from './types'

export const aiProviders: Record<string, AIProviderParser> = {
    openai: openaiProvider,
    anthropic: anthropicProvider,
    replicate: replicateProvider,
}

export { AIProviderParser, Usage } from './types'
export { getProviderConfig, calculateTokensCost } from './utils' 
