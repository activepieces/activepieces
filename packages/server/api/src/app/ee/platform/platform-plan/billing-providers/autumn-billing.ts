import { isNil, tryCatch } from '@activepieces/core-utils'
import { apDayjs } from '@activepieces/server-utils'
import { AiCreditsAutoTopUpState, AutoTopUpConfig, AutumnFeatureId, BillableFeature, isConsumableAutumnFeature, PlanName } from '@activepieces/shared'
import { AutumnError, type GetCustomerResponse } from 'autumn-js'
import { FastifyBaseLogger } from 'fastify'
import { getBillingEnforcedKey, getBillingOverviewKey, getCustomerStateRefreshKey } from '../../../../database/redis/keys'
import { distributedLock, distributedStore } from '../../../../database/redis-connections'
import { rejectedPromiseHandler } from '../../../../helper/promise-handler'
import { ActivateLicenseParams, ApplyAppSumoPlanParams, AppSumoAiCreditsUsage, BillingInfo, BillingOverview, BillingProvider, CreditsAndAppSumoState, CreditsGateState, CreditsUsage, ReportUsageCountsParams, TrackAppSumoAiUsageParams, TrackCreditsParams } from '../../../../platform/billing-provider'
import { assertSeatsNotBelowActiveUsers, platformPlanService } from '../platform-plan.service'
import { autumnConsole, autumnUtils, BalanceCacheSnapshot, CreditsBalanceCache } from './autumn-utils'

const CREDITS_REFETCH_PERIOD_MS = 180 * 1000
const CUSTOMER_STATE_REFRESH_DEBOUNCE_SECONDS = 60
const CUSTOMER_STATE_FETCH_LOCK_TIMEOUT_SECONDS = 15
const BILLING_OVERVIEW_TTL_SECONDS = 5 * 60

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
            key: `billing_overview_fetch_${platformId}`,
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
    createCheckoutSession: async ({ platformId, planId, successUrl }) => {
        await autumnUtils.ensureEnrolled(log, platformId)
        const creds = await autumnConsole.getCreds(log, platformId)
        if (isNil(creds)) {
            return { checkoutUrl: null }
        }
        const targetPlan = (await autumnConsole.listPlans({ platformId })).find((plan) => plan.id === planId)
        if (!isNil(targetPlan) && !isNil(targetPlan.includedSeats)) {
            await assertSeatsNotBelowActiveUsers({ platformId, targetLimit: targetPlan.includedSeats, log })
        }
        const { paymentUrl } = await autumnConsole.checkout({ ...creds, planId, successUrl })
        return { checkoutUrl: paymentUrl }
    },
    getBillingPortalUrl: async ({ platformId, returnUrl }) => {
        const creds = await autumnConsole.getCreds(log, platformId)
        if (isNil(creds)) {
            return { url: '' }
        }
        const { url } = await autumnConsole.portal({ ...creds, returnUrl })
        return { url: url ?? '' }
    },
    adjustUnconsumableFeatureQuantity: async ({ platformId, featureId, quantity, successUrl }) => {
        await autumnUtils.ensureEnrolled(log, platformId)
        if (featureId === AutumnFeatureId.USERS_LIMIT) {
            await assertSeatsNotBelowActiveUsers({ platformId, targetLimit: quantity, log })
        }
        const creds = await autumnConsole.getCreds(log, platformId)
        if (isNil(creds)) {
            return { checkoutUrl: null }
        }
        const { paymentUrl } = await autumnConsole.setUnconsumableQuantity({ ...creds, featureId, quantity, successUrl })
        return { checkoutUrl: paymentUrl }
    },
    checkUsersExceededLimit: async ({ platformId, entityManager }) => {
        await platformPlanService(log).checkUsersExceededLimit({ platformId, entityManager })
    },
    configureAutoTopUp: async (params) => {
        await autumnUtils.ensureEnrolled(log, params.platformId)
        const creds = await autumnConsole.getCreds(log, params.platformId)
        if (isNil(creds)) {
            return
        }
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
    setupPayment: async ({ platformId, redirectUrl }) => {
        await autumnUtils.ensureEnrolled(log, platformId)
        const creds = await autumnConsole.getCreds(log, platformId)
        if (isNil(creds)) {
            return { url: null }
        }
        return autumnConsole.setupPayment({ ...creds, redirectUrl })
    },
    cancelSubscription: async ({ platformId }) => {
        await autumnUtils.ensureEnrolled(log, platformId)
        const creds = await autumnConsole.getCreds(log, platformId)
        if (isNil(creds)) {
            return
        }
        const freePlan = (await autumnConsole.listPlans({ platformId })).find((plan) => plan.id === PlanName.FREE)
        if (!isNil(freePlan) && !isNil(freePlan.includedSeats)) {
            await assertSeatsNotBelowActiveUsers({ platformId, targetLimit: freePlan.includedSeats, log })
        }
        await autumnConsole.cancel({ ...creds })
    },
    reactivateSubscription: async ({ platformId }) => {
        await autumnUtils.ensureEnrolled(log, platformId)
        const creds = await autumnConsole.getCreds(log, platformId)
        if (isNil(creds)) {
            return
        }
        await autumnConsole.reactivate({ ...creds })
    },
    trackCredits: async (params: TrackCreditsParams) => {
        const client = await autumnUtils.resolveClientForPlatform(log, params.platformId)
        if (isNil(client)) {
            return
        }
        try {
            const response = await client.track({
                featureId: AutumnFeatureId.AP_CREDITS,
                value: params.value,
                idempotencyKey: params.idempotencyKey,
                properties: { source: params.source, ...params.properties },
            })
            if (!isNil(response.balance)) {
                await autumnUtils.writeCreditsBalance(params.platformId, response.balance)
            }
        }
        catch (error) {
            if (isDuplicateTrack(error)) {
                return
            }
            throw error
        }
    },
    trackAppSumoAiUsage: async (params: TrackAppSumoAiUsageParams) => {
        const client = await autumnUtils.resolveClientForPlatform(log, params.platformId)
        if (isNil(client)) {
            return
        }
        try {
            const response = await client.track({
                featureId: AutumnFeatureId.APP_SUMO_AI_CREDITS,
                value: params.value,
                idempotencyKey: params.idempotencyKey,
                properties: { ...params.properties },
            })
            if (!isNil(response.balance)) {
                await autumnUtils.writeAppSumoAiCreditsBalance(params.platformId, response.balance)
            }
        }
        catch (error) {
            if (isDuplicateTrack(error)) {
                return
            }
            throw error
        }
    },
    reportUsageCounts: async (params: ReportUsageCountsParams) => {
        await reportUsageCounts(log, params)
    },
    ensureEnrolled: async (platformId: string) => {
        await autumnUtils.ensureEnrolled(log, platformId)
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
        await platformPlanService(log).update({ platformId, licenseKey })
        await platformPlanService(log).setAutumnCredentials({ platformId, ...credentials })
        await autumnUtils.refreshEntitlements(log, platformId)
    },
    isBillingEnforced: async (platformId: string) => {
        return (await distributedStore.get<boolean>(getBillingEnforcedKey(platformId))) ?? false
    },
    shouldBlockOnCredits: async (platformId: string) => {
        return (await computeCreditsState(log, platformId)).blocked
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

function toBillingInfo(customer: GetCustomerResponse, monthStart: string, monthEnd: string): BillingInfo {
    const baseSubscriptions = customer.subscriptions.filter((subscription) => !subscription.addOn)
    const activeBaseSubscriptions = baseSubscriptions.filter((subscription) => subscription.status === 'active')
    const baseSubscription = activeBaseSubscriptions.find((subscription) => subscription.planId !== PlanName.FREE)
        ?? activeBaseSubscriptions[0]
        ?? baseSubscriptions[0]
    // A lifetime plan (e.g. AppSumo) has no recurring price, so Autumn models it as a one-off `purchase`
    const purchasedPlan = (customer.purchases ?? []).find((purchase) =>
        !isNil(purchase.plan) && !purchase.plan.addOn && purchase.planId !== PlanName.FREE)
    const currentPlan = purchasedPlan ?? baseSubscription
    const scheduledPlan = baseSubscriptions.find((subscription) => subscription !== baseSubscription)
    return {
        planName: currentPlan?.plan?.name ?? null,
        startDate: msToIso(baseSubscription?.currentPeriodStart) ?? monthStart,
        endDate: msToIso(baseSubscription?.currentPeriodEnd) ?? monthEnd,
        nextBillingAmount: baseSubscription?.plan?.price?.amount ?? 0,
        cancelAt: msToIso(baseSubscription?.expiresAt) ?? null,
        trialEndsAt: msToIso(baseSubscription?.trialEndsAt) ?? null,
        scheduledPlanName: scheduledPlan?.plan?.name ?? null,
        billingPortalAvailable: !isNil(customer.paymentMethod),
    }
}

function toBillableFeatures(customer: GetCustomerResponse): BillableFeature[] {
    const baseSubscriptions = customer.subscriptions.filter((subscription) => !subscription.addOn)
    const trialing = baseSubscriptions.some((subscription) => !isNil(subscription.trialEndsAt) && subscription.trialEndsAt > apDayjs().valueOf())
    if (trialing) {
        return []
    }
    const active = baseSubscriptions.find((subscription) => subscription.status === 'active')
    return (active?.plan?.items ?? []).flatMap((item) => {
        if (!autumnUtils.isAutumnFeatureId(item.featureId) || item.price?.billingMethod !== 'prepaid' || isNil(item.price.amount)) {
            return []
        }
        return [{ featureId: item.featureId, pricePerUnit: item.price.amount, billingUnits: item.price.billingUnits ?? 1, interval: item.price.interval ?? null }]
    })
}

function toSeatBreakdown(customer: GetCustomerResponse): { includedSeats: number | null, additionalSeats: number | null } {
    const balance = customer.balances[AutumnFeatureId.USERS_LIMIT]
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
        if (!autumnUtils.isAutumnFeatureId(autoTopUp.featureId)) {
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

async function computeCreditsState(log: FastifyBaseLogger, platformId: string): Promise<CreditsGateState> {
    return (await computeCreditsAndAppSumoState(log, platformId)).credits
}

async function computeCreditsAndAppSumoState(log: FastifyBaseLogger, platformId: string): Promise<CreditsAndAppSumoState> {
    const [billingEnforced, { credits, appSumo }] = await Promise.all([
        distributedStore.get<boolean>(getBillingEnforcedKey(platformId)),
        resolveCreditsCache(log, platformId),
    ])
    return {
        credits: toCreditsGateState(credits, billingEnforced ?? false),
        appSumo: toAppSumoGateState(appSumo),
    }
}

export function toCreditsGateState(balance: CreditsBalanceCache | null, billingEnforced: boolean): CreditsGateState {
    const exhausted = !isNil(balance) && !balance.unlimited && balance.remaining <= 0
    return {
        blocked: billingEnforced && exhausted,
        usage: balance?.usage ?? 0,
        limit: balance?.granted ?? 0,
        remaining: balance?.remaining ?? 0,
        unlimited: balance?.unlimited ?? false,
    }
}

export function toAppSumoGateState(balance: CreditsBalanceCache | null): CreditsGateState {
    const exhausted = !isNil(balance) && !balance.unlimited && balance.remaining <= 0
    return {
        blocked: exhausted,
        usage: balance?.usage ?? 0,
        limit: balance?.granted ?? 0,
        remaining: balance?.remaining ?? 0,
        unlimited: balance?.unlimited ?? false,
    }
}

async function reportUsageCounts(log: FastifyBaseLogger, { platformId, activeFlows, teamProjects, users }: ReportUsageCountsParams): Promise<void> {
    const client = await autumnUtils.resolveClientForPlatform(log, platformId)
    if (isNil(client)) {
        return
    }
    const results = await Promise.allSettled([
        client.setUsage({ featureId: AutumnFeatureId.ACTIVE_FLOWS_LIMIT, usage: activeFlows }),
        client.setUsage({ featureId: AutumnFeatureId.TEAM_PROJECTS_LIMIT, usage: teamProjects }),
        client.setUsage({ featureId: AutumnFeatureId.USERS_LIMIT, usage: users }),
    ])
    const errors = results.flatMap((result) => result.status === 'rejected' ? [result.reason] : [])
    if (errors.length > 0) {
        log.warn({ error: errors[0], platform: { id: platformId } }, 'Failed to report usage counts to Autumn')
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
        autumnUtils.readCreditsBalance(platformId),
        autumnUtils.readAppSumoAiCreditsBalance(platformId),
    ])
    return { credits, appSumo }
}

function isCreditsStale(credits: CreditsBalanceCache): boolean {
    return Date.now() - credits.syncedAt > CREDITS_REFETCH_PERIOD_MS
}

async function fetchCreditsDeduped(log: FastifyBaseLogger, platformId: string): Promise<BalanceCacheSnapshot | null> {
    const { data, error } = await tryCatch(() => distributedLock(log).runExclusive({
        key: `customer_state_fetch_${platformId}`,
        timeoutInSeconds: CUSTOMER_STATE_FETCH_LOCK_TIMEOUT_SECONDS,
        fn: async () => {
            const cached = await readCachedCredits(platformId)
            if (!isNil(cached.credits)) {
                return cached
            }
            return fetchCredits(log, platformId)
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
        return { startDate: monthStart, endDate: monthEnd, nextBillingAmount: 0, cancelAt: null, trialEndsAt: null, planName: null, scheduledPlanName: null, billingPortalAvailable: false, autoTopUps: [], consumableFeatures: [], nonConsumableFeatures: [], includedSeats: null, additionalSeats: null }
    }
    const customer = await client.getCustomer({ expand: ['subscriptions.plan', 'purchases.plan', 'payment_method', 'billing_controls.auto_topups.purchase_limit'] })
    const billableFeatures = toBillableFeatures(customer)
    const overview: BillingOverview = {
        ...toBillingInfo(customer, monthStart, monthEnd),
        ...toSeatBreakdown(customer),
        autoTopUps: toAutoTopUps(customer),
        consumableFeatures: billableFeatures.filter((feature) => isConsumableAutumnFeature(feature.featureId)),
        nonConsumableFeatures: billableFeatures.filter((feature) => !isConsumableAutumnFeature(feature.featureId)),
    }
    await distributedStore.put(getBillingOverviewKey(platformId), overview, BILLING_OVERVIEW_TTL_SECONDS)
    return overview
}
