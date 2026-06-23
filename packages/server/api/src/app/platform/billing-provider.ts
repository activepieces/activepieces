import { PurchasablePlan } from '@activepieces/shared'
import { hooksFactory } from '../helper/hooks-factory'

export const billingProvider = hooksFactory.create<BillingProvider>(() => ({
    listPlans: async () => {
        return []
    },
    createCheckoutSession: async () => {
        return { checkoutUrl: null }
    },
    getBillingPortalUrl: async () => {
        return { url: '' }
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

export type BillingProvider = {
    listPlans(platformId: string): Promise<PurchasablePlan[]>
    createCheckoutSession(params: CreateCheckoutSessionParams): Promise<{ checkoutUrl: string | null }>
    getBillingPortalUrl(params: BillingPortalParams): Promise<{ url: string }>
    trackCredits(params: TrackCreditsParams): Promise<void>
    trackAppSumoAiUsage(params: TrackAppSumoAiUsageParams): Promise<void>
    ensureEnrolled(platformId: string): Promise<void>
    refreshEntitlements(platformId: string): Promise<void>
    shouldBlock(platformId: string): Promise<boolean>
    shouldBlockOnCredits(platformId: string): Promise<boolean>
    getAppSumoAiCreditsState(platformId: string): Promise<CreditsGateState>
    getCreditsState(platformId: string): Promise<CreditsGateState>
    getAppSumoAiCreditsUsage(platformId: string): Promise<AppSumoAiCreditsUsage | null>
}
