import { isNil, tryCatch } from '@activepieces/core-utils'
import { apDayjs } from '@activepieces/server-utils'
import { AiCreditsAutoTopUpState, AppSumoCreditsBillableFeature, AutoTopUpConfig, ConsumableFeatureId, CreditsBillableFeature, FeatureId, isConsumableFeatureId, PlanName, SeatsBillableFeature, UnconsumableFeatureId } from '@activepieces/shared'
import { AutumnError, type GetCustomerResponse } from 'autumn-js'
import { FastifyBaseLogger } from 'fastify'
import { AUTUMN_ENROLL_LOCK_TIMEOUT_SECONDS, getAutumnEnrollLockKey, getBillingEnforcedKey, getBillingOverviewFetchLockKey, getBillingOverviewKey, getCustomerStateFetchLockKey, getCustomerStateMissKey, getCustomerStateRefreshKey } from '../../../../database/redis/keys'
import { distributedLock, distributedStore } from '../../../../database/redis-connections'
import { rejectedPromiseHandler } from '../../../../helper/promise-handler'
import { ActivateLicenseParams, ApplyAppSumoPlanParams, AppSumoAiCreditsUsage, BillingInfo, BillingOverview, BillingProvider, CreditsAndAppSumoState, CreditsGateState, CreditsUsage, emptyBillingOverview, TrackFeatureParams } from '../../../../platform/billing-provider'
import { assertSeatsNotBelowActiveUsers, platformPlanService } from '../platform-plan.service'
import { autumnConsole, autumnUtils, BalanceCacheSnapshot, ConsoleCustomerCall, CreditsBalanceCache } from './autumn-utils'

const CREDITS_REFETCH_PERIOD_MS = 180 * 1000
const CUSTOMER_STATE_REFRESH_DEBOUNCE_SECONDS = 15
const CUSTOMER_STATE_MISS_DEBOUNCE_SECONDS = 60
const CUSTOMER_STATE_FETCH_LOCK_TIMEOUT_SECONDS = 15
const CREDITS_CACHE_READ_TIMEOUT_MS = 25
const BILLING_OVERVIEW_TTL_SECONDS = 5 * 60
const TRIAL_DURATION_UNITS: Partial<Record<string, 'day' | 'month' | 'year'>> = { day: 'day', month: 'month', year: 'year' }

export const autumnBillingProvider = (log: FastifyBaseLogger): BillingProvider => ({
    listPlans: async (platformId: string) => {
        return autumnConsole.listPlans({ platformId })
    },
    getBillingOverview: async (platformId: string) => {
        const cached = await distributedStore.get<BillingOverview>(getBillingOverviewKey(platformId))
        if (!isNil(cached)) {
            return cached
        }
        return distributedLock(log).runExclusive({
            key: getBillingOverviewFetchLockKey(platformId),
            timeoutInSeconds: CUSTOMER_STATE_FETCH_LOCK_TIMEOUT_SECONDS,
            fn: async () => {
                const again = await distributedStore.get<BillingOverview>(getBillingOverviewKey(platformId))
                if (!isNil(again)) {
                    return again
                }
                return fetchBillingOverview(log, platformId)
            },
        })
    },
    createCheckoutSession: async ({ platformId, planId, successUrl }) => withEnrolledCreds({
        log,
        platformId,
        fallback: { checkoutUrl: null },
        fn: async (creds) => {
            const targetPlan = (await autumnConsole.listPlans({ platformId })).find((plan) => plan.id === planId)
            if (!isNil(targetPlan) && !isNil(targetPlan.includedSeats)) {
                await assertSeatsNotBelowActiveUsers({ platformId, targetLimit: targetPlan.includedSeats, log })
            }
            const { paymentUrl } = await autumnConsole.checkout({ ...creds, planId, successUrl })
            return { checkoutUrl: paymentUrl }
        },
    }),
    getBillingPortalUrl: async ({ platformId, returnUrl }) => {
        const creds = await autumnConsole.getCreds(log, platformId)
        if (isNil(creds)) {
            return { url: '' }
        }
        const { url } = await autumnConsole.portal({ ...creds, returnUrl })
        return { url: url ?? '' }
    },
    adjustUnconsumableFeatureQuantity: async ({ platformId, featureId, quantity }) => {
        if (featureId === UnconsumableFeatureId.USERS_LIMIT) {
            await assertSeatsNotBelowActiveUsers({ platformId, targetLimit: quantity, log })
        }
        return withEnrolledCreds({
            log,
            platformId,
            fallback: { checkoutUrl: null },
            fn: async (creds) => {
                const { paymentUrl } = await autumnConsole.setUnconsumableQuantity({ ...creds, featureId, quantity })
                return { checkoutUrl: paymentUrl }
            },
        })
    },
    configureAutoTopUp: async (params) => withEnrolledCreds({
        log,
        platformId: params.platformId,
        fallback: undefined,
        fn: async (creds) => {
            await autumnConsole.configureAutoTopUp(
                params.state === AiCreditsAutoTopUpState.DISABLED
                    ? { ...creds, featureId: params.featureId, enabled: false }
                    : {
                        ...creds,
                        featureId: params.featureId,
                        enabled: true,
                        threshold: params.minThreshold,
                        quantity: params.creditsToAdd,
                        maxMonthlyTopUps: params.maxMonthlyTopUps,
                    },
            )
            await autumnUtils.invalidateBillingOverview(params.platformId)
        },
    }),
    setupPayment: async ({ platformId, redirectUrl }) => withEnrolledCreds({
        log,
        platformId,
        fallback: { url: null },
        fn: (creds) => autumnConsole.setupPayment({ ...creds, redirectUrl }),
    }),
    cancelSubscription: async ({ platformId, feedback }) => withEnrolledCreds({
        log,
        platformId,
        fallback: undefined,
        fn: async (creds) => {
            const freePlan = (await autumnConsole.listPlans({ platformId })).find((plan) => plan.id === PlanName.FREE)
            if (!isNil(freePlan) && !isNil(freePlan.includedSeats)) {
                await assertSeatsNotBelowActiveUsers({ platformId, targetLimit: freePlan.includedSeats, log })
            }
            await autumnConsole.cancel({ ...creds, feedback })
        },
    }),
    reactivateSubscription: async ({ platformId }) => withEnrolledCreds({
        log,
        platformId,
        fallback: undefined,
        fn: (creds) => autumnConsole.reactivate({ ...creds }),
    }),
    trackFeature: async (params: TrackFeatureParams) => {
        await sendTrackEvent({ ...params, log })
    },
    ensureEnrolled: async (platformId: string) => {
        await autumnUtils.ensureEnrolled(log, platformId)
    },
    compFreeLegacy: async (platformId: string) => {
        await autumnUtils.ensureFreeLegacyComped(log, platformId)
    },
    refreshEntitlements: async (platformId: string) => {
        await autumnUtils.refreshEntitlements(log, platformId)
    },
    applyAppSumoPlan: async ({ platformId, action }: ApplyAppSumoPlanParams) => {
        await autumnUtils.ensureEnrolled(log, platformId)
        await autumnConsole.compAppSumo({ log, platformId, action })
        await autumnUtils.refreshEntitlements(log, platformId)
    },
    activateLicense: async ({ platformId, licenseKey }: ActivateLicenseParams) => {
        const credentials = await autumnConsole.activate({ licenseKey })
        await distributedLock(log).runExclusive({
            key: getAutumnEnrollLockKey(platformId),
            timeoutInSeconds: AUTUMN_ENROLL_LOCK_TIMEOUT_SECONDS,
            fn: async () => {
                const { autumnCustomerId: replacedCustomerId } = await platformPlanService(log).getAutumnCredentials(platformId)
                if (!isNil(replacedCustomerId) && replacedCustomerId !== credentials.autumnCustomerId) {
                    log.warn({ platform: { id: platformId }, replacedCustomerId, autumnCustomerId: credentials.autumnCustomerId }, 'License activation replaced an existing Autumn customer; the previous subscription is now orphaned and needs manual reconciliation')
                }
                await platformPlanService(log).update({ platformId, licenseKey })
                await platformPlanService(log).setAutumnCredentials({ platformId, ...credentials })
            },
        })
        await autumnUtils.refreshEntitlements(log, platformId)
    },
    isBillingEnforced: async (platformId: string) => {
        return (await distributedStore.get<boolean>(getBillingEnforcedKey(platformId))) ?? false
    },
    shouldBlockOnCredits: async (platformId: string) => {
        return (await computeCreditsAndAppSumoState(log, platformId)).credits.blocked
    },
    getCreditsAndAppSumoState: async (platformId: string) => {
        return computeCreditsAndAppSumoState(log, platformId)
    },
    getConsumablesUsage: async (platformId: string) => {
        const { credits, appSumo } = await resolveCreditsCache(log, platformId)
        return {
            credits: toCreditsUsage(credits),
            appSumo: toAppSumoAiCreditsUsage(appSumo),
        }
    },
    getCreditUsage: async ({ platformId, startDate, endDate }) => {
        return autumnUtils.getCreditUsage(log, platformId, startDate, endDate)
    },
})

async function withEnrolledCreds<T>({ log, platformId, fallback, fn }: WithEnrolledCredsParams<T>): Promise<T> {
    await autumnUtils.ensureEnrolled(log, platformId)
    const creds = await autumnConsole.getCreds(log, platformId)
    if (isNil(creds)) {
        return fallback
    }
    return fn(creds)
}

function selectCurrentPlan(customer: GetCustomerResponse): CurrentPlanSelection {
    const baseSubscriptions = autumnUtils.toBaseSubscriptions(customer)
    const subscription = autumnUtils.selectCurrentBaseSubscription(baseSubscriptions)
    const purchase = (customer.purchases ?? []).find((entry) =>
        !isNil(entry.plan) && !entry.plan.addOn && entry.planId !== PlanName.FREE)
    return { baseSubscriptions, subscription, purchase, plan: purchase?.plan ?? subscription?.plan ?? null }
}

function purchaseTrialEndsAt(purchase: GetCustomerResponse['purchases'][number] | undefined): string | null {
    const freeTrial = purchase?.plan?.freeTrial
    if (isNil(purchase) || isNil(freeTrial)) {
        return null
    }
    const unit = TRIAL_DURATION_UNITS[freeTrial.durationType]
    if (isNil(unit)) {
        return null
    }
    const endsAt = apDayjs(purchase.startedAt).add(freeTrial.durationLength, unit)
    return endsAt.isAfter(apDayjs()) ? endsAt.toISOString() : null
}

function toBillingInfo(customer: GetCustomerResponse, monthStart: string, monthEnd: string): BillingInfo {
    const { baseSubscriptions, subscription, purchase, plan } = selectCurrentPlan(customer)
    const scheduledPlan = baseSubscriptions.find((entry) => entry.status === 'scheduled')
    return {
        planName: plan?.name ?? null,
        creditsResetInterval: toCreditsResetInterval(plan?.items ?? []),
        planInterval: plan?.price?.interval ?? null,
        startDate: msToIso(subscription?.currentPeriodStart) ?? monthStart,
        endDate: msToIso(subscription?.currentPeriodEnd) ?? monthEnd,
        nextBillingAmount: subscription?.plan?.price?.amount ?? 0,
        cancelAt: msToIso(subscription?.expiresAt) ?? null,
        trialEndsAt: msToIso(subscription?.trialEndsAt) ?? purchaseTrialEndsAt(purchase),
        scheduledPlanName: scheduledPlan?.plan?.name ?? null,
        billingPortalAvailable: !isNil(customer.paymentMethod),
    }
}

function toBillableFeatures(customer: GetCustomerResponse): BillableFeatures {
    const { baseSubscriptions, plan } = selectCurrentPlan(customer)
    const trialing = baseSubscriptions.some((subscription) => !isNil(subscription.trialEndsAt) && subscription.trialEndsAt > apDayjs().valueOf())
    const items = trialing ? [] : plan?.items ?? []
    const autoTopUps = toAutoTopUps(customer)
    return {
        creditsFeature: withAutoTopUp({ feature: findPricedFeature({ items, featureId: ConsumableFeatureId.AP_CREDITS }), autoTopUps }),
        appSumoCreditsFeature: withAutoTopUp({ feature: findPricedFeature({ items, featureId: ConsumableFeatureId.APP_SUMO_AI_CREDITS }), autoTopUps }),
        seatsFeature: findPricedFeature({ items, featureId: UnconsumableFeatureId.USERS_LIMIT }),
    }
}

function withAutoTopUp<T extends ConsumableFeatureId>({ feature, autoTopUps }: WithAutoTopUpParams<T>): (PricedFeature<T> & { autoTopUp: AutoTopUpConfig | null }) | null {
    if (isNil(feature)) {
        return null
    }
    return { ...feature, autoTopUp: autoTopUps.find((config) => config.featureId === feature.featureId) ?? null }
}

function findPricedFeature<T extends FeatureId>({ items, featureId }: FindPricedFeatureParams<T>): PricedFeature<T> | null {
    return items.flatMap((item) => {
        const price = item.price
        if (item.featureId !== featureId || price?.billingMethod !== 'prepaid' || isNil(price.amount)) {
            return []
        }
        return [{ featureId, pricePerUnit: price.amount, billingUnits: price.billingUnits ?? 1, interval: price.interval ?? null }]
    })[0] ?? null
}

function toCreditsResetInterval(items: AutumnPlanItems): string | null {
    const creditsItem = items.find((item) => item.featureId === ConsumableFeatureId.AP_CREDITS && isNil(item.price))
    return creditsItem?.reset?.interval ?? null
}

function toSeatBreakdown(customer: GetCustomerResponse): { includedSeats: number | null, additionalSeats: number | null } {
    const balance = customer.balances[UnconsumableFeatureId.USERS_LIMIT]
    if (isNil(balance)) {
        return { includedSeats: null, additionalSeats: null }
    }
    const breakdown = balance.breakdown ?? []
    return {
        includedSeats: breakdown.reduce((sum, entry) => sum + entry.includedGrant, 0),
        additionalSeats: breakdown.reduce((sum, entry) => sum + entry.prepaidGrant, 0),
    }
}

function toAutoTopUps(customer: GetCustomerResponse): AutoTopUpConfig[] {
    return (customer.billingControls?.autoTopups ?? []).flatMap((autoTopUp) => {
        if (!isConsumableFeatureId(autoTopUp.featureId)) {
            return []
        }
        return [{
            featureId: autoTopUp.featureId,
            enabled: autoTopUp.enabled,
            threshold: autoTopUp.threshold,
            quantity: autoTopUp.quantity,
            maxMonthlyTopUps: autoTopUp.purchaseLimit?.limit ?? null,
        }]
    })
}

function toCreditsUsage(balance: CreditsBalanceCache | null): CreditsUsage | null {
    if (isNil(balance)) {
        return null
    }
    return { usage: balance.usage, remaining: balance.unlimited ? null : balance.remaining, nextResetAt: msToIso(balance.nextResetAt) }
}

function toAppSumoAiCreditsUsage(balance: CreditsBalanceCache | null): AppSumoAiCreditsUsage | null {
    if (isNil(balance) || balance.unlimited || balance.granted <= 0) {
        return null
    }
    return { usage: balance.usage, limit: balance.granted }
}

function isDuplicateTrack(error: unknown): boolean {
    return error instanceof AutumnError && error.statusCode === 409
}

function msToIso(ms: number | null | undefined): string | null {
    return isNil(ms) ? null : apDayjs(ms).toISOString()
}

async function computeCreditsAndAppSumoState(log: FastifyBaseLogger, platformId: string): Promise<CreditsAndAppSumoState> {
    const { data: snapshot, error } = await tryCatch(() => withTimeout(readCreditsCaches(platformId), CREDITS_CACHE_READ_TIMEOUT_MS))
    if (isNil(snapshot)) {
        log.warn({ error, platform: { id: platformId } }, 'Credits gate cache read timed out or failed; failing open without gating this request')
        return {
            credits: computeCreditState({ balance: null, enforced: false }),
            appSumo: computeCreditState({ balance: null, enforced: true }),
        }
    }
    const state = {
        credits: computeCreditState({ balance: snapshot.credits, enforced: snapshot.billingEnforced }),
        appSumo: computeCreditState({ balance: snapshot.appSumo, enforced: true }),
    }
    scheduleCreditsCacheMaintenance({ log, platformId, snapshot, state })
    return state
}

function scheduleCreditsCacheMaintenance({ log, platformId, snapshot, state }: CreditsCacheMaintenanceParams): void {
    const stale = isNil(snapshot.credits) || isCreditsStale(snapshot.credits)
    if (!stale && !state.credits.blocked && !state.appSumo.blocked) {
        return
    }
    rejectedPromiseHandler(refreshCredits(log, platformId), log)
}

async function readCreditsCaches(platformId: string): Promise<CreditsCacheSnapshot> {
    const [billingEnforced, { credits, appSumo }] = await Promise.all([
        distributedStore.get<boolean>(getBillingEnforcedKey(platformId)),
        readCachedCredits(platformId),
    ])
    return { billingEnforced: billingEnforced ?? false, credits, appSumo }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`Timed out after ${timeoutMs}ms`)), timeoutMs)
        promise.then(
            (value) => {
                clearTimeout(timer)
                resolve(value)
            },
            (rejection) => {
                clearTimeout(timer)
                reject(rejection)
            },
        )
    })
}

export function computeCreditState({ balance, enforced }: ComputeCreditStateParams): CreditsGateState {
    const exhausted = !isNil(balance) && isCreditsExhausted(balance)
    return {
        blocked: enforced && exhausted,
        usage: balance?.usage ?? 0,
        limit: balance?.granted ?? 0,
        remaining: balance?.remaining ?? 0,
        unlimited: balance?.unlimited ?? false,
    }
}

async function sendTrackEvent(params: SendTrackEventParams): Promise<void> {
    const { log, platformId, featureId, value, idempotencyKey } = params
    const { error } = await tryCatch(async () => {
        const client = await autumnUtils.resolveClientForPlatform(log, platformId)
        if (isNil(client)) {
            return
        }
        const properties = { source: params.source, ...params.properties }
        const response = await client.track({ featureId, value, idempotencyKey, properties })
        if (!isNil(response.balance)) {
            await autumnUtils.writeBalance({ platformId, featureId, balance: response.balance })
        }
    })
    if (!isNil(error) && !isDuplicateTrack(error)) {
        log.error({ error, platform: { id: platformId }, feature: { id: featureId } }, 'Failed to track feature usage with Autumn')
    }
}

async function resolveCreditsCache(log: FastifyBaseLogger, platformId: string): Promise<BalanceCacheSnapshot> {
    const cached = await readCachedCredits(platformId)
    if (isNil(cached.credits)) {
        const fetched = await fetchCreditsDeduped(log, platformId)
        if (!isNil(fetched)) {
            return fetched
        }
        return cached
    }
    if (isCreditsStale(cached.credits)) {
        rejectedPromiseHandler(refreshCredits(log, platformId), log)
    }
    return cached
}

async function readCachedCredits(platformId: string): Promise<BalanceCacheSnapshot> {
    const [credits, appSumo] = await Promise.all([
        autumnUtils.readBalance({ platformId, featureId: ConsumableFeatureId.AP_CREDITS }),
        autumnUtils.readBalance({ platformId, featureId: ConsumableFeatureId.APP_SUMO_AI_CREDITS }),
    ])
    return { credits, appSumo }
}

function isCreditsStale(credits: CreditsBalanceCache): boolean {
    return Date.now() - credits.syncedAt > CREDITS_REFETCH_PERIOD_MS
}

function isCreditsExhausted(credits: CreditsBalanceCache): boolean {
    return !credits.unlimited && credits.remaining <= 0
}

async function fetchCreditsDeduped(log: FastifyBaseLogger, platformId: string): Promise<BalanceCacheSnapshot | null> {
    const { data, error } = await tryCatch(() => distributedLock(log).runExclusive({
        key: getCustomerStateFetchLockKey(platformId),
        timeoutInSeconds: CUSTOMER_STATE_FETCH_LOCK_TIMEOUT_SECONDS,
        fn: async () => {
            const cached = await readCachedCredits(platformId)
            if (!isNil(cached.credits)) {
                return cached
            }
            const recentlyMissed = await distributedStore.get<string>(getCustomerStateMissKey(platformId))
            if (!isNil(recentlyMissed)) {
                return null
            }
            const fetched = await fetchCredits(log, platformId)
            if (isNil(fetched?.credits)) {
                await distributedStore.put(getCustomerStateMissKey(platformId), '1', CUSTOMER_STATE_MISS_DEBOUNCE_SECONDS)
            }
            return fetched
        },
    }))
    if (!isNil(error)) {
        log.warn({ error, platform: { id: platformId } }, 'Failed to fetch credits gate snapshot; failing open')
        return null
    }
    return data
}

async function refreshCredits(log: FastifyBaseLogger, platformId: string): Promise<void> {
    await distributedStore.runOnceWithin(getCustomerStateRefreshKey(platformId), CUSTOMER_STATE_REFRESH_DEBOUNCE_SECONDS, () =>
        fetchCredits(log, platformId),
    )
}

async function fetchCredits(log: FastifyBaseLogger, platformId: string): Promise<BalanceCacheSnapshot | null> {
    const client = await autumnUtils.resolveClientForPlatform(log, platformId)
    if (isNil(client)) {
        return null
    }
    const customer = await client.getCustomer()
    return autumnUtils.writeCustomerStateCaches(platformId, customer)
}

async function fetchBillingOverview(log: FastifyBaseLogger, platformId: string): Promise<BillingOverview> {
    const monthStart = apDayjs().startOf('month').toISOString()
    const monthEnd = apDayjs().endOf('month').toISOString()
    const client = await autumnUtils.resolveClientForPlatform(log, platformId)
    if (isNil(client)) {
        return emptyBillingOverview({ startDate: monthStart, endDate: monthEnd })
    }
    const { data: customer, error } = await tryCatch(() => client.getCustomer({ expand: ['subscriptions.plan', 'purchases.plan', 'payment_method', 'billing_controls.auto_topups.purchase_limit'] }))
    if (!isNil(error) || isNil(customer)) {
        log.warn({ error, platform: { id: platformId } }, 'Failed to fetch billing overview; serving an empty overview without caching it')
        return emptyBillingOverview({ startDate: monthStart, endDate: monthEnd, unavailable: true })
    }
    const overview: BillingOverview = {
        ...toBillingInfo(customer, monthStart, monthEnd),
        ...toSeatBreakdown(customer),
        ...toBillableFeatures(customer),
        unavailable: false,
    }
    await distributedStore.put(getBillingOverviewKey(platformId), overview, BILLING_OVERVIEW_TTL_SECONDS)
    return overview
}

type AutumnPlan = NonNullable<GetCustomerResponse['subscriptions'][number]['plan']>

type AutumnPlanItems = AutumnPlan['items']

type CurrentPlanSelection = {
    baseSubscriptions: GetCustomerResponse['subscriptions']
    subscription: GetCustomerResponse['subscriptions'][number] | undefined
    purchase: GetCustomerResponse['purchases'][number] | undefined
    plan: AutumnPlan | null
}

type ComputeCreditStateParams = {
    balance: CreditsBalanceCache | null
    enforced: boolean
}

type WithEnrolledCredsParams<T> = {
    log: FastifyBaseLogger
    platformId: string
    fallback: T
    fn: (creds: ConsoleCustomerCall) => Promise<T>
}

type SendTrackEventParams = TrackFeatureParams & {
    log: FastifyBaseLogger
}

type BillableFeatures = {
    creditsFeature: CreditsBillableFeature | null
    appSumoCreditsFeature: AppSumoCreditsBillableFeature | null
    seatsFeature: SeatsBillableFeature | null
}

type FindPricedFeatureParams<T extends FeatureId> = {
    items: AutumnPlanItems
    featureId: T
}

type PricedFeature<T extends FeatureId> = {
    featureId: T
    pricePerUnit: number
    billingUnits: number
    interval: string | null
}

type WithAutoTopUpParams<T extends ConsumableFeatureId> = {
    feature: PricedFeature<T> | null
    autoTopUps: AutoTopUpConfig[]
}

type CreditsCacheSnapshot = {
    billingEnforced: boolean
    credits: CreditsBalanceCache | null
    appSumo: CreditsBalanceCache | null
}

type CreditsCacheMaintenanceParams = {
    log: FastifyBaseLogger
    platformId: string
    snapshot: CreditsCacheSnapshot
    state: CreditsAndAppSumoState
}
