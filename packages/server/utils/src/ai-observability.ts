import { ActivepiecesAiBilling, ActivepiecesAiConsumerSource, isNil, isObject, tryCatch } from '@activepieces/core-utils'
import { OpenTelemetry } from '@ai-sdk/otel'
import { Attributes } from '@opentelemetry/api'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { BasicTracerProvider, BatchSpanProcessor } from '@opentelemetry/sdk-trace-base'
import { asSchema, Telemetry, ToolSet } from 'ai'
import { apVersionUtil } from './ap-version'
import { cryptoUtils } from './crypto'
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

function runtimeContextOf({ billing, fingerprint }: { billing?: ActivepiecesAiBilling, fingerprint?: string }): AiTraceContext {
    const ids = isNil(billing) ? idsFromWideEvent() : idsFromBilling({ billing })
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
        ...(isNil(fingerprint) ? {} : { fingerprint }),
    }
}

function promptFingerprintOf({ templates }: { templates: Record<string, unknown> }): string {
    return shortHash({ value: templates })
}

async function turnFingerprintOf({ promptFingerprint, tools }: { promptFingerprint: string | undefined, tools: ToolSet }): Promise<string> {
    const toolSchemas = await Promise.all(Object.entries(tools)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(async ([name, tool]) => ({ name, description: tool.description ?? '', inputSchema: await asSchema(tool.inputSchema).jsonSchema })))
    return shortHash({ value: { prompt: promptFingerprint ?? null, tools: toolSchemas } })
}

function shortHash({ value }: { value: unknown }): string {
    return cryptoUtils.hashSHA256(JSON.stringify(value)).slice(0, FINGERPRINT_LENGTH)
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
        runSource: fieldOf({ group: context['agentRun'], key: 'source' }),
        tierId: fieldOf({ group: context['agentRun'], key: 'tierId' }),
        tierModel: fieldOf({ group: context['agentRun'], key: 'tierModel' }),
    }
}

function fieldOf({ group, key }: { group: unknown, key: string }): string | undefined {
    const value = isObject(group) ? group[key] : undefined
    return typeof value === 'string' ? value : undefined
}

function enrichSpan({ runtimeContext }: { runtimeContext: Record<string, unknown> | undefined }): Attributes {
    const distinctId = runtimeContext?.['distinctId']
    const sessionId = runtimeContext?.['sessionId']
    const groups = runtimeContext?.['groups']
    const runSource = runtimeContext?.['runSource']
    const tierId = runtimeContext?.['tierId']
    const tierModel = runtimeContext?.['tierModel']
    const fingerprint = runtimeContext?.['fingerprint']
    return {
        '$lib': POSTHOG_AI_LIB,
        'activepiecesVersion': apVersionUtil.getCurrentRelease(),
        ...(typeof distinctId === 'string' ? { 'posthog.distinct_id': distinctId } : {}),
        ...(typeof sessionId === 'string' ? { '$ai_session_id': sessionId } : {}),
        ...(typeof groups === 'string' ? { '$groups': groups } : {}),
        ...(typeof runSource === 'string' ? { 'ai_run_source': runSource } : {}),
        ...(typeof tierId === 'string' ? { 'ai_tier_id': tierId } : {}),
        ...(typeof tierModel === 'string' ? { 'ai_tier_model': tierModel } : {}),
        ...(typeof fingerprint === 'string' ? { 'ai_fingerprint': fingerprint } : {}),
    }
}

const POSTHOG_AI_LIB = 'activepieces-ai'
const FINGERPRINT_LENGTH = 12

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
export const AI_TRACE_RUNTIME_CONTEXT = { distinctId: true, sessionId: true, groups: true, runSource: true, tierId: true, tierModel: true, fingerprint: true }

export type AiTraceContext = {
    distinctId?: string
    sessionId?: string
    groups?: string
    runSource?: string
    tierId?: string
    tierModel?: string
    fingerprint?: string
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
