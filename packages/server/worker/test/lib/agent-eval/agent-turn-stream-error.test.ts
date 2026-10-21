import { AIProviderName } from '@activepieces/core-utils'
import { convertArrayToReadableStream, MockLanguageModelV3 } from 'ai/test'
import { describe, expect, it } from 'vitest'
import { runAgentTurn } from '../../../src/lib/execute/jobs/ee/agent/run-agent-turn'

const silentLog = { debug: () => undefined, info: () => undefined, warn: () => undefined, error: () => undefined } as never

const TIER = { id: 'fast', thinkingBudget: 5_000, modelId: 'anthropic/claude-haiku-4.5' }

describe('a provider that streams a plain-object error', () => {
    it('keeps the provider detail instead of [object Object]', async () => {
        const model = new MockLanguageModelV3({
            doStream: async () => ({
                stream: convertArrayToReadableStream([
                    { type: 'stream-start', warnings: [] },
                    { type: 'error', error: { code: 502, message: 'Provider returned error' } },
                ]),
            }),
        })

        const { streamError } = await runAgentTurn({
            model,
            provider: AIProviderName.ACTIVEPIECES,
            systemPrompt: 'You are a test agent.',
            messages: [{ role: 'user', content: 'hello' }],
            tools: {},
            allToolNames: [],
            tier: TIER,
            modelId: TIER.modelId,
            phaseState: { phase: 'discovery' },
            abortSignal: new AbortController().signal,
            log: silentLog,
        })

        expect(streamError?.message).not.toContain('[object Object]')
        expect(streamError?.message).toContain('Provider returned error')
    })
})
