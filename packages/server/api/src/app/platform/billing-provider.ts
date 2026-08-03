import { ActivepiecesError, ErrorCode, PlatformUsageMetric } from '@activepieces/core-utils'
import { apDayjs } from '@activepieces/server-utils'
import { ApEdition, AppSumoCreditsBillableFeature, CancellationReason, ConsumableFeatureId, ConsumableProductAutoTopupParams, CreditsBillableFeature, FlowRun, PurchasablePlan, RunEnvironment, SeatsBillableFeature, UnconsumableFeatureId } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { hooksFactory } from '../helper/hooks-factory'
import { system } from '../helper/system/system'

export const billingProvider = hooksFactory.create<BillingProvider>(() => ({
    listPlans: async () => {
        return []
    },
    getBillingOverview: async () => {
        return emptyBillingOverview({})
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
    trackFeature: async () => {
        return
    },
    ensureEnrolled: async () => {
        return
    },
    compFreeLegacy: async () => {
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

export async function shouldBlockRunOnCredits({ platformId, environment, log }: RunCreditsGateParams): Promise<boolean> {
    if (system.getEdition() === ApEdition.ENTERPRISE) {
        return false
    }
    if (environment !== RunEnvironment.PRODUCTION) {
        return false
    }
    return billingProvider.get(log).shouldBlockOnCredits(platformId)
}

export async function assertRunCreditsNotExceeded({ platformId, environment, log }: RunCreditsGateParams): Promise<void> {
    const blocked = await shouldBlockRunOnCredits({ platformId, environment, log })
    if (!blocked) {
        return
    }
    throw new ActivepiecesError({
        code: ErrorCode.QUOTA_EXCEEDED,
        params: { metric: PlatformUsageMetric.CREDITS },
    })
}

export function toFlowRunCreditProperties({ platformId, flowRun }: ToFlowRunCreditPropertiesParams): FlowRunCreditConsumptionProperties {
    return {
        platformId,
        projectId: flowRun.projectId,
        flowId: flowRun.flowId,
        flowRunId: flowRun.id,
        environment: flowRun.environment,
    }
}

export function emptyBillingOverview({ startDate, endDate, unavailable = false }: EmptyBillingOverviewParams): BillingOverview {
    return {
        startDate: startDate ?? apDayjs().startOf('month').toISOString(),
        endDate: endDate ?? apDayjs().endOf('month').toISOString(),
        nextBillingAmount: 0,
        cancelAt: null,
        trialEndsAt: null,
        planName: null,
        scheduledPlanName: null,
        billingPortalAvailable: false,
        creditsResetInterval: null,
        creditsFeature: null,
        appSumoCreditsFeature: null,
        seatsFeature: null,
        includedSeats: null,
        additionalSeats: null,
        unavailable,
    }
}

export enum CreditUsageSource {
    FLOW_RUN = 'flow_run',
    AI = 'ai',
    CHAT = 'chat',
}

type ToFlowRunCreditPropertiesParams = {
    platformId: string
    flowRun: FlowRun
}

type EmptyBillingOverviewParams = {
    startDate?: string
    endDate?: string
    unavailable?: boolean
}

type RunCreditsGateParams = {
    platformId: string
    environment: RunEnvironment
    log: FastifyBaseLogger
}

export type CreditEventBreakdownEntry = {
    provider: string
    model: string
    messages: number
    toolCalls: number
}

type CreditConsumptionPropertiesBase = {
    platformId: string
    projectId: string
}

export type FlowRunCreditConsumptionProperties = CreditConsumptionPropertiesBase & {
    flowId: string
    flowRunId: string
    environment: string
}

export type AiCreditConsumptionProperties = FlowRunCreditConsumptionProperties & {
    messages: number
    toolCalls: number
    breakdown: CreditEventBreakdownEntry[]
}

export type ChatCreditConsumptionProperties = CreditConsumptionPropertiesBase & {
    userId: string
    conversationId: string
    turnIndex: number
    messages: number
    toolCalls: number
    provider: string | null
    model: string | null
    tier: string
}

export type ChatAppSumoConsumptionProperties = CreditConsumptionPropertiesBase & {
    conversationId: string
    turnIndex: number
    tier: string
}

type TrackUsageParamsBase = {
    platformId: string
    value: number
    idempotencyKey: string
}

export type TrackCreditsParams =
    | (TrackUsageParamsBase & { source: CreditUsageSource.FLOW_RUN, properties: FlowRunCreditConsumptionProperties })
    | (TrackUsageParamsBase & { source: CreditUsageSource.AI, properties: AiCreditConsumptionProperties })
    | (TrackUsageParamsBase & { source: CreditUsageSource.CHAT, properties: ChatCreditConsumptionProperties })

export type TrackAppSumoAiUsageParams = TrackUsageParamsBase & (
    { source: CreditUsageSource.AI, properties: AiCreditConsumptionProperties } |
    { source: CreditUsageSource.CHAT, properties: ChatAppSumoConsumptionProperties }
)

export type TrackFeatureParams =
    | ({ featureId: ConsumableFeatureId.AP_CREDITS } & TrackCreditsParams)
    | ({ featureId: ConsumableFeatureId.APP_SUMO_AI_CREDITS } & TrackAppSumoAiUsageParams)

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
    creditsResetInterval: string | null
}

export type BillingOverview = BillingInfo & {
    creditsFeature: CreditsBillableFeature | null
    appSumoCreditsFeature: AppSumoCreditsBillableFeature | null
    seatsFeature: SeatsBillableFeature | null
    includedSeats: number | null
    additionalSeats: number | null
    unavailable: boolean
}

export type AdjustUnconsumableFeatureQuantityParams = {
    platformId: string
    featureId: UnconsumableFeatureId
    quantity: number
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
    feedback: CancellationFeedback
}

export type CancellationFeedback = {
    reasons: CancellationReason[]
    comment: string | null
    canceledByEmail: string | null
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
    configureAutoTopUp(params: ConfigureAutoTopUpParams): Promise<void>
    setupPayment(params: SetupPaymentParams): Promise<{ url: string | null }>
    cancelSubscription(params: CancelSubscriptionParams): Promise<void>
    reactivateSubscription(params: ReactivateSubscriptionParams): Promise<void>
    trackFeature(params: TrackFeatureParams): Promise<void>
    ensureEnrolled(platformId: string): Promise<void>
    compFreeLegacy(platformId: string): Promise<void>
    refreshEntitlements(platformId: string): Promise<void>
    applyAppSumoPlan(params: ApplyAppSumoPlanParams): Promise<void>
    activateLicense(params: ActivateLicenseParams): Promise<void>
    isBillingEnforced(platformId: string): Promise<boolean>
    shouldBlockOnCredits(platformId: string): Promise<boolean>
    getCreditsAndAppSumoState(platformId: string): Promise<CreditsAndAppSumoState>
    getConsumablesUsage(platformId: string): Promise<ConsumablesUsage>
    getCreditUsage(params: CreditUsageByProjectParams): Promise<CreditUsage>
}
