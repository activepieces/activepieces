import { AIProviderName, AiUsageEnvironment, AiUsageOrigin } from '@activepieces/core-utils'
import { z } from 'zod'

const ID_MAX = 21
const MODEL_ID_MAX = 255

const nullableId = z.string().max(ID_MAX).nullable()
const counter = z.number().finite().nonnegative()

export const AiUsageBlock = z.object({
    v: z.literal(1),
    origin: z.enum(AiUsageOrigin),
    environment: z.enum(AiUsageEnvironment),
    projectId: nullableId,
    flowId: nullableId,
    agentId: nullableId,
    userId: nullableId,
    runId: nullableId,
    provider: z.enum(AIProviderName),
    providerConfigId: nullableId,
    modelId: z.string().min(1).max(MODEL_ID_MAX),
    inputTokens: counter,
    outputTokens: counter,
    cacheReadTokens: counter,
    cacheWriteTokens: counter,
    reasoningTokens: counter,
    reportedCostUsd: counter,
    estimatedCostUsd: counter,
    managedCredits: counter,
    unpriced: z.boolean(),
})
export type AiUsageBlock = z.infer<typeof AiUsageBlock>
