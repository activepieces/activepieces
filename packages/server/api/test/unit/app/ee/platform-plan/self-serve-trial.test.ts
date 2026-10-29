import { ApEdition, PlanName, SelfServeTrialState, SelfServeTrialStatus } from '@activepieces/shared'
import { ListSubscriptionsListStatus } from 'autumn-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SelfServeTrialStartOutcome, SelfServeTrialStartResult } from '../../../../../src/app/ee/platform/platform-plan/billing-providers/autumn-utils'

const { mockGetEdition, mockOnTrialStarted, mockOnTrialEnded, mockStoreDelete, mockStorePut, mockPlanUpdate, mockFindPlan, mockGetPlan, mockLogError, store, storeHooks } = vi.hoisted(() => {
    const store = new Map<string, unknown>()
    const storeHooks: { afterAccess: ((key: string) => void) | null } = { afterAccess: null }
    return {
        store,
        storeHooks,
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
        get: async (key: string) => {
            const value = store.get(key) ?? null
            storeHooks.afterAccess?.(key)
            return value
        },
        put: mockStorePut,
        putIfAbsent: async (key: string, value: unknown) => {
            const absent = !store.has(key)
            if (absent) {
                store.set(key, value)
            }
            storeHooks.afterAccess?.(key)
            return absent
        },
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
const TRIAL_KEY = `platform_plan:self-serve-trial:v2:${PLATFORM_ID}`
const CREDS = { autumnCustomerId: 'cus_123', autumnApiKey: 'am_sk_customer' }
const STARTED = { startedAt: '2099-10-14T09:00:00.000Z', endsAt: '2099-10-21T09:00:00.000Z' }
const PAST = { startedAt: '2026-10-01T09:00:00.000Z', endsAt: '2026-10-08T09:00:00.000Z' }
const ACTIVE: SelfServeTrialStatus = { state: SelfServeTrialState.ACTIVE, ...STARTED }
const USED: SelfServeTrialStatus = { state: SelfServeTrialState.USED, startedAt: null, endsAt: null }
const INELIGIBLE: SelfServeTrialStatus = { state: SelfServeTrialState.INELIGIBLE, startedAt: null, endsAt: null }
const FREE_PLAN = { plan: PlanName.FREE }
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

async function refreshWith({ customer, subscriptions = [], listError }: RefreshWithParams) {
    const { autumnUtils } = await loadModules()
    const listSubscriptions = vi.fn(async () => {
        if (listError) {
            throw listError
        }
        return subscriptions
    })
    vi.spyOn(autumnUtils, 'resolveClientForPlatform').mockResolvedValue({ getCustomer: async () => customer, listSubscriptions } as never)
    vi.spyOn(autumnUtils, 'writeCustomerStateCaches').mockResolvedValue({ credits: null, appSumo: null })
    vi.spyOn(autumnUtils, 'invalidateBillingOverview').mockResolvedValue(undefined)
    vi.spyOn(autumnUtils, 'provisionLicenseKeyIfPaid').mockResolvedValue(undefined)
    mockFindPlan.mockResolvedValue({ plan: PlanName.FREE })
    await autumnUtils.refreshEntitlements(log, PLATFORM_ID)
    return { listSubscriptions }
}

function customerWith({ addOn, trialUsed }: CustomerWithParams): Record<string, unknown> {
    const free = { planId: PlanName.FREE, status: 'active', addOn: false, trialEndsAt: null, startedAt: 0, plan: { addOn: false, items: [] } }
    const trial = addOn === undefined ? [] : [{ planId: PlanName.SELF_SERVE_TRIAL, status: 'active', addOn: true, startedAt: Date.parse(addOn.startedAt), trialEndsAt: Date.parse(addOn.endsAt), plan: { addOn: true, items: [] } }]
    const trialsUsed = trialUsed || addOn !== undefined ? [{ planId: PlanName.SELF_SERVE_TRIAL, customerId: 'cus_123' }] : []
    return { subscriptions: [free, ...trial], purchases: [], balances: {}, trialsUsed }
}

function runningTrialRow(dates: TrialDates): Record<string, unknown> {
    return { planId: PlanName.SELF_SERVE_TRIAL, status: ListSubscriptionsListStatus.Active, startedAt: Date.parse(dates.startedAt), trialEndsAt: Date.parse(dates.endsAt), expiresAt: null }
}

function endedTrialRow(dates: TrialDates): Record<string, unknown> {
    return { planId: PlanName.SELF_SERVE_TRIAL, status: ListSubscriptionsListStatus.Expired, startedAt: Date.parse(dates.startedAt), trialEndsAt: null, expiresAt: Date.parse(dates.endsAt) }
}

describe('self-serve trial', () => {
    beforeEach(() => {
        vi.useRealTimers()
        vi.clearAllMocks()
        vi.resetModules()
        store.clear()
        storeHooks.afterAccess = null
        mockGetEdition.mockReturnValue('cloud')
    })

    describe('getSelfServeTrialInfo', () => {
        it.each([
            { name: 'no trial on Free', dates: null, plan: FREE_PLAN, expected: { state: SelfServeTrialState.ELIGIBLE, startedAt: null, endsAt: null } },
            { name: 'a running trial', dates: STARTED, plan: FREE_PLAN, expected: { state: SelfServeTrialState.ACTIVE, ...STARTED } },
            { name: 'a trial past its end', dates: PAST, plan: FREE_PLAN, expected: { state: SelfServeTrialState.ENDED, ...PAST } },
            { name: 'an AppSumo platform', dates: null, plan: { ...FREE_PLAN, plan: PlanName.APPSUMO }, expected: { state: SelfServeTrialState.INELIGIBLE, startedAt: null, endsAt: null } },
            { name: 'an Enterprise platform', dates: null, plan: { ...FREE_PLAN, plan: PlanName.ENTERPRISE }, expected: { state: SelfServeTrialState.INELIGIBLE, startedAt: null, endsAt: null } },
            { name: 'a Plus chat platform', dates: null, plan: { ...FREE_PLAN, plan: PlanName.PLUS_CHAT }, expected: { state: SelfServeTrialState.INELIGIBLE, startedAt: null, endsAt: null } },
        ])('reads $name', async ({ dates, plan, expected }) => {
            const { autumnBillingProvider } = await enrolledProvider()
            store.set(TRIAL_KEY, { dates })
            mockGetPlan.mockResolvedValue(plan)

            const status = await autumnBillingProvider(log).getSelfServeTrialInfo(PLATFORM_ID)

            expect(status).toEqual(expected)
        })

        it.each([PlanName.FREE_LEGACY, PlanName.PLUS, PlanName.PLUS_ANNUAL, PlanName.TEAM, PlanName.TEAM_ANNUAL])('offers the trial on %s', async (planName) => {
            const { autumnBillingProvider } = await enrolledProvider()
            store.set(TRIAL_KEY, { dates: null })
            mockGetPlan.mockResolvedValue({ ...FREE_PLAN, plan: planName })

            const status = await autumnBillingProvider(log).getSelfServeTrialInfo(PLATFORM_ID)

            expect(status.state).toBe(SelfServeTrialState.ELIGIBLE)
        })

        it('reads no trial when the cache has nothing, without asking Autumn', async () => {
            const { autumnBillingProvider, autumnUtils } = await enrolledProvider()
            const resolveClient = vi.spyOn(autumnUtils, 'resolveClientForPlatform')
            mockGetPlan.mockResolvedValue(FREE_PLAN)

            const status = await autumnBillingProvider(log).getSelfServeTrialInfo(PLATFORM_ID)

            expect(status.state).toBe(SelfServeTrialState.ELIGIBLE)
            expect(resolveClient).not.toHaveBeenCalled()
        })
    })

    describe('isOnSelfServeTrial', () => {
        it.each([
            { name: 'a running trial', cached: { dates: STARTED }, expected: true },
            { name: 'no trial', cached: { dates: null }, expected: false },
        ])('reads $name from the cache', async ({ cached, expected }) => {
            const { autumnBillingProvider, autumnUtils } = await loadModules()
            const resolveClient = vi.spyOn(autumnUtils, 'resolveClientForPlatform')
            store.set(TRIAL_KEY, cached)

            expect(await autumnBillingProvider(log).isOnSelfServeTrial(PLATFORM_ID)).toBe(expected)
            expect(resolveClient).not.toHaveBeenCalled()
        })

        it('reads an ended trial as over and refreshes the entitlements so the plan drops it', async () => {
            const { autumnBillingProvider, autumnUtils } = await loadModules()
            const refresh = vi.spyOn(autumnUtils, 'refreshEntitlements').mockResolvedValue(undefined)
            store.set(TRIAL_KEY, { dates: PAST })

            expect(await autumnBillingProvider(log).isOnSelfServeTrial(PLATFORM_ID)).toBe(false)
            await vi.waitFor(() => expect(refresh).toHaveBeenCalledWith(log, PLATFORM_ID))
        })

        it('releases the refresh claim when the refresh after an ended trial fails, so the next read retries it', async () => {
            const { autumnBillingProvider, autumnUtils } = await loadModules()
            vi.spyOn(autumnUtils, 'refreshEntitlements').mockRejectedValue(new Error('Autumn is down'))
            store.set(TRIAL_KEY, { dates: PAST })

            expect(await autumnBillingProvider(log).isOnSelfServeTrial(PLATFORM_ID)).toBe(false)
            await vi.waitFor(() => expect(mockStoreDelete).toHaveBeenCalledWith(`self_serve_trial_ended_refresh_${PLATFORM_ID}_${PAST.endsAt}`))
        })

        it('reads no trial when the cache has nothing, without asking Autumn', async () => {
            const { autumnBillingProvider, autumnUtils } = await loadModules()
            const resolveClient = vi.spyOn(autumnUtils, 'resolveClientForPlatform')

            expect(await autumnBillingProvider(log).isOnSelfServeTrial(PLATFORM_ID)).toBe(false)
            expect(resolveClient).not.toHaveBeenCalled()
        })
    })

    describe('startSelfServeTrial', () => {
        async function startTrial({ plan, dates, outcome, refreshError }: StartTrialParams) {
            const { autumnBillingProvider, autumnConsole, autumnUtils } = await enrolledProvider()
            store.set(TRIAL_KEY, { dates: dates ?? null })
            mockGetPlan.mockResolvedValue(plan ?? FREE_PLAN)
            const consoleStart = vi.spyOn(autumnConsole, 'startSelfServeTrial').mockResolvedValue(outcome ?? { result: SelfServeTrialStartResult.STARTED, ...STARTED })
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
            expect(store.get(TRIAL_KEY)).toEqual({ dates: STARTED })
            expect(mockPlanUpdate).not.toHaveBeenCalled()
            expect(mockOnTrialStarted).toHaveBeenCalledTimes(1)
            expect(mockOnTrialStarted).toHaveBeenCalledWith({ platformId: PLATFORM_ID, endsAt: ACTIVE.endsAt })
        })

        it('returns a running trial without starting or reporting it again', async () => {
            const { status, consoleStart } = await startTrial({ dates: STARTED })

            expect(status).toEqual(ACTIVE)
            expect(consoleStart).not.toHaveBeenCalled()
            expect(mockOnTrialStarted).not.toHaveBeenCalled()
        })

        it('never asks the console again once the trial ended', async () => {
            const { status, consoleStart } = await startTrial({ dates: PAST })

            expect(status.state).toBe(SelfServeTrialState.ENDED)
            expect(consoleStart).not.toHaveBeenCalled()
        })

        it('refuses a platform on a plan without the trial before asking the console', async () => {
            const { status, consoleStart } = await startTrial({ plan: { ...FREE_PLAN, plan: PlanName.APPSUMO } })

            expect(status).toEqual(INELIGIBLE)
            expect(consoleStart).not.toHaveBeenCalled()
        })

        it('reads a start the console refuses as used, without remembering it', async () => {
            const { status } = await startTrial({ outcome: { result: SelfServeTrialStartResult.USED } })

            expect(status).toEqual(USED)
            expect(mockPlanUpdate).not.toHaveBeenCalled()
            expect(store.get(TRIAL_KEY)).toEqual({ dates: null })
            expect(mockOnTrialStarted).not.toHaveBeenCalled()
        })

        it('reads a plan the console refuses as ineligible, without remembering it', async () => {
            const { status } = await startTrial({ outcome: { result: SelfServeTrialStartResult.INELIGIBLE } })

            expect(status).toEqual(INELIGIBLE)
            expect(mockPlanUpdate).not.toHaveBeenCalled()
            expect(store.get(TRIAL_KEY)).toEqual({ dates: null })
        })

        it('returns the started trial when the refresh after it fails', async () => {
            const { status } = await startTrial({ refreshError: new Error('autumn timeout') })

            expect(status).toEqual(ACTIVE)
            expect(store.get(TRIAL_KEY)).toEqual({ dates: STARTED })
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

            expect(outcome).toEqual({ result: SelfServeTrialStartResult.STARTED, ...STARTED })
            expect(post).toHaveBeenCalledWith(
                'https://console.activepieces.com/api/v1/billing/self-serve-trial',
                { autumnCustomerId: CREDS.autumnCustomerId },
                expect.objectContaining({ headers: { Authorization: `Bearer ${token}` } }),
            )
        })

        it.each([
            { status: 409, result: SelfServeTrialStartResult.USED },
            { status: 403, result: SelfServeTrialStartResult.INELIGIBLE },
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
        it('keeps the running trial\'s dates', async () => {
            await refreshWith({ customer: customerWith({ addOn: STARTED }), subscriptions: [runningTrialRow(STARTED)] })

            expect(store.get(TRIAL_KEY)).toEqual({ dates: STARTED })
        })

        it('keeps an ended trial\'s dates from its expired subscription', async () => {
            await refreshWith({ customer: customerWith({ trialUsed: true }), subscriptions: [endedTrialRow(PAST)] })

            expect(store.get(TRIAL_KEY)).toEqual({ dates: PAST })
        })

        it('keeps the latest trial when the customer had more than one', async () => {
            await refreshWith({ customer: customerWith({ addOn: STARTED }), subscriptions: [endedTrialRow(PAST), runningTrialRow(STARTED)] })

            expect(store.get(TRIAL_KEY)).toEqual({ dates: STARTED })
        })

        it('never replaces saved dates when Autumn lists no trial yet', async () => {
            store.set(TRIAL_KEY, { dates: STARTED })

            await refreshWith({ customer: customerWith({}) })

            expect(store.get(TRIAL_KEY)).toEqual({ dates: STARTED })
        })

        it('keeps the saved dates when listing the trial fails, and still refreshes the plan', async () => {
            store.set(TRIAL_KEY, { dates: STARTED })

            await refreshWith({ customer: customerWith({ addOn: STARTED }), listError: new Error('Autumn is down') })

            expect(store.get(TRIAL_KEY)).toEqual({ dates: STARTED })
            expect(mockPlanUpdate).toHaveBeenCalled()
        })

        it('does not list subscriptions for a customer that never had a trial', async () => {
            const { listSubscriptions } = await refreshWith({ customer: customerWith({}) })

            expect(listSubscriptions).not.toHaveBeenCalled()
            expect(store.has(TRIAL_KEY)).toBe(false)
        })

        it('reports a trial that ended in the last 30 days', async () => {
            vi.useFakeTimers({ now: new Date('2026-10-10T09:00:00.000Z'), toFake: ['Date'] })

            await refreshWith({ customer: customerWith({ trialUsed: true }), subscriptions: [endedTrialRow(PAST)] })

            expect(mockOnTrialEnded).toHaveBeenCalledWith({ platformId: PLATFORM_ID, trialEndsAt: PAST.endsAt, endedAt: PAST.endsAt })
        })

        it('does not report a trial that ended long ago, or one still running', async () => {
            vi.useFakeTimers({ now: new Date('2026-12-10T09:00:00.000Z'), toFake: ['Date'] })

            await refreshWith({ customer: customerWith({ trialUsed: true }), subscriptions: [endedTrialRow(PAST)] })
            await refreshWith({ customer: customerWith({ addOn: STARTED }), subscriptions: [runningTrialRow(STARTED)] })

            expect(mockOnTrialEnded).not.toHaveBeenCalled()
        })
    })
})

type StartTrialParams = {
    plan?: Record<string, string | null>
    dates?: { startedAt: string, endsAt: string }
    outcome?: SelfServeTrialStartOutcome
    refreshError?: Error
}

type TrialDates = {
    startedAt: string
    endsAt: string
}

type CustomerWithParams = {
    addOn?: TrialDates
    trialUsed?: boolean
}

type RefreshWithParams = {
    customer: Record<string, unknown>
    subscriptions?: Record<string, unknown>[]
    listError?: Error
}
