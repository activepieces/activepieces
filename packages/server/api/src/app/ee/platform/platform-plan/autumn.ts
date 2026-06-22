import { isNil } from '@activepieces/core-utils'
import { PlanName, PlatformPlanLimits } from '@activepieces/shared'
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
import { distributedStore } from '../../../database/redis-connections'
import { BillingProvider, TrackCreditsParams } from '../../../platform/billing-provider'
import { platformPlanService } from './platform-plan.service'

const CREDIT_DEDUP_TTL_SECONDS = 86400
const CREDITS_CACHE_TTL_SECONDS = 180

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
    async refreshEntitlements(log: FastifyBaseLogger, platformId: string): Promise<void> {
        const client = await autumnUtils.resolveClientForPlatform(log, platformId)
        if (isNil(client)) {
            return
        }
        const customer = await client.getCustomer()
        const limits = autumnUtils.mapEntitlementsToPlanLimits(toAutumnEntitlements(customer))
        await platformPlanService(log).update({ platformId, ...limits })
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
            plan: autumnPlanIdToPlanName(entitlements.planId),
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

function autumnPlanIdToPlanName(planId: string | null): PlanName | null {
    if (isNil(planId) || planId === 'free') {
        return null
    }
    return Object.values(PlanName).find((name) => name === planId) ?? null
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
