import { EntityManager } from 'typeorm'
import { hooksFactory } from '../helper/hooks-factory'
import { AIProviderSchema } from './ai-provider-entity'

export const aiUsageHooks = hooksFactory.create<AiUsageHooks>(() => ({
    addConversationCredits: async (_params: AddConversationCreditsParams) => {
        return
    },
    unpinConversationsFromKey: async (_params: UnpinConversationsFromKeyParams) => {
        return
    },
}))

export type AddConversationCreditsParams = {
    conversationId: string
    credits: number
}

export type UnpinConversationsFromKeyParams = {
    manager: EntityManager
    platformId: string
    configId: string
    key: AIProviderSchema | null
}

export type AiUsageHooks = {
    addConversationCredits(params: AddConversationCreditsParams): Promise<void>
    unpinConversationsFromKey(params: UnpinConversationsFromKeyParams): Promise<void>
}
