import { describe, expect, it, vi } from 'vitest'

const { mockProjectFind, mockConversationDelete } = vi.hoisted(() => ({
    mockProjectFind: vi.fn().mockResolvedValue([]),
    mockConversationDelete: vi.fn().mockResolvedValue({ affected: 0 }),
}))

vi.mock('../../../../../src/app/core/db/repo-factory', () => ({
    repoFactory: (entity: { options?: { name?: string } }) => () => (
        entity?.options?.name === 'project'
            ? { find: mockProjectFind }
            : { delete: mockConversationDelete }
    ),
}))

const { agentRetention } = await import('../../../../../src/app/ee/agent/agent-retention')

const log = { info: vi.fn(), warn: vi.fn(), error: vi.fn() } as never

describe('agentRetention.deleteStaleFlowStepConversations', () => {
    it('only ever deletes flow-step conversations, so a chat is never swept', async () => {
        mockProjectFind.mockResolvedValue([{ id: 'proj-short', executionDataRetentionDays: 1 }])

        await agentRetention(log).deleteStaleFlowStepConversations()

        expect(mockConversationDelete).toHaveBeenCalled()
        for (const [criteria] of mockConversationDelete.mock.calls) {
            expect(criteria.source).toBe('FLOW_STEP')
        }
    })

    it('does not sweep a project twice when its retention clamps back to the default', async () => {
        mockConversationDelete.mockClear()
        mockProjectFind.mockResolvedValue([{ id: 'proj-same', executionDataRetentionDays: 1 }])

        await agentRetention(log).deleteStaleFlowStepConversations()

        const scoped = mockConversationDelete.mock.calls.filter(([criteria]) => criteria.projectId !== undefined)
        expect(scoped.length + 1).toBe(mockConversationDelete.mock.calls.length)
    })

    it('sweeps only the default boundary when no project shortened its retention', async () => {
        mockConversationDelete.mockClear()
        mockProjectFind.mockResolvedValue([])

        await agentRetention(log).deleteStaleFlowStepConversations()

        expect(mockConversationDelete).toHaveBeenCalledTimes(1)
        expect(mockConversationDelete.mock.calls[0][0].projectId).toBeUndefined()
    })
})
