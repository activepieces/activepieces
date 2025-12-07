import { AIProviderConfig, AIProviderModel } from '@activepieces/piece-ai'

export type AIProviderStrategy<T extends AIProviderConfig> = {
    name: string
    listModels(config: T): Promise<AIProviderModel[]>
}
