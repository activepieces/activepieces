import { z } from 'zod'
import { AiProviderCredentials } from './ai-provider-credentials'
import { AIProviderName } from './permission'
import { isNil } from './utils'

export function aiChargeFor({ credentials, turnAlreadyCharged = false, usageOnly = false }: AiChargeForParams): AiCharge {
    if (usageOnly) {
        return { basis: AiChargeBasis.USAGE_ONLY }
    }
    if (credentials.provider !== AIProviderName.ACTIVEPIECES) {
        return turnAlreadyCharged ? { basis: AiChargeBasis.USAGE_ONLY } : { basis: AiChargeBasis.FIXED_CREDITS }
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
    USAGE_ONLY = 'usage-only',
}

export enum AiUsageOrigin {
    FLOW_STEP = 'FLOW_STEP',
    FLOW_AGENT_STEP = 'FLOW_AGENT_STEP',
    AGENT = 'AGENT',
    AGENT_BUILDER = 'AGENT_BUILDER',
    CHAT = 'CHAT',
    ACTION_RUN = 'ACTION_RUN',
    KNOWLEDGE_BASE = 'KNOWLEDGE_BASE',
}

export enum AiUsageEnvironment {
    PRODUCTION = 'PRODUCTION',
    TESTING = 'TESTING',
}

export const AiCallContext = z.object({
    origin: z.enum(AiUsageOrigin),
    environment: z.enum(AiUsageEnvironment),
    agentId: z.string().optional(),
    flowId: z.string().optional(),
})
export type AiCallContext = z.infer<typeof AiCallContext>

export type ActivepiecesAiBilling =
    | { source: ActivepiecesAiConsumerSource.AI_STEP_IN_FLOW, platformId: string, projectId: string, flowRun: ActivepiecesAiFlowRun, context?: AiCallContext }
    | { source: ActivepiecesAiConsumerSource.CHAT, platformId: string, projectId: string | null, conversationId: string, chat?: ActivepiecesAiChat, context?: AiCallContext }

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
    | { basis: AiChargeBasis.USAGE_ONLY }

export type AiChargeForParams = {
    credentials: AiProviderCredentials
    turnAlreadyCharged?: boolean
    usageOnly?: boolean
}

export type AiCallTokens = {
    inputTokens?: number
    outputTokens?: number
    cacheReadTokens?: number
    cacheWriteTokens?: number
    reasoningTokens?: number
    observedCostUsd?: number
}

export type ActivepiecesAiCall = AiCallTokens & (
    | { charge: AiChargeBasis.PROVIDER_REPORTED_COST, generationId?: string, costUsd: number }
    | { charge: AiChargeBasis.FIXED_CREDITS, credits: number, generationId?: string }
    | { charge: AiChargeBasis.USAGE_ONLY, generationId?: string }
)

export type ActivepiecesAiCostEvent = {
    billing: ActivepiecesAiBilling
    provider: AIProviderName
    providerConfigId?: string
    modelId: string
    call: ActivepiecesAiCall
}

export type ActivepiecesAiCostReporter = (event: ActivepiecesAiCostEvent) => void
