import { FastifyBaseLogger } from 'fastify'
import { AddConversationCreditsParams, AiUsageHooks } from '../../ai/ai-usage-hooks'
import { AgentConversationEntity } from './agent-conversation-entity'
import { agentHelpers } from './agent-helpers'

export const agentConversationCreditsHooks = (_log: FastifyBaseLogger): AiUsageHooks => ({
    async addConversationCredits({ conversationId, credits }: AddConversationCreditsParams): Promise<void> {
        await agentHelpers.conversationRepo()
            .createQueryBuilder()
            .update(AgentConversationEntity)
            .set({ aiCredits: () => 'COALESCE("aiCredits", 0) + :credits' })
            .setParameter('credits', credits)
            .where('id = :conversationId', { conversationId })
            .execute()
    },
})
