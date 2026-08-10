import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockGetFlowRun, mockResumeFromWaitpoint } = vi.hoisted(() => ({
    mockGetFlowRun: vi.fn(),
    mockResumeFromWaitpoint: vi.fn().mockResolvedValue({ stale: false }),
}))

vi.mock('../../../../../src/app/flows/flow-run/flow-run-service', () => ({
    flowRunService: () => ({ getOneOrThrow: mockGetFlowRun }),
}))

vi.mock('../../../../../src/app/flows/flow-run/waitpoint/resume-service', () => ({
    resumeService: () => ({ resumeFromWaitpoint: mockResumeFromWaitpoint }),
}))

const { mockSet, mockWhere, mockAndWhere, mockExecute, mockFindOneBy, mockFindOne, mockSave, mockTrack, mockSendConversationUpdate } = vi.hoisted(() => ({
    mockSave: vi.fn(),
    mockSet: vi.fn(),
    mockWhere: vi.fn(),
    mockAndWhere: vi.fn(),
    mockExecute: vi.fn().mockResolvedValue({ affected: 1 }),
    mockFindOneBy: vi.fn().mockResolvedValue(null),
    mockFindOne: vi.fn().mockResolvedValue(null),
    mockTrack: vi.fn().mockResolvedValue(undefined),
    mockSendConversationUpdate: vi.fn(),
}))

vi.mock('../../../../../src/app/ee/agent/agent-approval-gate', () => ({
    agentApprovalGate: {},
}))

const { mockRunFromInstruction, mockUpdateStepProgress } = vi.hoisted(() => ({
    mockRunFromInstruction: vi.fn().mockResolvedValue({ result: { ok: true }, resolvedInput: {} }),
    mockUpdateStepProgress: vi.fn(),
}))

vi.mock('../../../../../src/app/flows/flow-run/engine-run-callback-service', () => ({
    engineRunCallbackService: () => ({ updateStepProgress: mockUpdateStepProgress }),
}))

vi.mock('../../../../../src/app/ee/agent/tools/piece-tool-runner', () => ({
    pieceToolRunner: { runFromInstruction: mockRunFromInstruction },
}))

vi.mock('@activepieces/server-utils', async (importOriginal) => ({
    ...(await importOriginal<Record<string, unknown>>()),
    agentAiUtils: { createChatModel: () => ({}) },
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
        resolveFastModel: () => ({}),
        conversationRepo: () => ({
            findOneBy: mockFindOneBy,
            findOne: mockFindOne,
            save: mockSave,
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
        mockFindOneBy.mockResolvedValue(null)
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

async function callUpdateProjectContext(input: { conversationId: string, runId?: string, projectId: string | null }): Promise<void> {
    const { agentRpcHandlers } = await import('../../../../../src/app/ee/agent/agent-rpc-handlers')
    await agentRpcHandlers(noopLogger as never).updateProjectContext(input as never)
}

describe('agentRpcHandlers.updateProjectContext — a flow-step run stays in its own project', () => {
    beforeEach(() => {
        mockSet.mockClear()
    })

    it('refuses to move a flow-step run to another project', async () => {
        mockFindOneBy.mockResolvedValue({ source: 'FLOW_STEP', projectId: 'proj-own' })

        await expect(callUpdateProjectContext({ conversationId: 'conv-1', projectId: 'proj-other' })).rejects.toThrow()
        expect(mockSet).not.toHaveBeenCalled()
    })

    it('allows a flow-step run to reaffirm the project it already belongs to', async () => {
        mockFindOneBy.mockResolvedValue({ source: 'FLOW_STEP', projectId: 'proj-own' })

        await callUpdateProjectContext({ conversationId: 'conv-1', projectId: 'proj-own' })

        expect(mockSet).toHaveBeenCalled()
    })

    it('leaves chat runs free to switch project, which is a feature there', async () => {
        mockFindOneBy.mockResolvedValue({ source: 'CHAT', projectId: 'proj-own' })

        await callUpdateProjectContext({ conversationId: 'conv-1', projectId: 'proj-other' })

        expect(mockSet).toHaveBeenCalled()
    })
})

async function callGetAgentConfigFor(input: Record<string, unknown>): Promise<unknown> {
    const { agentRpcHandlers } = await import('../../../../../src/app/ee/agent/agent-rpc-handlers')
    return agentRpcHandlers(noopLogger as never).getAgentConfig(input as never)
}

describe('agentRpcHandlers.getAgentConfig — a flow-step run creates its conversation on first use', () => {
    beforeEach(() => {
        mockSave.mockClear()
        mockFindOneBy.mockReset()
    })

    it('creates the row with the owner and project the job carried', async () => {
        mockFindOneBy.mockResolvedValue(null)
        mockSave.mockResolvedValue({ id: 'conv-1', source: 'FLOW_STEP', projectId: 'proj-1', messages: [] })

        await callGetAgentConfigFor({
            conversationId: 'conv-1', platformId: 'plat-1', userId: 'owner-1',
            userMessage: 'do a thing', modelName: null,
            source: 'FLOW_STEP', projectId: 'proj-1',
        }).catch(() => undefined)

        expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({
            id: 'conv-1',
            source: 'FLOW_STEP',
            projectId: 'proj-1',
            userId: 'owner-1',
        }))
    })

    it('does not create a second row when the run is retried', async () => {
        mockFindOneBy.mockResolvedValue({ id: 'conv-1', source: 'FLOW_STEP', projectId: 'proj-1', messages: [] })

        await callGetAgentConfigFor({
            conversationId: 'conv-1', platformId: 'plat-1', userId: 'owner-1',
            userMessage: 'do a thing', modelName: null,
            source: 'FLOW_STEP', projectId: 'proj-1',
        }).catch(() => undefined)

        expect(mockSave).not.toHaveBeenCalled()
    })
})

describe('agentRpcHandlers.executeAgentTool — the owner\'s own memory is not a flow-step target', () => {
    it('refuses ap_remember for a flow-step run', async () => {
        const { agentRpcHandlers } = await import('../../../../../src/app/ee/agent/agent-rpc-handlers')

        await expect(agentRpcHandlers(noopLogger as never).executeAgentTool({
            toolName: 'ap_remember',
            toolInput: { memory: 'the owner likes concise replies' },
            platformId: 'plat-1',
            userId: 'owner-1',
            conversationId: 'conv-1',
            source: 'FLOW_STEP',
        } as never)).rejects.toThrow()
    })
})

describe('agentRpcHandlers.executePieceTool — only a flow-step run may run a configured action', () => {
    async function runPieceTool(conversation: unknown) {
        mockRunFromInstruction.mockClear()
        mockFindOneBy.mockResolvedValue(conversation)
        const { agentRpcHandlers } = await import('../../../../../src/app/ee/agent/agent-rpc-handlers')
        return agentRpcHandlers(noopLogger as never).executePieceTool({
            conversationId: 'conv-1',
            toolName: 'send_email',
            instruction: 'email the summary',
            piece: { pieceName: '@activepieces/piece-gmail', pieceVersion: '0.1.0', actionName: 'send_email' },
        })
    }

    it('runs the action in the conversation\'s own project', async () => {
        await runPieceTool({ id: 'conv-1', source: 'FLOW_STEP', projectId: 'proj-1', platformId: 'plat-1' })

        expect(mockRunFromInstruction).toHaveBeenCalledTimes(1)
        const call = mockRunFromInstruction.mock.calls[0][0]
        expect(call.projectId).toBe('proj-1')
        expect(call.piece).toEqual({ pieceName: '@activepieces/piece-gmail', actionName: 'send_email', pieceVersion: '0.1.0' })
    })

    it('refuses when the conversation is a chat', async () => {
        await expect(runPieceTool({ id: 'conv-1', source: 'CHAT', projectId: 'proj-1' })).rejects.toThrow()

        expect(mockRunFromInstruction).not.toHaveBeenCalled()
    })

    it('refuses a flow-step run with no project, so the action is never run unscoped', async () => {
        await expect(runPieceTool({ id: 'conv-1', source: 'FLOW_STEP', projectId: null })).rejects.toThrow()

        expect(mockRunFromInstruction).not.toHaveBeenCalled()
    })
})

describe('agentRpcHandlers.updateFlowStepProgress — only a flow-step run may report progress', () => {

    let progressConversation = 0
    async function report(conversation: unknown) {
        mockUpdateStepProgress.mockClear()
        mockGetFlowRun.mockClear()
        mockGetFlowRun.mockResolvedValue({ id: 'run-1' })
        mockFindOne.mockResolvedValue(conversation)
        const { agentRpcHandlers } = await import('../../../../../src/app/ee/agent/agent-rpc-handlers')
        return agentRpcHandlers(noopLogger as never).updateFlowStepProgress({ conversationId: `conv-${++progressConversation}`, flowRunId: 'run-1', output: { steps: [] }, sequence: 1 })
    }

    it('emits into the project the conversation belongs to, not one the caller named', async () => {
        await report({ id: 'conv-1', source: 'FLOW_STEP', projectId: 'proj-1' })

        expect(mockUpdateStepProgress).toHaveBeenCalledTimes(1)
        expect(mockGetFlowRun).toHaveBeenCalledWith({ id: 'run-1', projectId: 'proj-1' })
    })




    it('refuses when the conversation is a chat', async () => {
        await expect(report({ id: 'conv-1', source: 'CHAT', projectId: 'proj-1' })).rejects.toThrow()

        expect(mockUpdateStepProgress).not.toHaveBeenCalled()
    })

    it('refuses a flow-step run with no project', async () => {
        await expect(report({ id: 'conv-1', source: 'FLOW_STEP', projectId: null })).rejects.toThrow()

        expect(mockUpdateStepProgress).not.toHaveBeenCalled()
    })
})

describe('agentRpcHandlers.resumeFlowStep — only a flow-step run may release a flow', () => {
    async function resume(conversation: unknown) {
        mockResumeFromWaitpoint.mockClear()
        mockGetFlowRun.mockClear()
        mockGetFlowRun.mockResolvedValue({ id: 'run-1' })
        mockFindOneBy.mockResolvedValue(conversation)
        const { agentRpcHandlers } = await import('../../../../../src/app/ee/agent/agent-rpc-handlers')
        return agentRpcHandlers(noopLogger as never).resumeFlowStep({
            conversationId: 'conv-1', flowRunId: 'run-1', waitpointId: 'wp-1', output: { success: true },
        })
    }

    it('releases the waitpoint for a flow-step run, scoped to that run\'s own project', async () => {
        await resume({ id: 'conv-1', source: 'FLOW_STEP', projectId: 'proj-1' })

        expect(mockGetFlowRun).toHaveBeenCalledWith({ id: 'run-1', projectId: 'proj-1' })
        expect(mockResumeFromWaitpoint).toHaveBeenCalledWith({
            flowRunId: 'run-1',
            waitpointId: 'wp-1',
            resumePayload: { body: { success: true }, headers: {}, queryParams: {} },
        })
    })

    it('sends an empty queryParams, so this path can never approve anything', async () => {
        await resume({ id: 'conv-1', source: 'FLOW_STEP', projectId: 'proj-1' })

        const { resumePayload } = mockResumeFromWaitpoint.mock.calls[0][0]
        expect(resumePayload.queryParams).toEqual({})
    })

    it('refuses when the conversation is a chat', async () => {
        await expect(resume({ id: 'conv-1', source: 'CHAT', projectId: 'proj-1' })).rejects.toThrow()

        expect(mockResumeFromWaitpoint).not.toHaveBeenCalled()
    })

    it('refuses when the conversation does not exist', async () => {
        await expect(resume(null)).rejects.toThrow()

        expect(mockResumeFromWaitpoint).not.toHaveBeenCalled()
    })

    it('refuses a flow-step run with no project, so the run lookup is never left unscoped', async () => {
        await expect(resume({ id: 'conv-1', source: 'FLOW_STEP', projectId: null })).rejects.toThrow()

        expect(mockGetFlowRun).not.toHaveBeenCalled()
        expect(mockResumeFromWaitpoint).not.toHaveBeenCalled()
    })
})
