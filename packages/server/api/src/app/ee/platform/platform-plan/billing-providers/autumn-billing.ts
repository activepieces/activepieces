import { ActivepiecesError, ErrorCode, isNil, tryCatch } from '@activepieces/core-utils'
import { apDayjs } from '@activepieces/server-utils'
import { AiCreditsAutoTopUpState, AutoTopUpConfig, AutumnFeatureId } from '@activepieces/shared'
import { AutumnError, type Balance } from 'autumn-js'
import { FastifyBaseLogger } from 'fastify'
import { getBillingEnforcedKey, getCustomerStateRefreshKey } from '../../../../database/redis/keys'
import { distributedLock, distributedStore } from '../../../../database/redis-connections'
import { rejectedPromiseHandler } from '../../../../helper/promise-handler'
import { ActivateLicenseParams, ApplyAppSumoPlanParams, AppSumoAiCreditsUsage, BillingProvider, CreditsGateState, CreditsUsage, ReportUsageCountsParams, TrackAppSumoAiUsageParams, TrackCreditsParams } from '../../../../platform/billing-provider'
import { platformPlanService } from '../platform-plan.service'
import { autumnConsole, autumnUtils, CreditsBalanceCache } from './autumn-utils'

const CREDITS_REFETCH_PERIOD_MS = 180 * 1000
const BILLING_ENFORCED_TTL_SECONDS = 24 * 60 * 60
const CUSTOMER_STATE_REFRESH_DEBOUNCE_SECONDS = 60
const CUSTOMER_STATE_FETCH_LOCK_TIMEOUT_SECONDS = 15
const AUTO_TOP_UP_ONLY_FEATURE_IDS: string[] = [AutumnFeatureId.AP_CREDITS, AutumnFeatureId.APP_SUMO_AI_CREDITS]

export const autumnBillingProvider = (log: FastifyBaseLogger): BillingProvider => ({
    listPlans: async (platformId: string) => {
        return autumnConsole.listPlans({ platformId })
    },
    getTopUpSettings: async (platformId: string) => {
        const client = await autumnUtils.resolveClientForPlatform(log, platformId)
        const creds = await autumnConsole.getCreds(log, platformId)
        if (isNil(client) || isNil(creds)) {
            return { autoTopUps: [], topUpFeatures: [] }
        }
        const customer = await client.getCustomer({ expand: ['billing_controls.auto_topups.purchase_limit'] })
        const autoTopUps: AutoTopUpConfig[] = (customer.billingControls?.autoTopups ?? []).flatMap((autoTopUp) => {
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
        return { autoTopUps, topUpFeatures: await autumnConsole.toppableFeatures(creds) }
    },
    createCheckoutSession: async ({ platformId, planId, successUrl }) => {
        await autumnUtils.ensureEnrolled(log, platformId)
        const creds = await autumnConsole.getCreds(log, platformId)
        if (isNil(creds)) {
            return { checkoutUrl: null }
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
    getBillingInfo: async (platformId) => {
        const monthStart = apDayjs().startOf('month').unix()
        const monthEnd = apDayjs().endOf('month').unix()
        const client = await autumnUtils.resolveClientForPlatform(log, platformId)
        if (isNil(client)) {
            return { startDate: monthStart, endDate: monthEnd, nextBillingAmount: 0, cancelAt: null, planId: null, planName: null, scheduledPlanName: null, billingPortalAvailable: false }
        }
        const customer = await client.getCustomer({ expand: ['subscriptions.plan', 'payment_method'] })
        const baseSubscriptions = customer.subscriptions.filter((subscription) => !subscription.addOn)
        const basePlan = baseSubscriptions.find((subscription) => subscription.status === 'active') ?? baseSubscriptions[0]
        const scheduledPlan = baseSubscriptions.find((subscription) => subscription !== basePlan)
        return {
            planId: basePlan?.planId ?? null,
            planName: basePlan?.plan?.name ?? null,
            startDate: msToUnixSeconds(basePlan?.currentPeriodStart) ?? monthStart,
            endDate: msToUnixSeconds(basePlan?.currentPeriodEnd) ?? monthEnd,
            nextBillingAmount: basePlan?.plan?.price?.amount ?? 0,
            cancelAt: msToUnixSeconds(basePlan?.expiresAt) ?? null,
            scheduledPlanName: scheduledPlan?.plan?.name ?? null,
            billingPortalAvailable: !isNil(customer.paymentMethod),
        }
    },
    topUpFeature: async ({ platformId, featureId, quantity, successUrl }) => {
        if (AUTO_TOP_UP_ONLY_FEATURE_IDS.includes(featureId)) {
            throw new ActivepiecesError({
                code: ErrorCode.DOES_NOT_MEET_BUSINESS_REQUIREMENTS,
                params: { message: 'Manual top-up is not available for consumable credits; use auto-top-up instead' },
            })
        }
        await autumnUtils.ensureEnrolled(log, platformId)
        const creds = await autumnConsole.getCreds(log, platformId)
        if (isNil(creds)) {
            return { checkoutUrl: null }
        }
        const { paymentUrl } = await autumnConsole.topUp({ ...creds, featureId, quantity, successUrl })
        return { checkoutUrl: paymentUrl }
    },
    configureAutoTopUp: async (params) => {
        await autumnUtils.ensureEnrolled(log, params.platformId)
        const client = await autumnUtils.resolveClientForPlatform(log, params.platformId)
        const creds = await autumnConsole.getCreds(log, params.platformId)
        if (isNil(client) || isNil(creds)) {
            return {}
        }
        if (params.state === AiCreditsAutoTopUpState.DISABLED) {
            await autumnConsole.configureAutoTopUp({ ...creds, featureId: params.featureId, enabled: false })
            return {}
        }
        const customer = await client.getCustomer({ expand: ['payment_method'] })
        const setupPaymentReturnUrl = isNil(customer?.paymentMethod) ? params.returnUrl : undefined
        const { setupPaymentUrl } = await autumnConsole.configureAutoTopUp({
            ...creds,
            featureId: params.featureId,
            enabled: true,
            threshold: params.minThreshold,
            quantity: params.creditsToAdd,
            maxMonthlyTopUps: params.maxMonthlyTopUps,
            setupPaymentReturnUrl,
        })
        return isNil(setupPaymentUrl) ? {} : { setupPaymentUrl }
    },
    cancelSubscription: async ({ platformId }) => {
        await autumnUtils.ensureEnrolled(log, platformId)
        const creds = await autumnConsole.getCreds(log, platformId)
        if (isNil(creds)) {
            return
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
    applyAppSumoPlan: async ({ platformId, planId, action }: ApplyAppSumoPlanParams) => {
        await autumnUtils.ensureEnrolled(log, platformId)
        await autumnConsole.compAppSumo({ platformId, planId, action })
        await autumnUtils.refreshEntitlements(log, platformId)
    },
    activateLicense: async ({ platformId, licenseKey }: ActivateLicenseParams) => {
        const credentials = await autumnConsole.activate({ licenseKey, platformId })
        await platformPlanService(log).update({ platformId, licenseKey })
        await platformPlanService(log).setAutumnCredentials({ platformId, ...credentials })
        await autumnUtils.refreshEntitlements(log, platformId)
    },
    isBillingEnforced: async (platformId: string) => {
        return (await resolveCustomerState(log, platformId)).billingEnforced
    },
    shouldBlockOnCredits: async (platformId: string) => {
        return (await computeCreditsState(log, platformId)).blocked
    },
    getCreditsState: async (platformId: string) => {
        return computeCreditsState(log, platformId)
    },
    getAppSumoAiCreditsState: async (platformId: string) => {
        const { appSumo: balance } = await resolveCustomerState(log, platformId)
        if (isNil(balance) || balance.unlimited) {
            return { blocked: false, usage: balance?.usage ?? 0, limit: balance?.granted ?? 0, remaining: balance?.remaining ?? 0, unlimited: balance?.unlimited ?? false }
        }
        return { blocked: balance.remaining <= 0, usage: balance.usage, limit: balance.granted, remaining: balance.remaining, unlimited: false }
    },
    getConsumablesUsage: async (platformId: string) => {
        const client = await autumnUtils.resolveClientForPlatform(log, platformId)
        if (isNil(client)) {
            return { credits: null, appSumo: null }
        }
        const customer = await client.getCustomer()
        return {
            credits: toCreditsUsage(customer.balances[AutumnFeatureId.AP_CREDITS]),
            appSumo: toAppSumoAiCreditsUsage(customer.balances[AutumnFeatureId.APP_SUMO_AI_CREDITS]),
        }
    },
})

function toCreditsUsage(balance: Balance | undefined): CreditsUsage | null {
    if (isNil(balance)) {
        return null
    }
    return { usage: balance.usage, remaining: balance.unlimited ? null : balance.remaining, nextResetAt: msToUnixSeconds(balance.nextResetAt) }
}

function toAppSumoAiCreditsUsage(balance: Balance | undefined): AppSumoAiCreditsUsage | null {
    if (isNil(balance) || balance.unlimited || isNil(balance.granted) || balance.granted <= 0) {
        return null
    }
    return { usage: balance.usage, limit: balance.granted }
}

function isDuplicateTrack(error: unknown): boolean {
    return error instanceof AutumnError && error.statusCode === 409
}

function msToUnixSeconds(ms: number | null | undefined): number | null {
    return isNil(ms) ? null : Math.floor(ms / 1000)
}

async function computeCreditsState(log: FastifyBaseLogger, platformId: string): Promise<CreditsGateState> {
    const { billingEnforced, credits: balance } = await resolveCustomerState(log, platformId)
    const exhausted = !isNil(balance) && !balance.unlimited && balance.remaining <= 0
    return {
        blocked: billingEnforced && exhausted,
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

async function resolveCustomerState(log: FastifyBaseLogger, platformId: string): Promise<CustomerState> {
    const cached = await readCachedCustomerState(platformId)
    if (isNil(cached.billingEnforced) || isNil(cached.credits)) {
        const fetched = await fetchCustomerStateDeduped(log, platformId)
        if (!isNil(fetched)) {
            return fetched
        }
        return { billingEnforced: cached.billingEnforced ?? false, credits: cached.credits, appSumo: cached.appSumo }
    }
    if (isCreditsStale(cached.credits)) {
        rejectedPromiseHandler(refreshCustomerState(log, platformId), log)
    }
    return { billingEnforced: cached.billingEnforced, credits: cached.credits, appSumo: cached.appSumo }
}

async function readCachedCustomerState(platformId: string): Promise<CachedCustomerState> {
    const [billingEnforced, credits, appSumo] = await Promise.all([
        distributedStore.get<boolean>(getBillingEnforcedKey(platformId)),
        autumnUtils.readCreditsBalance(platformId),
        autumnUtils.readAppSumoAiCreditsBalance(platformId),
    ])
    return { billingEnforced, credits, appSumo }
}

function isCreditsStale(credits: CreditsBalanceCache): boolean {
    return Date.now() - credits.syncedAt > CREDITS_REFETCH_PERIOD_MS
}

async function fetchCustomerStateDeduped(log: FastifyBaseLogger, platformId: string): Promise<CustomerState | null> {
    const { data, error } = await tryCatch(() => distributedLock(log).runExclusive({
        key: `customer_state_fetch_${platformId}`,
        timeoutInSeconds: CUSTOMER_STATE_FETCH_LOCK_TIMEOUT_SECONDS,
        fn: async () => {
            const cached = await readCachedCustomerState(platformId)
            if (!isNil(cached.billingEnforced) && !isNil(cached.credits)) {
                return { billingEnforced: cached.billingEnforced, credits: cached.credits, appSumo: cached.appSumo }
            }
            return fetchCustomerState(log, platformId)
        },
    }))
    if (!isNil(error)) {
        log.warn({ error, platform: { id: platformId } }, 'Failed to fetch credits gate snapshot; failing open')
        return null
    }
    return data
}

async function refreshCustomerState(log: FastifyBaseLogger, platformId: string): Promise<void> {
    const claimed = await distributedStore.putIfAbsent(getCustomerStateRefreshKey(platformId), '1', CUSTOMER_STATE_REFRESH_DEBOUNCE_SECONDS)
    if (!claimed) {
        return
    }
    await fetchCustomerState(log, platformId)
}

async function fetchCustomerState(log: FastifyBaseLogger, platformId: string): Promise<CustomerState | null> {
    const client = await autumnUtils.resolveClientForPlatform(log, platformId)
    if (isNil(client)) {
        return null
    }
    const customer = await client.getCustomer()
    const billingEnforced = !isNil(customer.flags[AutumnFeatureId.BILLING_ENFORCED])
    const creditsBalance = customer.balances[AutumnFeatureId.AP_CREDITS]
    const appSumoBalance = customer.balances[AutumnFeatureId.APP_SUMO_AI_CREDITS]
    await Promise.all([
        distributedStore.put(getBillingEnforcedKey(platformId), billingEnforced, BILLING_ENFORCED_TTL_SECONDS),
        isNil(creditsBalance) ? Promise.resolve() : autumnUtils.writeCreditsBalance(platformId, creditsBalance),
        isNil(appSumoBalance) ? Promise.resolve() : autumnUtils.writeAppSumoAiCreditsBalance(platformId, appSumoBalance),
    ])
    return {
        billingEnforced,
        credits: isNil(creditsBalance) ? null : autumnUtils.toBalanceCache(creditsBalance),
        appSumo: isNil(appSumoBalance) ? null : autumnUtils.toBalanceCache(appSumoBalance),
    }
}

type CustomerState = {
    billingEnforced: boolean
    credits: CreditsBalanceCache | null
    appSumo: CreditsBalanceCache | null
}

type CachedCustomerState = {
    billingEnforced: boolean | null
    credits: CreditsBalanceCache | null
    appSumo: CreditsBalanceCache | null
}
