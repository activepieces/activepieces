import { AIProviderAuthConfig, AIProviderConfig, AIProviderModel } from '@activepieces/shared'

export type AIProviderStrategy<T extends AIProviderAuthConfig, C extends AIProviderConfig> = {
    name: string
    listModels(authConfig: T, config: C): Promise<AIProviderModel[]>
}
