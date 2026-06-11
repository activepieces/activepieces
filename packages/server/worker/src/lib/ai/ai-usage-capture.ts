import {
    AiUsageActionName,
    AiUsageEvent,
    AiUsageModality,
    AiUsageSource,
    apId,
    spreadIfDefined,
    spreadIfNotUndefined,
    tryCatch,
    WorkerToApiContract,
} from '@activepieces/shared'
import { LanguageModelUsage } from 'ai'
import { Logger } from 'pino'

/**
 * Builds the bounded `AiUsageEvent` from an AI SDK result and reports it to the API over the
 * worker→API RPC (`reportAiUsage`). Content/prompts/bodies are never read here — only structural
 * metadata. Reporting is fire-and-forget: a transport failure is logged and swallowed so it can
 * never fail the user's AI step. This is the relocated `tracked-ai` capture logic — it now lives on
 * the worker, so the sandbox no longer imports it and provider creds never leave the worker.
 */
function buildTextEvent({ context, usage, finishReason, warnings, providerMetadata, toolCalls, genParams }: BuildTextEventParams): AiUsageEvent {
    return {
        idempotencyKey: apId(),
        source: context.source,
        modality: AiUsageModality.TEXT,
        provider: context.provider,
        model: context.model,
        ...spreadIfNotUndefined('usage', mapUsage(usage)),
        ...spreadIfNotUndefined('toolCalls', toolCalls),
        ...spreadIfDefined('finishReason', finishReason),
        ...spreadIfNotUndefined('warnings', warnings ? [...warnings] : undefined),
        ...spreadIfNotUndefined('providerMetadata', providerMetadata),
        ...spreadIfNotUndefined('genParams', genParams),
        context: buildEventContext(context),
    }
}

function buildImageEvent({ context, imageCount, warnings, providerMetadata }: BuildImageEventParams): AiUsageEvent {
    return {
        idempotencyKey: apId(),
        source: context.source,
        modality: AiUsageModality.IMAGE,
        provider: context.provider,
        model: context.model,
        imageCount,
        ...spreadIfNotUndefined('warnings', warnings ? [...warnings] : undefined),
        ...spreadIfNotUndefined('providerMetadata', providerMetadata),
        context: buildEventContext(context),
    }
}

function report({ apiClient, engineToken, event, log }: ReportParams): void {
    void tryCatch(() => apiClient.reportAiUsage({ engineToken, event })).then(({ error }) => {
        if (error) {
            log.warn({ err: error, idempotencyKey: event.idempotencyKey }, '[aiUsageCapture] Failed to report AI usage')
        }
    })
}

function mapUsage(usage: LanguageModelUsage | undefined): AiUsageEvent['usage'] | undefined {
    if (!usage) {
        return undefined
    }
    return {
        ...spreadIfDefined('inputTokens', usage.inputTokens),
        ...spreadIfDefined('outputTokens', usage.outputTokens),
        ...spreadIfDefined('totalTokens', usage.totalTokens),
        ...spreadIfDefined('reasoningTokens', usage.reasoningTokens),
        ...spreadIfDefined('cachedInputTokens', usage.cachedInputTokens),
    }
}

function buildEventContext(context: AiUsageCaptureContext): AiUsageEvent['context'] {
    if (context.source === AiUsageSource.CHAT) {
        return { ...spreadIfDefined('conversationId', context.conversationId) }
    }
    return {
        ...spreadIfDefined('flowId', context.flowId),
        ...spreadIfDefined('flowVersionId', context.flowVersionId),
        ...spreadIfDefined('runId', context.runId),
        ...spreadIfDefined('stepName', context.stepName),
        ...spreadIfDefined('actionName', context.actionName),
        ...spreadIfDefined('origin', context.origin),
    }
}

export const aiUsageCapture = {
    buildTextEvent,
    buildImageEvent,
    report,
}

export type AiUsageCaptureContext = {
    source: AiUsageSource
    provider: string
    model: string
    flowId?: string
    flowVersionId?: string
    runId?: string
    stepName?: string
    actionName?: AiUsageActionName
    conversationId?: string
    origin?: string
}

type BuildTextEventParams = {
    context: AiUsageCaptureContext
    usage?: LanguageModelUsage
    finishReason?: string
    warnings?: ReadonlyArray<unknown>
    providerMetadata?: unknown
    toolCalls?: { toolName: string, toolCallId?: string }[]
    genParams?: Record<string, unknown>
}

type BuildImageEventParams = {
    context: AiUsageCaptureContext
    imageCount: number
    warnings?: ReadonlyArray<unknown>
    providerMetadata?: unknown
}

type ReportParams = {
    apiClient: WorkerToApiContract
    engineToken: string
    event: AiUsageEvent
    log: Logger
}
