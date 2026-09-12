import { isNil, spreadIfDefined } from '@activepieces/core-utils'
import { AgentConversation, CHAT_CREDITS_PER_TOOL_CALL, isAppSumoCreditedPlan, PersistedAgentMessage, PersistedAgentPartType, PersistedAgentRole, PersistedToolCallStatus } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { LicenseKeyPostHogEvents } from '../../helper/telemetry.utils'
import { trackBillingAndSendTelemetry } from '../../platform/billing-and-telemetry'
import { CreditUsageSource } from '../../platform/billing-provider'
import { platformPlanService } from '../platform/platform-plan/platform-plan.service'
import { agentHelpers } from './agent-helpers'
import { agentHistory } from './history/agent-history'

const BILLABLE_EXTERNAL_TOOL_NAMES = new Set<string>([
    'ap_web_search',
    'ap_scrape_url',
    'ap_generate_image',
    'ap_execute_action',
    'ap_explore_data',
    'ap_run_code',
])

function isBillableChatToolCall(toolName: string): boolean {
    return toolName.startsWith('mcp__') || BILLABLE_EXTERNAL_TOOL_NAMES.has(toolName)
}

function countBillableToolCallsInLatestTurn({ messages }: { messages: PersistedAgentMessage[] }): number {
    const lastUserIndex = messages.map((message) => message.role).lastIndexOf(PersistedAgentRole.USER)
    const turn = lastUserIndex === -1 ? messages : messages.slice(lastUserIndex + 1)
    return turn.reduce((sum, message) => sum + message.parts.filter((part) =>
        part.type === PersistedAgentPartType.TOOL_CALL
        && part.status === PersistedToolCallStatus.COMPLETED
        && isBillableChatToolCall(part.toolName),
    ).length, 0)
}

async function chargeForLatestTurn({ conversation, runId, log }: ChargeForLatestTurnParams): Promise<void> {
    const messages = agentHistory.resolveMessages({ conversation, log })
    const billableToolCalls = countBillableToolCallsInLatestTurn({ messages })
    const turnIndex = messages.filter((message) => message.role === PersistedAgentRole.USER).length
    const idempotencyScope = runId ?? turnIndex
    const provider = await agentHelpers.resolveChatProviderName({
        platformId: conversation.platformId,
        projectId: conversation.projectId ?? null,
        log,
    })
    const model = agentHelpers.resolveModelIdForAnalytics({ selectedModel: conversation.modelName ?? null, provider })
    const tier = agentHelpers.resolveTier({ tierId: conversation.modelName ?? null })
    const platformPlan = await platformPlanService(log).getOrCreateForPlatform(conversation.platformId)

    const charge = billableToolCalls === 0 ? undefined : {
        platformId: conversation.platformId,
        value: billableToolCalls * CHAT_CREDITS_PER_TOOL_CALL,
        source: CreditUsageSource.CHAT,
        idempotencyKey: `${conversation.id}:chatTools:${idempotencyScope}`,
        properties: {
            platformId: conversation.platformId,
            projectId: conversation.projectId ?? PROJECTLESS_CHAT,
            userId: conversation.userId,
            conversationId: conversation.id,
            turnIndex,
            messages: MESSAGES_A_TOOL_CALL_CHARGE_COVERS,
            toolCalls: billableToolCalls,
            provider,
            model,
            tier: tier.id,
        },
    }
    const appSumoCharge = isNil(charge) || !isAppSumoCreditedPlan(platformPlan.plan) ? undefined : {
        ...charge,
        idempotencyKey: `${conversation.id}:appSumoChatTools:${idempotencyScope}`,
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
                toolsUsed: billableToolCalls,
            },
        },
    })
}

export const chatToolBilling = {
    isBillableChatToolCall,
    countBillableToolCallsInLatestTurn,
    chargeForLatestTurn,
}

const PROJECTLESS_CHAT = 'chat'
const MESSAGES_A_TOOL_CALL_CHARGE_COVERS = 0

type ChargeForLatestTurnParams = {
    conversation: AgentConversation
    runId?: string
    log: FastifyBaseLogger
}
