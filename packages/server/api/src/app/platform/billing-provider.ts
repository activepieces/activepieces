import { ActivepiecesError, ErrorCode, PlatformUsageMetric } from '@activepieces/core-utils'
import { apDayjs } from '@activepieces/server-utils'
import { AutoTopUpConfig, ConsumableProductAutoTopupParams, PurchasablePlan, ToppableFeature } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { hooksFactory } from '../helper/hooks-factory'

function defaultBillingInfo(): BillingInfo {
    return { startDate: apDayjs().startOf('month').unix(), endDate: apDayjs().endOf('month').unix(), nextBillingAmount: 0, cancelAt: null, planId: null, planName: null, scheduledPlanName: null, billingPortalAvailable: false }
}

export const billingProvider = hooksFactory.create<BillingProvider>(() => ({
    listPlans: async () => {
        return []
    },
    getTopUpSettings: async () => {
        return { autoTopUps: [], topUpFeatures: [] }
    },
    createCheckoutSession: async () => {
        return { checkoutUrl: null }
    },
    getBillingPortalUrl: async () => {
        return { url: '' }
    },
    getBillingInfo: async () => {
        return defaultBillingInfo()
    },
    topUpFeature: async () => {
        return { checkoutUrl: null }
    },
    configureAutoTopUp: async () => {
        return {}
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
    getAppSumoAiCreditsState: async () => {
        return { blocked: false, usage: 0, limit: 0, remaining: 0, unlimited: false }
    },
    getCreditsState: async () => {
        return { blocked: false, usage: 0, limit: 0, remaining: 0, unlimited: false }
    },
    getConsumablesUsage: async () => {
        return { credits: null, appSumo: null }
    },
}))

export async function assertCreditsNotExceeded({ platformId, log }: { platformId: string, log: FastifyBaseLogger }): Promise<void> {
    const appSumoAiCredits = await billingProvider.get(log).getAppSumoAiCreditsState(platformId)
    if (appSumoAiCredits.blocked) {
        throw new ActivepiecesError({
            code: ErrorCode.QUOTA_EXCEEDED,
            params: { metric: PlatformUsageMetric.CREDITS, usage: appSumoAiCredits.usage, limit: appSumoAiCredits.limit },
        })
    }
    const credits = await billingProvider.get(log).getCreditsState(platformId)
    if (credits.blocked) {
        throw new ActivepiecesError({
            code: ErrorCode.QUOTA_EXCEEDED,
            params: { metric: PlatformUsageMetric.CREDITS, usage: credits.usage, limit: credits.limit },
        })
    }
}

export enum CreditUsageSource {
    FLOW_RUN = 'flow_run',
    AI = 'ai',
    CHAT = 'chat',
}

export type TrackCreditsParams = {
    platformId: string
    value: number
    source: CreditUsageSource
    idempotencyKey: string
    properties?: Record<string, unknown>
}

export type TrackAppSumoAiUsageParams = {
    platformId: string
    value: number
    idempotencyKey: string
    properties?: Record<string, unknown>
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

export type AppSumoAiCreditsUsage = {
    usage: number
    limit: number
}

export type CreditsUsage = {
    usage: number
    remaining: number | null
    nextResetAt: number | null
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
    startDate: number
    endDate: number
    nextBillingAmount: number
    cancelAt: number | null
    planId: string | null
    planName: string | null
    scheduledPlanName: string | null
    billingPortalAvailable: boolean
}

export type TopUpFeatureParams = {
    platformId: string
    featureId: string
    quantity: number
    successUrl?: string
}

export type ConfigureAutoTopUpParams = ConsumableProductAutoTopupParams & {
    platformId: string
    returnUrl?: string
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
    planId?: string
    action: AppSumoAction
}

export type ActivateLicenseParams = {
    platformId: string
    licenseKey: string
}

export type BillingProvider = {
    listPlans(platformId: string): Promise<PurchasablePlan[]>
    getTopUpSettings(platformId: string): Promise<{ autoTopUps: AutoTopUpConfig[], topUpFeatures: ToppableFeature[] }>
    createCheckoutSession(params: CreateCheckoutSessionParams): Promise<{ checkoutUrl: string | null }>
    getBillingPortalUrl(params: BillingPortalParams): Promise<{ url: string }>
    getBillingInfo(platformId: string): Promise<BillingInfo>
    topUpFeature(params: TopUpFeatureParams): Promise<{ checkoutUrl: string | null }>
    configureAutoTopUp(params: ConfigureAutoTopUpParams): Promise<{ setupPaymentUrl?: string }>
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
    getAppSumoAiCreditsState(platformId: string): Promise<CreditsGateState>
    getCreditsState(platformId: string): Promise<CreditsGateState>
    getConsumablesUsage(platformId: string): Promise<ConsumablesUsage>
}
