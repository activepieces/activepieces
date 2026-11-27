import { ActivepiecesAiBilling, ActivepiecesAiConsumerSource, isNil, isObject, tryCatch } from '@activepieces/core-utils'
import { OpenTelemetry } from '@ai-sdk/otel'
import { Attributes } from '@opentelemetry/api'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { BasicTracerProvider, BatchSpanProcessor } from '@opentelemetry/sdk-trace-base'
import { Telemetry } from 'ai'
import { aiTraceScrubber } from './ai-trace-scrubber'
import { apVersionUtil } from './ap-version'
import { posthogConfig } from './posthog-config'
import { wideEvent } from './wide-event'

let tracing: { processor: BatchSpanProcessor, integration: Telemetry, projectToken: string } | undefined

function init({ enabled, projectToken }: { enabled: boolean, projectToken: string | null }): void {
    const activeToken = enabled ? projectToken : null
    if (tracing?.projectToken === activeToken) {
        return
    }
    if (!isNil(tracing)) {
        tracing.processor.shutdown().catch(() => undefined)
        tracing = undefined
    }
    if (isNil(activeToken)) {
        return
    }
    const exporter = aiTraceScrubber.wrapExporter({
        exporter: new OTLPTraceExporter({
            url: `${posthogConfig.host}/i/v0/ai/otel`,
            headers: { Authorization: `Bearer ${activeToken}` },
        }),
    })
    const processor = new BatchSpanProcessor(exporter, { maxExportBatchSize: 8, maxQueueSize: 128 })
    const tracer = new BasicTracerProvider({ spanProcessors: [processor], spanLimits: { attributeValueLengthLimit: 100_000 } }).getTracer('activepieces-ai')
    tracing = { processor, integration: new OpenTelemetry({ tracer, enrichSpan }), projectToken: activeToken }
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

function runtimeContextOf({ billing, functionId }: { billing?: ActivepiecesAiBilling, functionId?: string }): AiTraceContext {
    const ids = { ...runLabelsFromWideEvent(), ...(isNil(billing) ? idsFromWideEvent() : idsFromBilling({ billing })) }
    const groups = {
        ...(isNil(ids.platformId) ? {} : { platform: ids.platformId }),
        ...(isNil(ids.projectId) ? {} : { project: ids.projectId }),
    }
    return {
        ...(isNil(ids.userId) ? {} : { distinctId: ids.userId }),
        ...(isNil(ids.conversationId) ? {} : { sessionId: ids.conversationId }),
        ...(Object.keys(groups).length === 0 ? {} : { groups: JSON.stringify(groups) }),
        ...(isNil(ids.runSource) ? {} : { runSource: ids.runSource }),
        ...(isNil(ids.tierId) ? {} : { tierId: ids.tierId }),
        ...(isNil(ids.tierModel) ? {} : { tierModel: ids.tierModel }),
        ...(isNil(functionId) ? {} : { functionId }),
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
        userId: fieldOf({ group: context['user'], key: 'id' }),
        conversationId: fieldOf({ group: context['conversation'], key: 'id' }),
        platformId: fieldOf({ group: context['platform'], key: 'id' }),
        projectId: fieldOf({ group: context['project'], key: 'id' }),
    }
}

function runLabelsFromWideEvent(): TraceIds {
    const agentRun = wideEvent.current()?.getContext()['agentRun']
    return {
        runSource: fieldOf({ group: agentRun, key: 'source' }),
        tierId: fieldOf({ group: agentRun, key: 'tierId' }),
        tierModel: fieldOf({ group: agentRun, key: 'tierModel' }),
    }
}

function fieldOf({ group, key }: { group: unknown, key: string }): string | undefined {
    const value = isObject(group) ? group[key] : undefined
    return typeof value === 'string' ? value : undefined
}

function enrichSpan({ runtimeContext }: { runtimeContext: Record<string, unknown> | undefined }): Attributes {
    const contextAttributes = Object.entries(SPAN_ATTRIBUTE_BY_CONTEXT_KEY).flatMap(([contextKey, attribute]) => {
        const value = runtimeContext?.[contextKey]
        return typeof value === 'string' ? [[attribute, value]] : []
    })
    return {
        '$lib': POSTHOG_AI_LIB,
        'activepiecesVersion': apVersionUtil.getCurrentRelease(),
        ...Object.fromEntries(contextAttributes),
    }
}

const POSTHOG_AI_LIB = 'activepieces-ai'
const SPAN_ATTRIBUTE_BY_CONTEXT_KEY: Record<keyof AiTraceContext, string> = {
    distinctId: 'posthog.distinct_id',
    sessionId: '$ai_session_id',
    groups: '$groups',
    runSource: 'ai_run_source',
    tierId: 'ai_tier_id',
    tierModel: 'ai_tier_model',
    functionId: 'ai_function_id',
}

export const aiObservability = {
    init,
    integration,
    flush,
    reset,
    runtimeContextOf,
}

export const AI_TRACE_RUNTIME_CONTEXT = { distinctId: true, sessionId: true, groups: true, runSource: true, tierId: true, tierModel: true, functionId: true }

export type AiTraceContext = {
    distinctId?: string
    sessionId?: string
    groups?: string
    runSource?: string
    tierId?: string
    tierModel?: string
    functionId?: string
}

type TraceIds = {
    userId?: string
    conversationId?: string
    platformId?: string
    projectId?: string
    runSource?: string
    tierId?: string
    tierModel?: string
}
