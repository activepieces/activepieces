import { AIProviderName, isNil, unique } from '@activepieces/core-utils'
import { AgentConversation } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { In, IsNull } from 'typeorm'
import { aiKeyScope } from '../../ai/ai-key-scope'
import { AIProviderSchema } from '../../ai/ai-provider-entity'
import { AddConversationCreditsParams, AiUsageHooks, UnpinConversationsFromKeyParams } from '../../ai/ai-usage-hooks'
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
    async unpinConversationsFromKey({ manager, platformId, configId, key }: UnpinConversationsFromKeyParams): Promise<void> {
        const repo = manager.getRepository(AgentConversationEntity)
        const pinned = await repo.find({
            where: { platformId, providerConfigId: configId },
            select: { id: true, projectId: true, modelName: true },
        })
        const stale = isNil(key) ? pinned : pinned.filter((conversation) => !keyStillServes({ key, conversation }))
        for (const modelName of unique(stale.map((conversation) => conversation.modelName ?? null))) {
            const ids = stale.filter((conversation) => (conversation.modelName ?? null) === modelName).map((conversation) => conversation.id)
            await repo.update(
                { platformId, providerConfigId: configId, modelName: isNil(modelName) ? IsNull() : modelName, id: In(ids) },
                { providerConfigId: null },
            )
        }
    },
})

function keyStillServes({ key, conversation }: { key: AIProviderSchema, conversation: Pick<AgentConversation, 'projectId' | 'modelName'> }): boolean {
    const servesProject = isNil(conversation.projectId)
        ? key.projectScope === 'all'
        : aiKeyScope.rowAllowsScope({ row: key, scope: { type: 'project', projectId: conversation.projectId } })
    const servesModel = isNil(conversation.modelName)
        || key.provider === AIProviderName.ACTIVEPIECES
        || aiKeyScope.keyOffersModel({ key, modelId: conversation.modelName })
    return servesProject && servesModel
}
