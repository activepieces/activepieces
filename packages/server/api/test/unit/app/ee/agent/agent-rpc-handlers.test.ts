import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockSet, mockWhere, mockAndWhere, mockExecute, mockFindOneBy, mockTrack, mockSendConversationUpdate } = vi.hoisted(() => ({
    mockSet: vi.fn(),
    mockWhere: vi.fn(),
    mockAndWhere: vi.fn(),
    mockExecute: vi.fn().mockResolvedValue({ affected: 1 }),
    mockFindOneBy: vi.fn().mockResolvedValue(null),
    mockTrack: vi.fn().mockResolvedValue(undefined),
    mockSendConversationUpdate: vi.fn(),
}))

vi.mock('../../../../../src/app/ee/agent/agent-approval-gate', () => ({
    agentApprovalGate: {},
}))

type QueryBuilderMock = {
    update: () => QueryBuilderMock
    set: (values: unknown) => QueryBuilderMock
    where: (sql: string, params: unknown) => QueryBuilderMock
    andWhere: (sql: string, params: unknown) => QueryBuilderMock
    execute: () => Promise<{ affected: number }>
}

vi.mock('../../../../../src/app/ee/agent/agent-helpers', () => ({
    agentHelpers: {
        conversationRepo: () => ({
            findOneBy: mockFindOneBy,
            createQueryBuilder: (): QueryBuilderMock => {
                const builder: QueryBuilderMock = {
                    update: () => builder,
                    set: (values) => { mockSet(values); return builder },
                    where: (_sql, params) => { mockWhere(params); return builder },
                    andWhere: (_sql, params) => { mockAndWhere(params); return builder },
                    execute: mockExecute,
                }
                return builder
            },
        }),
    },
}))

vi.mock('../../../../../src/app/ee/agent/chat-analytics-sync', () => ({
    chatAnalyticsTelemetry: () => ({ sendConversationUpdate: mockSendConversationUpdate }),
}))

vi.mock('../../../../../src/app/ee/agent/chat-usage-tracker', () => ({
    chatUsageTracker: () => ({ track: mockTrack }),
}))

const noopLogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }

async function callUpdateChatProgress(input: { conversationId: string, runId?: string, uiMessages: unknown[], messages?: unknown[] }): Promise<void> {
    const { agentRpcHandlers } = await import('../../../../../src/app/ee/agent/agent-rpc-handlers')
    await agentRpcHandlers(noopLogger as never).updateAgentProgress(input)
}

describe('agentRpcHandlers.updateAgentProgress — incremental LLM message persistence', () => {
    beforeEach(() => {
        mockSet.mockClear()
        mockWhere.mockClear()
        mockAndWhere.mockClear()
    })

    it('persists both uiMessages and the LLM messages', async () => {
        const messages = [{ role: 'user', content: 'hi' }, { role: 'assistant', content: 'hello' }]

        await callUpdateChatProgress({ conversationId: 'conv-1', runId: 'run-1', uiMessages: [{ role: 'assistant', parts: [] }], messages })

        expect(mockSet).toHaveBeenCalledTimes(1)
        const updates = mockSet.mock.calls[0][0]
        expect(updates.messages).toEqual(messages)
        expect(updates.uiMessages).toBeDefined()
    })

    it('persists only uiMessages when no messages are provided (backward compatible)', async () => {
        await callUpdateChatProgress({ conversationId: 'conv-1', runId: 'run-1', uiMessages: [{ role: 'assistant', parts: [] }] })

        expect(mockSet).toHaveBeenCalledTimes(1)
        const updates = mockSet.mock.calls[0][0]
        expect(updates).not.toHaveProperty('messages')
        expect(updates.uiMessages).toBeDefined()
    })

    it('fences the write on the owning run id so a superseded run is rejected by the DB', async () => {
        await callUpdateChatProgress({ conversationId: 'conv-1', runId: 'run-1', uiMessages: [{ role: 'assistant', parts: [] }], messages: [{ role: 'assistant', content: 'x' }] })

        expect(mockWhere.mock.calls[0][0]).toEqual({ id: 'conv-1' })
        expect(mockAndWhere.mock.calls[0][0]).toEqual({ runId: 'run-1' })
    })
})

async function callSaveChatMessages(input: { conversationId: string, runId?: string, messages: unknown[], uiMessages: unknown[] }): Promise<void> {
    const { agentRpcHandlers } = await import('../../../../../src/app/ee/agent/agent-rpc-handlers')
    await agentRpcHandlers(noopLogger as never).saveAgentMessages(input as never)
}

describe('agentRpcHandlers.saveAgentMessages — no-shrink guard against context loss', () => {
    beforeEach(() => {
        mockSet.mockClear()
        mockFindOneBy.mockReset()
    })

    it('refuses to overwrite messages with a SHORTER history (the aborted-turn clobber)', async () => {
        // The conversation already has a full turn persisted incrementally...
        mockFindOneBy.mockResolvedValue({ messages: [{ role: 'user' }, { role: 'assistant' }, { role: 'tool' }, { role: 'assistant' }] })

        // ...and an aborted final save arrives with only the base user message.
        await callSaveChatMessages({ conversationId: 'conv-1', runId: 'run-1', messages: [{ role: 'user', content: 'Close my deals' }], uiMessages: [{ role: 'user' }, { role: 'assistant' }] })

        expect(mockSet).toHaveBeenCalledTimes(1)
        const updates = mockSet.mock.calls[0][0]
        // Content is preserved (not shrunk); only status is written.
        expect(updates).not.toHaveProperty('messages')
        expect(updates).not.toHaveProperty('uiMessages')
    })

    it('persists when the incoming history is at least as complete as what is stored', async () => {
        mockFindOneBy.mockResolvedValue({ messages: [{ role: 'user' }, { role: 'assistant' }] })
        const fullMessages = [{ role: 'user' }, { role: 'assistant' }, { role: 'tool' }, { role: 'assistant' }]

        await callSaveChatMessages({ conversationId: 'conv-1', runId: 'run-1', messages: fullMessages, uiMessages: [{ role: 'user' }, { role: 'assistant' }] })

        const updates = mockSet.mock.calls[0][0]
        expect(updates.messages).toEqual(fullMessages)
        expect(updates.uiMessages).toBeDefined()
    })

    it('an empty error-save flips status to ERROR without wiping stored history', async () => {
        mockFindOneBy.mockResolvedValue({ messages: [{ role: 'user' }, { role: 'assistant' }] })

        await callSaveChatMessages({ conversationId: 'conv-1', runId: 'run-1', messages: [], uiMessages: [] })

        const updates = mockSet.mock.calls[0][0]
        expect(updates).not.toHaveProperty('messages')
        expect(updates).not.toHaveProperty('uiMessages')
        expect(updates.status).toBe('ERROR')
    })
})

describe('agentRpcHandlers.saveAgentMessages — billing a row the run no longer owns', () => {
    beforeEach(() => {
        mockSet.mockClear()
        mockFindOneBy.mockReset()
        mockExecute.mockReset()
        mockTrack.mockClear()
        mockSendConversationUpdate.mockClear()
    })

    it('does not bill when the fenced save was rejected (preempted by a newer run)', async () => {
        mockExecute.mockResolvedValue({ affected: 0 })
        mockFindOneBy.mockResolvedValue({ id: 'conv-1', messages: [{ role: 'user' }] })

        await callSaveChatMessages({ conversationId: 'conv-1', runId: 'run-1', messages: [{ role: 'user' }, { role: 'assistant' }], uiMessages: [{ role: 'assistant' }] })

        expect(mockTrack).not.toHaveBeenCalled()
        expect(mockSendConversationUpdate).not.toHaveBeenCalled()
    })

    it('bills under the owning run id when the save landed', async () => {
        mockExecute.mockResolvedValue({ affected: 1 })
        mockFindOneBy.mockResolvedValue({ id: 'conv-1', messages: [{ role: 'user' }] })

        await callSaveChatMessages({ conversationId: 'conv-1', runId: 'run-1', messages: [{ role: 'user' }, { role: 'assistant' }], uiMessages: [{ role: 'assistant' }] })

        expect(mockTrack).toHaveBeenCalledTimes(1)
        expect(mockTrack.mock.calls[0][0]).toMatchObject({ runId: 'run-1' })
    })

    it('still bills when affected is undefined (driver reports no row count)', async () => {
        mockExecute.mockResolvedValue({})
        mockFindOneBy.mockResolvedValue({ id: 'conv-1', messages: [{ role: 'user' }] })

        await callSaveChatMessages({ conversationId: 'conv-1', runId: 'run-1', messages: [{ role: 'user' }, { role: 'assistant' }], uiMessages: [{ role: 'assistant' }] })

        expect(mockTrack).toHaveBeenCalledTimes(1)
    })
})

async function callExecuteAgentTool(input: { toolName: string, source: string }): Promise<unknown> {
    const { agentRpcHandlers } = await import('../../../../../src/app/ee/agent/agent-rpc-handlers')
    return agentRpcHandlers(noopLogger as never).executeAgentTool({
        toolName: input.toolName,
        toolInput: {},
        platformId: 'plat-1',
        userId: 'user-1',
        source: input.source as never,
    })
}

describe('agentRpcHandlers.executeAgentTool — chat-only tools are refused off the chat surface', () => {
    it.each(['__cancel_check', '__approval_wait', '__store_pending_gate', '__store_selected_connection', '__flow_write_check'])(
        'refuses %s for a FLOW_STEP run',
        async (toolName) => {
            await expect(callExecuteAgentTool({ toolName, source: 'FLOW_STEP' })).rejects.toThrow()
        },
    )

    it('refuses an unknown __ tool too, so a new one is never exposed by default', async () => {
        await expect(callExecuteAgentTool({ toolName: '__some_future_tool', source: 'FLOW_STEP' })).rejects.toThrow()
    })

    it('lets a CHAT run through to the normal handler', async () => {
        await expect(callExecuteAgentTool({ toolName: '__cancel_check', source: 'CHAT' })).resolves.toEqual({ result: false })
    })
})
