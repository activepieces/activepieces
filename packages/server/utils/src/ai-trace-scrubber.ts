import { isObject, tryCatchSync } from '@activepieces/core-utils'
import { Attributes, AttributeValue, SpanStatus } from '@opentelemetry/api'
import { ReadableSpan, SpanExporter, TimedEvent } from '@opentelemetry/sdk-trace-base'

function wrapExporter({ exporter }: { exporter: SpanExporter }): SpanExporter {
    return {
        export: (spans, resultCallback) => exporter.export(spans.map((span) => scrubSpan({ span })), resultCallback),
        shutdown: () => exporter.shutdown(),
        forceFlush: () => exporter.forceFlush?.() ?? Promise.resolve(),
    }
}

function scrubSpan({ span }: { span: ReadableSpan }): ReadableSpan {
    const context = span.spanContext()
    return {
        name: span.name,
        kind: span.kind,
        spanContext: () => context,
        parentSpanContext: span.parentSpanContext,
        startTime: span.startTime,
        endTime: span.endTime,
        status: errorTypeOnly({ status: span.status, events: span.events }),
        attributes: scrubAttributes({ attributes: span.attributes }),
        links: span.links,
        events: span.events.map((event) => scrubEvent({ event })),
        duration: span.duration,
        ended: span.ended,
        resource: span.resource,
        instrumentationScope: span.instrumentationScope,
        droppedAttributesCount: span.droppedAttributesCount,
        droppedEventsCount: span.droppedEventsCount,
        droppedLinksCount: span.droppedLinksCount,
    }
}

function errorTypeOnly({ status, events }: { status: SpanStatus, events: TimedEvent[] }): SpanStatus {
    if (status.message === undefined) {
        return status
    }
    const errorType = events.find((event) => event.name === 'exception')?.attributes?.['exception.type']
    return typeof errorType === 'string' ? { code: status.code, message: errorType } : { code: status.code }
}

function scrubEvent({ event }: { event: TimedEvent }): TimedEvent {
    if (event.attributes === undefined) {
        return event
    }
    const attributes = Object.fromEntries(Object.entries(event.attributes).filter(([key]) => !ERROR_DETAIL_ATTRIBUTES.has(key)))
    return { ...event, attributes: scrubAttributes({ attributes }) }
}

function scrubAttributes({ attributes }: { attributes: Attributes }): Attributes {
    return Object.fromEntries(Object.entries(attributes).map(([key, value]) => [key, scrubAttribute({ key, value })]))
}

function scrubAttribute({ key, value }: { key: string, value: AttributeValue | undefined }): AttributeValue | undefined {
    if (holdsSecret({ key, value })) {
        return REDACTED
    }
    if (typeof value === 'string') {
        return scrubText({ text: value })
    }
    if (Array.isArray(value) && value.every(isStringOrEmpty)) {
        return value.map((item) => (typeof item === 'string' ? scrubText({ text: item }) : item))
    }
    return value
}

function scrubText({ text }: { text: string }): string {
    if (!looksLikeJson(text)) {
        return text
    }
    const { data, error } = tryCatchSync((): unknown => JSON.parse(text))
    return error ? text : JSON.stringify(scrubJson({ value: data }))
}

function scrubJson({ value }: { value: unknown }): unknown {
    if (Array.isArray(value)) {
        return value.map((item) => scrubJson({ value: item }))
    }
    if (isObject(value)) {
        return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, holdsSecret({ key, value: child }) ? REDACTED : scrubJson({ value: child })]))
    }
    if (typeof value === 'string') {
        return scrubText({ text: value })
    }
    return value
}

function holdsSecret({ key, value }: { key: string, value: unknown }): boolean {
    return isSensitiveKey(key) && value !== null && (typeof value === 'string' || typeof value === 'object')
}

function isSensitiveKey(key: string): boolean {
    const normalized = key.toLowerCase().replace(/[^a-z]/g, '')
    return SENSITIVE_KEY_PARTS.some((part) => normalized.includes(part))
}

function looksLikeJson(text: string): boolean {
    const trimmed = text.trimStart()
    return trimmed.startsWith('{') || trimmed.startsWith('[')
}

function isStringOrEmpty(item: unknown): item is string | null | undefined {
    return typeof item === 'string' || item === null || item === undefined
}

const REDACTED = '[REDACTED]'

const SENSITIVE_KEY_PARTS = ['token', 'password', 'passwd', 'secret', 'apikey', 'authorization', 'credential', 'privatekey', 'accesskey', 'cookie']

const ERROR_DETAIL_ATTRIBUTES = new Set(['exception.message', 'exception.stacktrace'])

export const aiTraceScrubber = {
    wrapExporter,
}
