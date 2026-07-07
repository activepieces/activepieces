import { assertNotNullOrUndefined, isEmpty, isNil, tryCatch } from '@activepieces/core-utils'
import { apVersionUtil, safeHttp } from '@activepieces/server-utils'
import { AutumnFeatureId, PlanName, PlatformPlanLimits, PurchasablePlan, ToppableFeature } from '@activepieces/shared'
import {
    type AggregateEventsResponse,
    Autumn,
    type Balance,
    type CheckParams,
    type EventsAggregateParams,
    type GetCustomerParams,
    type GetCustomerResponse,
    type ListPlansParams,
    Range,
    type TrackParams,
} from 'autumn-js'
import { FastifyBaseLogger } from 'fastify'
import { BILLING_ENFORCED_TTL_SECONDS, getAppSumoAiCreditsBalanceKey, getBillingEnforcedKey, getBillingOverviewKey, getCreditsBalanceKey } from '../../../../database/redis/keys'
import { distributedLock, distributedStore } from '../../../../database/redis-connections'
import { system } from '../../../../helper/system/system'
import { AppSystemProp } from '../../../../helper/system/system-props'
import { AppSumoAction, CreditUsage } from '../../../../platform/billing-provider'
import { platformService } from '../../../../platform/platform.service'
import { userService } from '../../../../user/user-service'
import { platformPlanService } from '../platform-plan.service'

const AUTUMN_CONSOLE_URL = 'https://lounge-greatest-comprehensive-wives.trycloudflare.com'
const CONSOLE_REQUEST_TIMEOUT_MS = 30000
const CREDITS_CACHE_TTL_SECONDS = 60 * 60

const PROJECT_ID_PROPERTY = 'projectId'
const CREDIT_USAGE_MAX_GROUPS = 250

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
    'workerGroupsEnabled',
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
            aggregateEvents(params: WithoutCustomerId<EventsAggregateParams>) {
                return client.events.aggregate({ customerId, ...params })
            },
        }
    },
    async loadAutumnCreds(log: FastifyBaseLogger, platformId: string): Promise<ConsoleCustomerCall | null> {
        const { autumnCustomerId, autumnApiKey } = await platformPlanService(log).getAutumnCredentials(platformId)
        if (isNil(autumnCustomerId) && isNil(autumnApiKey)) {
            return null
        }
        if (isNil(autumnCustomerId) || isNil(autumnApiKey)) {
            log.error({ platform: { id: platformId } }, 'Autumn credentials incomplete for an enrolled platform; billing and entitlement calls will silently no-op until repaired')
            return null
        }
        return { autumnCustomerId, autumnApiKey }
    },
    async resolveClientForPlatform(log: FastifyBaseLogger, platformId: string) {
        const creds = await autumnUtils.loadAutumnCreds(log, platformId)
        if (isNil(creds)) {
            return null
        }
        return autumnUtils.client({ secretKey: creds.autumnApiKey, customerId: creds.autumnCustomerId })
    },
    async getCreditUsage(log: FastifyBaseLogger, platformId: string, startDate?: string, endDate?: string): Promise<CreditUsage> {
        const client = await autumnUtils.resolveClientForPlatform(log, platformId)
        if (isNil(client)) {
            return { total: 0, byProject: [] }
        }
        const timeRange = !isNil(startDate) && !isNil(endDate)
            ? { customRange: { start: new Date(startDate).getTime(), end: new Date(endDate).getTime() } }
            : { range: Range.Thirtyd }
        const result = await client.aggregateEvents({
            featureId: AutumnFeatureId.AP_CREDITS,
            groupBy: `properties.${PROJECT_ID_PROPERTY}`,
            maxGroups: CREDIT_USAGE_MAX_GROUPS,
            ...timeRange,
        })
        return toCreditUsage(result)
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
                    ? await autumnConsole.enrollFree({ email: await getPlatformOwnerEmail(log, platformId) })
                    : await autumnConsole.activate({ licenseKey: platformPlan.licenseKey })
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
        await autumnUtils.writeCustomerStateCaches(platformId, customer)
        await autumnUtils.invalidateBillingOverview(platformId)
        await autumnUtils.provisionLicenseKeyIfPaid(log, platformId, entitlements.planId)
    },
    async provisionLicenseKeyIfPaid(log: FastifyBaseLogger, platformId: string, planId: string | null): Promise<void> {
        if (isNil(planId) || planId === PlanName.FREE || planId === PlanName.APPSUMO) {
            return
        }
        const platformPlan = await platformPlanService(log).getOrCreateForPlatform(platformId)
        if (!isNil(platformPlan.licenseKey) && !isEmpty(platformPlan.licenseKey)) {
            return
        }
        const creds = await autumnConsole.getCreds(log, platformId)
        if (isNil(creds)) {
            return
        }
        const { data, error } = await tryCatch(() => autumnConsole.provisionLicenseKey({ ...creds }))
        if (error) {
            log.warn({ error, platform: { id: platformId } }, 'Failed to provision license key for self-serve paid customer')
            return
        }
        if (!isNil(data.licenseKey)) {
            await platformPlanService(log).update({ platformId, licenseKey: data.licenseKey })
        }
    },
    async invalidateBillingOverview(platformId: string): Promise<void> {
        await distributedStore.delete(getBillingOverviewKey(platformId))
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
    billingEnforcedFromCustomer(customer: GetCustomerResponse): boolean {
        return !isNil(customer.flags[AutumnFeatureId.BILLING_ENFORCED])
    },
    async writeCustomerStateCaches(platformId: string, customer: GetCustomerResponse): Promise<BalanceCacheSnapshot> {
        const creditsBalance = customer.balances[AutumnFeatureId.AP_CREDITS]
        const appSumoBalance = customer.balances[AutumnFeatureId.APP_SUMO_AI_CREDITS]
        await Promise.all([
            distributedStore.put(getBillingEnforcedKey(platformId), autumnUtils.billingEnforcedFromCustomer(customer), BILLING_ENFORCED_TTL_SECONDS),
            isNil(creditsBalance) ? Promise.resolve() : autumnUtils.writeCreditsBalance(platformId, creditsBalance),
            isNil(appSumoBalance) ? Promise.resolve() : autumnUtils.writeAppSumoAiCreditsBalance(platformId, appSumoBalance),
        ])
        return {
            credits: isNil(creditsBalance) ? null : autumnUtils.toBalanceCache(creditsBalance),
            appSumo: isNil(appSumoBalance) ? null : autumnUtils.toBalanceCache(appSumoBalance),
        }
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
    async enrollFree({ email }: { email: string }): Promise<AutumnEnrollmentCredentials> {
        const response = await safeHttp.axios.post<ConsoleBillingEnvelope>(
            `${AUTUMN_CONSOLE_URL}/api/billing/enroll`,
            { email },
            { timeout: CONSOLE_REQUEST_TIMEOUT_MS },
        )
        return response.data.data
    },
    async activate({ licenseKey }: { licenseKey: string }): Promise<AutumnEnrollmentCredentials> {
        const response = await safeHttp.axios.post<ConsoleBillingEnvelope>(
            `${AUTUMN_CONSOLE_URL}/api/billing/activate`,
            {},
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
    async configureAutoTopUp(params: ConsoleCustomerCall & ConfigureAutoTopUpOnConsoleParams): Promise<void> {
        const { autumnCustomerId, autumnApiKey, ...body } = params
        await safeHttp.axios.post<ConsoleBillingEnvelope>(
            `${AUTUMN_CONSOLE_URL}/api/billing/auto-topup`,
            { autumnCustomerId, ...body },
            { timeout: CONSOLE_REQUEST_TIMEOUT_MS, headers: { Authorization: `Bearer ${autumnApiKey}` } },
        )
    },
    async setupPayment({ autumnCustomerId, autumnApiKey, redirectUrl }: ConsoleCustomerCall & { redirectUrl?: string }): Promise<{ url: string | null }> {
        const response = await safeHttp.axios.post<{ data: { url: string | null } }>(
            `${AUTUMN_CONSOLE_URL}/api/billing/setup-payment`,
            { autumnCustomerId, redirectUrl },
            { timeout: CONSOLE_REQUEST_TIMEOUT_MS, headers: { Authorization: `Bearer ${autumnApiKey}` } },
        )
        return response.data.data
    },
    async provisionLicenseKey({ autumnCustomerId, autumnApiKey }: ConsoleCustomerCall): Promise<{ licenseKey: string | null }> {
        const response = await safeHttp.axios.post<{ data: { licenseKey: string | null } }>(
            `${AUTUMN_CONSOLE_URL}/api/billing/provision-license-key`,
            { autumnCustomerId },
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
    async compAppSumo({ log, platformId, action }: { log: FastifyBaseLogger, platformId: string, action: AppSumoAction }): Promise<void> {
        const creds = await autumnConsole.getCreds(log, platformId)
        assertNotNullOrUndefined(creds, 'Autumn credentials must exist before applying an AppSumo plan')
        const token = system.get(AppSystemProp.APPSUMO_TOKEN)
        await safeHttp.axios.post<ConsoleBillingEnvelope>(
            `${AUTUMN_CONSOLE_URL}/api/billing/appsumo`,
            { autumnCustomerId: creds.autumnCustomerId, action },
            {
                timeout: CONSOLE_REQUEST_TIMEOUT_MS,
                headers: { Authorization: `Bearer ${token}` },
            },
        )
    },
    async getCreds(log: FastifyBaseLogger, platformId: string): Promise<ConsoleCustomerCall | null> {
        return autumnUtils.loadAutumnCreds(log, platformId)
    },
}

function toCreditUsage(response: AggregateEventsResponse): CreditUsage {
    const featureId = AutumnFeatureId.AP_CREDITS
    const byProjectMap = new Map<string, number>()
    for (const bin of response.list ?? []) {
        const grouped = bin.groupedValues?.[featureId] ?? {}
        for (const [projectId, value] of Object.entries(grouped)) {
            byProjectMap.set(projectId, (byProjectMap.get(projectId) ?? 0) + value)
        }
    }
    return {
        total: response.total?.[featureId]?.sum ?? 0,
        byProject: [...byProjectMap].map(([projectId, creditsUsed]) => ({ projectId, creditsUsed })),
    }
}

async function getPlatformOwnerEmail(log: FastifyBaseLogger, platformId: string): Promise<string> {
    const platform = await platformService(log).getOneOrThrow(platformId)
    const owner = await userService(log).getMetaInformation({ id: platform.ownerId })
    return owner.email
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
    // A lifetime plan (e.g. AppSumo) is a one-off `purchase`, not a subscription — the only base subscription
    const baseSubscriptionPlanId =
        customer.subscriptions.find((subscription) => !subscription.addOn && subscription.planId !== PlanName.FREE)?.planId
        ?? customer.subscriptions.find((subscription) => !subscription.addOn)?.planId
        ?? null
    const purchasedPlanId = (customer.purchases ?? [])
        .find((purchase) => !isNil(purchase.planId) && purchase.planId !== PlanName.FREE)?.planId ?? null
    const planId = baseSubscriptionPlanId != null && baseSubscriptionPlanId !== PlanName.FREE
        ? baseSubscriptionPlanId
        : purchasedPlanId ?? baseSubscriptionPlanId
    return {
        planId,
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

export type BalanceCacheSnapshot = {
    credits: CreditsBalanceCache | null
    appSumo: CreditsBalanceCache | null
}

