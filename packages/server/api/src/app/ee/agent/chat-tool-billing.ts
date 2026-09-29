import { isNil, spreadIfDefined } from '@activepieces/core-utils'
import { AgentConversation, chatBilling, ChatToolCall, isAppSumoCreditedPlan, PersistedAgentMessage, PersistedAgentPartType, PersistedAgentRole, PersistedToolCallStatus } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { LicenseKeyPostHogEvents } from '../../helper/telemetry.utils'
import { trackBillingAndSendTelemetry } from '../../platform/billing-and-telemetry'
import { CreditUsageSource } from '../../platform/billing-provider'
import { platformPlanService } from '../platform/platform-plan/platform-plan.service'
import { agentHelpers } from './agent-helpers'
import { agentHistory } from './history/agent-history'

function latestTurnToolCalls({ messages }: { messages: PersistedAgentMessage[] }): ChatToolCall[] {
    const lastUserIndex = messages.map((message) => message.role).lastIndexOf(PersistedAgentRole.USER)
    const turn = lastUserIndex === -1 ? messages : messages.slice(lastUserIndex + 1)
    return turn.flatMap((message) => message.parts.flatMap((part) =>
        part.type === PersistedAgentPartType.TOOL_CALL && part.status === PersistedToolCallStatus.COMPLETED
            ? [{ toolName: part.toolName, output: part.output }]
            : [],
    ))
}

function countBillableToolCallsInLatestTurn({ messages }: { messages: PersistedAgentMessage[] }): number {
    return latestTurnToolCalls({ messages }).filter(chatBilling.isFlatBilledToolCall).length
}

async function chargeForLatestTurn({ conversation, runId, log }: ChargeForLatestTurnParams): Promise<void> {
    const messages = agentHistory.resolveMessages({ conversation, log })
    const turnIndex = messages.filter((message) => message.role === PersistedAgentRole.USER).length
    const idempotencyScope = runId ?? turnIndex
    const provider = await agentHelpers.resolveChatProviderName({
        platformId: conversation.platformId,
        projectId: conversation.projectId ?? null,
        log,
    })
    const surface = agentHelpers.surfaceOf({ source: conversation.source })
    const model = agentHelpers.resolveModelIdForAnalytics({ selectedModel: conversation.modelName ?? null, provider, surface })
    const tier = agentHelpers.resolveTier({ tierId: conversation.modelName ?? null, surface })
    const platformPlan = await platformPlanService(log).getOrCreateForPlatform(conversation.platformId)

    const { messageCredits, billedToolCalls, total } = chatBilling.creditsForTurn({ provider, toolCalls: latestTurnToolCalls({ messages }) })
    const charge = total === 0 ? undefined : {
        platformId: conversation.platformId,
        value: total,
        source: CreditUsageSource.CHAT,
        idempotencyKey: `${conversation.id}:chatTurn:${idempotencyScope}`,
        properties: {
            platformId: conversation.platformId,
            projectId: conversation.projectId ?? PROJECTLESS_CHAT,
            userId: conversation.userId,
            conversationId: conversation.id,
            turnIndex,
            messages: messageCredits,
            toolCalls: billedToolCalls,
            provider,
            model,
            tier: tier.id,
        },
    }
    const appSumoCharge = isNil(charge) || !isAppSumoCreditedPlan(platformPlan.plan) ? undefined : {
        ...charge,
        idempotencyKey: `${conversation.id}:appSumoChatTurn:${idempotencyScope}`,
        properties: {
            platformId: conversation.platformId,
            projectId: conversation.projectId ?? PROJECTLESS_CHAT,
            conversationId: conversation.id,
            turnIndex,
            tier: tier.id,
        },
    }

    await trackBillingAndSendTelemetry({
        log,
        licenseKey: platformPlan.licenseKey,
        ...spreadIfDefined('credits', charge),
        ...spreadIfDefined('appSumo', appSumoCharge),
        telemetry: {
            event: LicenseKeyPostHogEvents.CHAT_MESSAGE,
            properties: {
                provider,
                model,
                toolsUsed: billedToolCalls,
            },
        },
    })
}

export const chatToolBilling = {
    countBillableToolCallsInLatestTurn,
    chargeForLatestTurn,
}

const PROJECTLESS_CHAT = 'chat'

type ChargeForLatestTurnParams = {
    conversation: AgentConversation
    runId?: string
    log: FastifyBaseLogger
}
