import { z } from 'zod'

export const AI_USAGE_ACTION_NAMES = [
    'askAi',
    'classifyText',
    'summarizeText',
    'extractStructuredData',
    'run_agent',
    'generateImage',
] as const

export enum AiUsageModality {
    TEXT = 'text',
    IMAGE = 'image',
}

export enum AiUsageSource {
    FLOW = 'flow',
    CHAT = 'chat',
}

const AiUsageTokenDetails = z.object({
    inputTokens: z.number().optional(),
    outputTokens: z.number().optional(),
    totalTokens: z.number().optional(),
    reasoningTokens: z.number().optional(),
    cachedInputTokens: z.number().optional(),
})

const AiUsageToolCall = z.object({
    toolName: z.string(),
    toolCallId: z.string().optional(),
})

/**
 * `actionName` and `origin` describe which piece/surface produced the event. They are
 * sandbox-supplied and therefore UNTRUSTED — kept for debugging/observability/breakdown only.
 * Never use them as an input to billing classification: the worker already knows which call it
 * made and decides any metering server-side from its own state. See workstream 6 in the plan.
 */
const AiUsageEventContext = z.object({
    flowId: z.string().optional(),
    flowVersionId: z.string().optional(),
    runId: z.string().optional(),
    stepName: z.string().optional(),
    actionName: z.enum(AI_USAGE_ACTION_NAMES).optional(),
    origin: z.string().optional(),
    conversationId: z.string().optional(),
})

/**
 * Rich, bounded usage event reported by the worker AI service after every AI SDK call.
 *
 * The wrapper strips content/bodies/binary (prompts, generated text/images, tool args & result
 * bodies, raw provider request/response bodies) before sending; everything kept here is structural
 * metadata safe to forward to a billing vendor. Derived metrics (e.g. number of tool calls) are
 * computed server-side from the raw fields here (`toolCalls.length`), not sent pre-reduced.
 */
export const AiUsageEvent = z.object({
    idempotencyKey: z.string(),
    source: z.enum(AiUsageSource),
    modality: z.enum(AiUsageModality),
    provider: z.string(),
    model: z.string(),
    usage: AiUsageTokenDetails.optional(),
    toolCalls: z.array(AiUsageToolCall).optional(),
    imageCount: z.number().optional(),
    finishReason: z.string().optional(),
    warnings: z.array(z.unknown()).optional(),
    providerMetadata: z.unknown().optional(),
    genParams: z.record(z.string(), z.unknown()).optional(),
    context: AiUsageEventContext.optional(),
})

export type AiUsageEvent = z.infer<typeof AiUsageEvent>

export type AiUsageActionName = typeof AI_USAGE_ACTION_NAMES[number]
