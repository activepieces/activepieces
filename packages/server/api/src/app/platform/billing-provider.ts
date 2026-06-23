import { hooksFactory } from '../helper/hooks-factory'

export const billingProvider = hooksFactory.create<BillingProvider>(() => ({
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

export type BillingProvider = {
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
