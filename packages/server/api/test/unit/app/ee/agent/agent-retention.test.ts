import { describe, expect, it, vi } from 'vitest'

const { mockProjectFind, mockConversationDelete, mockWhere } = vi.hoisted(() => ({
    mockProjectFind: vi.fn().mockResolvedValue([]),
    mockConversationDelete: vi.fn().mockResolvedValue({ affected: 0 }),
    mockWhere: vi.fn(),
}))

function conversationQueryBuilder() {
    const builder: Record<string, unknown> = {}
    for (const method of ['select', 'where', 'andWhere', 'limit', 'delete']) {
        builder[method] = (...args: unknown[]) => {
            if (method === 'where' || method === 'andWhere') {
                mockWhere(args[0], args[1])
            }
            return builder
        }
    }
    builder.getQuery = () => 'SELECT id FROM stale'
    builder.getParameters = () => ({})
    builder.execute = () => mockConversationDelete()
    return builder
}

vi.mock('../../../../../src/app/core/db/repo-factory', () => ({
    repoFactory: (entity: { options?: { name?: string } }) => () => (
        entity?.options?.name === 'project'
            ? { find: mockProjectFind }
            : { createQueryBuilder: () => conversationQueryBuilder() }
    ),
}))

const { agentRetention } = await import('../../../../../src/app/ee/agent/agent-retention')

const log = { info: vi.fn(), warn: vi.fn(), error: vi.fn() } as never

describe('agentRetention.deleteStaleFlowStepConversations', () => {
    it('only ever sweeps flow-step conversations, so a chat is never deleted', async () => {
        mockWhere.mockClear()
        mockProjectFind.mockResolvedValue([])

        await agentRetention(log).deleteStaleFlowStepConversations()

        const sourceFilters = mockWhere.mock.calls.filter(([sql]) => String(sql).includes('conversation.source'))
        expect(sourceFilters.length).toBeGreaterThan(0)
        for (const [, params] of sourceFilters) {
            expect(params.source).toBe('FLOW_STEP')
        }
    })

    it('bounds each pass so a backlog drains across runs instead of one statement', async () => {
        mockWhere.mockClear()
        mockProjectFind.mockResolvedValue([])

        await agentRetention(log).deleteStaleFlowStepConversations()

        expect(mockConversationDelete).toHaveBeenCalled()
    })

    it('sweeps the default boundary once when no project shortened its retention', async () => {
        mockConversationDelete.mockClear()
        mockProjectFind.mockResolvedValue([])

        await agentRetention(log).deleteStaleFlowStepConversations()

        expect(mockConversationDelete).toHaveBeenCalledTimes(1)
    })
})
