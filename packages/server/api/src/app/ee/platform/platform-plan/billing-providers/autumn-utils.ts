import { isEmpty, isNil } from '@activepieces/core-utils'
import { apVersionUtil, safeHttp } from '@activepieces/server-utils'
import { AutumnFeatureId, PlatformPlanLimits, PurchasablePlan, ToppableFeature } from '@activepieces/shared'
import {
    Autumn,
    type Balance,
    type CheckParams,
    type GetCustomerParams,
    type GetCustomerResponse,
    type ListPlansParams,
    type TrackParams,
} from 'autumn-js'
import { FastifyBaseLogger } from 'fastify'
import { lru, LRU } from 'tiny-lru'
import { getAppSumoAiCreditsBalanceKey, getCreditsBalanceKey } from '../../../../database/redis/keys'
import { distributedLock, distributedStore } from '../../../../database/redis-connections'
import { system } from '../../../../helper/system/system'
import { AppSystemProp } from '../../../../helper/system/system-props'
import { AppSumoAction } from '../../../../platform/billing-provider'
import { platformPlanService } from '../platform-plan.service'

const AUTUMN_CONSOLE_URL = 'https://ribbon-knowledgestorm-zope-forgotten.trycloudflare.com'
const AUTUMN_FREE_PLAN_ID = 'free'
const CONSOLE_REQUEST_TIMEOUT_MS = 30000
const CREDITS_CACHE_TTL_SECONDS = 60 * 60
const CREDENTIALS_CACHE_TTL_MS = 5 * 60 * 1000
const CREDENTIALS_CACHE_MAX_ENTRIES = 10000

const credentialsCache: LRU<ResolvedAutumnCredentials> = lru(CREDENTIALS_CACHE_MAX_ENTRIES, CREDENTIALS_CACHE_TTL_MS)

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
            setUsage({ featureId, usage }: SetUsageInput) {
                return client.balances.update({ customerId, featureId, usage })
            },
            getCustomer(params?: { expand?: GetCustomerParams['expand'] }) {
                return client.customers.get({ customerId, expand: params?.expand })
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
                    ? await autumnConsole.subscribeFree({ platformId })
                    : await autumnConsole.activate({ licenseKey: platformPlan.licenseKey, platformId })
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
        await platformPlanService(log).update({ platformId, ...autumnUtils.mapAutumnFeaturesToPlatformPlan(entitlements) })
        const creditsBalance = customer.balances[AutumnFeatureId.AP_CREDITS]
        if (!isNil(creditsBalance)) {
            await autumnUtils.writeCreditsBalance(platformId, creditsBalance)
        }
        const appSumoBalance = customer.balances[AutumnFeatureId.APP_SUMO_AI_CREDITS]
        if (!isNil(appSumoBalance)) {
            await autumnUtils.writeAppSumoAiCreditsBalance(platformId, appSumoBalance)
        }
    },
    mapAutumnFeaturesToPlatformPlan(entitlements: AutumnEntitlements): Partial<PlatformPlanLimits> {
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
            teamProjectsLimit: toProjectedLimit(teamProjects, 1),
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
        await distributedStore.put(getCreditsBalanceKey(platformId), autumnUtils.toBalanceCache(balance), CREDITS_CACHE_TTL_SECONDS)
    },
    async readAppSumoAiCreditsBalance(platformId: string): Promise<CreditsBalanceCache | null> {
        return distributedStore.get<CreditsBalanceCache>(getAppSumoAiCreditsBalanceKey(platformId))
    },
    async writeAppSumoAiCreditsBalance(platformId: string, balance: Balance): Promise<void> {
        await distributedStore.put(getAppSumoAiCreditsBalanceKey(platformId), autumnUtils.toBalanceCache(balance), CREDITS_CACHE_TTL_SECONDS)
    },
    toBalanceCache(balance: Balance): CreditsBalanceCache {
        return {
            granted: balance.granted,
            usage: balance.usage,
            remaining: balance.remaining,
            unlimited: balance.unlimited,
            nextResetAt: balance.nextResetAt,
            syncedAt: Date.now(),
        }
    },
    isAutumnFeatureId(value: string): value is AutumnFeatureId {
        return Object.values(AutumnFeatureId).some((id) => id === value)
    },
}

export const autumnConsole = {
    async listPlans({ platformId }: { platformId: string }): Promise<PurchasablePlan[]> {
        const response = await safeHttp.axios.post<ConsolePlansEnvelope>(
            `${AUTUMN_CONSOLE_URL}/api/billing/plans`,
            { version: apVersionUtil.getCurrentRelease(), platformId },
            { timeout: CONSOLE_REQUEST_TIMEOUT_MS },
        )
        return response.data.data
    },
    async subscribeFree({ platformId }: { platformId: string }): Promise<AutumnEnrollmentCredentials> {
        const response = await safeHttp.axios.post<ConsoleBillingEnvelope>(
            `${AUTUMN_CONSOLE_URL}/api/billing/subscribe`,
            { planId: AUTUMN_FREE_PLAN_ID, platformId },
            { timeout: CONSOLE_REQUEST_TIMEOUT_MS },
        )
        return response.data.data
    },
    async activate({ licenseKey, platformId }: { licenseKey: string, platformId: string }): Promise<AutumnEnrollmentCredentials> {
        const response = await safeHttp.axios.post<ConsoleBillingEnvelope>(
            `${AUTUMN_CONSOLE_URL}/api/billing/activate`,
            { platformId },
            {
                timeout: CONSOLE_REQUEST_TIMEOUT_MS,
                headers: { Authorization: `Bearer ${licenseKey}` },
            },
        )
        return response.data.data
    },
    async checkout({ autumnCustomerId, autumnApiKey, planId, successUrl }: ConsoleCustomerCall & { planId: string, successUrl?: string }): Promise<{ paymentUrl: string | null }> {
        const response = await safeHttp.axios.post<{ data: { paymentUrl: string | null } }>(
            `${AUTUMN_CONSOLE_URL}/api/billing/checkout`,
            { autumnCustomerId, planId, successUrl },
            { timeout: CONSOLE_REQUEST_TIMEOUT_MS, headers: { Authorization: `Bearer ${autumnApiKey}` } },
        )
        return response.data.data
    },
    async toppableFeatures({ autumnCustomerId, autumnApiKey }: ConsoleCustomerCall): Promise<ToppableFeature[]> {
        const response = await safeHttp.axios.post<{ data: RawToppableFeature[] }>(
            `${AUTUMN_CONSOLE_URL}/api/billing/toppable-features`,
            { autumnCustomerId },
            { timeout: CONSOLE_REQUEST_TIMEOUT_MS, headers: { Authorization: `Bearer ${autumnApiKey}` } },
        )
        return response.data.data.flatMap((feature) => {
            if (!autumnUtils.isAutumnFeatureId(feature.featureId)) {
                return []
            }
            return [{ featureId: feature.featureId, pricePerUnit: feature.pricePerUnit, billingUnits: feature.billingUnits }]
        })
    },
    async topUp({ autumnCustomerId, autumnApiKey, featureId, quantity, successUrl }: ConsoleCustomerCall & { featureId: string, quantity: number, successUrl?: string }): Promise<{ paymentUrl: string | null }> {
        const response = await safeHttp.axios.post<{ data: { paymentUrl: string | null } }>(
            `${AUTUMN_CONSOLE_URL}/api/billing/topup`,
            { autumnCustomerId, featureId, quantity, successUrl },
            { timeout: CONSOLE_REQUEST_TIMEOUT_MS, headers: { Authorization: `Bearer ${autumnApiKey}` } },
        )
        return response.data.data
    },
    async portal({ autumnCustomerId, autumnApiKey, returnUrl }: ConsoleCustomerCall & { returnUrl?: string }): Promise<{ url: string | null }> {
        const response = await safeHttp.axios.post<{ data: { url: string | null } }>(
            `${AUTUMN_CONSOLE_URL}/api/billing/portal`,
            { autumnCustomerId, returnUrl },
            { timeout: CONSOLE_REQUEST_TIMEOUT_MS, headers: { Authorization: `Bearer ${autumnApiKey}` } },
        )
        return response.data.data
    },
    async configureAutoTopUp(params: ConsoleCustomerCall & ConfigureAutoTopUpOnConsoleParams): Promise<{ setupPaymentUrl?: string }> {
        const { autumnCustomerId, autumnApiKey, ...body } = params
        const response = await safeHttp.axios.post<{ data: { setupPaymentUrl?: string } }>(
            `${AUTUMN_CONSOLE_URL}/api/billing/auto-topup`,
            { autumnCustomerId, ...body },
            { timeout: CONSOLE_REQUEST_TIMEOUT_MS, headers: { Authorization: `Bearer ${autumnApiKey}` } },
        )
        return response.data.data
    },
    async cancel({ autumnCustomerId, autumnApiKey }: ConsoleCustomerCall): Promise<void> {
        await safeHttp.axios.post<ConsoleBillingEnvelope>(
            `${AUTUMN_CONSOLE_URL}/api/billing/cancel`,
            { autumnCustomerId },
            { timeout: CONSOLE_REQUEST_TIMEOUT_MS, headers: { Authorization: `Bearer ${autumnApiKey}` } },
        )
    },
    async reactivate({ autumnCustomerId, autumnApiKey }: ConsoleCustomerCall): Promise<void> {
        await safeHttp.axios.post<ConsoleBillingEnvelope>(
            `${AUTUMN_CONSOLE_URL}/api/billing/reactivate`,
            { autumnCustomerId },
            { timeout: CONSOLE_REQUEST_TIMEOUT_MS, headers: { Authorization: `Bearer ${autumnApiKey}` } },
        )
    },
    async compAppSumo({ platformId, planId, action }: { platformId: string, planId?: string, action: AppSumoAction }): Promise<void> {
        const token = system.get(AppSystemProp.APPSUMO_TOKEN)
        await safeHttp.axios.post<ConsoleBillingEnvelope>(
            `${AUTUMN_CONSOLE_URL}/api/billing/appsumo`,
            { platformId, planId, action },
            {
                timeout: CONSOLE_REQUEST_TIMEOUT_MS,
                headers: { Authorization: `Bearer ${token}` },
            },
        )
    },
    async getCreds(log: FastifyBaseLogger, platformId: string): Promise<ConsoleCustomerCall | null> {
        const { autumnCustomerId, autumnApiKey } = await platformPlanService(log).getAutumnCredentials(platformId)
        if (isNil(autumnCustomerId) || isNil(autumnApiKey)) {
            return null
        }
        return { autumnCustomerId, autumnApiKey }
    },
}

function toAutumnEntitlements(customer: GetCustomerResponse): AutumnEntitlements {
    const flags: Record<string, boolean> = {}
    for (const [featureId, flag] of Object.entries(customer.flags)) {
        flags[featureId] = featureId === AutumnFeatureId.SHOW_POWERED_BY ? !isNil(flag.planId) : true
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

function toProjectedLimit(balance: AutumnFeatureBalance | undefined, whenAbsent: number | null): number | null {
    if (isNil(balance)) {
        return whenAbsent
    }
    if (balance.unlimited) {
        return null
    }
    return balance.granted ?? whenAbsent
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

type SetUsageInput = {
    featureId: string
    usage: number
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

type AutumnEnrollmentCredentials = {
    autumnCustomerId: string
    autumnApiKey: string
}

type ConsoleCustomerCall = {
    autumnCustomerId: string
    autumnApiKey: string
}

type ConfigureAutoTopUpOnConsoleParams =
    | {
        featureId: string
        enabled: true
        threshold: number
        quantity: number
        maxMonthlyTopUps?: number | null
        setupPaymentReturnUrl?: string
    }
    | {
        featureId: string
        enabled: false
    }

type RawToppableFeature = {
    featureId: string
    pricePerUnit: number
    billingUnits: number
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

export type CreditsBalanceCache = {
    granted: number
    usage: number
    remaining: number
    unlimited: boolean
    nextResetAt: number | null
    syncedAt: number
}
