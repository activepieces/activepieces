import { AIProviderAuthConfig, AIProviderConfig, AIProviderModel } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'

export const MODEL_LIST_TIMEOUT_MS = 15_000

export type AIProviderStrategy<T extends AIProviderAuthConfig, C extends AIProviderConfig> = {
    name: string
    modelIdsAreCustomerNamed?: boolean
    listModels(authConfig: T, config: C): Promise<AIProviderModel[]>
    validateConnection(authConfig: T, config: C, log: FastifyBaseLogger): Promise<void>
}
