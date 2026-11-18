import { FastifyBaseLogger } from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { autumnBillingProvider } from '../../../../../src/app/ee/platform/platform-plan/billing-providers/autumn-billing'

const mockGetCustomer = vi.fn()

vi.mock('../../../../../src/app/ee/platform/platform-plan/billing-providers/autumn-utils', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../../../../../src/app/ee/platform/platform-plan/billing-providers/autumn-utils')>()
    return {
        ...actual,
        autumnUtils: { ...actual.autumnUtils, resolveClientForPlatform: async () => ({ getCustomer: mockGetCustomer }) },
    }
})

vi.mock('../../../../../src/app/database/redis-connections', async (importOriginal) => ({
    ...await importOriginal<typeof import('../../../../../src/app/database/redis-connections')>(),
    distributedStore: {
        get: async () => null,
        put: async () => undefined,
    },
    distributedLock: () => ({
        runExclusive: <T>({ fn }: { fn: () => Promise<T> }): Promise<T> => fn(),
    }),
}))

vi.mock('../../../../../src/app/ee/platform/platform-plan/platform-plan.service', () => ({
    platformPlanService: () => ({}),
    assertSeatsNotBelowActiveUsers: vi.fn(),
}))

const log = { warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() } satisfies Partial<FastifyBaseLogger>

beforeEach(() => {
    mockGetCustomer.mockReset()
})

describe('billing overview invite rewards', () => {
    it('reads the plan\'s reward slots, counting used slots as earned', async () => {
        mockGetCustomer.mockResolvedValue(customer({ rewarded_invites_count: { granted: 4, usage: 1 } }))

        expect((await overview()).inviteRewards).toEqual({ maxRewards: 4, rewardsEarned: 1, creditsPerInvite: 1000 })
    })

    it('never counts more earned rewards than the plan grants', async () => {
        mockGetCustomer.mockResolvedValue(customer({ rewarded_invites_count: { granted: 4, usage: 6 } }))

        expect((await overview()).inviteRewards).toEqual({ maxRewards: 4, rewardsEarned: 4, creditsPerInvite: 1000 })
    })

    it('has no invite rewards when the plan carries no reward slots', async () => {
        mockGetCustomer.mockResolvedValue(customer({}))

        expect((await overview()).inviteRewards).toBeNull()
    })
})

function overview() {
    return autumnBillingProvider(log).getBillingOverview('platform-1')
}

function customer(balances: Record<string, { granted: number, usage: number }>) {
    return { balances, subscriptions: [], purchases: [], flags: {} }
}
