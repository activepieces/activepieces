import { AIProviderName } from '@activepieces/core-utils'
import { SharedV3ProviderOptions } from '@ai-sdk/provider'
import { convertArrayToReadableStream, MockLanguageModelV3 } from 'ai/test'
import { describe, expect, it } from 'vitest'
import { runAgentTurn } from '../../../src/lib/execute/jobs/ee/agent/run-agent-turn'

const silentLog = { debug: () => undefined, info: () => undefined, warn: () => undefined, error: () => undefined } as never

const TIER = { id: 'fast', thinkingBudget: 5_000, modelId: 'anthropic/claude-haiku-4.5' }

async function capturedProviderOptions({ provider, modelId }: { provider: AIProviderName, modelId: string }): Promise<SharedV3ProviderOptions[]> {
    const sent: SharedV3ProviderOptions[] = []
    const model = new MockLanguageModelV3({
        doStream: async ({ providerOptions }) => {
            sent.push(providerOptions ?? {})
            return {
                stream: convertArrayToReadableStream([
                    { type: 'stream-start', warnings: [] },
                    { type: 'text-start', id: 'text-1' },
                    { type: 'text-delta', id: 'text-1', delta: 'On it.' },
                    { type: 'text-end', id: 'text-1' },
                    { type: 'finish', finishReason: 'stop', usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 } },
                ]),
            }
        },
    })

    await runAgentTurn({
        model,
        provider,
        systemPrompt: 'You are a test agent.',
        messages: [{ role: 'user', content: 'hello' }],
        tools: {},
        allToolNames: [],
        tier: TIER,
        modelId,
        phaseState: { phase: 'discovery' },
        abortSignal: new AbortController().signal,
        log: silentLog,
    })

    return sent
}

describe('the agent loop asks a provider for the reasoning it can actually give', () => {
    it('never asks a reasoning-native managed model to switch reasoning off', async () => {
        const [first] = await capturedProviderOptions({ provider: AIProviderName.ACTIVEPIECES, modelId: 'google/gemini-3.8-flash' })

        expect(first.openrouter?.reasoning).not.toHaveProperty('enabled')
        expect(first.openrouter?.reasoning).not.toMatchObject({ effort: 'none' })
        expect(first.openrouter?.reasoning).toEqual({ effort: 'minimal' })
    })

    it('keeps the zero-reasoning first step for a model documented to allow it', async () => {
        const [first] = await capturedProviderOptions({ provider: AIProviderName.ACTIVEPIECES, modelId: TIER.modelId })

        expect(first.openrouter?.reasoning).toEqual({ enabled: false })
    })

    it('still sends the ephemeral prompt cache alongside it', async () => {
        const [first] = await capturedProviderOptions({ provider: AIProviderName.ACTIVEPIECES, modelId: TIER.modelId })

        expect(first.openrouter?.cache_control).toEqual({ type: 'ephemeral' })
    })

    it('sends Anthropic its own thinking switch rather than an OpenRouter one', async () => {
        const [first] = await capturedProviderOptions({ provider: AIProviderName.ANTHROPIC, modelId: TIER.modelId })

        expect(first.anthropic?.thinking).toEqual({ type: 'disabled' })
        expect(first.openrouter).toBeUndefined()
    })
})
