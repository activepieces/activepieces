import { isEmpty, isNil } from '@activepieces/core-utils'
import { safeHttp } from '@activepieces/server-utils'
import { PlatformPlanLimits } from '@activepieces/shared'
import {
    type AttachParams,
    Autumn,
    type Balance,
    type CheckParams,
    type CreateEntityParams,
    type GetCustomerParams,
    type GetCustomerResponse,
    type GetEntityParams,
    type ListPlansParams,
    type OpenCustomerPortalParams,
    type SetupPaymentParams,
    type TrackParams,
} from 'autumn-js'
import { FastifyBaseLogger } from 'fastify'
import { getCreditsBalanceKey, getCreditTrackedKey } from '../../../database/redis/keys'
import { distributedLock, distributedStore } from '../../../database/redis-connections'
import { BillingProvider, TrackCreditsParams } from '../../../platform/billing-provider'
import { platformPlanService } from './platform-plan.service'

const CREDIT_DEDUP_TTL_SECONDS = 86400
const CREDITS_CACHE_TTL_SECONDS = 180
const CONSOLE_REQUEST_TIMEOUT_MS = 30000

const AUTUMN_CONSOLE_URL = 'https://console.activepieces.com'
// Assumed FREE plan id — NOT yet verified against the Autumn dashboard. Single source of truth for the free
// plan id (used by both subscribeFreeOnConsole and autumnPlanIdToPlanName); update here once confirmed.
const AUTUMN_FREE_PLAN_ID = 'free'

const AUTUMN_FEATURE = {
    CREDITS: 'credits',
    PROJECTS: 'projects',
    BILLING_ENFORCED: 'billing_enforced',
} as const

const AUTUMN_FLAG_FEATURES = [
    'tablesEnabled',
    'eventStreamingEnabled',
    'environmentsEnabled',
    'analyticsEnabled',
    'showPoweredBy',
    'auditLogEnabled',
    'embeddingEnabled',
    'agentsEnabled',
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
] as const satisfies readonly (keyof PlatformPlanLimits)[]

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
            attach(params: WithoutCustomerId<AttachParams>) {
                return client.billing.attach({ customerId, ...params })
            },
            openCustomerPortal(params?: WithoutCustomerId<OpenCustomerPortalParams>) {
                return client.billing.openCustomerPortal({ customerId, ...params })
            },
            setupPayment(params: WithoutCustomerId<SetupPaymentParams>) {
                return client.billing.setupPayment({ customerId, ...params })
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
        const { autumnCustomerId, autumnApiKey } = await platformPlanService(log).getAutumnCredentials(platformId)
        if (isNil(autumnCustomerId) || isNil(autumnApiKey)) {
            return null
        }
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
                    : await migrateOnConsole({ licenseKey: platformPlan.licenseKey, platformId })
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
    },
    mapEntitlementsToPlanLimits(entitlements: AutumnEntitlements): Partial<PlatformPlanLimits> {
        const flags: Partial<PlatformPlanLimits> = {}
        for (const feature of AUTUMN_FLAG_FEATURES) {
            flags[feature] = entitlements.flags[feature] ?? false
        }
        const projects = entitlements.balances[AUTUMN_FEATURE.PROJECTS]
        const credits = entitlements.balances[AUTUMN_FEATURE.CREDITS]
        return {
            ...flags,
            plan: autumnPlanIdToStoredPlan(entitlements.planId),
            projectsLimit: isNil(projects) || projects.unlimited ? null : projects.granted,
            includedAiCredits: credits?.granted ?? 0,
            activeFlowsLimit: undefined,
            billingEnforced: entitlements.flags[AUTUMN_FEATURE.BILLING_ENFORCED] ?? false,
        }
    },
    async readCreditsBalance(platformId: string): Promise<CreditsBalanceCache | null> {
        return distributedStore.get<CreditsBalanceCache>(getCreditsBalanceKey(platformId))
    },
    async writeCreditsBalance(platformId: string, balance: Balance): Promise<void> {
        const cached: CreditsBalanceCache = {
            granted: balance.granted,
            usage: balance.usage,
            remaining: balance.remaining,
            unlimited: balance.unlimited,
            nextResetAt: balance.nextResetAt,
            syncedAt: Date.now(),
        }
        await distributedStore.put(getCreditsBalanceKey(platformId), cached, CREDITS_CACHE_TTL_SECONDS)
    },
}

export const autumnBillingProvider = (log: FastifyBaseLogger): BillingProvider => ({
    trackCredits: async (params: TrackCreditsParams) => {
        const dedupKey = getCreditTrackedKey(params.idempotencyKey)
        const reserved = await distributedStore.putIfAbsent(dedupKey, '1', CREDIT_DEDUP_TTL_SECONDS)
        if (!reserved) {
            return
        }
        try {
            const client = await autumnUtils.resolveClientForPlatform(log, params.platformId)
            if (isNil(client)) {
                return
            }
            const response = await client.track({
                featureId: AUTUMN_FEATURE.CREDITS,
                value: params.value,
                idempotencyKey: params.idempotencyKey,
                properties: { source: params.source, ...params.properties },
            })
            if (!isNil(response.balance)) {
                await autumnUtils.writeCreditsBalance(params.platformId, response.balance)
            }
        }
        catch (error) {
            await distributedStore.delete(dedupKey)
            throw error
        }
    },
    ensureEnrolled: async (platformId: string) => {
        await autumnUtils.ensureEnrolled(log, platformId)
    },
    refreshEntitlements: async (platformId: string) => {
        await autumnUtils.refreshEntitlements(log, platformId)
    },
    shouldBlock: async (platformId: string) => {
        const platformPlan = await platformPlanService(log).getOrCreateForPlatform(platformId)
        return platformPlan.billingEnforced === true
    },
    shouldBlockOnCredits: async (platformId: string) => {
        const platformPlan = await platformPlanService(log).getOrCreateForPlatform(platformId)
        if (platformPlan.billingEnforced !== true) {
            return false
        }
        const balance = await autumnUtils.readCreditsBalance(platformId)
        if (isNil(balance) || balance.unlimited) {
            return false
        }
        return balance.remaining <= 0
    },
})

function autumnPlanIdToStoredPlan(planId: string | null): string | null {
    if (isNil(planId) || planId === AUTUMN_FREE_PLAN_ID) {
        return null
    }
    return planId
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

async function migrateOnConsole({ licenseKey, platformId }: { licenseKey: string, platformId: string }): Promise<AutumnEnrollmentCredentials> {
    const response = await safeHttp.axios.post<ConsoleBillingEnvelope>(
        `${AUTUMN_CONSOLE_URL}/api/billing/migrate`,
        { platformId },
        {
            timeout: CONSOLE_REQUEST_TIMEOUT_MS,
            headers: { Authorization: `Bearer ${licenseKey}` },
        },
    )
    return response.data.data
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
