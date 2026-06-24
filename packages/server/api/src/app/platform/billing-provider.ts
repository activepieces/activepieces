import { apDayjs } from '@activepieces/server-utils'
import { AutoTopUpConfig, PurchasablePlan, ToppableFeature } from '@activepieces/shared'
import { hooksFactory } from '../helper/hooks-factory'

function defaultBillingInfo(): BillingInfo {
    return { startDate: apDayjs().startOf('month').unix(), endDate: apDayjs().endOf('month').unix(), nextBillingAmount: 0, cancelAt: null }
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
    trackCredits: async () => {
        return
    },
    trackAppSumoAiUsage: async () => {
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
    shouldBlock: async () => {
        return false
    },
    shouldBlockOnCredits: async () => {
        return false
    },
    getAppSumoAiCreditsState: async () => {
        return { blocked: false, usage: 0, limit: 0 }
    },
    getCreditsState: async () => {
        return { blocked: false, usage: 0, limit: 0 }
    },
    getAppSumoAiCreditsUsage: async () => {
        return null
    },
}))

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

export type CreditsGateState = {
    blocked: boolean
    usage: number
    limit: number
}

export type AppSumoAiCreditsUsage = {
    usage: number
    limit: number
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
}

export type TopUpFeatureParams = {
    platformId: string
    featureId: string
    quantity: number
    successUrl?: string
}

export type ConfigureAutoTopUpParams = {
    platformId: string
    featureId: string
    enabled: boolean
    threshold: number
    quantity: number
    maxMonthlyTopUps?: number | null
    returnUrl?: string
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

export type BillingProvider = {
    listPlans(platformId: string): Promise<PurchasablePlan[]>
    getTopUpSettings(platformId: string): Promise<{ autoTopUps: AutoTopUpConfig[], topUpFeatures: ToppableFeature[] }>
    createCheckoutSession(params: CreateCheckoutSessionParams): Promise<{ checkoutUrl: string | null }>
    getBillingPortalUrl(params: BillingPortalParams): Promise<{ url: string }>
    getBillingInfo(platformId: string): Promise<BillingInfo>
    topUpFeature(params: TopUpFeatureParams): Promise<{ checkoutUrl: string | null }>
    configureAutoTopUp(params: ConfigureAutoTopUpParams): Promise<{ setupPaymentUrl?: string }>
    trackCredits(params: TrackCreditsParams): Promise<void>
    trackAppSumoAiUsage(params: TrackAppSumoAiUsageParams): Promise<void>
    ensureEnrolled(platformId: string): Promise<void>
    refreshEntitlements(platformId: string): Promise<void>
    applyAppSumoPlan(params: ApplyAppSumoPlanParams): Promise<void>
    shouldBlock(platformId: string): Promise<boolean>
    shouldBlockOnCredits(platformId: string): Promise<boolean>
    getAppSumoAiCreditsState(platformId: string): Promise<CreditsGateState>
    getCreditsState(platformId: string): Promise<CreditsGateState>
    getAppSumoAiCreditsUsage(platformId: string): Promise<AppSumoAiCreditsUsage | null>
}
