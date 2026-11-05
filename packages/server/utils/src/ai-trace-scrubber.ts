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
    const pieces: string[] = []
    let cursor = 0
    let budget = text.length * SCAN_BUDGET_PER_CHAR
    let start = nextOpeningBracket({ text, from: 0 })
    while (start !== -1) {
        const scan = closingBracketIndex({ text, start, budget })
        budget -= scan.scanned
        if (budget <= 0) {
            pieces.push(text.slice(cursor, start), REDACTED)
            return pieces.join('')
        }
        const embedded = scan.close === -1 ? undefined : parseJson({ text: text.slice(start, scan.close + 1) })
        if (embedded === undefined) {
            start = nextOpeningBracket({ text, from: start + 1 })
            continue
        }
        pieces.push(text.slice(cursor, start), JSON.stringify(scrubJson({ value: embedded.value })))
        cursor = scan.close + 1
        start = nextOpeningBracket({ text, from: cursor })
    }
    pieces.push(text.slice(cursor))
    return pieces.join('')
}

function parseJson({ text }: { text: string }): { value: unknown } | undefined {
    const { data, error } = tryCatchSync((): unknown => JSON.parse(text))
    return error ? undefined : { value: data }
}

function closingBracketIndex({ text, start, budget }: { text: string, start: number, budget: number }): { close: number, scanned: number } {
    let depth = 0
    let inString = false
    for (let index = start; index < text.length; index++) {
        if (index - start >= budget) {
            return { close: -1, scanned: index - start }
        }
        const char = text[index]
        if (inString) {
            if (char === '\\') {
                index++
            }
            else if (char === '"') {
                inString = false
            }
            continue
        }
        if (char === '"') {
            inString = true
        }
        else if (char === '{' || char === '[') {
            depth++
        }
        else if (char === '}' || char === ']') {
            depth--
            if (depth === 0) {
                return { close: index, scanned: index - start + 1 }
            }
        }
    }
    return { close: -1, scanned: text.length - start }
}

function nextOpeningBracket({ text, from }: { text: string, from: number }): number {
    const opening = /[[{]/g
    opening.lastIndex = from
    return opening.exec(text)?.index ?? -1
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

function isStringOrEmpty(item: unknown): item is string | null | undefined {
    return typeof item === 'string' || item === null || item === undefined
}

const REDACTED = '[REDACTED]'

const SCAN_BUDGET_PER_CHAR = 10

const SENSITIVE_KEY_PARTS = ['token', 'password', 'passwd', 'secret', 'apikey', 'authorization', 'credential', 'privatekey', 'accesskey', 'cookie']

const ERROR_DETAIL_ATTRIBUTES = new Set(['exception.message', 'exception.stacktrace'])

export const aiTraceScrubber = {
    wrapExporter,
}
