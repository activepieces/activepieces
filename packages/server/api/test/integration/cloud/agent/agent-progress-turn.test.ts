import { AgentConversationStatus } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { agentHelpers } from '../../../../src/app/ee/agent/agent-helpers'
import { agentRpcHandlers } from '../../../../src/app/ee/agent/agent-rpc-handlers'
import { db } from '../../../helpers/db'
import { createTestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('progress saves that carry only the turn', () => {
    it('keeps the stored history and replaces the turn with the latest progress', async () => {
        const conversationId = await streamingConversation({ messages: HISTORY, uiMessages: UI_HISTORY })

        await saveTurn({ conversationId, messages: [STEP_1], uiMessages: [assistantUi('step 1')] })
        await saveTurn({ conversationId, messages: [STEP_1, STEP_2], uiMessages: [assistantUi('step 2')] })

        const stored = await agentHelpers.conversationRepo().findOneByOrFail({ id: conversationId })
        expect(stored.messages).toEqual([...HISTORY, STEP_1, STEP_2])
        expect(stored.uiMessages).toEqual([...UI_HISTORY, assistantUi('step 2')])
    })

    it('leaves the row identical when the same progress save arrives twice', async () => {
        const conversationId = await streamingConversation({ messages: HISTORY, uiMessages: UI_HISTORY })

        await saveTurn({ conversationId, messages: [STEP_1], uiMessages: [assistantUi('step 1')] })
        const first = await agentHelpers.conversationRepo().findOneByOrFail({ id: conversationId })
        await saveTurn({ conversationId, messages: [STEP_1], uiMessages: [assistantUi('step 1')] })
        const second = await agentHelpers.conversationRepo().findOneByOrFail({ id: conversationId })

        expect(second.messages).toEqual(first.messages)
        expect(second.uiMessages).toEqual(first.uiMessages)
    })

    it('does not drop history when the stored row is shorter than the base the worker reports', async () => {
        const conversationId = await streamingConversation({ messages: [HISTORY[0]], uiMessages: [UI_HISTORY[0]] })

        await saveTurn({ conversationId, messages: [STEP_1], uiMessages: [assistantUi('step 1')] })

        const stored = await agentHelpers.conversationRepo().findOneByOrFail({ id: conversationId })
        expect(stored.messages).toEqual([HISTORY[0]])
        expect(stored.uiMessages).toEqual([UI_HISTORY[0]])
    })
})

async function streamingConversation({ messages, uiMessages }: { messages: unknown[], uiMessages: unknown[] }): Promise<string> {
    const ctx = await createTestContext(app, { plan: { chatEnabled: true } })
    const response = await ctx.post('/v1/agents/conversations', { title: 'Long chat' })
    const conversationId: string = response.json().id
    await db.update('agent_conversation', conversationId, {
        status: AgentConversationStatus.STREAMING,
        messages,
        uiMessages,
    })
    return conversationId
}

async function saveTurn({ conversationId, messages, uiMessages }: { conversationId: string, messages: unknown[], uiMessages: unknown[] }): Promise<void> {
    await agentRpcHandlers(app.log).updateAgentProgress({
        conversationId,
        turn: { baseMessageCount: HISTORY.length, messages, baseUiMessageCount: UI_HISTORY.length, uiMessages },
    })
}

function assistantUi(text: string): unknown {
    return { role: 'assistant', parts: [{ type: 'text', text }] }
}

const HISTORY = [
    { role: 'user', content: 'first question' },
    { role: 'assistant', content: 'first answer' },
    { role: 'user', content: 'second question' },
]
const UI_HISTORY = [
    { role: 'user', parts: [{ type: 'text', text: 'first question' }] },
    { role: 'assistant', parts: [{ type: 'text', text: 'first answer' }] },
    { role: 'user', parts: [{ type: 'text', text: 'second question' }] },
]
const STEP_1 = { role: 'assistant', content: [{ type: 'tool-call', toolCallId: 'call-1', toolName: 'ap_list_flows', input: {} }] }
const STEP_2 = { role: 'tool', content: [{ type: 'tool-result', toolCallId: 'call-1', toolName: 'ap_list_flows', output: { type: 'json', value: [] } }] }
