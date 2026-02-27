import { AIProviderAuthConfig, AIProviderConfig, AIProviderModel } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'

export type AIProviderStrategy<T extends AIProviderAuthConfig, C extends AIProviderConfig> = {
    name: string
    listModels(authConfig: T, config: C): Promise<AIProviderModel[]>
    validateConnection(authConfig: T, config: C, log: FastifyBaseLogger): Promise<void>
}
