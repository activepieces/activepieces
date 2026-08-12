import { describe, expect, it, vi } from 'vitest'

const { mockProjectFind, mockConversationFind, mockConversationDelete } = vi.hoisted(() => ({
    mockProjectFind: vi.fn().mockResolvedValue([]),
    mockConversationFind: vi.fn().mockResolvedValue([]),
    mockConversationDelete: vi.fn().mockResolvedValue({ affected: 0 }),
}))

vi.mock('../../../../../src/app/core/db/repo-factory', () => ({
    repoFactory: (entity: { options?: { name?: string } }) => () => (
        entity?.options?.name === 'project'
            ? { find: mockProjectFind }
            : { find: mockConversationFind, delete: mockConversationDelete }
    ),
}))

const { agentRetention } = await import('../../../../../src/app/ee/agent/agent-retention')

const log = { info: vi.fn(), warn: vi.fn(), error: vi.fn() } as never

describe('agentRetention.deleteStaleFlowStepConversations', () => {
    it('only ever deletes flow-step conversations, so a chat is never swept', async () => {
        mockProjectFind.mockResolvedValue([])
        mockConversationFind.mockResolvedValue([])

        await agentRetention(log).deleteStaleFlowStepConversations()

        for (const call of mockConversationFind.mock.calls) {
            expect(call[0].where.source).toBe('FLOW_STEP')
        }
        expect(mockConversationFind).toHaveBeenCalled()
    })

    it('sweeps a project with a shorter retention on its own boundary, not the default', async () => {
        mockProjectFind.mockResolvedValue([{ id: 'proj-short', executionDataRetentionDays: 1 }])
        mockConversationFind.mockResolvedValue([])

        await agentRetention(log).deleteStaleFlowStepConversations()

        const scoped = mockConversationFind.mock.calls.filter((call) => call[0].where.projectId !== undefined)
        expect(scoped.length).toBeGreaterThan(0)
    })

    it('deletes what it finds and reports the count', async () => {
        mockProjectFind.mockResolvedValue([])
        mockConversationFind.mockResolvedValueOnce([{ id: 'conv-1' }, { id: 'conv-2' }]).mockResolvedValue([])
        mockConversationDelete.mockResolvedValue({ affected: 2 })

        await agentRetention(log).deleteStaleFlowStepConversations()

        expect(mockConversationDelete).toHaveBeenCalledWith({ id: expect.anything() })
    })
})
