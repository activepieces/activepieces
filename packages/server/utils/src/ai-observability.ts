import { createHash } from 'node:crypto'
import { ActivepiecesAiBilling, ActivepiecesAiConsumerSource, isNil, isObject, tryCatch } from '@activepieces/core-utils'
import { OpenTelemetry } from '@ai-sdk/otel'
import { Attributes } from '@opentelemetry/api'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { BasicTracerProvider, BatchSpanProcessor } from '@opentelemetry/sdk-trace-base'
import { asSchema, Telemetry, ToolSet } from 'ai'
import { apVersionUtil } from './ap-version'
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

function runtimeContextOf({ billing, turn }: { billing?: ActivepiecesAiBilling, turn?: AiTurnTrace }): AiTraceContext {
    const ids = isNil(billing) ? idsFromWideEvent() : idsFromBilling({ billing })
    const groups = {
        ...(isNil(ids.platformId) ? {} : { platform: ids.platformId }),
        ...(isNil(ids.projectId) ? {} : { project: ids.projectId }),
    }
    return {
        ...(isNil(ids.userId) ? {} : { distinctId: ids.userId }),
        ...(isNil(ids.conversationId) ? {} : { sessionId: ids.conversationId }),
        ...(Object.keys(groups).length === 0 ? {} : { groups: JSON.stringify(groups) }),
        version: apVersionUtil.getCurrentRelease(),
        ...turn,
    }
}

function promptFingerprintOf({ templates }: { templates: Record<string, unknown> }): string {
    return shortHash({ value: templates })
}

async function turnFingerprintOf({ promptFingerprint, tools, guides }: { promptFingerprint: string | undefined, tools: ToolSet, guides: Record<string, string> }): Promise<string> {
    const toolSchemas = await Promise.all(Object.entries(tools)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(async ([name, tool]) => ({ name, description: tool.description ?? '', inputSchema: await asSchema(tool.inputSchema).jsonSchema })))
    const skills = Object.entries(guides).sort(([a], [b]) => a.localeCompare(b))
    return shortHash({ value: { prompt: promptFingerprint ?? null, tools: toolSchemas, skills } })
}

function shortHash({ value }: { value: unknown }): string {
    return createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, FINGERPRINT_LENGTH)
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
        ...Object.fromEntries(Object.entries(TURN_ATTRIBUTES).flatMap(([key, attribute]) => {
            const value = runtimeContext?.[key]
            return typeof value === 'string' ? [[attribute, value]] : []
        })),
    }
}

const POSTHOG_AI_LIB = 'activepieces-ai'
const FINGERPRINT_LENGTH = 12
const TURN_ATTRIBUTES: Record<keyof AiTurnTrace | 'version', string> = {
    version: 'activepiecesVersion',
    runSource: 'ai_run_source',
    tierId: 'ai_tier_id',
    tierModel: 'ai_tier_model',
    fingerprint: 'ai_fingerprint',
}

export const aiObservability = {
    init,
    integration,
    flush,
    reset,
    runtimeContextOf,
    promptFingerprintOf,
    turnFingerprintOf,
}

export const POSTHOG_PROJECT_TOKEN = 'phc_7F92HoXJPeGnTKmYv0eOw62FurPMRW9Aqr0TPrDzvHh'
export const POSTHOG_HOST = 'https://us.i.posthog.com'
export const AI_TRACE_RUNTIME_CONTEXT = { distinctId: true, sessionId: true, groups: true, version: true, runSource: true, tierId: true, tierModel: true, fingerprint: true }

export type AiTurnTrace = {
    runSource?: string
    tierId?: string
    tierModel?: string
    fingerprint?: string
}

export type AiTraceContext = AiTurnTrace & {
    distinctId?: string
    sessionId?: string
    groups?: string
    version?: string
}

type TraceIds = {
    userId?: string
    conversationId?: string
    platformId?: string
    projectId?: string
}
