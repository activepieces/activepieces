import { FREE_LEGACY_CUTOFF_ISO } from '@activepieces/shared'
import dayjs from 'dayjs'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockGetAutumnCredentials, mockSetAutumnCredentials, mockGetOrCreateForPlatform, mockCompFreeLegacy, mockEnrollFree, mockActivate, mockRefreshEntitlements, mockGetEdition } = vi.hoisted(() => ({
    mockGetAutumnCredentials: vi.fn(),
    mockSetAutumnCredentials: vi.fn().mockResolvedValue(undefined),
    mockGetOrCreateForPlatform: vi.fn(),
    mockCompFreeLegacy: vi.fn().mockResolvedValue(undefined),
    mockEnrollFree: vi.fn(),
    mockActivate: vi.fn(),
    mockRefreshEntitlements: vi.fn().mockResolvedValue(undefined),
    mockGetEdition: vi.fn().mockReturnValue('cloud'),
}))

vi.mock('../../../../../src/app/helper/system/system', () => ({
    system: {
        getEdition: mockGetEdition,
        get: vi.fn().mockReturnValue('secret'),
        getOrThrow: vi.fn().mockReturnValue('https://console.activepieces.com'),
        globalLogger: () => ({ error: vi.fn(), warn: vi.fn(), info: vi.fn() }),
    },
}))

vi.mock('../../../../../src/app/ee/platform/platform-plan/platform-plan.service', () => ({
    platformPlanService: () => ({
        getAutumnCredentials: mockGetAutumnCredentials,
        setAutumnCredentials: mockSetAutumnCredentials,
        getOrCreateForPlatform: mockGetOrCreateForPlatform,
    }),
}))

vi.mock('../../../../../src/app/database/redis-connections', () => ({
    distributedLock: () => ({
        runExclusive: async ({ fn }: { fn: () => Promise<unknown> }) => fn(),
    }),
    distributedStore: {
        get: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        runOnceWithin: async (_key: string, _ttl: number, fn: () => Promise<unknown>) => {
            await fn()
            return true
        },
    },
}))

vi.mock('../../../../../src/app/platform/platform.service', () => ({
    platformService: () => ({ getOneOrThrow: async () => ({ id: 'platform-1', ownerId: 'user-1' }) }),
}))

vi.mock('../../../../../src/app/user/user-service', () => ({
    userService: () => ({ getMetaInformation: async () => ({ email: 'owner@example.com' }) }),
}))

const PLATFORM_ID = 'platform-1'
const CUSTOMER_ID = 'cus_123'

const BEFORE_CUTOFF = dayjs(FREE_LEGACY_CUTOFF_ISO).subtract(1, 'day').toISOString()
const AT_CUTOFF = FREE_LEGACY_CUTOFF_ISO
const AFTER_CUTOFF = dayjs(FREE_LEGACY_CUTOFF_ISO).add(1, 'day').toISOString()

const credentials = (params: { autumnCustomerId?: string | null, plan: string | null, created: string }) => ({
    autumnCustomerId: params.autumnCustomerId === undefined ? CUSTOMER_ID : params.autumnCustomerId,
    autumnApiKey: 'am_sk_test',
    plan: params.plan,
    created: params.created,
})

describe('free legacy comp', () => {
    beforeEach(async () => {
        vi.clearAllMocks()
        vi.resetModules()
        mockGetEdition.mockReturnValue('cloud')
        mockEnrollFree.mockResolvedValue({ autumnCustomerId: CUSTOMER_ID, autumnApiKey: 'am_sk_test' })
        mockRefreshEntitlements.mockResolvedValue(undefined)
        const { autumnConsole, autumnUtils } = await import('../../../../../src/app/ee/platform/platform-plan/billing-providers/autumn-utils')
        vi.spyOn(autumnConsole, 'compFreeLegacy').mockImplementation(mockCompFreeLegacy)
        vi.spyOn(autumnConsole, 'enrollFree').mockImplementation(mockEnrollFree)
        vi.spyOn(autumnConsole, 'activate').mockImplementation(mockActivate)
        vi.spyOn(autumnUtils, 'refreshEntitlements').mockImplementation(mockRefreshEntitlements)
    })

    const ensureEnrolled = async () => {
        const { autumnUtils } = await import('../../../../../src/app/ee/platform/platform-plan/billing-providers/autumn-utils')
        const log = { warn: vi.fn(), error: vi.fn(), info: vi.fn() }
        await autumnUtils.ensureEnrolled(log as never, PLATFORM_ID)
    }

    it('comps an enrolled free platform created before the cutoff', async () => {
        mockGetAutumnCredentials.mockResolvedValue(credentials({ plan: 'free', created: BEFORE_CUTOFF }))

        await ensureEnrolled()

        expect(mockCompFreeLegacy).toHaveBeenCalledWith({ autumnCustomerId: CUSTOMER_ID })
        expect(mockRefreshEntitlements).toHaveBeenCalled()
    })

    it('comps a dormant platform still carrying the pre-Autumn standard plan name, after enrolling it', async () => {
        mockGetAutumnCredentials
            .mockResolvedValueOnce(credentials({ autumnCustomerId: null, plan: 'standard', created: BEFORE_CUTOFF }))
            .mockResolvedValueOnce(credentials({ autumnCustomerId: null, plan: 'standard', created: BEFORE_CUTOFF }))
            .mockResolvedValue(credentials({ plan: 'free', created: BEFORE_CUTOFF }))
        mockGetOrCreateForPlatform.mockResolvedValue({ licenseKey: null })

        await ensureEnrolled()

        expect(mockEnrollFree).toHaveBeenCalled()
        expect(mockCompFreeLegacy).toHaveBeenCalledWith({ autumnCustomerId: CUSTOMER_ID })
    })

    it('does not comp a platform created after the cutoff', async () => {
        mockGetAutumnCredentials.mockResolvedValue(credentials({ plan: 'free', created: AFTER_CUTOFF }))

        await ensureEnrolled()

        expect(mockCompFreeLegacy).not.toHaveBeenCalled()
    })

    it('does not comp a platform created exactly at the cutoff', async () => {
        mockGetAutumnCredentials.mockResolvedValue(credentials({ plan: 'free', created: AT_CUTOFF }))

        await ensureEnrolled()

        expect(mockCompFreeLegacy).not.toHaveBeenCalled()
    })

    it('does not comp a paid platform created before the cutoff', async () => {
        mockGetAutumnCredentials.mockResolvedValue(credentials({ plan: 'plus', created: BEFORE_CUTOFF }))

        await ensureEnrolled()

        expect(mockCompFreeLegacy).not.toHaveBeenCalled()
    })

    it('does not comp again once the projection reads free_legacy', async () => {
        mockGetAutumnCredentials.mockResolvedValue(credentials({ plan: 'free_legacy', created: BEFORE_CUTOFF }))

        await ensureEnrolled()

        expect(mockCompFreeLegacy).not.toHaveBeenCalled()
    })

    it('does not comp on self-hosted enterprise', async () => {
        mockGetEdition.mockReturnValue('ee')
        vi.resetModules()
        mockGetAutumnCredentials.mockResolvedValue(credentials({ plan: 'free', created: BEFORE_CUTOFF }))

        const { autumnConsole, autumnUtils } = await import('../../../../../src/app/ee/platform/platform-plan/billing-providers/autumn-utils')
        vi.spyOn(autumnConsole, 'compFreeLegacy').mockImplementation(mockCompFreeLegacy)
        vi.spyOn(autumnUtils, 'refreshEntitlements').mockImplementation(mockRefreshEntitlements)
        const log = { warn: vi.fn(), error: vi.fn(), info: vi.fn() }
        await autumnUtils.ensureEnrolled(log as never, PLATFORM_ID)

        expect(mockCompFreeLegacy).not.toHaveBeenCalled()
    })

    it('comps from a credit track alone, with no plan read and nobody logged in', async () => {
        mockGetAutumnCredentials.mockResolvedValue(credentials({ plan: 'free', created: BEFORE_CUTOFF }))

        const { autumnUtils } = await import('../../../../../src/app/ee/platform/platform-plan/billing-providers/autumn-utils')
        const log = { warn: vi.fn(), error: vi.fn(), info: vi.fn() }
        await autumnUtils.loadAutumnCreds(log as never, PLATFORM_ID)
        await new Promise((resolve) => setImmediate(resolve))

        expect(mockCompFreeLegacy).toHaveBeenCalledWith({ autumnCustomerId: CUSTOMER_ID })
    })

    it('does not comp from a credit track when the platform is ineligible', async () => {
        mockGetAutumnCredentials.mockResolvedValue(credentials({ plan: 'plus', created: BEFORE_CUTOFF }))

        const { autumnUtils } = await import('../../../../../src/app/ee/platform/platform-plan/billing-providers/autumn-utils')
        const log = { warn: vi.fn(), error: vi.fn(), info: vi.fn() }
        await autumnUtils.loadAutumnCreds(log as never, PLATFORM_ID)
        await new Promise((resolve) => setImmediate(resolve))

        expect(mockCompFreeLegacy).not.toHaveBeenCalled()
    })

    it('leaves the projection untouched when the console call fails', async () => {
        mockGetAutumnCredentials.mockResolvedValue(credentials({ plan: 'free', created: BEFORE_CUTOFF }))
        mockCompFreeLegacy.mockRejectedValueOnce(new Error('console down'))

        await ensureEnrolled()

        expect(mockRefreshEntitlements).not.toHaveBeenCalled()
    })
})
