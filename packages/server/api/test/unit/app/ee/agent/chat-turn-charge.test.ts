import { AIProviderName } from '@activepieces/core-utils'
import { AgentConversation, AgentConversationStatus, AgentRunSource, apId, PersistedAgentMessage, PersistedAgentPart, PersistedAgentPartType, PersistedAgentRole, PersistedToolCallStatus } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { trackBillingAndSendTelemetry, resolveConversationProviderName } = vi.hoisted(() => ({
    trackBillingAndSendTelemetry: vi.fn(),
    resolveConversationProviderName: vi.fn(),
}))

vi.mock('../../../../../src/app/platform/billing-and-telemetry', () => ({
    trackBillingAndSendTelemetry: (...args: unknown[]) => trackBillingAndSendTelemetry(...args),
}))

vi.mock('../../../../../src/app/ee/platform/platform-plan/platform-plan.service', () => ({
    platformPlanService: () => ({
        getOrCreateForPlatform: async () => ({ plan: 'standard', licenseKey: null }),
    }),
}))

vi.mock('../../../../../src/app/ee/agent/agent-helpers', () => ({
    agentHelpers: {
        resolveConversationProviderName: (...args: unknown[]) => resolveConversationProviderName(...args),
        surfaceOf: () => 'chat',
        resolveModelIdForAnalytics: () => 'model',
        resolveTier: () => ({ id: 'smart' }),
    },
}))

vi.mock('../../../../../src/app/ee/agent/history/agent-history', () => ({
    agentHistory: {
        resolveMessages: ({ conversation }: { conversation: AgentConversation }) => conversation.uiMessages ?? [],
    },
}))

import { chatToolBilling } from '../../../../../src/app/ee/agent/chat-tool-billing'

describe('chatToolBilling.chargeForLatestTurn with task agents', () => {
    beforeEach(() => {
        trackBillingAndSendTelemetry.mockReset()
        resolveConversationProviderName.mockReset()
    })

    it('charges a managed-key turn no message credit, only the paid calls its tasks made', async () => {
        resolveConversationProviderName.mockResolvedValue(AIProviderName.ACTIVEPIECES)

        await chatToolBilling.chargeForLatestTurn({ conversation: conversationWithTwoTasks(), log: LOG })

        expect(trackBillingAndSendTelemetry).toHaveBeenCalledWith(expect.objectContaining({
            credits: expect.objectContaining({ value: 3, properties: expect.objectContaining({ messages: 0, toolCalls: 3 }) }),
        }))
    })

    it('charges an own-key turn one message credit, once, plus the paid calls its tasks made', async () => {
        resolveConversationProviderName.mockResolvedValue(AIProviderName.OPENAI)

        await chatToolBilling.chargeForLatestTurn({ conversation: conversationWithTwoTasks(), log: LOG })

        expect(trackBillingAndSendTelemetry).toHaveBeenCalledWith(expect.objectContaining({
            credits: expect.objectContaining({ value: 4, properties: expect.objectContaining({ messages: 1, toolCalls: 3 }) }),
        }))
    })
})

function conversationWithTwoTasks(): AgentConversation {
    const messages: PersistedAgentMessage[] = [
        { role: PersistedAgentRole.USER, parts: [{ type: PersistedAgentPartType.TEXT, text: 'research and build' }] },
        { role: PersistedAgentRole.ASSISTANT, parts: [
            taskPart({ toolName: 'ap_run_task', billedToolCalls: [{ toolName: 'ap_execute_action', output: {} }, { toolName: 'ap_explore_data', output: {} }] }),
            taskPart({ toolName: 'ap_deep_research', billedToolCalls: [{ toolName: 'ap_scrape_url', output: {} }, { toolName: 'ap_fetch_url', output: {} }] }),
        ] },
    ]
    const now = new Date().toISOString()
    return {
        id: apId(),
        created: now,
        updated: now,
        platformId: apId(),
        projectId: apId(),
        userId: apId(),
        agentId: null,
        flowRunId: null,
        aiCredits: null,
        source: AgentRunSource.CHAT,
        title: null,
        modelName: null,
        modelTierId: null,
        status: AgentConversationStatus.IDLE,
        activeRunId: null,
        messages: [],
        uiMessages: messages,
        summary: null,
        summarizedUpToIndex: null,
    }
}

function taskPart({ toolName, billedToolCalls }: { toolName: string, billedToolCalls: { toolName: string, output: unknown }[] }): PersistedAgentPart {
    return {
        type: PersistedAgentPartType.TOOL_CALL,
        toolCallId: `${toolName}-1`,
        toolName,
        input: {},
        status: PersistedToolCallStatus.COMPLETED,
        output: { status: 'done', billedToolCalls, tokens: { input: 1000, output: 100 } },
    }
}

const LOG: FastifyBaseLogger = {
    level: 'info',
    fatal: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
    silent: vi.fn(),
    child: () => LOG,
}
