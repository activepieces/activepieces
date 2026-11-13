import { SpanStatusCode } from '@opentelemetry/api'
import { BasicTracerProvider, InMemorySpanExporter, ReadableSpan, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base'
import { describe, expect, it } from 'vitest'
import { aiTraceScrubber } from '../src/ai-trace-scrubber'

describe('aiTraceScrubber', () => {
    it('redacts sensitive fields at any depth of a tool result, including JSON inside strings', () => {
        const pieceOutput = {
            token: 'hidden-1',
            access_token: 'hidden-2',
            profile: { name: 'Acme', password: 'hidden-"3"', nested: JSON.stringify({ client_secret: 'hidden-4' }) },
            credentials: { user: 'hidden-5' },
            rows: [{ email: 'ops@acme.test', apiKey: 'hidden-6' }],
        }
        const toolResult = { content: [{ type: 'text', text: JSON.stringify(pieceOutput) }], structuredContent: pieceOutput, usage: { inputTokens: 120, inputTokenDetails: { cacheReadTokens: 3 } } }

        const span = exportOneSpan((tracer) => {
            const s = tracer.startSpan('execute_tool ap_run_action')
            s.setAttribute('gen_ai.tool.call.result', JSON.stringify(toolResult))
            s.end()
        })

        const result = String(span.attributes['gen_ai.tool.call.result'])
        expect(result).not.toMatch(/hidden-/)
        const parsed = JSON.parse(result)
        expect(parsed.usage.inputTokens).toBe(120)
        expect(parsed.usage.inputTokenDetails).toBe('[REDACTED]')
        expect(parsed.structuredContent.profile.name).toBe('Acme')
        expect(parsed.structuredContent.rows[0].email).toBe('ops@acme.test')
        expect(JSON.parse(parsed.content[0].text).token).toBe('[REDACTED]')
    })

    it('redacts JSON embedded in decorated piece action text, keeping the text around it', () => {
        const output = { workspace: 'acme', access_token: 'hidden-oauth', items: [{ id: 1, note: 'a [bracket] in text' }] }
        const actionText = `✅ Connect CRM completed (run run_1).\n\n${JSON.stringify(output)}\n\n(Long values above end with "…[truncated]" — shortened, not missing.)`
        const toolResult = { content: [{ type: 'text', text: actionText }] }

        const span = exportOneSpan((tracer) => {
            const s = tracer.startSpan('execute_tool ap_run_action')
            s.setAttribute('gen_ai.tool.call.result', JSON.stringify(toolResult))
            s.end()
        })

        const text: string = JSON.parse(String(span.attributes['gen_ai.tool.call.result'])).content[0].text
        expect(text).not.toContain('hidden-oauth')
        expect(text.startsWith('✅ Connect CRM completed (run run_1).\n\n')).toBe(true)
        expect(text.endsWith('shortened, not missing.)')).toBe(true)
        const embedded = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1))
        expect(embedded).toEqual({ ...output, access_token: '[REDACTED]' })
    })

    it('stays fast on bracket-heavy text and fails closed instead of leaking', () => {
        const hostile = `${'['.repeat(100_000)} {"token":"hidden-after-brackets"}`
        const startedAt = Date.now()

        const span = exportOneSpan((tracer) => {
            const s = tracer.startSpan('invoke_agent')
            s.setAttribute('gen_ai.input.messages', hostile)
            s.end()
        })

        expect(Date.now() - startedAt).toBeLessThan(1000)
        expect(String(span.attributes['gen_ai.input.messages'])).not.toContain('hidden-after-brackets')
    })

    it('redacts sensitive attributes by name and keeps numbers and plain text', () => {
        const span = exportOneSpan((tracer) => {
            const s = tracer.startSpan('invoke_agent')
            s.setAttributes({
                'http.request.header.authorization': 'hidden-header',
                'gen_ai.usage.input_tokens': 1234,
                'gen_ai.input.messages': 'Send the weekly report to the sales team on Monday',
            })
            s.end()
        })

        expect(span.attributes['http.request.header.authorization']).toBe('[REDACTED]')
        expect(span.attributes['gen_ai.usage.input_tokens']).toBe(1234)
        expect(span.attributes['gen_ai.input.messages']).toBe('Send the weekly report to the sales team on Monday')
    })

    it('exports an error as its type, never its message', () => {
        const span = exportOneSpan((tracer) => {
            const s = tracer.startSpan('invoke_agent')
            const error = new TypeError('Incorrect API key provided: hidden-provider-key')
            s.recordException(error)
            s.setStatus({ code: SpanStatusCode.ERROR, message: error.message })
            s.end()
        })

        expect(JSON.stringify({ status: span.status, events: span.events })).not.toContain('hidden-provider-key')
        expect(span.status).toEqual({ code: SpanStatusCode.ERROR, message: 'TypeError' })
        expect(span.events[0].attributes?.['exception.type']).toBe('TypeError')
    })
})

function exportOneSpan(record: (tracer: ReturnType<BasicTracerProvider['getTracer']>) => void): ReadableSpan {
    const captured = new InMemorySpanExporter()
    const tracer = new BasicTracerProvider({
        spanProcessors: [new SimpleSpanProcessor(aiTraceScrubber.wrapExporter({ exporter: captured }))],
    }).getTracer('test')
    record(tracer)
    return captured.getFinishedSpans()[0]
}
