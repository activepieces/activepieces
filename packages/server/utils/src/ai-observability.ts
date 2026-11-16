import { ActivepiecesAiBilling, ActivepiecesAiConsumerSource, isNil, isObject, tryCatch } from '@activepieces/core-utils'
import { OpenTelemetry } from '@ai-sdk/otel'
import { Attributes } from '@opentelemetry/api'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { BasicTracerProvider, BatchSpanProcessor } from '@opentelemetry/sdk-trace-base'
import { Telemetry } from 'ai'
import { aiTraceScrubber } from './ai-trace-scrubber'
import { wideEvent } from './wide-event'

let tracing: { processor: BatchSpanProcessor, integration: Telemetry } | undefined

function init({ enabled }: { enabled: boolean }): void {
    if (!enabled || !isNil(tracing)) {
        return
    }
    const exporter = aiTraceScrubber.wrapExporter({
        exporter: new OTLPTraceExporter({
            url: `${POSTHOG_HOST}/i/v0/ai/otel`,
            headers: { Authorization: `Bearer ${POSTHOG_PROJECT_TOKEN}` },
        }),
    })
    const processor = new BatchSpanProcessor(exporter, { maxExportBatchSize: 8, maxQueueSize: 128 })
    const tracer = new BasicTracerProvider({ spanProcessors: [processor], spanLimits: { attributeValueLengthLimit: 100_000 } }).getTracer('activepieces-ai')
    tracing = { processor, integration: new OpenTelemetry({ tracer, enrichSpan }) }
}

function integration(): Telemetry | undefined {
    return tracing?.integration
}

async function flush(): Promise<void> {
    await tryCatch(async () => tracing?.processor.forceFlush())
}

function reset(): void {
    tracing = undefined
}

function runtimeContextOf({ billing }: { billing?: ActivepiecesAiBilling }): AiTraceContext {
    const ids = isNil(billing) ? idsFromWideEvent() : idsFromBilling({ billing })
    const groups = {
        ...(isNil(ids.platformId) ? {} : { platform: ids.platformId }),
        ...(isNil(ids.projectId) ? {} : { project: ids.projectId }),
    }
    return {
        ...(isNil(ids.userId) ? {} : { distinctId: ids.userId }),
        ...(isNil(ids.conversationId) ? {} : { sessionId: ids.conversationId }),
        ...(Object.keys(groups).length === 0 ? {} : { groups: JSON.stringify(groups) }),
    }
}

function idsFromBilling({ billing }: { billing: ActivepiecesAiBilling }): TraceIds {
    const isChat = billing.source === ActivepiecesAiConsumerSource.CHAT
    return {
        userId: (isChat ? billing.chat?.userId : undefined) ?? billing.context?.userId,
        conversationId: isChat ? billing.conversationId : undefined,
        platformId: billing.platformId,
        projectId: billing.projectId ?? undefined,
    }
}

function idsFromWideEvent(): TraceIds {
    const context = wideEvent.current()?.getContext() ?? {}
    return {
        userId: idOf(context['user']),
        conversationId: idOf(context['conversation']),
        platformId: idOf(context['platform']),
        projectId: idOf(context['project']),
    }
}

function idOf(group: unknown): string | undefined {
    return isObject(group) && typeof group['id'] === 'string' ? group['id'] : undefined
}

function enrichSpan({ runtimeContext }: { runtimeContext: Record<string, unknown> | undefined }): Attributes {
    const distinctId = runtimeContext?.['distinctId']
    const sessionId = runtimeContext?.['sessionId']
    const groups = runtimeContext?.['groups']
    return {
        '$lib': POSTHOG_AI_LIB,
        ...(typeof distinctId === 'string' ? { 'posthog.distinct_id': distinctId } : {}),
        ...(typeof sessionId === 'string' ? { '$ai_session_id': sessionId } : {}),
        ...(typeof groups === 'string' ? { '$groups': groups } : {}),
    }
}

const POSTHOG_AI_LIB = 'activepieces-ai'

export const aiObservability = {
    init,
    integration,
    flush,
    reset,
    runtimeContextOf,
}

export const POSTHOG_PROJECT_TOKEN = 'phc_7F92HoXJPeGnTKmYv0eOw62FurPMRW9Aqr0TPrDzvHh'
export const POSTHOG_HOST = 'https://us.i.posthog.com'
export const AI_TRACE_RUNTIME_CONTEXT = { distinctId: true, sessionId: true, groups: true }

export type AiTraceContext = {
    distinctId?: string
    sessionId?: string
    groups?: string
}

type TraceIds = {
    userId?: string
    conversationId?: string
    platformId?: string
    projectId?: string
}
