import { ApEdition } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { autumnBillingProvider } from '../../../../../src/app/ee/platform/platform-plan/billing-providers/autumn-billing'

const mockGetCustomer = vi.fn()
const edition = vi.hoisted(() => ({ current: 'CLOUD' }))

vi.mock('../../../../../src/app/helper/system/system', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../../../../../src/app/helper/system/system')>()
    return { ...actual, system: { ...actual.system, getEdition: () => edition.current } }
})

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
    edition.current = ApEdition.CLOUD
})

describe('billing overview invite rewards', () => {
    it('reads the rewarded invites used from the balance', async () => {
        mockGetCustomer.mockResolvedValue(customer({ rewarded_invites_count: { granted: 4, usage: 1 } }))

        expect((await overview()).inviteRewards).toEqual({ maxRewards: 4, rewardsEarned: 1, creditsPerInvite: 1000 })
    })

    it('never counts past the plan', async () => {
        mockGetCustomer.mockResolvedValue(customer({ rewarded_invites_count: { granted: 4, usage: 6 } }))

        expect((await overview()).inviteRewards).toEqual({ maxRewards: 4, rewardsEarned: 4, creditsPerInvite: 1000 })
    })

    it('has no invite rewards outside Cloud, even on a plan with rewarded invites', async () => {
        edition.current = ApEdition.ENTERPRISE
        mockGetCustomer.mockResolvedValue(customer({ rewarded_invites_count: { granted: 4, usage: 1 } }))

        expect((await overview()).inviteRewards).toBeNull()
    })

    it('has no invite rewards when the plan carries no rewarded invites', async () => {
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
