import { EnterpriseTrialStatus, PlanName } from '@activepieces/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockGetEdition, mockOnTrialStarted, mockOnTrialEnded, mockStoreDelete, mockPlanUpdate, mockFindPlan } = vi.hoisted(() => ({
    mockGetEdition: vi.fn().mockReturnValue('cloud'),
    mockOnTrialStarted: vi.fn().mockResolvedValue(undefined),
    mockOnTrialEnded: vi.fn().mockResolvedValue(undefined),
    mockStoreDelete: vi.fn().mockResolvedValue(undefined),
    mockPlanUpdate: vi.fn().mockResolvedValue(undefined),
    mockFindPlan: vi.fn(),
}))

vi.mock('../../../../../src/app/helper/system/system', () => ({
    system: {
        getEdition: mockGetEdition,
        get: vi.fn().mockReturnValue('console-secret'),
        getOrThrow: vi.fn().mockReturnValue('https://console.activepieces.com'),
        globalLogger: () => ({ error: vi.fn(), warn: vi.fn(), info: vi.fn() }),
    },
}))

vi.mock('../../../../../src/app/ee/platform/platform-plan/platform-plan.service', () => ({
    platformPlanService: () => ({ update: mockPlanUpdate }),
    platformPlanRepo: () => ({ findOneBy: mockFindPlan }),
    assertSeatsNotBelowActiveUsers: vi.fn(),
}))

vi.mock('../../../../../src/app/ee/platform/platform-plan/platform-plan-telemetry', () => ({
    platformPlanTelemetry: () => ({
        onEnterpriseTrialStarted: mockOnTrialStarted,
        onEnterpriseTrialEnded: mockOnTrialEnded,
        onEntitlementsRefreshed: vi.fn().mockResolvedValue(undefined),
    }),
}))

vi.mock('../../../../../src/app/database/redis-connections', () => ({
    distributedLock: () => ({
        runExclusive: async ({ fn }: { fn: () => Promise<unknown> }) => fn(),
    }),
    distributedStore: {
        get: vi.fn(),
        put: vi.fn(),
        delete: mockStoreDelete,
        runOnceWithin: async (_key: string, _ttl: number, fn: () => Promise<unknown>) => {
            await fn()
            return true
        },
    },
}))

vi.mock('../../../../../src/app/helper/domain-helper', () => ({
    domainHelper: { getPublicUrl: async () => 'https://cloud.example.com/' },
}))

vi.mock('../../../../../src/app/platform/platform.service', () => ({
    platformService: () => ({ getOneOrThrow: async () => ({ id: 'platform-1', ownerId: 'user-1' }) }),
}))

vi.mock('../../../../../src/app/user/user-service', () => ({
    userService: () => ({ getMetaInformation: async () => ({ email: 'owner@example.com' }) }),
}))

const PLATFORM_ID = 'platform-1'
const CREDS = { autumnCustomerId: 'cus_123', autumnApiKey: 'am_sk_customer' }
const ELIGIBLE: EnterpriseTrialStatus = { state: 'eligible', startedAt: null, endsAt: null, extended: false }
const ACTIVE: EnterpriseTrialStatus = { state: 'active', startedAt: '2026-10-14T09:00:00.000Z', endsAt: '2026-10-21T09:00:00.000Z', extended: false }
const log = { warn: vi.fn(), error: vi.fn(), info: vi.fn() } as never

async function loadModules() {
    const utils = await import('../../../../../src/app/ee/platform/platform-plan/billing-providers/autumn-utils')
    const billing = await import('../../../../../src/app/ee/platform/platform-plan/billing-providers/autumn-billing')
    const serverUtils = await import('@activepieces/server-utils')
    return { ...utils, ...billing, safeHttp: serverUtils.safeHttp }
}

describe('enterprise trial', () => {
    beforeEach(() => {
        vi.useRealTimers()
        vi.clearAllMocks()
        vi.resetModules()
        mockGetEdition.mockReturnValue('cloud')
    })

    describe('startEnterpriseTrial', () => {
        async function startTrial({ current, refreshError }: StartTrialParams) {
            const { autumnBillingProvider, autumnConsole, autumnUtils } = await loadModules()
            vi.spyOn(autumnUtils, 'ensureEnrolled').mockResolvedValue(undefined)
            vi.spyOn(autumnConsole, 'getCreds').mockResolvedValue(CREDS)
            vi.spyOn(autumnConsole, 'getEnterpriseTrial').mockResolvedValue(current)
            const consoleStart = vi.spyOn(autumnConsole, 'startEnterpriseTrial').mockResolvedValue(ACTIVE)
            vi.spyOn(autumnUtils, 'refreshEntitlements').mockImplementation(async () => {
                if (refreshError) {
                    throw refreshError
                }
            })
            const status = await autumnBillingProvider(log).startEnterpriseTrial(PLATFORM_ID)
            return { status, consoleStart }
        }

        it('starts an eligible trial and reports it once', async () => {
            const { status, consoleStart } = await startTrial({ current: ELIGIBLE })

            expect(status).toEqual(ACTIVE)
            expect(consoleStart).toHaveBeenCalledTimes(1)
            expect(mockOnTrialStarted).toHaveBeenCalledTimes(1)
            expect(mockOnTrialStarted).toHaveBeenCalledWith({ platformId: PLATFORM_ID, endsAt: ACTIVE.endsAt })
        })

        it('returns a running trial without starting or reporting it again', async () => {
            const { status, consoleStart } = await startTrial({ current: ACTIVE })

            expect(status).toEqual(ACTIVE)
            expect(consoleStart).not.toHaveBeenCalled()
            expect(mockOnTrialStarted).not.toHaveBeenCalled()
        })

        it('returns the started trial when the refresh after it fails, and lets the next plan read retry', async () => {
            const { status } = await startTrial({ current: ELIGIBLE, refreshError: new Error('autumn timeout') })

            expect(status).toEqual(ACTIVE)
            expect(mockStoreDelete).toHaveBeenCalledWith(`platform_plan:entitlements-refresh:${PLATFORM_ID}`)
        })
    })

    describe('console credentials', () => {
        it.each(['cloud', 'ee'] as const)('reads the %s trial with the customer key and sends no email', async (edition) => {
            const { autumnConsole, safeHttp } = await loadModules()
            const get = vi.spyOn(safeHttp.axios, 'get').mockResolvedValue({ data: { data: ELIGIBLE } })

            await autumnConsole.getEnterpriseTrial({ ...CREDS, edition })

            expect(get).toHaveBeenCalledWith(
                'https://console.activepieces.com/api/v1/billing/enterprise-trial',
                expect.objectContaining({
                    headers: { Authorization: `Bearer ${CREDS.autumnApiKey}` },
                    params: { autumnCustomerId: CREDS.autumnCustomerId, edition },
                }),
            )
        })

        it.each(['cloud', 'ee'] as const)('starts the %s trial with the customer key and sends neither the key nor an email in the body', async (edition) => {
            const { autumnConsole, safeHttp } = await loadModules()
            const post = vi.spyOn(safeHttp.axios, 'post').mockResolvedValue({ data: { data: ACTIVE } })

            await autumnConsole.startEnterpriseTrial({ ...CREDS, edition, platformId: PLATFORM_ID, appUrl: 'https://cloud.example.com/' })

            expect(post).toHaveBeenCalledWith(
                'https://console.activepieces.com/api/v1/billing/enterprise-trial/start',
                { autumnCustomerId: CREDS.autumnCustomerId, edition, platformId: PLATFORM_ID, appUrl: 'https://cloud.example.com/' },
                expect.objectContaining({ headers: { Authorization: `Bearer ${CREDS.autumnApiKey}` } }),
            )
        })
    })

    describe('refreshEntitlements', () => {
        it('reports the ended trial even when updating the caches fails afterwards', async () => {
            const { autumnUtils } = await loadModules()
            const freeOnly = {
                subscriptions: [{ planId: PlanName.FREE, status: 'active', addOn: false, trialEndsAt: null, plan: { addOn: false, items: [] } }],
                purchases: [],
                balances: {},
            }
            vi.spyOn(autumnUtils, 'resolveClientForPlatform').mockResolvedValue({ getCustomer: async () => freeOnly } as never)
            vi.spyOn(autumnUtils, 'writeCustomerStateCaches').mockRejectedValue(new Error('redis down'))
            mockFindPlan.mockResolvedValue({ plan: PlanName.FREE, enterpriseTrialEndsAt: '2026-10-13T16:51:01.835Z' })

            await expect(autumnUtils.refreshEntitlements(log, PLATFORM_ID)).rejects.toThrow('redis down')

            expect(mockPlanUpdate).toHaveBeenCalled()
            expect(mockOnTrialEnded).toHaveBeenCalledWith({
                platformId: PLATFORM_ID,
                trialEndsAt: '2026-10-13T16:51:01.835Z',
                endedAt: '2026-10-13T16:51:01.835Z',
            })
        })

        it('reports an early-ended trial as ending when the refresh noticed it', async () => {
            vi.useFakeTimers({ now: new Date('2026-10-17T17:20:40.000Z'), toFake: ['Date'] })
            const { autumnUtils } = await loadModules()
            const freeOnly = {
                subscriptions: [{ planId: PlanName.FREE, status: 'active', addOn: false, trialEndsAt: null, plan: { addOn: false, items: [] } }],
                purchases: [],
                balances: {},
            }
            vi.spyOn(autumnUtils, 'resolveClientForPlatform').mockResolvedValue({ getCustomer: async () => freeOnly } as never)
            vi.spyOn(autumnUtils, 'writeCustomerStateCaches').mockResolvedValue(undefined)
            vi.spyOn(autumnUtils, 'invalidateBillingOverview').mockResolvedValue(undefined)
            vi.spyOn(autumnUtils, 'provisionLicenseKeyIfPaid').mockResolvedValue(undefined)
            mockFindPlan.mockResolvedValue({ plan: PlanName.FREE, enterpriseTrialEndsAt: '2026-10-24T17:15:30.022Z' })

            await autumnUtils.refreshEntitlements(log, PLATFORM_ID)

            expect(mockOnTrialEnded).toHaveBeenCalledWith({
                platformId: PLATFORM_ID,
                trialEndsAt: '2026-10-24T17:15:30.022Z',
                endedAt: '2026-10-17T17:20:40.000Z',
            })
        })
    })
})

type StartTrialParams = {
    current: EnterpriseTrialStatus
    refreshError?: Error
}
