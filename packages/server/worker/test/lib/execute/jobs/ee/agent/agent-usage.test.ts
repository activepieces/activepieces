import { describe, expect, it } from 'vitest'
import { createAgentUsageCollector } from '../../../../../../src/lib/execute/jobs/ee/agent/agent-usage'

describe('createAgentUsageCollector', () => {
    it('returns undefined when no calls were recorded, even after markIncomplete', () => {
        const collector = createAgentUsageCollector()
        expect(collector.snapshot()).toBeUndefined()
        collector.markIncomplete()
        expect(collector.snapshot()).toBeUndefined()
    })

    it('sums calls across steps into the totals', () => {
        const collector = createAgentUsageCollector()
        collector.record({
            provider: 'anthropic',
            model: 'claude-sonnet-4-5-20250929',
            usage: { inputTokens: 100, outputTokens: 20 },
        })
        collector.record({
            provider: 'anthropic',
            model: 'claude-sonnet-4-5-20250929',
            usage: {
                inputTokens: 150,
                outputTokens: 30,
                inputTokenDetails: { cacheReadTokens: 40 },
                outputTokenDetails: { reasoningTokens: 6 },
            },
        })

        expect(collector.snapshot()).toEqual({
            version: 1,
            calls: [
                { provider: 'anthropic', model: 'claude-sonnet-4-5-20250929', inputTokens: 100, outputTokens: 20 },
                {
                    provider: 'anthropic',
                    model: 'claude-sonnet-4-5-20250929',
                    inputTokens: 150,
                    outputTokens: 30,
                    cachedInputTokens: 40,
                    reasoningTokens: 6,
                },
            ],
            totals: { inputTokens: 250, outputTokens: 50 },
        })
    })

    it('treats undefined token counts as zero and marks the report incomplete', () => {
        const collector = createAgentUsageCollector()
        collector.record({ provider: 'openai', model: 'gpt-4o-2024-11-20', usage: undefined })
        const snapshot = collector.snapshot()
        expect(snapshot?.calls[0]).toEqual({ provider: 'openai', model: 'gpt-4o-2024-11-20', inputTokens: 0, outputTokens: 0 })
        expect(snapshot?.incomplete).toBe(true)
    })

    it('stays incomplete once marked, even when later calls are fully counted', () => {
        const collector = createAgentUsageCollector()
        collector.record({ provider: 'openai', model: 'gpt-4o-2024-11-20', usage: { inputTokens: 5, outputTokens: 5 } })
        collector.markIncomplete()
        collector.record({ provider: 'openai', model: 'gpt-4o-2024-11-20', usage: { inputTokens: 5, outputTokens: 5 } })
        expect(collector.snapshot()?.incomplete).toBe(true)
    })
})
