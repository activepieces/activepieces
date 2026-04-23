import { AIProviderName } from './ai-provider-name'

export const AI_PIECE_PROVIDER_INTRODUCED_AT: Record<AIProviderName, string> = {
    [AIProviderName.OPENAI]: '0.0.1',
    [AIProviderName.ANTHROPIC]: '0.0.1',
    [AIProviderName.GOOGLE]: '0.0.1',
    [AIProviderName.AZURE]: '0.0.1',
    [AIProviderName.OPENROUTER]: '0.0.1',
    [AIProviderName.ACTIVEPIECES]: '0.0.1',
    [AIProviderName.CLOUDFLARE_GATEWAY]: '0.0.3',
    [AIProviderName.CUSTOM]: '0.0.4',
    [AIProviderName.BEDROCK]: '0.3.6',
}
