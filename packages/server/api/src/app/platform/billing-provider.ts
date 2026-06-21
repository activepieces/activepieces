import { hooksFactory } from '../helper/hooks-factory'

export const billingProvider = hooksFactory.create<BillingProvider>(() => ({
    trackCredits: async () => {
        return
    },
    refreshEntitlements: async () => {
        return
    },
    shouldBlock: async () => {
        return false
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

export type BillingProvider = {
    trackCredits(params: TrackCreditsParams): Promise<void>
    refreshEntitlements(platformId: string): Promise<void>
    shouldBlock(platformId: string): Promise<boolean>
}
