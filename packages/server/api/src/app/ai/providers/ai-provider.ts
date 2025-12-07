import { AIProviderConfig, AIProviderModel } from '@activepieces/common-ai'

export type AIProviderStrategy<T extends AIProviderConfig> = {
    name: string
    listModels(config: T): Promise<AIProviderModel[]>
}
