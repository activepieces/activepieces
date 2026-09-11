import { AIProviderName } from './permission'

export enum ActivepiecesAiBillingScope {
    PLATFORM = 'platform',
    PROJECT = 'project',
    CONVERSATION = 'conversation',
}

export type ActivepiecesAiBilling =
    | { scope: ActivepiecesAiBillingScope.PLATFORM, platformId: string }
    | { scope: ActivepiecesAiBillingScope.PROJECT, platformId: string, projectId: string }
    | { scope: ActivepiecesAiBillingScope.CONVERSATION, platformId: string, projectId: string | null, conversationId: string }

export type ActivepiecesAiCall = {
    generationId: string
    costUsd: number
    inputTokens?: number
    outputTokens?: number
}

export type ActivepiecesAiCostEvent = {
    billing: ActivepiecesAiBilling
    provider: AIProviderName
    modelId: string
    call: ActivepiecesAiCall
}

export type ActivepiecesAiCostReporter = (event: ActivepiecesAiCostEvent) => void
