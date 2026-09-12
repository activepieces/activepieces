import { AIProviderName } from './permission'

export enum ActivepiecesAiBillingScope {
    PLATFORM = 'platform',
    PROJECT = 'project',
    CONVERSATION = 'conversation',
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

export type ActivepiecesAiCall =
    | { charge: 'observed-cost', generationId: string, costUsd: number, inputTokens?: number, outputTokens?: number }
    | { charge: 'flat-credits', credits: number, generationId?: string }

export type ActivepiecesAiCostEvent = {
    billing: ActivepiecesAiBilling
    provider: AIProviderName
    modelId: string
    call: ActivepiecesAiCall
}

export type ActivepiecesAiCostReporter = (event: ActivepiecesAiCostEvent) => void
