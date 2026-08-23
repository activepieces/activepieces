import { AIProviderName } from '@activepieces/core-utils'
import { AgentConversation, AgentRunSource, CHAT_BYOK_CREDIT_WEIGHT, CHAT_CREDITS_PER_TOOL_CALL, isAppSumoCreditedPlan, PersistedAgentRole } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { BillingEvents } from '../../helper/telemetry.utils'
import { trackBillingAndSendTelemetry } from '../../platform/billing-and-telemetry'
import { CreditUsageSource } from '../../platform/billing-provider'
import { platformPlanService } from '../platform/platform-plan/platform-plan.service'
import { agentHelpers } from './agent-helpers'
import { chatToolBilling } from './chat-tool-billing'
import { agentHistory } from './history/agent-history'

export const chatUsageTracker = (log: FastifyBaseLogger) => ({
    async track({ conversation, runId }: TrackParams): Promise<void> {
        if (conversation.source === AgentRunSource.FLOW_STEP) {
            return
        }
        const messages = agentHistory.resolveMessages({ conversation, log })
        const billableToolCalls = chatToolBilling.countBillableToolCallsInLatestTurn({ messages })
        const turnIndex = messages.filter((message) => message.role === PersistedAgentRole.USER).length
        const idempotencyScope = runId ?? turnIndex

        const provider = await agentHelpers.resolveChatProviderName({ platformId: conversation.platformId, log })
        const model = agentHelpers.resolveModelIdForAnalytics({ selectedModel: conversation.modelName ?? null, provider })

        const isManagedProvider = provider === AIProviderName.ACTIVEPIECES
        const tier = agentHelpers.resolveTier({ tierId: conversation.modelName ?? null })
        const creditWeight = isManagedProvider ? tier.creditWeight : CHAT_BYOK_CREDIT_WEIGHT
        const creditValue = creditWeight + billableToolCalls * CHAT_CREDITS_PER_TOOL_CALL

        const platformPlan = await platformPlanService(log).getOrCreateForPlatform(conversation.platformId)
        const isAppSumoPlan = isAppSumoCreditedPlan(platformPlan.plan)

        await trackBillingAndSendTelemetry({
            log,
            licenseKey: platformPlan.licenseKey,
            credits: {
                platformId: conversation.platformId,
                value: creditValue,
                source: CreditUsageSource.CHAT,
                idempotencyKey: `${conversation.id}:chat:${idempotencyScope}`,
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
            appSumo: isAppSumoPlan ? {
                platformId: conversation.platformId,
                value: creditValue,
                source: CreditUsageSource.CHAT,
                idempotencyKey: `${conversation.id}:appSumoAi:${idempotencyScope}`,
                properties: {
                    platformId: conversation.platformId,
                    projectId: conversation.projectId ?? 'chat',
                    conversationId: conversation.id,
                    turnIndex,
                    tier: tier.id,
                },
            } : undefined,
            telemetry: {
                event: BillingEvents.CHAT_MESSAGE,
                properties: {
                    provider,
                    model,
                    toolsUsed: billableToolCalls,
                },
            },
        })
    },
})

type TrackParams = {
    conversation: AgentConversation
    runId?: string
}
