import { ApEdition, PlanName, SelfServeTrialStatus } from '@activepieces/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockGetEdition, mockOnTrialStarted, mockOnTrialEnded, mockStoreDelete, mockStorePut, mockPlanUpdate, mockFindPlan, mockGetPlan, mockLogError, store } = vi.hoisted(() => {
    const store = new Map<string, unknown>()
    return {
        store,
        mockGetEdition: vi.fn().mockReturnValue('cloud'),
        mockOnTrialStarted: vi.fn().mockResolvedValue(undefined),
        mockOnTrialEnded: vi.fn().mockResolvedValue(undefined),
        mockStoreDelete: vi.fn(async (key: string) => {
            store.delete(key)
        }),
        mockStorePut: vi.fn(async (key: string, value: unknown) => {
            store.set(key, value)
        }),
        mockPlanUpdate: vi.fn().mockResolvedValue(undefined),
        mockFindPlan: vi.fn(),
        mockGetPlan: vi.fn(),
        mockLogError: vi.fn(),
    }
})

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
        onSelfServeTrialStarted: mockOnTrialStarted,
        onSelfServeTrialEnded: mockOnTrialEnded,
        onEntitlementsRefreshed: vi.fn().mockResolvedValue(undefined),
    }),
}))

vi.mock('../../../../../src/app/database/redis-connections', () => ({
    distributedLock: () => ({
        runExclusive: async ({ fn }: { fn: () => Promise<unknown> }) => fn(),
    }),
    distributedStore: {
        get: async (key: string) => store.get(key) ?? null,
        put: mockStorePut,
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
const WINDOW_KEY = `platform_plan:self-serve-trial:v1:${PLATFORM_ID}`
const CREDS = { autumnCustomerId: 'cus_123', autumnApiKey: 'am_sk_customer' }
const STARTED = { startedAt: '2099-10-14T09:00:00.000Z', endsAt: '2099-10-21T09:00:00.000Z' }
const PAST = { startedAt: '2026-10-01T09:00:00.000Z', endsAt: '2026-10-08T09:00:00.000Z' }
const ACTIVE: SelfServeTrialStatus = { state: 'active', ...STARTED, extended: false }
const USED: SelfServeTrialStatus = { state: 'used', startedAt: null, endsAt: null, extended: false }
const INELIGIBLE: SelfServeTrialStatus = { state: 'ineligible', startedAt: null, endsAt: null, extended: false }
const FREE_PLAN = { plan: PlanName.FREE, selfServeTrialUsedElsewhereAt: null }
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

async function refreshWith({ customer }: { customer: Record<string, unknown> }) {
    const { autumnUtils } = await loadModules()
    vi.spyOn(autumnUtils, 'resolveClientForPlatform').mockResolvedValue({ getCustomer: async () => customer } as never)
    vi.spyOn(autumnUtils, 'writeCustomerStateCaches').mockResolvedValue({ credits: null, appSumo: null })
    vi.spyOn(autumnUtils, 'invalidateBillingOverview').mockResolvedValue(undefined)
    vi.spyOn(autumnUtils, 'provisionLicenseKeyIfPaid').mockResolvedValue(undefined)
    mockFindPlan.mockResolvedValue({ plan: PlanName.FREE })
    await autumnUtils.refreshEntitlements(log, PLATFORM_ID)
}

function customerWith({ addOn, metadata }: CustomerWithParams): Record<string, unknown> {
    const free = { planId: PlanName.FREE, status: 'active', addOn: false, trialEndsAt: null, startedAt: 0, plan: { addOn: false, items: [] } }
    const trial = addOn === undefined ? [] : [{ planId: PlanName.ENTERPRISE_TRIAL, status: 'active', addOn: true, startedAt: Date.parse(addOn.startedAt), trialEndsAt: Date.parse(addOn.endsAt), plan: { addOn: true, items: [] } }]
    return { subscriptions: [free, ...trial], purchases: [], balances: {}, metadata: metadata ?? {} }
}

describe('self-serve trial', () => {
    beforeEach(() => {
        vi.useRealTimers()
        vi.clearAllMocks()
        vi.resetModules()
        store.clear()
        mockGetEdition.mockReturnValue('cloud')
    })

    describe('getSelfServeTrial', () => {
        it.each([
            { name: 'no trial on Free', window: null, plan: FREE_PLAN, expected: { state: 'eligible', startedAt: null, endsAt: null } },
            { name: 'a running trial', window: STARTED, plan: FREE_PLAN, expected: { state: 'active', ...STARTED } },
            { name: 'a trial past its end', window: PAST, plan: FREE_PLAN, expected: { state: 'ended', ...PAST } },
            { name: 'a trial used on another platform', window: null, plan: { ...FREE_PLAN, selfServeTrialUsedElsewhereAt: '2026-10-09T09:00:00.000Z' }, expected: { state: 'used', startedAt: null, endsAt: null } },
            { name: 'an AppSumo platform', window: null, plan: { ...FREE_PLAN, plan: PlanName.APPSUMO }, expected: { state: 'ineligible', startedAt: null, endsAt: null } },
            { name: 'an Enterprise platform', window: null, plan: { ...FREE_PLAN, plan: PlanName.ENTERPRISE }, expected: { state: 'ineligible', startedAt: null, endsAt: null } },
            { name: 'a Plus chat platform', window: null, plan: { ...FREE_PLAN, plan: PlanName.PLUS_CHAT }, expected: { state: 'ineligible', startedAt: null, endsAt: null } },
        ])('reads $name', async ({ window, plan, expected }) => {
            const { autumnBillingProvider } = await enrolledProvider()
            store.set(WINDOW_KEY, { window })
            mockGetPlan.mockResolvedValue(plan)

            const status = await autumnBillingProvider(log).getSelfServeTrial(PLATFORM_ID)

            expect(status).toEqual({ ...expected, extended: false })
        })

        it.each([PlanName.FREE_LEGACY, PlanName.PLUS, PlanName.PLUS_ANNUAL, PlanName.TEAM, PlanName.TEAM_ANNUAL])('offers the trial on %s', async (planName) => {
            const { autumnBillingProvider } = await enrolledProvider()
            store.set(WINDOW_KEY, { window: null })
            mockGetPlan.mockResolvedValue({ ...FREE_PLAN, plan: planName })

            const status = await autumnBillingProvider(log).getSelfServeTrial(PLATFORM_ID)

            expect(status.state).toBe('eligible')
        })

        it('reads the trial from Autumn when the cache has nothing, and keeps it', async () => {
            const { autumnBillingProvider, autumnUtils } = await enrolledProvider()
            const getCustomer = vi.fn().mockResolvedValue(customerWith({ addOn: STARTED }))
            vi.spyOn(autumnUtils, 'resolveClientForPlatform').mockResolvedValue({ getCustomer } as never)
            mockGetPlan.mockResolvedValue(FREE_PLAN)

            const first = await autumnBillingProvider(log).getSelfServeTrial(PLATFORM_ID)
            const second = await autumnBillingProvider(log).getSelfServeTrial(PLATFORM_ID)

            expect(first).toEqual(ACTIVE)
            expect(second).toEqual(ACTIVE)
            expect(getCustomer).toHaveBeenCalledTimes(1)
        })
    })

    describe('startSelfServeTrial', () => {
        async function startTrial({ plan, window, outcome, refreshError }: StartTrialParams) {
            const { autumnBillingProvider, autumnConsole, autumnUtils } = await enrolledProvider()
            store.set(WINDOW_KEY, { window: window ?? null })
            mockGetPlan.mockResolvedValue(plan ?? FREE_PLAN)
            const consoleStart = vi.spyOn(autumnConsole, 'startSelfServeTrial').mockResolvedValue(outcome ?? { result: 'started', ...STARTED })
            vi.spyOn(autumnUtils, 'refreshEntitlements').mockImplementation(async () => {
                if (refreshError) {
                    throw refreshError
                }
            })
            const status = await autumnBillingProvider(log).startSelfServeTrial(PLATFORM_ID)
            return { status, consoleStart }
        }

        it('starts an eligible trial, keeps its dates and reports it once', async () => {
            const { status, consoleStart } = await startTrial({})

            expect(status).toEqual(ACTIVE)
            expect(consoleStart).toHaveBeenCalledWith(CREDS)
            expect(store.get(WINDOW_KEY)).toEqual({ window: STARTED })
            expect(mockPlanUpdate).not.toHaveBeenCalled()
            expect(mockOnTrialStarted).toHaveBeenCalledTimes(1)
            expect(mockOnTrialStarted).toHaveBeenCalledWith({ platformId: PLATFORM_ID, endsAt: ACTIVE.endsAt })
        })

        it('returns a running trial without starting or reporting it again', async () => {
            const { status, consoleStart } = await startTrial({ window: STARTED })

            expect(status).toEqual(ACTIVE)
            expect(consoleStart).not.toHaveBeenCalled()
            expect(mockOnTrialStarted).not.toHaveBeenCalled()
        })

        it('never asks the console again once the trial ended', async () => {
            const { status, consoleStart } = await startTrial({ window: PAST })

            expect(status.state).toBe('ended')
            expect(consoleStart).not.toHaveBeenCalled()
        })

        it('refuses a platform on a plan without the trial before asking the console', async () => {
            const { status, consoleStart } = await startTrial({ plan: { ...FREE_PLAN, plan: PlanName.APPSUMO } })

            expect(status).toEqual(INELIGIBLE)
            expect(consoleStart).not.toHaveBeenCalled()
        })

        it('remembers a start the console refuses as used, as a trial used elsewhere', async () => {
            const { status } = await startTrial({ outcome: { result: 'used' } })

            expect(status).toEqual(USED)
            expect(mockPlanUpdate).toHaveBeenCalledWith({ platformId: PLATFORM_ID, selfServeTrialUsedElsewhereAt: expect.any(String) })
            expect(mockOnTrialStarted).not.toHaveBeenCalled()
        })

        it('reads a plan the console refuses as ineligible, without remembering it', async () => {
            const { status } = await startTrial({ outcome: { result: 'ineligible' } })

            expect(status).toEqual(INELIGIBLE)
            expect(mockPlanUpdate).not.toHaveBeenCalled()
            expect(store.get(WINDOW_KEY)).toEqual({ window: null })
        })

        it('returns the started trial when the refresh after it fails', async () => {
            const { status } = await startTrial({ refreshError: new Error('autumn timeout') })

            expect(status).toEqual(ACTIVE)
            expect(store.get(WINDOW_KEY)).toEqual({ window: STARTED })
        })

        it('lets the next plan read refresh again after a start', async () => {
            await startTrial({})

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

            const outcome = await autumnConsole.startSelfServeTrial(CREDS)

            expect(outcome).toEqual({ result: 'started', ...STARTED })
            expect(post).toHaveBeenCalledWith(
                'https://console.activepieces.com/api/v1/billing/self-serve-trial',
                { autumnCustomerId: CREDS.autumnCustomerId },
                expect.objectContaining({ headers: { Authorization: `Bearer ${token}` } }),
            )
        })

        it.each([
            { status: 409, result: 'used' },
            { status: 403, result: 'ineligible' },
        ])('reads a $status from the console as $result, without logging an error', async ({ status, result }) => {
            const { autumnConsole, safeHttp } = await loadModules()
            vi.spyOn(safeHttp.axios, 'post').mockRejectedValue(Object.assign(new Error(`Request failed with status code ${status}`), { isAxiosError: true, response: { status } }))

            await expect(autumnConsole.startSelfServeTrial(CREDS)).resolves.toEqual({ result })
            expect(mockLogError).not.toHaveBeenCalled()
        })

        it('still fails on any other console error', async () => {
            const { autumnConsole, safeHttp } = await loadModules()
            vi.spyOn(safeHttp.axios, 'post').mockRejectedValue(Object.assign(new Error('Request failed with status code 500'), { isAxiosError: true, response: { status: 500 } }))

            await expect(autumnConsole.startSelfServeTrial(CREDS)).rejects.toThrow('500')
            expect(mockLogError).toHaveBeenCalledOnce()
        })
    })

    describe('refreshEntitlements', () => {
        it('keeps the running add-on\'s dates', async () => {
            await refreshWith({ customer: customerWith({ addOn: STARTED }) })

            expect(store.get(WINDOW_KEY)).toEqual({ window: STARTED })
            expect(mockPlanUpdate).toHaveBeenCalledWith(expect.not.objectContaining({ selfServeTrialUsedElsewhereAt: expect.anything() }))
        })

        it('keeps the dates saved on the customer once the add-on is gone', async () => {
            await refreshWith({ customer: customerWith({ metadata: { self_serve_trial_started_at: PAST.startedAt, self_serve_trial_ends_at: PAST.endsAt } }) })

            expect(store.get(WINDOW_KEY)).toEqual({ window: PAST })
        })

        it('never replaces saved dates when Autumn shows no trial yet', async () => {
            store.set(WINDOW_KEY, { window: STARTED })

            await refreshWith({ customer: customerWith({}) })

            expect(store.get(WINDOW_KEY)).toEqual({ window: STARTED })
        })

        it('marks a platform that never had a trial', async () => {
            await refreshWith({ customer: customerWith({}) })

            expect(store.get(WINDOW_KEY)).toEqual({ window: null })
        })

        it('ignores dates on the customer that do not make a trial', async () => {
            await refreshWith({ customer: customerWith({ metadata: { self_serve_trial_started_at: 'soon', self_serve_trial_ends_at: PAST.endsAt } }) })

            expect(store.get(WINDOW_KEY)).toEqual({ window: null })
        })

        it('reports a trial that ended in the last 30 days', async () => {
            vi.useFakeTimers({ now: new Date('2026-10-10T09:00:00.000Z'), toFake: ['Date'] })

            await refreshWith({ customer: customerWith({ metadata: { self_serve_trial_started_at: PAST.startedAt, self_serve_trial_ends_at: PAST.endsAt } }) })

            expect(mockOnTrialEnded).toHaveBeenCalledWith({ platformId: PLATFORM_ID, trialEndsAt: PAST.endsAt, endedAt: PAST.endsAt })
        })

        it('does not report a trial that ended long ago, or one still running', async () => {
            vi.useFakeTimers({ now: new Date('2026-12-10T09:00:00.000Z'), toFake: ['Date'] })

            await refreshWith({ customer: customerWith({ metadata: { self_serve_trial_started_at: PAST.startedAt, self_serve_trial_ends_at: PAST.endsAt } }) })
            await refreshWith({ customer: customerWith({ addOn: STARTED }) })

            expect(mockOnTrialEnded).not.toHaveBeenCalled()
        })
    })
})

type StartTrialParams = {
    plan?: Record<string, string | null>
    window?: { startedAt: string, endsAt: string }
    outcome?: { result: 'started', startedAt: string, endsAt: string } | { result: 'used' } | { result: 'ineligible' }
    refreshError?: Error
}

type CustomerWithParams = {
    addOn?: { startedAt: string, endsAt: string }
    metadata?: Record<string, string>
}
