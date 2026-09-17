import { FastifyBaseLogger } from 'fastify'
import { AddConversationCreditsParams, AiUsageHooks } from '../../ai/ai-usage-hooks'
import { AgentConversationEntity } from './agent-conversation-entity'
import { agentHelpers } from './agent-helpers'

export const agentConversationCreditsHooks = (_log: FastifyBaseLogger): AiUsageHooks => ({
    async addConversationCredits({ conversationId, credits }: AddConversationCreditsParams): Promise<void> {
        const wholeCredits = Math.round(credits)
        if (wholeCredits === 0) {
            return
        }
        await agentHelpers.conversationRepo()
            .createQueryBuilder()
            .update(AgentConversationEntity)
            .set({ aiCredits: () => 'COALESCE("aiCredits", 0) + :credits' })
            .setParameter('credits', wholeCredits)
            .where('id = :conversationId', { conversationId })
            .execute()
    },
})
