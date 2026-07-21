import { ActivepiecesError, ErrorCode, isNil, PlatformUsageMetric } from '@activepieces/core-utils'
import { apDayjs } from '@activepieces/server-utils'
import { AutoTopUpConfig, BillableFeature, ConsumableProductAutoTopupParams, PurchasablePlan } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { EntityManager } from 'typeorm'
import { hooksFactory } from '../helper/hooks-factory'

function defaultBillingInfo(): BillingInfo {
    return { startDate: apDayjs().startOf('month').toISOString(), endDate: apDayjs().endOf('month').toISOString(), nextBillingAmount: 0, cancelAt: null, trialEndsAt: null, planName: null, scheduledPlanName: null, billingPortalAvailable: false }
}

export const billingProvider = hooksFactory.create<BillingProvider>(() => ({
    listPlans: async () => {
        return []
    },
    getBillingOverview: async () => {
        return { ...defaultBillingInfo(), autoTopUps: [], consumableFeatures: [], nonConsumableFeatures: [], includedSeats: null, additionalSeats: null }
    },
    createCheckoutSession: async () => {
        return { checkoutUrl: null }
    },
    getBillingPortalUrl: async () => {
        return { url: '' }
    },
    adjustUnconsumableFeatureQuantity: async () => {
        return { checkoutUrl: null }
    },
    checkUsersExceededLimit: async () => {
        return
    },
    configureAutoTopUp: async () => {
        return
    },
    setupPayment: async () => {
        return { url: null }
    },
    cancelSubscription: async () => {
        return
    },
    reactivateSubscription: async () => {
        return
    },
    trackCredits: async () => {
        return
    },
    trackAppSumoAiUsage: async () => {
        return
    },
    reportUsageCounts: async () => {
        return
    },
    ensureEnrolled: async () => {
        return
    },
    refreshEntitlements: async () => {
        return
    },
    applyAppSumoPlan: async () => {
        return
    },
    activateLicense: async () => {
        return
    },
    isBillingEnforced: async () => {
        return false
    },
    shouldBlockOnCredits: async () => {
        return false
    },
    getCreditsAndAppSumoState: async () => {
        return {
            credits: { blocked: false, usage: 0, limit: 0, remaining: 0, unlimited: false },
            appSumo: { blocked: false, usage: 0, limit: 0, remaining: 0, unlimited: false },
        }
    },
    getConsumablesUsage: async () => {
        return { credits: null, appSumo: null }
    },
    getCreditUsage: async () => {
        return { total: 0, byProject: [] }
    },
}))

export async function assertCreditsAndAppSumoNotExceeded({ platformId, log }: { platformId: string, log: FastifyBaseLogger }): Promise<void> {
    const { credits, appSumo } = await billingProvider.get(log).getCreditsAndAppSumoState(platformId)
    if (appSumo.blocked) {
        throw new ActivepiecesError({
            code: ErrorCode.QUOTA_EXCEEDED,
            params: { metric: PlatformUsageMetric.CREDITS, usage: appSumo.usage, limit: appSumo.limit },
        })
    }
    if (credits.blocked) {
        throw new ActivepiecesError({
            code: ErrorCode.QUOTA_EXCEEDED,
            params: { metric: PlatformUsageMetric.CREDITS, usage: credits.usage, limit: credits.limit },
        })
    }
}

export async function trackCreditsWithAppSumo({ log, credits, appSumo }: {
    log: FastifyBaseLogger
    credits: TrackCreditsParams
    appSumo?: TrackAppSumoAiUsageParams
}): Promise<void> {
    const provider = billingProvider.get(log)
    await provider.trackCredits(credits)
    if (!isNil(appSumo)) {
        await provider.trackAppSumoAiUsage(appSumo)
    }
}

export enum CreditUsageSource {
    FLOW_RUN = 'flow_run',
    AI = 'ai',
    CHAT = 'chat',
}

export type CreditEventBreakdownEntry = {
    provider: string
    model: string
    messages: number
    toolCalls: number
}

type CreditPropertiesBase = {
    platformId: string
    projectId: string
}

export type FlowRunCreditProperties = CreditPropertiesBase & {
    flowId: string
    flowRunId: string
    environment: string
}

export type AiCreditProperties = FlowRunCreditProperties & {
    messages: number
    toolCalls: number
    breakdown: CreditEventBreakdownEntry[]
}

export type ChatCreditProperties = CreditPropertiesBase & {
    userId: string
    conversationId: string
    turnIndex: number
    messages: number
    toolCalls: number
    provider: string | null
    model: string | null
    tier: string
}

export type ChatAppSumoProperties = CreditPropertiesBase & {
    conversationId: string
    turnIndex: number
    tier: string
}

type TrackCreditsParamsBase = {
    platformId: string
    value: number
    idempotencyKey: string
}

export type TrackCreditsParams =
    | (TrackCreditsParamsBase & { source: CreditUsageSource.FLOW_RUN, properties: FlowRunCreditProperties })
    | (TrackCreditsParamsBase & { source: CreditUsageSource.AI, properties: AiCreditProperties })
    | (TrackCreditsParamsBase & { source: CreditUsageSource.CHAT, properties: ChatCreditProperties })

export type TrackAppSumoAiUsageParams = {
    platformId: string
    value: number
    idempotencyKey: string
    properties: FlowRunCreditProperties | ChatAppSumoProperties
}

export type CreditUsageByProjectParams = {
    platformId: string
    startDate?: string
    endDate?: string
}

export type ProjectCreditsAggregate = {
    projectId: string
    creditsUsed: number
}

export type CreditUsage = {
    total: number
    byProject: ProjectCreditsAggregate[]
}

export type ReportUsageCountsParams = {
    platformId: string
    activeFlows: number
    teamProjects: number
    users: number
}


export type CreditsGateState = {
    blocked: boolean
    usage: number
    limit: number
    remaining: number
    unlimited: boolean
}

export type CreditsAndAppSumoState = {
    credits: CreditsGateState
    appSumo: CreditsGateState
}

export type AppSumoAiCreditsUsage = {
    usage: number
    limit: number
}

export type CreditsUsage = {
    usage: number
    remaining: number | null
    nextResetAt: string | null
}

export type ConsumablesUsage = {
    credits: CreditsUsage | null
    appSumo: AppSumoAiCreditsUsage | null
}

export type CreateCheckoutSessionParams = {
    platformId: string
    planId: string
    successUrl?: string
}

export type BillingPortalParams = {
    platformId: string
    returnUrl?: string
}

export type BillingInfo = {
    startDate: string
    endDate: string
    nextBillingAmount: number
    cancelAt: string | null
    trialEndsAt: string | null
    planName: string | null
    scheduledPlanName: string | null
    billingPortalAvailable: boolean
}

export type BillingOverview = BillingInfo & {
    autoTopUps: AutoTopUpConfig[]
    consumableFeatures: BillableFeature[]
    nonConsumableFeatures: BillableFeature[]
    includedSeats: number | null
    additionalSeats: number | null
}

export type AdjustUnconsumableFeatureQuantityParams = {
    platformId: string
    featureId: string
    quantity: number
}

export type CheckUsersExceededLimitParams = {
    platformId: string
    entityManager: EntityManager
}

export type ConfigureAutoTopUpParams = ConsumableProductAutoTopupParams & {
    platformId: string
}

export type SetupPaymentParams = {
    platformId: string
    redirectUrl?: string
}

export type CancelSubscriptionParams = {
    platformId: string
}

export type ReactivateSubscriptionParams = {
    platformId: string
}

export enum AppSumoAction {
    ACTIVATE = 'activate',
    REFUND = 'refund',
}

export type ApplyAppSumoPlanParams = {
    platformId: string
    action: AppSumoAction
}

export type ActivateLicenseParams = {
    platformId: string
    licenseKey: string
}

export type BillingProvider = {
    listPlans(platformId: string): Promise<PurchasablePlan[]>
    getBillingOverview(platformId: string): Promise<BillingOverview>
    createCheckoutSession(params: CreateCheckoutSessionParams): Promise<{ checkoutUrl: string | null }>
    getBillingPortalUrl(params: BillingPortalParams): Promise<{ url: string }>
    adjustUnconsumableFeatureQuantity(params: AdjustUnconsumableFeatureQuantityParams): Promise<{ checkoutUrl: string | null }>
    checkUsersExceededLimit(params: CheckUsersExceededLimitParams): Promise<void>
    configureAutoTopUp(params: ConfigureAutoTopUpParams): Promise<void>
    setupPayment(params: SetupPaymentParams): Promise<{ url: string | null }>
    cancelSubscription(params: CancelSubscriptionParams): Promise<void>
    reactivateSubscription(params: ReactivateSubscriptionParams): Promise<void>
    trackCredits(params: TrackCreditsParams): Promise<void>
    trackAppSumoAiUsage(params: TrackAppSumoAiUsageParams): Promise<void>
    reportUsageCounts(params: ReportUsageCountsParams): Promise<void>
    ensureEnrolled(platformId: string): Promise<void>
    refreshEntitlements(platformId: string): Promise<void>
    applyAppSumoPlan(params: ApplyAppSumoPlanParams): Promise<void>
    activateLicense(params: ActivateLicenseParams): Promise<void>
    isBillingEnforced(platformId: string): Promise<boolean>
    shouldBlockOnCredits(platformId: string): Promise<boolean>
    getCreditsAndAppSumoState(platformId: string): Promise<CreditsAndAppSumoState>
    getConsumablesUsage(platformId: string): Promise<ConsumablesUsage>
    getCreditUsage(params: CreditUsageByProjectParams): Promise<CreditUsage>
}
