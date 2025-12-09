import { AIProviderConfig, AIProviderModel } from '@activepieces/shared'

export type AIProviderStrategy<T extends AIProviderConfig> = {
    name: string
    listModels(config: T): Promise<AIProviderModel[]>
}
