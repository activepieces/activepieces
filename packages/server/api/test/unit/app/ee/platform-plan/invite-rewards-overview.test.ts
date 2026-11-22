import { ApEdition } from '@activepieces/shared'
import Fastify from 'fastify'
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

const log = Fastify({ logger: false }).log

beforeEach(() => {
    mockGetCustomer.mockReset()
    edition.current = ApEdition.CLOUD
})

describe('billing overview rewarded invites left', () => {
    it('reads the rewarded invites left from the balance', async () => {
        mockGetCustomer.mockResolvedValue(customer({ rewarded_invites_count: { granted: 4, usage: 1 } }))

        expect((await overview()).rewardedInvitesLeft).toBe(3)
    })

    it('never goes below zero', async () => {
        mockGetCustomer.mockResolvedValue(customer({ rewarded_invites_count: { granted: 4, usage: 6 } }))

        expect((await overview()).rewardedInvitesLeft).toBe(0)
    })

    it('is null outside Cloud, even on a plan with rewarded invites', async () => {
        edition.current = ApEdition.ENTERPRISE
        mockGetCustomer.mockResolvedValue(customer({ rewarded_invites_count: { granted: 4, usage: 1 } }))

        expect((await overview()).rewardedInvitesLeft).toBeNull()
    })

    it('is null when the plan carries no rewarded invites', async () => {
        mockGetCustomer.mockResolvedValue(customer({}))

        expect((await overview()).rewardedInvitesLeft).toBeNull()
    })
})

function overview() {
    return autumnBillingProvider(log).getBillingOverview('platform-1')
}

function customer(balances: Record<string, { granted: number, usage: number }>) {
    return { balances, subscriptions: [], purchases: [], flags: {} }
}
