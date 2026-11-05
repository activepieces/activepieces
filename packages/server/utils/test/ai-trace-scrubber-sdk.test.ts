import { OpenTelemetry } from '@ai-sdk/otel'
import { APICallError, LanguageModelV4GenerateResult } from '@ai-sdk/provider'
import { BasicTracerProvider, InMemorySpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base'
import { generateText, stepCountIs, tool } from 'ai'
import { MockLanguageModelV4 } from 'ai/test'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { aiTraceScrubber } from '../src/ai-trace-scrubber'

describe('aiTraceScrubber with real AI SDK spans', () => {
    it('keeps tool tokens and passwords out of every span of a real tool-calling turn', async () => {
        const { captured, integration } = createScrubbedIntegration()
        const model = new MockLanguageModelV4({
            doGenerate: [
                modelResult({ content: [{ type: 'tool-call', toolCallId: 'call-1', toolName: 'connect_crm', input: JSON.stringify({ workspace: 'acme', password: 'hidden-input-password' }) }], finish: 'tool-calls' }),
                modelResult({ content: [{ type: 'text', text: 'Connected to the Acme workspace.' }], finish: 'stop' }),
            ],
        })
        const connectCrm = tool({
            inputSchema: z.object({ workspace: z.string(), password: z.string() }),
            execute: async ({ workspace }) => ({
                content: [{ type: 'text', text: JSON.stringify({ workspace, access_token: 'hidden-oauth-token', refresh_token: 'hidden-refresh' }) }],
                structuredContent: { workspace, token: 'hidden-plain-token' },
            }),
        })

        const result = await generateText({
            model,
            prompt: 'Connect my CRM',
            tools: { connect_crm: connectCrm },
            stopWhen: stepCountIs(2),
            telemetry: { functionId: 'agent-turn', integrations: [integration] },
        })

        const spans = captured.getFinishedSpans()
        const exported = JSON.stringify(spans.map((span) => ({ name: span.name, attributes: span.attributes, status: span.status, events: span.events })))
        expect(result.text).toBe('Connected to the Acme workspace.')
        expect(spans.some((span) => span.name.includes('connect_crm'))).toBe(true)
        expect(exported).toContain('Connected to the Acme workspace.')
        expect(exported).toContain('acme')
        expect(exported).not.toMatch(/hidden-/)
    })

    it('exports a provider error that echoes a key as the error type only', async () => {
        const { captured, integration } = createScrubbedIntegration()
        const model = new MockLanguageModelV4({
            doGenerate: async () => {
                throw new APICallError({ message: 'Incorrect API key provided: hidden-provider-key', url: 'https://provider.test/v1', requestBodyValues: {}, statusCode: 401, isRetryable: false })
            },
        })

        await expect(generateText({ model, prompt: 'hi', maxRetries: 0, telemetry: { functionId: 'agent-turn', integrations: [integration] } })).rejects.toThrow()

        const spans = captured.getFinishedSpans()
        expect(spans.length).toBeGreaterThan(0)
        expect(JSON.stringify(spans.map((span) => ({ attributes: span.attributes, status: span.status, events: span.events })))).not.toContain('hidden-provider-key')
        expect(spans.some((span) => span.status.message === 'AI_APICallError')).toBe(true)
    })
})

function createScrubbedIntegration(): { captured: InMemorySpanExporter, integration: OpenTelemetry } {
    const captured = new InMemorySpanExporter()
    const tracer = new BasicTracerProvider({
        spanProcessors: [new SimpleSpanProcessor(aiTraceScrubber.wrapExporter({ exporter: captured }))],
    }).getTracer('test')
    return { captured, integration: new OpenTelemetry({ tracer }) }
}

function modelResult({ content, finish }: { content: LanguageModelV4GenerateResult['content'], finish: 'tool-calls' | 'stop' }): LanguageModelV4GenerateResult {
    return {
        content,
        finishReason: { unified: finish, raw: finish },
        usage: {
            inputTokens: { total: 10, noCache: 10, cacheRead: 0, cacheWrite: 0 },
            outputTokens: { total: 5, text: 5, reasoning: 0 },
        },
        warnings: [],
    }
}
