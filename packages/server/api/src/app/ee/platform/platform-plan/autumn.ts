import { ActivepiecesError, ErrorCode, isEmpty, isNil } from '@activepieces/core-utils'
import { safeHttp } from '@activepieces/server-utils'
import { PlatformPlanLimits } from '@activepieces/shared'
import {
    type AttachParams,
    Autumn,
    AutumnError,
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
    type UpdateCustomerParams,
} from 'autumn-js'
import { FastifyBaseLogger } from 'fastify'
import { lru, LRU } from 'tiny-lru'
import { getAppSumoAiCreditsBalanceKey, getBillingEnforcedKey, getCreditsBalanceKey } from '../../../database/redis/keys'
import { distributedLock, distributedStore } from '../../../database/redis-connections'
import { BillingProvider, CreditsGateState, TrackAppSumoAiUsageParams, TrackCreditsParams } from '../../../platform/billing-provider'
import { platformPlanService } from './platform-plan.service'

const CREDITS_CACHE_TTL_SECONDS = 180
const CONSOLE_REQUEST_TIMEOUT_MS = 30000
const CREDENTIALS_CACHE_TTL_MS = 5 * 60 * 1000
const CREDENTIALS_CACHE_MAX_ENTRIES = 10000

const credentialsCache: LRU<ResolvedAutumnCredentials> = lru(CREDENTIALS_CACHE_MAX_ENTRIES, CREDENTIALS_CACHE_TTL_MS)

const AUTUMN_CONSOLE_URL = 'https://console.activepieces.com'
// Assumed FREE plan id — NOT yet verified against the Autumn dashboard. Single source of truth for the free
// plan id (used by both subscribeFreeOnConsole and autumnPlanIdToPlanName); update here once confirmed.
const AUTUMN_FREE_PLAN_ID = 'free'

// Self-serve-purchasable Autumn plan ids. `listPlans` only surfaces these (intersected with what's live and
// not archived in Autumn), so a checkout can never target enterprise (sales-led) or appsumo (comped) plans.
// MUST match the Autumn dashboard plan ids.
const SUPPORTED_PLAN_IDS: readonly string[] = ['standard']

const AUTUMN_FEATURE = {
    CREDITS: 'apCredits',
    APPSUMO_AI_CREDITS: 'appSumoAiCredits',
    TEAM_PROJECTS_LIMIT: 'teamProjectsLimit',
    USERS_LIMIT: 'usersLimit',
    ACTIVE_FLOWS_LIMIT: 'activeFlowsLimit',
    BILLING_ENFORCED: 'billingEnforced',
} as const


const AUTUMN_FLAG_FEATURES = [
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
            updateCustomer(params: WithoutCustomerId<UpdateCustomerParams>) {
                return client.customers.update({ customerId, ...params })
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
        const teamProjects = entitlements.balances[AUTUMN_FEATURE.TEAM_PROJECTS_LIMIT]
        const users = entitlements.balances[AUTUMN_FEATURE.USERS_LIMIT]
        const activeFlows = entitlements.balances[AUTUMN_FEATURE.ACTIVE_FLOWS_LIMIT]
        const credits = entitlements.balances[AUTUMN_FEATURE.CREDITS]
        return {
            ...flags,
            plan: autumnPlanIdToStoredPlan(entitlements.planId),
            teamProjectsLimit: toProjectedLimit(teamProjects, 0),
            usersLimit: toProjectedLimit(users, null),
            activeFlowsLimit: toProjectedLimit(activeFlows, null),
            includedAiCredits: credits?.granted ?? 0,
            billingEnforced: entitlements.flags[AUTUMN_FEATURE.BILLING_ENFORCED] ?? false,
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
        await autumnUtils.ensureEnrolled(log, platformId)
        const client = await autumnUtils.resolveClientForPlatform(log, platformId)
        if (isNil(client)) {
            return []
        }
        const { list } = await client.listPlans()
        return list
            .filter((plan) => !plan.archived && !plan.addOn && SUPPORTED_PLAN_IDS.includes(plan.id))
            .map((plan) => ({
                id: plan.id,
                name: plan.name,
                description: plan.description ?? null,
                price: plan.price?.amount ?? null,
                interval: plan.price?.interval ?? null,
                priceDisplay: plan.price?.display?.primaryText ?? null,
            }))
    },
    createCheckoutSession: async ({ platformId, planId, successUrl }) => {
        // Enroll first so a customer-scoped client exists (mints a FREE Autumn customer via the console for
        // a brand-new platform), then attach the paid plan. PAY-FIRST: never enablePlanImmediately — the plan
        // activates only once payment completes; the frontend polls refreshEntitlements after redirect.
        await autumnUtils.ensureEnrolled(log, platformId)
        const client = await autumnUtils.resolveClientForPlatform(log, platformId)
        if (isNil(client)) {
            return { checkoutUrl: null }
        }
        const result = await client.attach({ planId, successUrl })
        return { checkoutUrl: result.paymentUrl }
    },
    getBillingPortalUrl: async ({ platformId, returnUrl }) => {
        const client = await autumnUtils.resolveClientForPlatform(log, platformId)
        if (isNil(client)) {
            return { url: '' }
        }
        const result = await client.openCustomerPortal({ returnUrl })
        return { url: result.url }
    },
    topUpFeature: async ({ platformId, featureId, quantity, successUrl }) => {
        await autumnUtils.ensureEnrolled(log, platformId)
        const client = await autumnUtils.resolveClientForPlatform(log, platformId)
        if (isNil(client)) {
            return { checkoutUrl: null }
        }
        // The prepaid one-off item lives ON the customer's plan (alongside the included allotment), so a
        // manual purchase re-attaches that same plan with the prepaid featureQuantity — no separate top-up
        // product. Feature-generic: any prepaid item on the plan (credits today; users/flows/projects later).
        const customer = await client.getCustomer()
        const basePlanId = customer.subscriptions.find((subscription) => !subscription.addOn)?.planId
        assertPlanAllowsTopUp(basePlanId)
        const result = await client.attach({
            planId: basePlanId,
            featureQuantities: [{ featureId, quantity }],
            successUrl,
        })
        return { checkoutUrl: result.paymentUrl }
    },
    configureAutoTopUp: async ({ platformId, featureId, enabled, threshold, quantity, maxMonthlyTopUps, returnUrl }) => {
        await autumnUtils.ensureEnrolled(log, platformId)
        const client = await autumnUtils.resolveClientForPlatform(log, platformId)
        if (isNil(client)) {
            return {}
        }
        // Enabling is paid-plan-only; disabling is always allowed. Only fetch the customer when enabling
        // (needed for both the plan gate and the saved-card check).
        const customer = enabled ? await client.getCustomer() : null
        if (!isNil(customer)) {
            assertPlanAllowsTopUp(customer.subscriptions.find((subscription) => !subscription.addOn)?.planId)
        }
        await client.updateCustomer({
            billingControls: {
                autoTopups: [{
                    featureId,
                    enabled,
                    threshold,
                    quantity,
                    ...(isNil(maxMonthlyTopUps) ? {} : { purchaseLimit: { interval: 'month', limit: maxMonthlyTopUps } }),
                }],
            },
        })
        // Native auto-top-up requires a saved card; redirect the user to add one only when enabling and
        // none is on file.
        if (!enabled || !isNil(customer?.paymentMethod)) {
            return {}
        }
        const setup = await client.setupPayment({ successUrl: returnUrl })
        return { setupPaymentUrl: setup.url }
    },
    trackCredits: async (params: TrackCreditsParams) => {
        const client = await autumnUtils.resolveClientForPlatform(log, params.platformId)
        if (isNil(client)) {
            return
        }
        try {
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
                featureId: AUTUMN_FEATURE.APPSUMO_AI_CREDITS,
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
            return { blocked: false, usage: balance?.usage ?? 0, limit: balance?.granted ?? 0 }
        }
        return { blocked: balance.remaining <= 0, usage: balance.usage, limit: balance.granted }
    },
    getAppSumoAiCreditsUsage: async (platformId: string) => {
        const client = await autumnUtils.resolveClientForPlatform(log, platformId)
        if (isNil(client)) {
            return null
        }
        const customer = await client.getCustomer()
        const balance = customer.balances[AUTUMN_FEATURE.APPSUMO_AI_CREDITS]
        if (isNil(balance) || balance.unlimited || isNil(balance.granted) || balance.granted <= 0) {
            return null
        }
        return { usage: balance.usage, limit: balance.granted }
    },
})

// Top-ups (manual + auto) are paid-plan-only: a free (or unenrolled) platform must upgrade first, so it
// can't buy prepaid credits. Narrows basePlanId to a usable string for the subsequent attach.
function assertPlanAllowsTopUp(basePlanId: string | undefined): asserts basePlanId is string {
    if (isNil(basePlanId) || basePlanId === AUTUMN_FREE_PLAN_ID) {
        throw new ActivepiecesError({
            code: ErrorCode.DOES_NOT_MEET_BUSINESS_REQUIREMENTS,
            params: { message: 'Top-up is only available on paid plans' },
        })
    }
}

// Projects a numeric non-consumable limit from an Autumn balance: `null` = unlimited; an absent feature
// falls back to `whenAbsent` (0 = none for team projects, null = unlimited for users/active flows).
function toProjectedLimit(balance: AutumnFeatureBalance | undefined, whenAbsent: number | null): number | null {
    if (isNil(balance)) {
        return whenAbsent
    }
    if (balance.unlimited) {
        return null
    }
    return balance.granted ?? whenAbsent
}

// Autumn dedupes a repeated Idempotency-Key with a 409 within its 24h window; the usage is already
// recorded, so a duplicate track is a successful no-op rather than an error to retry.
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
    }
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
