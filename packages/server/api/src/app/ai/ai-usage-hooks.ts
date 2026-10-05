import { hooksFactory } from '../helper/hooks-factory'

export const aiUsageHooks = hooksFactory.create<AiUsageHooks>(() => ({
    addConversationCredits: async (_params: AddConversationCreditsParams) => {
        return
    },
}))

export type AddConversationCreditsParams = {
    conversationId: string
    credits: number
}

export type AiUsageHooks = {
    addConversationCredits(params: AddConversationCreditsParams): Promise<void>
}
