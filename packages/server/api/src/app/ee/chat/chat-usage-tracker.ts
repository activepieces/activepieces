import { AIProviderName, isNil } from '@activepieces/core-utils'
import { ChatConversation, PersistedChatMessage, PersistedChatPartType, PersistedChatRole, PlanName } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { BillingEvents, captureBillingEvent } from '../../helper/telemetry.utils'
import { CreditUsageSource, trackCreditsWithAppSumo } from '../../platform/billing-provider'
import { platformPlanService } from '../platform/platform-plan/platform-plan.service'
import { chatHelpers } from './chat-helpers'
import { chatToolBilling } from './chat-tool-billing'
import { chatHistory } from './history/chat-history'

export const chatUsageTracker = (log: FastifyBaseLogger) => ({
    async track({ conversation }: TrackParams): Promise<void> {
        const messages = chatHistory.resolveMessages({ conversation, log })
        const billableToolCalls = countBillableToolCallsInLatestTurn(messages)
        const turnIndex = messages.filter((message) => message.role === PersistedChatRole.USER).length

        const provider = await chatHelpers.resolveChatProviderName({ platformId: conversation.platformId, log })
        const model = chatHelpers.resolveModelId({ tierId: conversation.modelName ?? null, provider })

        const isManagedProvider = provider === AIProviderName.ACTIVEPIECES
        const tier = chatHelpers.resolveTier({ tierId: conversation.modelName ?? null })
        const creditWeight = isManagedProvider ? tier.creditWeight : 1
        const creditValue = (billableToolCalls + 1) * creditWeight

        const platformPlan = await platformPlanService(log).getOrCreateForPlatform(conversation.platformId)
        const isAppSumoPlan = platformPlan.plan?.toLowerCase().includes(PlanName.APPSUMO) ?? false

        await trackCreditsWithAppSumo({
            log,
            credits: {
                platformId: conversation.platformId,
                value: creditValue,
                source: CreditUsageSource.CHAT,
                idempotencyKey: `${conversation.id}:chat:${turnIndex}`,
                properties: {
                    platformId: conversation.platformId,
                    projectId: conversation.projectId ?? 'chat',
                    userId: conversation.userId,
                    conversationId: conversation.id,
                    turnIndex,
                    messages: 1,
                    toolCalls: billableToolCalls,
                    provider,
                    model,
                    tier: tier.id,
                },
            },
            appSumo: isManagedProvider && isAppSumoPlan ? {
                platformId: conversation.platformId,
                value: creditValue,

                idempotencyKey: `${conversation.id}:appSumoAi:${turnIndex}`,
                properties: {
                    platformId: conversation.platformId,
                    projectId: conversation.projectId?? 'chat',
                    conversationId: conversation.id,
                    turnIndex,
                    tier: tier.id,
                },
            } : undefined,
        })

        const licenseKey = platformPlan.licenseKey
        if (isNil(licenseKey) || licenseKey.length === 0) {
            return
        }
        captureBillingEvent({
            licenseKey,
            event: BillingEvents.CHAT_MESSAGE,
            properties: {
                provider,
                model,
                toolsUsed: billableToolCalls,
            },
        })
    },
})

function countBillableToolCallsInLatestTurn(messages: PersistedChatMessage[]): number {
    const lastUserIndex = messages.map((message) => message.role).lastIndexOf(PersistedChatRole.USER)
    const turn = lastUserIndex === -1 ? messages : messages.slice(lastUserIndex + 1)
    return turn.reduce((sum, message) => sum + message.parts.filter((part) =>
        part.type === PersistedChatPartType.TOOL_CALL && chatToolBilling.isBillableChatToolCall(part.toolName),
    ).length, 0)
}

type TrackParams = {
    conversation: ChatConversation
}
