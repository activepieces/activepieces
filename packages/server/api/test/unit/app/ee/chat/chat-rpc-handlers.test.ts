import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockGetActiveRunId, mockUpdate, mockFindOneBy } = vi.hoisted(() => ({
    mockGetActiveRunId: vi.fn(),
    mockUpdate: vi.fn().mockResolvedValue({ affected: 1 }),
    mockFindOneBy: vi.fn().mockResolvedValue(null),
}))

vi.mock('../../../../../src/app/ee/chat/chat-approval-gate', () => ({
    chatApprovalGate: {
        getActiveRunId: mockGetActiveRunId,
    },
}))

vi.mock('../../../../../src/app/ee/chat/chat-helpers', () => ({
    chatHelpers: {
        conversationRepo: () => ({ update: mockUpdate, findOneBy: mockFindOneBy }),
    },
}))

vi.mock('../../../../../src/app/ee/chat/chat-sync-job', () => ({
    chatAnalyticsTelemetry: () => ({ sendConversationUpdate: vi.fn(), sendMessageBillingEvent: vi.fn() }),
}))

const noopLogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }

async function callUpdateChatProgress(input: { conversationId: string, runId?: string, uiMessages: unknown[], messages?: unknown[] }): Promise<void> {
    const { chatRpcHandlers } = await import('../../../../../src/app/ee/chat/chat-rpc-handlers')
    await chatRpcHandlers(noopLogger as never).updateChatProgress(input)
}

describe('chatRpcHandlers.updateChatProgress — incremental LLM message persistence', () => {
    beforeEach(() => {
        mockUpdate.mockClear()
        mockGetActiveRunId.mockReset()
    })

    it('persists both uiMessages and the LLM messages when the run is active', async () => {
        mockGetActiveRunId.mockResolvedValue('run-1')
        const messages = [{ role: 'user', content: 'hi' }, { role: 'assistant', content: 'hello' }]

        await callUpdateChatProgress({ conversationId: 'conv-1', runId: 'run-1', uiMessages: [{ role: 'assistant', parts: [] }], messages })

        expect(mockUpdate).toHaveBeenCalledTimes(1)
        const [conversationId, updates] = mockUpdate.mock.calls[0]
        expect(conversationId).toBe('conv-1')
        expect(updates.messages).toEqual(messages)
        expect(updates.uiMessages).toBeDefined()
    })

    it('persists only uiMessages when no messages are provided (backward compatible)', async () => {
        mockGetActiveRunId.mockResolvedValue('run-1')

        await callUpdateChatProgress({ conversationId: 'conv-1', runId: 'run-1', uiMessages: [{ role: 'assistant', parts: [] }] })

        expect(mockUpdate).toHaveBeenCalledTimes(1)
        const [, updates] = mockUpdate.mock.calls[0]
        expect(updates).not.toHaveProperty('messages')
        expect(updates.uiMessages).toBeDefined()
    })

    it('skips the write entirely when the run is stale (superseded by a newer run)', async () => {
        mockGetActiveRunId.mockResolvedValue('run-2')

        await callUpdateChatProgress({ conversationId: 'conv-1', runId: 'run-1', uiMessages: [{ role: 'assistant', parts: [] }], messages: [{ role: 'assistant', content: 'x' }] })

        expect(mockUpdate).not.toHaveBeenCalled()
    })
})

async function callSaveChatMessages(input: { conversationId: string, runId?: string, messages: unknown[], uiMessages: unknown[] }): Promise<void> {
    const { chatRpcHandlers } = await import('../../../../../src/app/ee/chat/chat-rpc-handlers')
    await chatRpcHandlers(noopLogger as never).saveChatMessages(input as never)
}

describe('chatRpcHandlers.saveChatMessages — no-shrink guard against context loss', () => {
    beforeEach(() => {
        mockUpdate.mockClear()
        mockGetActiveRunId.mockReset()
        mockFindOneBy.mockReset()
    })

    it('refuses to overwrite messages with a SHORTER history (the aborted-turn clobber)', async () => {
        mockGetActiveRunId.mockResolvedValue('run-1')
        // The conversation already has a full turn persisted incrementally...
        mockFindOneBy.mockResolvedValue({ messages: [{ role: 'user' }, { role: 'assistant' }, { role: 'tool' }, { role: 'assistant' }] })

        // ...and an aborted final save arrives with only the base user message.
        await callSaveChatMessages({ conversationId: 'conv-1', runId: 'run-1', messages: [{ role: 'user', content: 'Close my deals' }], uiMessages: [{ role: 'user' }, { role: 'assistant' }] })

        expect(mockUpdate).toHaveBeenCalledTimes(1)
        const [, updates] = mockUpdate.mock.calls[0]
        // Content is preserved (not shrunk); only status is written.
        expect(updates).not.toHaveProperty('messages')
        expect(updates).not.toHaveProperty('uiMessages')
    })

    it('persists when the incoming history is at least as complete as what is stored', async () => {
        mockGetActiveRunId.mockResolvedValue('run-1')
        mockFindOneBy.mockResolvedValue({ messages: [{ role: 'user' }, { role: 'assistant' }] })
        const fullMessages = [{ role: 'user' }, { role: 'assistant' }, { role: 'tool' }, { role: 'assistant' }]

        await callSaveChatMessages({ conversationId: 'conv-1', runId: 'run-1', messages: fullMessages, uiMessages: [{ role: 'user' }, { role: 'assistant' }] })

        const [, updates] = mockUpdate.mock.calls[0]
        expect(updates.messages).toEqual(fullMessages)
        expect(updates.uiMessages).toBeDefined()
    })

    it('an empty error-save flips status to ERROR without wiping stored history', async () => {
        mockGetActiveRunId.mockResolvedValue('run-1')
        mockFindOneBy.mockResolvedValue({ messages: [{ role: 'user' }, { role: 'assistant' }] })

        await callSaveChatMessages({ conversationId: 'conv-1', runId: 'run-1', messages: [], uiMessages: [] })

        const [, updates] = mockUpdate.mock.calls[0]
        expect(updates).not.toHaveProperty('messages')
        expect(updates).not.toHaveProperty('uiMessages')
        expect(updates.status).toBe('ERROR')
    })
})
