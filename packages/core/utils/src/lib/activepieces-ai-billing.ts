import { AIProviderName } from './permission'

export enum ActivepiecesAiBillingScope {
    PLATFORM = 'platform',
    PROJECT = 'project',
    CONVERSATION = 'conversation',
}

export enum AiChargeBasis {
    PROVIDER_REPORTED_COST = 'provider-reported-cost',
    FIXED_CREDITS = 'fixed-credits',
}

export enum BYOKBilling {
    ONE_CREDIT_PER_MODEL_CALL = 'one-credit-per-model-call',
    ALREADY_CHARGED_FOR_THE_TURN = 'already-charged-for-the-turn',
}

export type ActivepiecesAiBilling =
    | { scope: ActivepiecesAiBillingScope.PLATFORM, platformId: string }
    | { scope: ActivepiecesAiBillingScope.PROJECT, platformId: string, projectId: string, flowRun?: ActivepiecesAiFlowRun }
    | { scope: ActivepiecesAiBillingScope.CONVERSATION, platformId: string, projectId: string | null, conversationId: string, chat?: ActivepiecesAiChat }

export type ActivepiecesAiFlowRun = {
    flowId: string
    flowRunId: string
    environment?: string
}

export type ActivepiecesAiChat = {
    userId: string
    turnIndex: number
    tier: string
}

export type AiCallTokens = {
    inputTokens?: number
    outputTokens?: number
}

export type ActivepiecesAiCall = AiCallTokens & (
    | { charge: AiChargeBasis.PROVIDER_REPORTED_COST, generationId: string, costUsd: number }
    | { charge: AiChargeBasis.FIXED_CREDITS, credits: number, generationId?: string }
)

export type ActivepiecesAiCostEvent = {
    billing: ActivepiecesAiBilling
    provider: AIProviderName
    modelId: string
    call: ActivepiecesAiCall
}

export type ActivepiecesAiCostReporter = (event: ActivepiecesAiCostEvent) => void
