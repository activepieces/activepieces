import { AIProviderName } from '@activepieces/core-utils'
import { describe, expect, it } from 'vitest'
import { resolveAiCreditWeight } from '../../../../src/app/flows/flow-run/flow-run-ai-usage-tracker'
import { buildCreditEvents, CreditUsageEvent, CreditUsageSource } from '../../../../src/app/platform/billing-provider'

const baseArgs = {
    platformId: 'platform-1',
    source: CreditUsageSource.AI,
    baseIdempotencyKey: 'run-1:ai',
    properties: { platformId: 'platform-1', projectId: 'project-1' },
}

describe('buildCreditEvents', () => {
    it('preserves the summed value across the split', () => {
        const events = buildCreditEvents({
            ...baseArgs,
            events: [
                { event: CreditUsageEvent.AI_STEP_MESSAGE, value: 3, key: 'message' },
                { event: CreditUsageEvent.AI_STEP_TOOL_CALL, value: 5, key: 'tool_call' },
            ],
        })
        const total = events.reduce((sum, event) => sum + event.value, 0)
        expect(total).toBe(8)
    })

    it('skips zero-value components', () => {
        const events = buildCreditEvents({
            ...baseArgs,
            events: [
                { event: CreditUsageEvent.AI_STEP_MESSAGE, value: 2, key: 'message' },
                { event: CreditUsageEvent.AI_STEP_TOOL_CALL, value: 0, key: 'tool_call' },
            ],
        })
        expect(events).toHaveLength(1)
        expect(events[0].properties?.event).toBe(CreditUsageEvent.AI_STEP_MESSAGE)
    })

    it('returns an empty array when every component is zero', () => {
        const events = buildCreditEvents({
            ...baseArgs,
            events: [
                { event: CreditUsageEvent.AI_STEP_MESSAGE, value: 0, key: 'message' },
                { event: CreditUsageEvent.AI_STEP_TOOL_CALL, value: 0, key: 'tool_call' },
            ],
        })
        expect(events).toEqual([])
    })

    it('derives distinct idempotency keys and stamps event + source + base properties', () => {
        const events = buildCreditEvents({
            ...baseArgs,
            events: [
                { event: CreditUsageEvent.AI_STEP_MESSAGE, value: 1, key: 'message' },
                { event: CreditUsageEvent.AI_STEP_TOOL_CALL, value: 1, key: 'tool_call' },
            ],
        })
        expect(events.map((event) => event.idempotencyKey)).toEqual(['run-1:ai:message', 'run-1:ai:tool_call'])
        expect(events[0].source).toBe(CreditUsageSource.AI)
        expect(events[0].properties).toEqual({ platformId: 'platform-1', projectId: 'project-1', event: CreditUsageEvent.AI_STEP_MESSAGE })
    })
})

describe('resolveAiCreditWeight', () => {
    it('weights managed-provider models by their chat tier', () => {
        expect(resolveAiCreditWeight({ provider: AIProviderName.ACTIVEPIECES, model: 'anthropic/claude-haiku-4.5' })).toBe(2)
        expect(resolveAiCreditWeight({ provider: AIProviderName.ACTIVEPIECES, model: 'anthropic/claude-sonnet-4.6' })).toBe(10)
        expect(resolveAiCreditWeight({ provider: AIProviderName.ACTIVEPIECES, model: 'anthropic/claude-opus-4.8' })).toBe(20)
    })

    it('defaults unknown managed-provider models to 2', () => {
        expect(resolveAiCreditWeight({ provider: AIProviderName.ACTIVEPIECES, model: 'openai/gpt-4o' })).toBe(2)
    })

    it('does not weight non-managed providers', () => {
        expect(resolveAiCreditWeight({ provider: AIProviderName.ANTHROPIC, model: 'anthropic/claude-opus-4.8' })).toBe(1)
    })
})
