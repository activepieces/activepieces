import { ApEdition, ApEnvironment, apId } from '@activepieces/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockGet, mockGetEdition } = vi.hoisted(() => ({
    mockGet: vi.fn(),
    mockGetEdition: vi.fn(),
}))

vi.mock('../../../../../src/app/helper/system/system', () => ({
    system: {
        get: (...args: unknown[]) => mockGet(...args),
        getEdition: () => mockGetEdition(),
    },
}))

import { taskAgentsRollout } from '../../../../../src/app/ee/agent/task-agents-rollout'

describe('taskAgentsRollout', () => {
    beforeEach(() => {
        mockGet.mockReturnValue('prod')
        mockGetEdition.mockReturnValue(ApEdition.CLOUD)
    })

    it('turns task agents on for about the rollout share of cloud conversations', () => {
        const conversationIds = Array.from({ length: 5000 }, () => apId())
        const onShare = conversationIds.filter((conversationId) => taskAgentsRollout.isOnForConversation({ conversationId })).length / conversationIds.length

        expect(onShare).toBeGreaterThan(taskAgentsRollout.ROLLOUT_PERCENT / 100 - 0.03)
        expect(onShare).toBeLessThan(taskAgentsRollout.ROLLOUT_PERCENT / 100 + 0.03)
    })

    it('keeps the same answer for the same conversation on every turn', () => {
        const conversationId = apId()
        const first = taskAgentsRollout.isOnForConversation({ conversationId })

        expect(Array.from({ length: 10 }, () => taskAgentsRollout.isOnForConversation({ conversationId }))).toEqual(Array(10).fill(first))
    })

    it('keeps task agents off on self-hosted editions', () => {
        const conversationIds = Array.from({ length: 500 }, () => apId())
        for (const edition of [ApEdition.COMMUNITY, ApEdition.ENTERPRISE]) {
            mockGetEdition.mockReturnValue(edition)
            expect(conversationIds.some((conversationId) => taskAgentsRollout.isOnForConversation({ conversationId }))).toBe(false)
        }
    })

    it('turns task agents on for every conversation in local development', () => {
        mockGet.mockReturnValue(ApEnvironment.DEVELOPMENT)
        mockGetEdition.mockReturnValue(ApEdition.COMMUNITY)
        const conversationIds = Array.from({ length: 500 }, () => apId())

        expect(conversationIds.every((conversationId) => taskAgentsRollout.isOnForConversation({ conversationId }))).toBe(true)
    })
})
