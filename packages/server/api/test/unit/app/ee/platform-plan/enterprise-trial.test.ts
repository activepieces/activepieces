import { ApEdition, EnterpriseTrialStatus, PlanName } from '@activepieces/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockGetEdition, mockOnTrialStarted, mockOnTrialEnded, mockStoreDelete, mockPlanUpdate, mockFindPlan, mockGetPlan, mockLogError } = vi.hoisted(() => ({
    mockGetEdition: vi.fn().mockReturnValue('cloud'),
    mockOnTrialStarted: vi.fn().mockResolvedValue(undefined),
    mockOnTrialEnded: vi.fn().mockResolvedValue(undefined),
    mockStoreDelete: vi.fn().mockResolvedValue(undefined),
    mockPlanUpdate: vi.fn().mockResolvedValue(undefined),
    mockFindPlan: vi.fn(),
    mockGetPlan: vi.fn(),
    mockLogError: vi.fn(),
}))

vi.mock('../../../../../src/app/helper/system/system', () => ({
    system: {
        getEdition: mockGetEdition,
        get: vi.fn().mockReturnValue('console-secret'),
        getOrThrow: vi.fn().mockReturnValue('https://console.activepieces.com'),
        globalLogger: () => ({ error: mockLogError, warn: vi.fn(), info: vi.fn() }),
    },
}))

vi.mock('../../../../../src/app/ee/platform/platform-plan/platform-plan.service', () => ({
    platformPlanService: () => ({ update: mockPlanUpdate, getOrCreateForPlatform: mockGetPlan }),
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

vi.mock('../../../../../src/app/platform/platform.service', () => ({
    platformService: () => ({ getOneOrThrow: async () => ({ id: 'platform-1', ownerId: 'user-1' }) }),
}))

vi.mock('../../../../../src/app/user/user-service', () => ({
    userService: () => ({ getMetaInformation: async () => ({ email: 'owner@example.com' }) }),
}))

const PLATFORM_ID = 'platform-1'
const CREDS = { autumnCustomerId: 'cus_123', autumnApiKey: 'am_sk_customer' }
const STARTED = { startedAt: '2026-10-14T09:00:00.000Z', endsAt: '2026-10-21T09:00:00.000Z' }
const ACTIVE: EnterpriseTrialStatus = { state: 'active', ...STARTED, extended: false }
const USED: EnterpriseTrialStatus = { state: 'used', startedAt: null, endsAt: null, extended: false }
const NO_TRIAL_PLAN = { enterpriseTrialStartedAt: null, enterpriseTrialEndsAt: null, enterpriseTrialEndedAt: null, enterpriseTrialUsedElsewhereAt: null }
const log = { warn: vi.fn(), error: vi.fn(), info: vi.fn() } as never

async function loadModules() {
    const utils = await import('../../../../../src/app/ee/platform/platform-plan/billing-providers/autumn-utils')
    const billing = await import('../../../../../src/app/ee/platform/platform-plan/billing-providers/autumn-billing')
    const serverUtils = await import('@activepieces/server-utils')
    return { ...utils, ...billing, safeHttp: serverUtils.safeHttp }
}

async function enrolledProvider() {
    const modules = await loadModules()
    vi.spyOn(modules.autumnUtils, 'ensureEnrolled').mockResolvedValue(undefined)
    vi.spyOn(modules.autumnConsole, 'getCreds').mockResolvedValue(CREDS)
    return modules
}

describe('enterprise trial', () => {
    beforeEach(() => {
        vi.useRealTimers()
        vi.clearAllMocks()
        vi.resetModules()
        mockGetEdition.mockReturnValue('cloud')
    })

    describe('getEnterpriseTrial', () => {
        it.each([
            { name: 'no trial yet', plan: {}, expected: { state: 'eligible', startedAt: null, endsAt: null } },
            { name: 'a running trial', plan: { enterpriseTrialStartedAt: '2026-10-14T09:00:00.000Z', enterpriseTrialEndsAt: '2099-01-01T00:00:00.000Z' }, expected: { state: 'active', startedAt: '2026-10-14T09:00:00.000Z', endsAt: '2099-01-01T00:00:00.000Z' } },
            { name: 'a trial past its end that the plan still shows', plan: { enterpriseTrialStartedAt: '2026-10-01T09:00:00.000Z', enterpriseTrialEndsAt: '2026-10-08T09:00:00.000Z' }, expected: { state: 'ended', startedAt: '2026-10-01T09:00:00.000Z', endsAt: '2026-10-08T09:00:00.000Z' } },
            { name: 'a trial that ended here', plan: { enterpriseTrialEndedAt: '2026-10-08T09:00:00.000Z', enterpriseTrialUsedElsewhereAt: '2026-10-09T09:00:00.000Z' }, expected: { state: 'ended', startedAt: null, endsAt: '2026-10-08T09:00:00.000Z' } },
            { name: 'a trial used on another platform', plan: { enterpriseTrialUsedElsewhereAt: '2026-10-09T09:00:00.000Z' }, expected: { state: 'used', startedAt: null, endsAt: null } },
        ])('reads $name from the platform plan', async ({ plan, expected }) => {
            const { autumnBillingProvider } = await enrolledProvider()
            mockGetPlan.mockResolvedValue({ ...NO_TRIAL_PLAN, ...plan })

            const status = await autumnBillingProvider(log).getEnterpriseTrial(PLATFORM_ID)

            expect(status).toEqual({ ...expected, extended: false })
        })
    })

    describe('startEnterpriseTrial', () => {
        async function startTrial({ plan, started, refreshError }: StartTrialParams) {
            const { autumnBillingProvider, autumnConsole, autumnUtils } = await enrolledProvider()
            mockGetPlan.mockResolvedValue({ ...NO_TRIAL_PLAN, ...plan })
            const consoleStart = vi.spyOn(autumnConsole, 'startEnterpriseTrial').mockResolvedValue(started === undefined ? STARTED : started)
            vi.spyOn(autumnUtils, 'refreshEntitlements').mockImplementation(async () => {
                if (refreshError) {
                    throw refreshError
                }
            })
            const status = await autumnBillingProvider(log).startEnterpriseTrial(PLATFORM_ID)
            return { status, consoleStart }
        }

        it('starts an eligible trial and reports it once', async () => {
            const { status, consoleStart } = await startTrial({ plan: {} })

            expect(status).toEqual(ACTIVE)
            expect(consoleStart).toHaveBeenCalledWith(CREDS)
            expect(mockPlanUpdate).toHaveBeenCalledWith({ platformId: PLATFORM_ID, enterpriseTrialStartedAt: STARTED.startedAt, enterpriseTrialEndsAt: STARTED.endsAt })
            expect(mockOnTrialStarted).toHaveBeenCalledTimes(1)
            expect(mockOnTrialStarted).toHaveBeenCalledWith({ platformId: PLATFORM_ID, endsAt: ACTIVE.endsAt })
        })

        it('returns a running trial without starting or reporting it again', async () => {
            const { status, consoleStart } = await startTrial({ plan: { enterpriseTrialStartedAt: STARTED.startedAt, enterpriseTrialEndsAt: '2099-01-01T00:00:00.000Z' } })

            expect(status.state).toBe('active')
            expect(consoleStart).not.toHaveBeenCalled()
            expect(mockOnTrialStarted).not.toHaveBeenCalled()
        })

        it('never asks the console again once the trial ended here', async () => {
            const { status, consoleStart } = await startTrial({ plan: { enterpriseTrialEndedAt: '2026-10-08T09:00:00.000Z' } })

            expect(status.state).toBe('ended')
            expect(consoleStart).not.toHaveBeenCalled()
        })

        it('remembers a start the console refuses, as a trial used elsewhere', async () => {
            const { status } = await startTrial({ plan: {}, started: null })

            expect(status).toEqual(USED)
            expect(mockPlanUpdate).toHaveBeenCalledWith({ platformId: PLATFORM_ID, enterpriseTrialUsedElsewhereAt: expect.any(String) })
            expect(mockOnTrialStarted).not.toHaveBeenCalled()
        })

        it('returns the started trial when the refresh after it fails, and lets the next plan read retry', async () => {
            const { status } = await startTrial({ plan: {}, refreshError: new Error('autumn timeout') })

            expect(status).toEqual(ACTIVE)
            expect(mockStoreDelete).toHaveBeenCalledWith(`platform_plan:entitlements-refresh:${PLATFORM_ID}`)
        })
    })

    describe('console credentials', () => {
        it.each([
            { edition: ApEdition.CLOUD, token: 'console-secret' },
            { edition: ApEdition.ENTERPRISE, token: CREDS.autumnApiKey },
        ])('starts the trial on $edition with the $edition credential and sends only the customer id', async ({ edition, token }) => {
            mockGetEdition.mockReturnValue(edition)
            const { autumnConsole, safeHttp } = await loadModules()
            const post = vi.spyOn(safeHttp.axios, 'post').mockResolvedValue({ data: { data: STARTED } })

            const started = await autumnConsole.startEnterpriseTrial(CREDS)

            expect(started).toEqual(STARTED)
            expect(post).toHaveBeenCalledWith(
                'https://console.activepieces.com/api/v1/billing/enterprise-trial',
                { autumnCustomerId: CREDS.autumnCustomerId },
                expect.objectContaining({ headers: { Authorization: `Bearer ${token}` } }),
            )
        })

        it('reads a 409 from the console as a trial this owner already used', async () => {
            const { autumnConsole, safeHttp } = await loadModules()
            vi.spyOn(safeHttp.axios, 'post').mockRejectedValue(Object.assign(new Error('Request failed with status code 409'), { isAxiosError: true, response: { status: 409 } }))

            await expect(autumnConsole.startEnterpriseTrial(CREDS)).resolves.toBeNull()
            expect(mockLogError).not.toHaveBeenCalled()
        })

        it('still fails on any other console error', async () => {
            const { autumnConsole, safeHttp } = await loadModules()
            vi.spyOn(safeHttp.axios, 'post').mockRejectedValue(Object.assign(new Error('Request failed with status code 500'), { isAxiosError: true, response: { status: 500 } }))

            await expect(autumnConsole.startEnterpriseTrial(CREDS)).rejects.toThrow('500')
            expect(mockLogError).toHaveBeenCalledOnce()
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

            expect(mockPlanUpdate).toHaveBeenCalledWith(expect.objectContaining({ enterpriseTrialEndedAt: '2026-10-13T16:51:01.835Z' }))
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

            expect(mockPlanUpdate).toHaveBeenCalledWith(expect.objectContaining({ enterpriseTrialEndedAt: '2026-10-17T17:20:40.000Z' }))
            expect(mockOnTrialEnded).toHaveBeenCalledWith({
                platformId: PLATFORM_ID,
                trialEndsAt: '2026-10-24T17:15:30.022Z',
                endedAt: '2026-10-17T17:20:40.000Z',
            })
        })

        it('never ends a trial that a start saved while the refresh was reading Autumn', async () => {
            const { autumnUtils } = await loadModules()
            const freeOnly = {
                subscriptions: [{ planId: PlanName.FREE, status: 'active', addOn: false, trialEndsAt: null, plan: { addOn: false, items: [] } }],
                purchases: [],
                balances: {},
            }
            const reads: string[] = []
            vi.spyOn(autumnUtils, 'resolveClientForPlatform').mockResolvedValue({
                getCustomer: async () => {
                    reads.push('autumn')
                    return freeOnly
                },
            } as never)
            vi.spyOn(autumnUtils, 'writeCustomerStateCaches').mockResolvedValue({ credits: null, appSumo: null })
            vi.spyOn(autumnUtils, 'invalidateBillingOverview').mockResolvedValue(undefined)
            vi.spyOn(autumnUtils, 'provisionLicenseKeyIfPaid').mockResolvedValue(undefined)
            mockFindPlan.mockImplementation(async () => {
                reads.push('plan')
                return reads.includes('autumn')
                    ? { plan: PlanName.FREE, enterpriseTrialStartedAt: '2099-01-01T00:00:00.000Z', enterpriseTrialEndsAt: '2099-01-08T00:00:00.000Z' }
                    : { plan: PlanName.FREE, enterpriseTrialEndsAt: null }
            })

            await autumnUtils.refreshEntitlements(log, PLATFORM_ID)

            expect(reads).toEqual(['plan', 'autumn'])
            expect(mockOnTrialEnded).not.toHaveBeenCalled()
            expect(mockPlanUpdate).toHaveBeenCalledWith(expect.not.objectContaining({ enterpriseTrialEndedAt: expect.anything() }))
        })

        it('leaves the ended mark alone while no trial has ended', async () => {
            const { autumnUtils } = await loadModules()
            const freeOnly = {
                subscriptions: [{ planId: PlanName.FREE, status: 'active', addOn: false, trialEndsAt: null, plan: { addOn: false, items: [] } }],
                purchases: [],
                balances: {},
            }
            vi.spyOn(autumnUtils, 'resolveClientForPlatform').mockResolvedValue({ getCustomer: async () => freeOnly } as never)
            vi.spyOn(autumnUtils, 'writeCustomerStateCaches').mockResolvedValue({ credits: null, appSumo: null })
            vi.spyOn(autumnUtils, 'invalidateBillingOverview').mockResolvedValue(undefined)
            vi.spyOn(autumnUtils, 'provisionLicenseKeyIfPaid').mockResolvedValue(undefined)
            mockFindPlan.mockResolvedValue({ plan: PlanName.FREE, enterpriseTrialEndsAt: null })

            await autumnUtils.refreshEntitlements(log, PLATFORM_ID)

            expect(mockPlanUpdate).toHaveBeenCalledWith(expect.not.objectContaining({ enterpriseTrialEndedAt: expect.anything() }))
            expect(mockOnTrialEnded).not.toHaveBeenCalled()
        })
    })
})

type StartTrialParams = {
    plan: Record<string, string>
    started?: typeof STARTED | null
    refreshError?: Error
}
