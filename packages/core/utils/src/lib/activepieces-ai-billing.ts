import { AiProviderCredentials } from './ai-provider-credentials'
import { AIProviderName } from './permission'
import { isNil } from './utils'

export function aiChargeFor({ credentials, turnAlreadyCharged = false }: AiChargeForParams): AiCharge | undefined {
    if (credentials.provider !== AIProviderName.ACTIVEPIECES) {
        return turnAlreadyCharged ? undefined : { basis: AiChargeBasis.FIXED_CREDITS }
    }
    const { apiKey } = credentials.auth
    return { basis: AiChargeBasis.PROVIDER_REPORTED_COST, managedApiKey: isNil(apiKey) || apiKey.length === 0 ? undefined : apiKey }
}

export enum ActivepiecesAiConsumerSource {
    AI_STEP_IN_FLOW = 'ai-step-in-flow',
    CHAT = 'chat',
}

export enum AiChargeBasis {
    PROVIDER_REPORTED_COST = 'provider-reported-cost',
    FIXED_CREDITS = 'fixed-credits',
}

export type ActivepiecesAiBilling =
    | { source: ActivepiecesAiConsumerSource.AI_STEP_IN_FLOW, platformId: string, projectId: string, flowRun: ActivepiecesAiFlowRun }
    | { source: ActivepiecesAiConsumerSource.CHAT, platformId: string, projectId: string | null, conversationId: string, chat?: ActivepiecesAiChat }

export type ActivepiecesAiFlowRun = {
    flowId: string
    flowRunId: string
}

export type ActivepiecesAiChat = {
    userId: string
    turnIndex: number
    tier: string
}

export type AiCharge =
    | { basis: AiChargeBasis.PROVIDER_REPORTED_COST, managedApiKey?: string }
    | { basis: AiChargeBasis.FIXED_CREDITS }

export type AiChargeForParams = {
    credentials: AiProviderCredentials
    turnAlreadyCharged?: boolean
}

export type AiCallTokens = {
    inputTokens?: number
    outputTokens?: number
}

export type ActivepiecesAiCall = AiCallTokens & (
    | { charge: AiChargeBasis.PROVIDER_REPORTED_COST, generationId?: string, costUsd: number }
    | { charge: AiChargeBasis.FIXED_CREDITS, credits: number, generationId?: string }
)

export type ActivepiecesAiCostEvent = {
    billing: ActivepiecesAiBilling
    provider: AIProviderName
    modelId: string
    call: ActivepiecesAiCall
}

export type ActivepiecesAiCostReporter = (event: ActivepiecesAiCostEvent) => void
