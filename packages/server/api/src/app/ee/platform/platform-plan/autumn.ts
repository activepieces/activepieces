import { ActivepiecesError, ErrorCode, isEmpty, isNil } from '@activepieces/core-utils'
import { apDayjs, apVersionUtil, safeHttp } from '@activepieces/server-utils'
import { AutoTopUpConfig, AutumnFeatureId, PlatformPlanLimits, PurchasablePlan, ToppableFeature } from '@activepieces/shared'
import {
    Autumn,
    AutumnError,
    type Balance,
    type CheckParams,
    type CreateEntityParams,
    type GetCustomerParams,
    type GetCustomerResponse,
    type GetEntityParams,
    type ListPlansParams,
    type TrackParams,
} from 'autumn-js'
import { FastifyBaseLogger } from 'fastify'
import { lru, LRU } from 'tiny-lru'
import { getAppSumoAiCreditsBalanceKey, getBillingEnforcedKey, getCreditsBalanceKey } from '../../../database/redis/keys'
import { distributedLock, distributedStore } from '../../../database/redis-connections'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { ActivateLicenseParams, ApplyAppSumoPlanParams, AppSumoAction, AppSumoAiCreditsUsage, BillingProvider, CreditsGateState, CreditsUsage, TrackAppSumoAiUsageParams, TrackCreditsParams } from '../../../platform/billing-provider'
import { platformPlanService } from './platform-plan.service'

const CREDITS_CACHE_TTL_SECONDS = 180
const CONSOLE_REQUEST_TIMEOUT_MS = 30000
const CREDENTIALS_CACHE_TTL_MS = 5 * 60 * 1000
const CREDENTIALS_CACHE_MAX_ENTRIES = 10000

const credentialsCache: LRU<ResolvedAutumnCredentials> = lru(CREDENTIALS_CACHE_MAX_ENTRIES, CREDENTIALS_CACHE_TTL_MS)

const AUTUMN_CONSOLE_URL = 'https://console.activepieces.com'
const AUTUMN_FREE_PLAN_ID = 'free'

// Consumable credit features are refilled by auto-top-up ONLY — never a manual one-off purchase (product
// decision). Manual top-up is reserved for non-consumable limit features bought outright (e.g. usersLimit).
// Keep in sync with the frontend feature `kind`.
const AUTO_TOP_UP_ONLY_FEATURE_IDS: string[] = [AutumnFeatureId.AP_CREDITS, AutumnFeatureId.APP_SUMO_AI_CREDITS]


const AUTUMN_FLAG_FEATURE_IDS = [
    'tablesEnabled',
    'eventStreamingEnabled',
    'environmentsEnabled',
    'analyticsEnabled',
    'showPoweredBy',
    'auditLogEnabled',
    'embeddingEnabled',
    'aiProvidersEnabled',
    'chatEnabled',
    'dataManipulationEnabled',
    'managePiecesEnabled',
    'manageTemplatesEnabled',
    'customAppearanceEnabled',
    'projectRolesEnabled',
    'globalConnectionsEnabled',
    'customRolesEnabled',
    'apiKeysEnabled',
    'ssoEnabled',
    'secretManagersEnabled',
    'scimEnabled',
] as const satisfies readonly (keyof PlatformPlanLimits & `${AutumnFeatureId}`)[]

export const autumnUtils = {
    consoleUrl: AUTUMN_CONSOLE_URL,
    client({ secretKey, customerId, serverURL }: AutumnClientParams) {
        const client = new Autumn({ secretKey, serverURL, failOpen: true })
        return {
            check(params: WithoutCustomerId<CheckParams>) {
                return client.check({ customerId, ...params })
            },
            track({ idempotencyKey, ...params }: TrackInput) {
                return client.track(
                    { customerId, ...params },
                    idempotencyKey ? { headers: { 'Idempotency-Key': idempotencyKey } } : undefined,
                )
            },
            getCustomer(params?: { expand?: GetCustomerParams['expand'] }) {
                return client.customers.get({ customerId, expand: params?.expand })
            },
            createEntity(params: WithoutCustomerId<CreateEntityParams>) {
                return client.entities.create({ customerId, ...params })
            },
            getEntity(params: WithoutCustomerId<GetEntityParams>) {
                return client.entities.get({ customerId, ...params })
            },
            listPlans(params?: ListPlansParams) {
                return client.plans.list(params)
            },
        }
    },
    async resolveClientForPlatform(log: FastifyBaseLogger, platformId: string) {
        const cached = credentialsCache.get(platformId)
        if (!isNil(cached)) {
            return autumnUtils.client({ secretKey: cached.autumnApiKey, customerId: cached.autumnCustomerId })
        }
        const { autumnCustomerId, autumnApiKey } = await platformPlanService(log).getAutumnCredentials(platformId)
        if (isNil(autumnCustomerId) || isNil(autumnApiKey)) {
            return null
        }
        credentialsCache.set(platformId, { autumnCustomerId, autumnApiKey })
        return autumnUtils.client({ secretKey: autumnApiKey, customerId: autumnCustomerId })
    },
    async ensureEnrolled(log: FastifyBaseLogger, platformId: string): Promise<void> {
        const { autumnCustomerId } = await platformPlanService(log).getAutumnCredentials(platformId)
        if (!isNil(autumnCustomerId)) {
            return
        }
        await distributedLock(log).runExclusive({
            key: `autumn_enroll_${platformId}`,
            timeoutInSeconds: 60,
            fn: async () => {
                const { autumnCustomerId } = await platformPlanService(log).getAutumnCredentials(platformId)
                if (!isNil(autumnCustomerId)) {
                    return
                }
                const platformPlan = await platformPlanService(log).getOrCreateForPlatform(platformId)
                const credentials = isNil(platformPlan.licenseKey) || isEmpty(platformPlan.licenseKey)
                    ? await subscribeFreeOnConsole({ platformId })
                    : await activateOnConsole({ licenseKey: platformPlan.licenseKey, platformId })
                await platformPlanService(log).setAutumnCredentials({ platformId, ...credentials })
                await autumnUtils.refreshEntitlements(log, platformId)
            },
        })
    },
    async refreshEntitlements(log: FastifyBaseLogger, platformId: string): Promise<void> {
        const client = await autumnUtils.resolveClientForPlatform(log, platformId)
        if (isNil(client)) {
            return
        }
        const customer = await client.getCustomer()
        const entitlements = toAutumnEntitlements(customer)
        await platformPlanService(log).update({ platformId, ...autumnUtils.mapEntitlementsToPlanLimits(entitlements) })
        const creditsBalance = customer.balances[AutumnFeatureId.AP_CREDITS]
        if (!isNil(creditsBalance)) {
            await autumnUtils.writeCreditsBalance(platformId, creditsBalance)
        }
        const appSumoBalance = customer.balances[AutumnFeatureId.APP_SUMO_AI_CREDITS]
        if (!isNil(appSumoBalance)) {
            await autumnUtils.writeAppSumoAiCreditsBalance(platformId, appSumoBalance)
        }
    },
    mapEntitlementsToPlanLimits(entitlements: AutumnEntitlements): Partial<PlatformPlanLimits> {
        const flags: Partial<PlatformPlanLimits> = {}
        for (const feature of AUTUMN_FLAG_FEATURE_IDS) {
            flags[feature] = entitlements.flags[feature] ?? false
        }
        const teamProjects = entitlements.balances[AutumnFeatureId.TEAM_PROJECTS_LIMIT]
        const users = entitlements.balances[AutumnFeatureId.USERS_LIMIT]
        const activeFlows = entitlements.balances[AutumnFeatureId.ACTIVE_FLOWS_LIMIT]
        const credits = entitlements.balances[AutumnFeatureId.AP_CREDITS]
        return {
            ...flags,
            plan: entitlements.planId,
            teamProjectsLimit: toProjectedLimit(teamProjects, 0),
            usersLimit: toProjectedLimit(users, null),
            activeFlowsLimit: toProjectedLimit(activeFlows, null),
            includedCredits: credits?.granted ?? 0,
            billingEnforced: entitlements.flags[AutumnFeatureId.BILLING_ENFORCED] ?? false,
        }
    },
    async readCreditsBalance(platformId: string): Promise<CreditsBalanceCache | null> {
        return distributedStore.get<CreditsBalanceCache>(getCreditsBalanceKey(platformId))
    },
    async writeCreditsBalance(platformId: string, balance: Balance): Promise<void> {
        await distributedStore.put(getCreditsBalanceKey(platformId), toBalanceCache(balance), CREDITS_CACHE_TTL_SECONDS)
    },
    async readAppSumoAiCreditsBalance(platformId: string): Promise<CreditsBalanceCache | null> {
        return distributedStore.get<CreditsBalanceCache>(getAppSumoAiCreditsBalanceKey(platformId))
    },
    async writeAppSumoAiCreditsBalance(platformId: string, balance: Balance): Promise<void> {
        await distributedStore.put(getAppSumoAiCreditsBalanceKey(platformId), toBalanceCache(balance), CREDITS_CACHE_TTL_SECONDS)
    },
}

export const autumnBillingProvider = (log: FastifyBaseLogger): BillingProvider => ({
    listPlans: async (platformId: string) => {
        // The console (master key) owns the catalog + plan-applicability — including which plans a given AP
        // image version may purchase — so we send the running version and let it return the applicable set.
        const response = await safeHttp.axios.post<ConsolePlansEnvelope>(
            `${AUTUMN_CONSOLE_URL}/api/billing/plans`,
            { version: apVersionUtil.getCurrentRelease(), platformId },
            { timeout: CONSOLE_REQUEST_TIMEOUT_MS },
        )
        return response.data.data
    },
    getTopUpSettings: async (platformId: string) => {
        const client = await autumnUtils.resolveClientForPlatform(log, platformId)
        const creds = await getConsoleCreds(log, platformId)
        if (isNil(client) || isNil(creds)) {
            return { autoTopUps: [], topUpFeatures: [] }
        }
        const customer = await client.getCustomer({ expand: ['billing_controls.auto_topups.purchase_limit'] })
        const autoTopUps: AutoTopUpConfig[] = (customer.billingControls?.autoTopups ?? []).flatMap((autoTopUp) => {
            if (!isAutumnFeatureId(autoTopUp.featureId)) {
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
        return { autoTopUps, topUpFeatures: await toppableFeaturesOnConsole(creds) }
    },
    createCheckoutSession: async ({ platformId, planId, successUrl }) => {
        await autumnUtils.ensureEnrolled(log, platformId)
        const creds = await getConsoleCreds(log, platformId)
        if (isNil(creds)) {
            return { checkoutUrl: null }
        }
        const { paymentUrl } = await checkoutOnConsole({ ...creds, planId, successUrl })
        return { checkoutUrl: paymentUrl }
    },
    getBillingPortalUrl: async ({ platformId, returnUrl }) => {
        const creds = await getConsoleCreds(log, platformId)
        if (isNil(creds)) {
            return { url: '' }
        }
        const { url } = await portalOnConsole({ ...creds, returnUrl })
        return { url: url ?? '' }
    },
    getBillingInfo: async (platformId) => {
        const monthStart = apDayjs().startOf('month').unix()
        const monthEnd = apDayjs().endOf('month').unix()
        const client = await autumnUtils.resolveClientForPlatform(log, platformId)
        if (isNil(client)) {
            return { startDate: monthStart, endDate: monthEnd, nextBillingAmount: 0, cancelAt: null, planId: null, planName: null, scheduledPlanName: null }
        }
        const customer = await client.getCustomer({ expand: ['subscriptions.plan'] })
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
        const creds = await getConsoleCreds(log, platformId)
        if (isNil(creds)) {
            return { checkoutUrl: null }
        }
        const { paymentUrl } = await topUpOnConsole({ ...creds, featureId, quantity, successUrl })
        return { checkoutUrl: paymentUrl }
    },
    configureAutoTopUp: async ({ platformId, featureId, enabled, threshold, quantity, maxMonthlyTopUps, returnUrl }) => {
        await autumnUtils.ensureEnrolled(log, platformId)
        const client = await autumnUtils.resolveClientForPlatform(log, platformId)
        const creds = await getConsoleCreds(log, platformId)
        if (isNil(client) || isNil(creds)) {
            return {}
        }
        const customer = enabled ? await client.getCustomer({ expand: ['payment_method'] }) : null
        const setupPaymentReturnUrl = enabled && isNil(customer?.paymentMethod) ? returnUrl : undefined
        const { setupPaymentUrl } = await configureAutoTopUpOnConsole({
            ...creds, featureId, enabled, threshold, quantity, maxMonthlyTopUps, setupPaymentReturnUrl,
        })
        return isNil(setupPaymentUrl) ? {} : { setupPaymentUrl }
    },
    cancelSubscription: async ({ platformId }) => {
        await autumnUtils.ensureEnrolled(log, platformId)
        const creds = await getConsoleCreds(log, platformId)
        if (isNil(creds)) {
            return
        }
        await cancelOnConsole({ ...creds })
    },
    reactivateSubscription: async ({ platformId }) => {
        await autumnUtils.ensureEnrolled(log, platformId)
        const creds = await getConsoleCreds(log, platformId)
        if (isNil(creds)) {
            return
        }
        await reactivateOnConsole({ ...creds })
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
    ensureEnrolled: async (platformId: string) => {
        await autumnUtils.ensureEnrolled(log, platformId)
    },
    refreshEntitlements: async (platformId: string) => {
        await autumnUtils.refreshEntitlements(log, platformId)
    },
    applyAppSumoPlan: async ({ platformId, planId, action }: ApplyAppSumoPlanParams) => {
        await autumnUtils.ensureEnrolled(log, platformId)
        await compAppSumoOnConsole({ platformId, planId, action })
        await autumnUtils.refreshEntitlements(log, platformId)
    },
    activateLicense: async ({ platformId, licenseKey }: ActivateLicenseParams) => {
        await platformPlanService(log).update({ platformId, licenseKey })
        const credentials = await activateOnConsole({ licenseKey, platformId })
        await platformPlanService(log).setAutumnCredentials({ platformId, ...credentials })
        await autumnUtils.refreshEntitlements(log, platformId)
    },
    shouldBlock: async (platformId: string) => {
        return readBillingEnforced(platformId)
    },
    shouldBlockOnCredits: async (platformId: string) => {
        return (await computeCreditsState(platformId)).blocked
    },
    getCreditsState: async (platformId: string) => {
        return computeCreditsState(platformId)
    },
    getAppSumoAiCreditsState: async (platformId: string) => {
        const balance = await autumnUtils.readAppSumoAiCreditsBalance(platformId)
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
    return { usage: balance.usage, remaining: balance.unlimited ? null : balance.remaining }
}

function toAppSumoAiCreditsUsage(balance: Balance | undefined): AppSumoAiCreditsUsage | null {
    if (isNil(balance) || balance.unlimited || isNil(balance.granted) || balance.granted <= 0) {
        return null
    }
    return { usage: balance.usage, limit: balance.granted }
}

function isAutumnFeatureId(value: string): value is AutumnFeatureId {
    return Object.values(AutumnFeatureId).some((id) => id === value)
}

function toProjectedLimit(balance: AutumnFeatureBalance | undefined, whenAbsent: number | null): number | null {
    if (isNil(balance)) {
        return whenAbsent
    }
    if (balance.unlimited) {
        return null
    }
    return balance.granted ?? whenAbsent
}


function isDuplicateTrack(error: unknown): boolean {
    return error instanceof AutumnError && error.statusCode === 409
}

async function readBillingEnforced(platformId: string): Promise<boolean> {
    return (await distributedStore.get<boolean>(getBillingEnforcedKey(platformId))) === true
}

async function computeCreditsState(platformId: string): Promise<CreditsGateState> {
    const [billingEnforced, balance] = await Promise.all([
        readBillingEnforced(platformId),
        autumnUtils.readCreditsBalance(platformId),
    ])
    const exhausted = !isNil(balance) && !balance.unlimited && balance.remaining <= 0
    return {
        blocked: billingEnforced && exhausted,
        usage: balance?.usage ?? 0,
        limit: balance?.granted ?? 0,
        remaining: balance?.remaining ?? 0,
        unlimited: balance?.unlimited ?? false,
    }
}

function msToUnixSeconds(ms: number | null | undefined): number | null {
    return isNil(ms) ? null : Math.floor(ms / 1000)
}

function toBalanceCache(balance: Balance): CreditsBalanceCache {
    return {
        granted: balance.granted,
        usage: balance.usage,
        remaining: balance.remaining,
        unlimited: balance.unlimited,
        nextResetAt: balance.nextResetAt,
        syncedAt: Date.now(),
    }
}

function toAutumnEntitlements(customer: GetCustomerResponse): AutumnEntitlements {
    const flags: Record<string, boolean> = {}
    for (const featureId of Object.keys(customer.flags)) {
        flags[featureId] = true
    }
    const balances: Record<string, AutumnFeatureBalance> = {}
    for (const [featureId, balance] of Object.entries(customer.balances)) {
        balances[featureId] = {
            granted: balance.granted,
            usage: balance.usage,
            remaining: balance.remaining,
            unlimited: balance.unlimited,
            nextResetAt: balance.nextResetAt,
        }
    }
    const basePlan = customer.subscriptions.find((subscription) => !subscription.addOn)
    return {
        planId: basePlan?.planId ?? null,
        flags,
        balances,
    }
}

async function subscribeFreeOnConsole({ platformId }: { platformId: string }): Promise<AutumnEnrollmentCredentials> {
    const response = await safeHttp.axios.post<ConsoleBillingEnvelope>(
        `${AUTUMN_CONSOLE_URL}/api/billing/subscribe`,
        { planId: AUTUMN_FREE_PLAN_ID, platformId },
        { timeout: CONSOLE_REQUEST_TIMEOUT_MS },
    )
    return response.data.data
}

async function activateOnConsole({ licenseKey, platformId }: { licenseKey: string, platformId: string }): Promise<AutumnEnrollmentCredentials> {
    const response = await safeHttp.axios.post<ConsoleBillingEnvelope>(
        `${AUTUMN_CONSOLE_URL}/api/billing/activate`,
        { platformId },
        {
            timeout: CONSOLE_REQUEST_TIMEOUT_MS,
            headers: { Authorization: `Bearer ${licenseKey}` },
        },
    )
    return response.data.data
}

async function checkoutOnConsole({ autumnCustomerId, autumnApiKey, planId, successUrl }: ConsoleCustomerCall & { planId: string, successUrl?: string }): Promise<{ paymentUrl: string | null }> {
    const response = await safeHttp.axios.post<{ data: { paymentUrl: string | null } }>(
        `${AUTUMN_CONSOLE_URL}/api/billing/checkout`,
        { autumnCustomerId, planId, successUrl },
        { timeout: CONSOLE_REQUEST_TIMEOUT_MS, headers: { Authorization: `Bearer ${autumnApiKey}` } },
    )
    return response.data.data
}

async function toppableFeaturesOnConsole({ autumnCustomerId, autumnApiKey }: ConsoleCustomerCall): Promise<ToppableFeature[]> {
    const response = await safeHttp.axios.post<{ data: RawToppableFeature[] }>(
        `${AUTUMN_CONSOLE_URL}/api/billing/toppable-features`,
        { autumnCustomerId },
        { timeout: CONSOLE_REQUEST_TIMEOUT_MS, headers: { Authorization: `Bearer ${autumnApiKey}` } },
    )
    return response.data.data.flatMap((feature) => {
        if (!isAutumnFeatureId(feature.featureId)) {
            return []
        }
        return [{ featureId: feature.featureId, pricePerUnit: feature.pricePerUnit, billingUnits: feature.billingUnits }]
    })
}

async function topUpOnConsole({ autumnCustomerId, autumnApiKey, featureId, quantity, successUrl }: ConsoleCustomerCall & { featureId: string, quantity: number, successUrl?: string }): Promise<{ paymentUrl: string | null }> {
    const response = await safeHttp.axios.post<{ data: { paymentUrl: string | null } }>(
        `${AUTUMN_CONSOLE_URL}/api/billing/topup`,
        { autumnCustomerId, featureId, quantity, successUrl },
        { timeout: CONSOLE_REQUEST_TIMEOUT_MS, headers: { Authorization: `Bearer ${autumnApiKey}` } },
    )
    return response.data.data
}

async function portalOnConsole({ autumnCustomerId, autumnApiKey, returnUrl }: ConsoleCustomerCall & { returnUrl?: string }): Promise<{ url: string | null }> {
    const response = await safeHttp.axios.post<{ data: { url: string | null } }>(
        `${AUTUMN_CONSOLE_URL}/api/billing/portal`,
        { autumnCustomerId, returnUrl },
        { timeout: CONSOLE_REQUEST_TIMEOUT_MS, headers: { Authorization: `Bearer ${autumnApiKey}` } },
    )
    return response.data.data
}

async function configureAutoTopUpOnConsole({ autumnCustomerId, autumnApiKey, featureId, enabled, threshold, quantity, maxMonthlyTopUps, setupPaymentReturnUrl }: ConsoleCustomerCall & { featureId: string, enabled: boolean, threshold: number, quantity: number, maxMonthlyTopUps?: number | null, setupPaymentReturnUrl?: string }): Promise<{ setupPaymentUrl?: string }> {
    const response = await safeHttp.axios.post<{ data: { setupPaymentUrl?: string } }>(
        `${AUTUMN_CONSOLE_URL}/api/billing/auto-topup`,
        { autumnCustomerId, featureId, enabled, threshold, quantity, maxMonthlyTopUps, setupPaymentReturnUrl },
        { timeout: CONSOLE_REQUEST_TIMEOUT_MS, headers: { Authorization: `Bearer ${autumnApiKey}` } },
    )
    return response.data.data
}

async function cancelOnConsole({ autumnCustomerId, autumnApiKey }: ConsoleCustomerCall): Promise<void> {
    await safeHttp.axios.post<ConsoleBillingEnvelope>(
        `${AUTUMN_CONSOLE_URL}/api/billing/cancel`,
        { autumnCustomerId },
        { timeout: CONSOLE_REQUEST_TIMEOUT_MS, headers: { Authorization: `Bearer ${autumnApiKey}` } },
    )
}

async function reactivateOnConsole({ autumnCustomerId, autumnApiKey }: ConsoleCustomerCall): Promise<void> {
    await safeHttp.axios.post<ConsoleBillingEnvelope>(
        `${AUTUMN_CONSOLE_URL}/api/billing/reactivate`,
        { autumnCustomerId },
        { timeout: CONSOLE_REQUEST_TIMEOUT_MS, headers: { Authorization: `Bearer ${autumnApiKey}` } },
    )
}

async function getConsoleCreds(log: FastifyBaseLogger, platformId: string): Promise<ConsoleCustomerCall | null> {
    const { autumnCustomerId, autumnApiKey } = await platformPlanService(log).getAutumnCredentials(platformId)
    if (isNil(autumnCustomerId) || isNil(autumnApiKey)) {
        return null
    }
    return { autumnCustomerId, autumnApiKey }
}

async function compAppSumoOnConsole({ platformId, planId, action }: { platformId: string, planId?: string, action: AppSumoAction }): Promise<void> {
    const token = system.get(AppSystemProp.APPSUMO_TOKEN)
    await safeHttp.axios.post<ConsoleBillingEnvelope>(
        `${AUTUMN_CONSOLE_URL}/api/billing/appsumo`,
        { platformId, planId, action },
        {
            timeout: CONSOLE_REQUEST_TIMEOUT_MS,
            headers: { Authorization: `Bearer ${token}` },
        },
    )
}


type ConsoleCustomerCall = {
    autumnCustomerId: string
    autumnApiKey: string
}

type RawToppableFeature = {
    featureId: string
    pricePerUnit: number
    billingUnits: number
}

type WithoutCustomerId<T> = Omit<T, 'customerId'>

type ResolvedAutumnCredentials = {
    autumnCustomerId: string
    autumnApiKey: string
}

type AutumnClientParams = {
    secretKey: string
    customerId: string
    serverURL?: string
}

type TrackInput = WithoutCustomerId<TrackParams> & {
    idempotencyKey?: string
}

type AutumnFeatureBalance = {
    granted: number | null
    usage: number
    remaining: number | null
    unlimited: boolean
    nextResetAt: number | null
}

type AutumnEntitlements = {
    planId: string | null
    flags: Record<string, boolean>
    balances: Record<string, AutumnFeatureBalance>
}

type CreditsBalanceCache = {
    granted: number
    usage: number
    remaining: number
    unlimited: boolean
    nextResetAt: number | null
    syncedAt: number
}

type AutumnEnrollmentCredentials = {
    autumnCustomerId: string
    autumnApiKey: string
}

type ConsoleBillingCredentials = {
    autumnCustomerId: string
    autumnApiKey: string
    paymentUrl: string | null
}

type ConsoleBillingEnvelope = {
    success: boolean
    data: ConsoleBillingCredentials
}

type ConsolePlansEnvelope = {
    success: boolean
    data: PurchasablePlan[]
}
