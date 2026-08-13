import { assertNotNullOrUndefined, isEmpty, isNil, tryCatch } from '@activepieces/core-utils'
import { apVersionUtil, safeHttp } from '@activepieces/server-utils'
import { ApEdition, ConsumableFeatureId, FeatureFlagId, isFreeLegacyEligible, PlanName, PlatformPlanLimits, PurchasablePlan, UnconsumableFeatureId } from '@activepieces/shared'
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
import { type AxiosRequestConfig } from 'axios'
import { FastifyBaseLogger } from 'fastify'
import { AUTUMN_ENROLL_LOCK_TIMEOUT_SECONDS, BILLING_ENFORCED_TTL_SECONDS, getAppSumoAiCreditsBalanceKey, getAutumnEnrollLockKey, getBillingEnforcedKey, getBillingOverviewKey, getCreditsBalanceKey, getFreeLegacyCompAttemptKey } from '../../../../database/redis/keys'
import { distributedLock, distributedStore } from '../../../../database/redis-connections'
import { rejectedPromiseHandler } from '../../../../helper/promise-handler'
import { system } from '../../../../helper/system/system'
import { AppSystemProp } from '../../../../helper/system/system-props'
import { AppSumoAction, CancellationFeedback, CreditUsage, CreditUsageSource } from '../../../../platform/billing-provider'
import { platformService } from '../../../../platform/platform.service'
import { userService } from '../../../../user/user-service'
import { platformPlanService } from '../platform-plan.service'

const AUTUMN_CONSOLE_URL = system.getOrThrow(AppSystemProp.AUTUMN_CONSOLE_URL).replace(/\/+$/, '')
const edition = system.getEdition()
const CONSOLE_REQUEST_TIMEOUT_MS = 30000
const AUTUMN_GET_CUSTOMER_TIMEOUT_MS = 5000
const CREDITS_CACHE_TTL_SECONDS = 60 * 60
const FREE_LEGACY_COMP_ATTEMPT_TTL_SECONDS = 5 * 60

const PROJECT_ID_PROPERTY = 'projectId'
const CREDIT_USAGE_MAX_GROUPS = 250
const AI_CREDIT_USAGE_SOURCES = [CreditUsageSource.AI, CreditUsageSource.CHAT]
const PLATFORM_PLAN_FLAG_FEATURE_IDS = [
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
] as const satisfies readonly (keyof PlatformPlanLimits & `${FeatureFlagId}`)[]

export const autumnUtils = {
    client({ secretKey, customerId }: AutumnClientParams) {
        const client = new Autumn({ secretKey, failOpen: true })
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
                return client.customers.get(
                    { customerId, expand: params?.expand },
                    { timeoutMs: AUTUMN_GET_CUSTOMER_TIMEOUT_MS },
                )
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
        const credentials = await platformPlanService(log).getAutumnCredentials(platformId)
        const { autumnCustomerId, autumnApiKey } = credentials
        if (edition === ApEdition.CLOUD && isFreeLegacyEligible(credentials)) {
            rejectedPromiseHandler(autumnUtils.ensureFreeLegacyComped(log, platformId), log)
        }
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
        const baseParams = {
            featureId: ConsumableFeatureId.AP_CREDITS,
            groupBy: `properties.${PROJECT_ID_PROPERTY}`,
            maxGroups: CREDIT_USAGE_MAX_GROUPS,
            ...timeRange,
        }
        const [total, ...aiResults] = await Promise.all([
            client.aggregateEvents(baseParams),
            ...AI_CREDIT_USAGE_SOURCES.map((source) => client.aggregateEvents({ ...baseParams, filterBy: { source } })),
        ])
        return toCreditUsage({ total, aiResults })
    },
    async ensureEnrolled(log: FastifyBaseLogger, platformId: string): Promise<void> {
        const credentials = await platformPlanService(log).getAutumnCredentials(platformId)
        if (isNil(credentials.autumnCustomerId)) {
            await distributedLock(log).runExclusive({
                key: getAutumnEnrollLockKey(platformId),
                timeoutInSeconds: AUTUMN_ENROLL_LOCK_TIMEOUT_SECONDS,
                fn: async () => {
                    const { autumnCustomerId } = await platformPlanService(log).getAutumnCredentials(platformId)
                    if (!isNil(autumnCustomerId)) {
                        return
                    }
                    const platformPlan = await platformPlanService(log).getOrCreateForPlatform(platformId)
                    const enrolled = isNil(platformPlan.licenseKey) || isEmpty(platformPlan.licenseKey)
                        ? await autumnConsole.enrollFree({ email: await autumnUtils.getPlatformOwnerEmail(log, platformId) })
                        : await autumnConsole.activate({ licenseKey: platformPlan.licenseKey })
                    await platformPlanService(log).setAutumnCredentials({ platformId, ...enrolled })
                    await autumnUtils.refreshEntitlements(log, platformId)
                },
            })
        }
        await autumnUtils.ensureFreeLegacyComped(log, platformId)
    },
    async ensureFreeLegacyComped(log: FastifyBaseLogger, platformId: string): Promise<void> {
        if (edition !== ApEdition.CLOUD) {
            return
        }
        if (!isFreeLegacyEligible(await platformPlanService(log).getAutumnCredentials(platformId))) {
            return
        }
        await distributedStore.runOnceWithin(getFreeLegacyCompAttemptKey(platformId), FREE_LEGACY_COMP_ATTEMPT_TTL_SECONDS, () =>
            distributedLock(log).runExclusive({
                key: getAutumnEnrollLockKey(platformId),
                timeoutInSeconds: AUTUMN_ENROLL_LOCK_TIMEOUT_SECONDS,
                fn: async () => {
                    const credentials = await platformPlanService(log).getAutumnCredentials(platformId)
                    const autumnCustomerId = credentials.autumnCustomerId
                    if (!isFreeLegacyEligible(credentials) || isNil(autumnCustomerId)) {
                        return
                    }
                    const { error } = await tryCatch(() => autumnConsole.compFreeLegacy({ autumnCustomerId }))
                    if (!isNil(error)) {
                        log.warn({ error, platform: { id: platformId } }, 'Failed to comp the free legacy plan')
                        return
                    }
                    await autumnUtils.refreshEntitlements(log, platformId)
                },
            }),
        )
    },
    async refreshEntitlements(log: FastifyBaseLogger, platformId: string): Promise<void> {
        const client = await autumnUtils.resolveClientForPlatform(log, platformId)
        if (isNil(client)) {
            return
        }
        const customer = await client.getCustomer({ expand: ['subscriptions.plan'] })
        const entitlements = toAutumnEntitlements(customer)
        await platformPlanService(log).update({ platformId, ...autumnUtils.mapAutumnFeaturesToPlatformPlan(entitlements) })
        await autumnUtils.writeCustomerStateCaches(platformId, customer)
        await autumnUtils.invalidateBillingOverview(platformId)
        await autumnUtils.provisionLicenseKeyIfPaid(log, platformId, entitlements.planId)
    },
    async provisionLicenseKeyIfPaid(log: FastifyBaseLogger, platformId: string, planId: string | null): Promise<void> {
        if (isNil(planId) || planId === PlanName.FREE || planId === PlanName.APPSUMO || planId === PlanName.FREE_LEGACY) {
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
        for (const feature of PLATFORM_PLAN_FLAG_FEATURE_IDS) {
            flags[feature] = entitlements.flags[feature] ?? false
        }
        const teamProjects = entitlements.balances[UnconsumableFeatureId.TEAM_PROJECTS_LIMIT]
        const users = entitlements.balances[UnconsumableFeatureId.USERS_LIMIT]
        const activeFlows = entitlements.balances[UnconsumableFeatureId.ACTIVE_FLOWS_LIMIT]
        const credits = entitlements.balances[ConsumableFeatureId.AP_CREDITS]
        return {
            ...flags,
            plan: entitlements.planId,
            billedTeamProjectsLimit: toProjectedLimit(teamProjects, 1),
            usersLimit: toProjectedLimit(users, null),
            scheduledUsersLimit: entitlements.scheduledUsersLimit,
            activeFlowsLimit: toProjectedLimit(activeFlows, null),
            includedCredits: credits?.granted ?? 0,
        }
    },
    async readBalance({ platformId, featureId }: BalanceCacheRef): Promise<CreditsBalanceCache | null> {
        return distributedStore.get<CreditsBalanceCache>(balanceCacheKey({ platformId, featureId }))
    },
    async writeBalance({ platformId, featureId, balance }: WriteBalanceParams): Promise<void> {
        await distributedStore.put(balanceCacheKey({ platformId, featureId }), autumnUtils.toBalanceCache(balance), CREDITS_CACHE_TTL_SECONDS)
    },
    billingEnforcedFromCustomer(customer: GetCustomerResponse): boolean {
        return !isNil(customer.flags[FeatureFlagId.BILLING_ENFORCED])
    },
    async writeCustomerStateCaches(platformId: string, customer: GetCustomerResponse): Promise<BalanceCacheSnapshot> {
        const creditsBalance = customer.balances[ConsumableFeatureId.AP_CREDITS]
        const appSumoBalance = customer.balances[ConsumableFeatureId.APP_SUMO_AI_CREDITS]
        await Promise.all([
            distributedStore.put(getBillingEnforcedKey(platformId), autumnUtils.billingEnforcedFromCustomer(customer), BILLING_ENFORCED_TTL_SECONDS),
            isNil(creditsBalance) ? Promise.resolve() : autumnUtils.writeBalance({ platformId, featureId: ConsumableFeatureId.AP_CREDITS, balance: creditsBalance }),
            isNil(appSumoBalance) ? Promise.resolve() : autumnUtils.writeBalance({ platformId, featureId: ConsumableFeatureId.APP_SUMO_AI_CREDITS, balance: appSumoBalance }),
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
            nextResetAt: largestGrantResetAt(balance) ?? balance.nextResetAt,
            syncedAt: Date.now(),
        }
    },
    toBaseSubscriptions(customer: GetCustomerResponse): GetCustomerResponse['subscriptions'] {
        return customer.subscriptions.filter((subscription) => !subscription.addOn)
    },
    selectCurrentBaseSubscription(baseSubscriptions: GetCustomerResponse['subscriptions']): GetCustomerResponse['subscriptions'][number] | undefined {
        const activeBaseSubscriptions = baseSubscriptions.filter((subscription) => subscription.status === 'active')
        return activeBaseSubscriptions.find((subscription) => subscription.planId !== PlanName.FREE)
            ?? activeBaseSubscriptions[0]
            ?? baseSubscriptions[0]
    },
    async getPlatformOwnerEmail(log: FastifyBaseLogger, platformId: string): Promise<string> {
        const platform = await platformService(log).getOneOrThrow(platformId)
        const owner = await userService(log).getMetaInformation({ id: platform.ownerId })
        return owner.email
    },
}

export const autumnConsole = {
    async listPlans({ platformId }: { platformId: string }): Promise<PurchasablePlan[]> {
        const { plans } = await consoleRequest<{ plans: ConsoleAutumnPlan[] }>({
            method: 'get',
            path: '/api/v1/billing/plans',
            query: { version: apVersionUtil.getCurrentRelease(), platformId },
        })
        return plans.map(toPurchasablePlan)
    },
    async enrollFree({ email }: { email: string }): Promise<AutumnEnrollmentCredentials> {
        return consoleRequest<AutumnEnrollmentCredentials>({ path: '/api/v1/billing/enroll', body: { email } })
    },
    async activate({ licenseKey }: { licenseKey: string }): Promise<AutumnEnrollmentCredentials> {
        return consoleRequest<AutumnEnrollmentCredentials>({ path: '/api/v1/billing/activate', token: licenseKey })
    },
    async checkout({ autumnCustomerId, autumnApiKey, planId, successUrl }: ConsoleCustomerCall & { planId: string, successUrl?: string }): Promise<{ paymentUrl: string | null }> {
        return consoleRequest<{ paymentUrl: string | null }>({
            path: '/api/v1/billing/checkout',
            token: autumnApiKey,
            body: { autumnCustomerId, planId, successUrl },
        })
    },
    async setUnconsumableQuantity({ autumnCustomerId, autumnApiKey, featureId, quantity }: ConsoleCustomerCall & { featureId: string, quantity: number }): Promise<{ paymentUrl: string | null }> {
        return consoleRequest<{ paymentUrl: string | null }>({
            path: '/api/v1/billing/unconsumable-feature-quantity',
            token: autumnApiKey,
            body: { autumnCustomerId, featureId, quantity },
        })
    },
    async portal({ autumnCustomerId, autumnApiKey, returnUrl }: ConsoleCustomerCall & { returnUrl?: string }): Promise<{ url: string | null }> {
        return consoleRequest<{ url: string | null }>({
            path: '/api/v1/billing/portal',
            token: autumnApiKey,
            body: { autumnCustomerId, returnUrl },
        })
    },
    async configureAutoTopUp(params: ConsoleCustomerCall & ConfigureAutoTopUpOnConsoleParams): Promise<void> {
        const { autumnCustomerId, autumnApiKey, ...body } = params
        await consoleRequest({ path: '/api/v1/billing/auto-topup', token: autumnApiKey, body: { autumnCustomerId, ...body } })
    },
    async setupPayment({ autumnCustomerId, autumnApiKey, redirectUrl }: ConsoleCustomerCall & { redirectUrl?: string }): Promise<{ url: string | null }> {
        return consoleRequest<{ url: string | null }>({
            path: '/api/v1/billing/setup-payment',
            token: autumnApiKey,
            body: { autumnCustomerId, redirectUrl },
        })
    },
    async provisionLicenseKey({ autumnCustomerId, autumnApiKey }: ConsoleCustomerCall): Promise<{ licenseKey: string | null }> {
        return consoleRequest<{ licenseKey: string | null }>({
            path: '/api/v1/billing/provision-license-key',
            token: autumnApiKey,
            body: { autumnCustomerId },
        })
    },
    async cancel({ autumnCustomerId, autumnApiKey, feedback }: ConsoleCustomerCall & { feedback: CancellationFeedback }): Promise<void> {
        await consoleRequest({
            path: '/api/v1/billing/cancel',
            token: autumnApiKey,
            body: { autumnCustomerId, reasons: feedback.reasons, comment: feedback.comment, canceledByEmail: feedback.canceledByEmail },
        })
    },
    async reactivate({ autumnCustomerId, autumnApiKey }: ConsoleCustomerCall): Promise<void> {
        await consoleRequest({ path: '/api/v1/billing/reactivate', token: autumnApiKey, body: { autumnCustomerId } })
    },
    async compAppSumo({ log, platformId, action }: { log: FastifyBaseLogger, platformId: string, action: AppSumoAction }): Promise<void> {
        const creds = await autumnConsole.getCreds(log, platformId)
        assertNotNullOrUndefined(creds, 'Autumn credentials must exist before applying an AppSumo plan')
        await consoleRequest({
            path: '/api/v1/billing/appsumo',
            token: system.get(AppSystemProp.APPSUMO_TOKEN),
            body: { autumnCustomerId: creds.autumnCustomerId, action },
        })
    },
    async compFreeLegacy({ autumnCustomerId }: { autumnCustomerId: string }): Promise<void> {
        await consoleRequest({ path: '/api/v1/billing/free-legacy', token: consoleSecretOrThrow(), body: { autumnCustomerId } })
    },
    async grantChatPlan({ email }: { email: string }): Promise<string> {
        const grant = await consoleRequest<{ licenseKey: string | null } | null>({
            path: '/api/external/grant-chat-plan',
            token: consoleSecretOrThrow(),
            body: { email },
        })
        const licenseKey = grant?.licenseKey
        if (isNil(licenseKey) || isEmpty(licenseKey)) {
            throw new Error('Console returned no license key for the chat plan grant')
        }
        return licenseKey
    },
    async getCreds(log: FastifyBaseLogger, platformId: string): Promise<ConsoleCustomerCall | null> {
        return autumnUtils.loadAutumnCreds(log, platformId)
    },
}

async function consoleRequest<T>({ path, method = 'post', token, body, query }: ConsoleRequestParams): Promise<T> {
    const url = `${AUTUMN_CONSOLE_URL}${path}`
    const config: AxiosRequestConfig = {
        timeout: CONSOLE_REQUEST_TIMEOUT_MS,
        params: query,
        headers: isNil(token) ? undefined : { Authorization: `Bearer ${token}` },
    }
    const { data: response, error } = await tryCatch(() => method === 'get'
        ? safeHttp.axios.get<ConsoleEnvelope<T>>(url, config)
        : safeHttp.axios.post<ConsoleEnvelope<T>>(url, body ?? {}, config))
    if (!isNil(error)) {
        system.globalLogger().error({ error, url }, 'Autumn console request failed')
        throw error
    }
    assertNotNullOrUndefined(response, 'response')
    return response.data.data
}

function consoleSecretOrThrow(): string {
    const secret = system.get(AppSystemProp.CONSOLE_API_SECRET_KEY)
    if (isNil(secret) || isEmpty(secret)) {
        throw new Error('CONSOLE_API_SECRET_KEY is not configured')
    }
    return secret
}

function balanceCacheKey({ platformId, featureId }: BalanceCacheRef): string {
    return featureId === ConsumableFeatureId.AP_CREDITS
        ? getCreditsBalanceKey(platformId)
        : getAppSumoAiCreditsBalanceKey(platformId)
}

function largestGrantResetAt(balance: Balance): number | null {
    const resets = (balance.breakdown ?? []).filter((entry) => !isNil(entry.reset?.resetsAt))
    if (resets.length < 2) {
        return null
    }
    return resets.reduce((largest, entry) => entry.includedGrant > largest.includedGrant ? entry : largest).reset?.resetsAt ?? null
}

function toPurchasablePlan(plan: ConsoleAutumnPlan): PurchasablePlan {
    const creditsItem = (plan.items ?? []).find((item) => item.featureId === ConsumableFeatureId.AP_CREDITS && isNil(item.price))
    return {
        id: plan.id,
        name: plan.name,
        description: plan.description ?? null,
        price: plan.price?.amount ?? null,
        interval: plan.price?.interval ?? null,
        priceDisplay: plan.price?.display?.primaryText ?? null,
        baseVariantId: plan.variantDetails?.basePlanId ?? plan.baseVariantId ?? null,
        includedSeats: (plan.items ?? []).find((item) => item.featureId === UnconsumableFeatureId.USERS_LIMIT)?.included ?? null,
        includedCredits: creditsItem?.included ?? null,
        creditsResetInterval: creditsItem?.reset?.interval ?? null,
    }
}

function sumCreditsByProject(response: AggregateEventsResponse): Map<string, number> {
    const featureId = ConsumableFeatureId.AP_CREDITS
    const byProjectMap = new Map<string, number>()
    for (const bin of response.list ?? []) {
        const grouped = bin.groupedValues?.[featureId] ?? {}
        for (const [projectId, value] of Object.entries(grouped)) {
            byProjectMap.set(projectId, (byProjectMap.get(projectId) ?? 0) + value)
        }
    }
    return byProjectMap
}

function toCreditUsage({ total, aiResults }: { total: AggregateEventsResponse, aiResults: AggregateEventsResponse[] }): CreditUsage {
    const creditsByProject = sumCreditsByProject(total)
    const aiCreditsByProject = new Map<string, number>()
    for (const result of aiResults) {
        for (const [projectId, value] of sumCreditsByProject(result)) {
            aiCreditsByProject.set(projectId, (aiCreditsByProject.get(projectId) ?? 0) + value)
        }
    }
    return {
        total: total.total?.[ConsumableFeatureId.AP_CREDITS]?.sum ?? 0,
        byProject: [...creditsByProject].map(([projectId, creditsUsed]) => ({
            projectId,
            creditsUsed,
            aiCreditsUsed: aiCreditsByProject.get(projectId) ?? 0,
        })),
    }
}

function toAutumnEntitlements(customer: GetCustomerResponse): AutumnEntitlements {
    const flags: Record<string, boolean> = {}
    for (const [featureId, flag] of Object.entries(customer.flags)) {
        flags[featureId] = featureId === FeatureFlagId.SHOW_POWERED_BY ? !isNil(flag.planId) : true
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
    // A lifetime plan (e.g. AppSumo) is a one-off `purchase`, not a subscription — the only base subscription.
    // Resolve from the ACTIVE base subscription (mirroring toBillingInfo): a scheduled future plan (e.g. a
    // pending end-of-cycle downgrade) also lives in `subscriptions`, and picking it here would mislabel the
    // customer as already on the plan they only switch to later.
    const baseSubscriptions = autumnUtils.toBaseSubscriptions(customer)
    const baseSubscriptionPlanId = autumnUtils.selectCurrentBaseSubscription(baseSubscriptions)?.planId ?? null
    const purchasedPlanId = (customer.purchases ?? [])
        .find((purchase) => !isNil(purchase.planId) && purchase.planId !== PlanName.FREE)?.planId ?? null
    const planId = baseSubscriptionPlanId != null && baseSubscriptionPlanId !== PlanName.FREE
        ? baseSubscriptionPlanId
        : purchasedPlanId ?? baseSubscriptionPlanId
    return {
        planId,
        flags,
        balances,
        scheduledUsersLimit: toScheduledUsersLimit(baseSubscriptions),
    }
}

function toScheduledUsersLimit(baseSubscriptions: GetCustomerResponse['subscriptions']): number | null {
    const scheduledSubscription = baseSubscriptions.find((subscription) => subscription.status === 'scheduled')
    const usersLimitItem = (scheduledSubscription?.plan?.items ?? [])
        .find((item) => item.featureId === UnconsumableFeatureId.USERS_LIMIT)
    if (isNil(usersLimitItem) || usersLimitItem.unlimited) {
        return null
    }
    return usersLimitItem.included ?? null
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
    scheduledUsersLimit: number | null
}

type AutumnEnrollmentCredentials = {
    autumnCustomerId: string
    autumnApiKey: string
}

export type ConsoleCustomerCall = {
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

type ConsoleAutumnPlan = Awaited<ReturnType<Autumn['plans']['list']>>['list'][number]

type ConsoleEnvelope<T> = {
    success: boolean
    data: T
}

type ConsoleRequestParams = {
    path: string
    method?: 'get' | 'post'
    token?: string
    body?: unknown
    query?: Record<string, string>
}

export type BalanceCacheRef = {
    platformId: string
    featureId: ConsumableFeatureId
}

export type WriteBalanceParams = BalanceCacheRef & {
    balance: Balance
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

