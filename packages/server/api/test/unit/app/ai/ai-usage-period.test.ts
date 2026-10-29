import { AIProviderName, AiUsageOrigin } from '@activepieces/core-utils'
import { describe, expect, it } from 'vitest'
import { aiUsageDimension } from '../../../../src/app/ai/usage/ai-usage-dimension'
import { aiUsagePeriod } from '../../../../src/app/ai/usage/ai-usage-period'

function iso(value: string): Date {
    return new Date(value)
}

describe('aiUsagePeriod.resolve', () => {
    it('ends sub-day periods at the current 5-minute bucket and compares with the span just before', () => {
        const resolved = aiUsagePeriod.resolve({ period: '24h', now: iso('2026-10-26T10:07:30Z') })
        expect(resolved.table).toBe('ai_usage_5m')
        expect(resolved.current).toEqual({ start: iso('2026-10-25T10:10:00Z'), end: iso('2026-10-26T10:10:00Z') })
        expect(resolved.previous).toEqual({ start: iso('2026-10-24T10:10:00Z'), end: iso('2026-10-25T10:10:00Z') })
        expect(resolved.slotCount).toBe(24)
        expect(resolved.scale).toBeNull()
        expect(aiUsagePeriod.labelOf({ resolved, slot: 1 })).toBe('2026-10-25T11:10:00.000Z')
    })

    it('counts last N days including today and scales the matching previous day by the elapsed fraction', () => {
        const resolved = aiUsagePeriod.resolve({ period: '7d', now: iso('2026-10-26T06:00:00Z') })
        expect(resolved.table).toBe('ai_usage_daily')
        expect(resolved.current).toEqual({ start: iso('2026-10-20T00:00:00Z'), end: iso('2026-10-27T00:00:00Z') })
        expect(resolved.previous).toEqual({ start: iso('2026-10-13T00:00:00Z'), end: iso('2026-10-20T00:00:00Z') })
        expect(resolved.scale).toEqual({ day: iso('2026-10-19T00:00:00Z'), fraction: 0.25 })
        expect(aiUsagePeriod.labelOf({ resolved, slot: 6 })).toBe('2026-10-26')
    })

    it('compares this month with the same days of last month', () => {
        const resolved = aiUsagePeriod.resolve({ period: 'this-month', now: iso('2026-10-20T12:00:00Z') })
        expect(resolved.current).toEqual({ start: iso('2026-10-01T00:00:00Z'), end: iso('2026-10-21T00:00:00Z') })
        expect(resolved.previous).toEqual({ start: iso('2026-09-01T00:00:00Z'), end: iso('2026-09-21T00:00:00Z') })
        expect(resolved.slotCount).toBe(20)
        expect(resolved.previousSlotCount).toBe(20)
        expect(resolved.scale).toEqual({ day: iso('2026-09-20T00:00:00Z'), fraction: 0.5 })
    })

    it('clamps this month at the end of a shorter previous month and stops scaling a finished day', () => {
        const resolved = aiUsagePeriod.resolve({ period: 'this-month', now: iso('2026-03-30T12:00:00Z') })
        expect(resolved.previous).toEqual({ start: iso('2026-02-01T00:00:00Z'), end: iso('2026-03-01T00:00:00Z') })
        expect(resolved.slotCount).toBe(30)
        expect(resolved.previousSlotCount).toBe(28)
        expect(resolved.scale).toBeNull()
    })

    it('handles a leap February', () => {
        const resolved = aiUsagePeriod.resolve({ period: 'this-month', now: iso('2028-03-31T00:00:00Z') })
        expect(resolved.previousSlotCount).toBe(29)
    })

    it('compares last month with the month before and folds a longer previous month into the last slot', () => {
        const resolved = aiUsagePeriod.resolve({ period: 'last-month', now: iso('2026-10-05T00:00:00Z') })
        expect(resolved.current).toEqual({ start: iso('2026-09-01T00:00:00Z'), end: iso('2026-10-01T00:00:00Z') })
        expect(resolved.previous).toEqual({ start: iso('2026-08-01T00:00:00Z'), end: iso('2026-09-01T00:00:00Z') })
        expect(resolved.slotCount).toBe(30)
        expect(resolved.previousSlotCount).toBe(30)
        expect(resolved.scale).toBeNull()
    })

    it('rolls last month over the year boundary', () => {
        const resolved = aiUsagePeriod.resolve({ period: 'last-month', now: iso('2027-01-03T00:00:00Z') })
        expect(resolved.current).toEqual({ start: iso('2026-12-01T00:00:00Z'), end: iso('2027-01-01T00:00:00Z') })
        expect(resolved.previous.start).toEqual(iso('2026-11-01T00:00:00Z'))
    })
})

describe('aiUsageDimension', () => {
    it('round-trips model ids that contain slashes and colons', () => {
        const id = aiUsageDimension.idOf({ dimension: 'model', keys: { projectId: null, flowId: null, agentId: null, userId: null, provider: AIProviderName.OPENROUTER, providerConfigId: null, modelId: 'anthropic/claude-sonnet-5:beta' } })
        expect(id).not.toBeNull()
        expect(aiUsageDimension.filterOf({ dimension: 'model', id: id ?? '' })).toEqual([
            { column: 'provider', value: AIProviderName.OPENROUTER },
            { column: 'modelId', value: 'anthropic/claude-sonnet-5:beta' },
        ])
    })

    it('maps keys without a config to credits or an unknown key of that provider', () => {
        const keys = { projectId: null, flowId: null, agentId: null, userId: null, providerConfigId: null, modelId: null }
        expect(aiUsageDimension.idOf({ dimension: 'key', keys: { ...keys, provider: AIProviderName.ACTIVEPIECES } })).toBe('activepieces-credits')
        expect(aiUsageDimension.filterOf({ dimension: 'key', id: 'unknown-openai' })).toEqual([
            { column: 'provider', value: AIProviderName.OPENAI },
            { column: 'providerConfigId', value: null },
        ])
    })

    it('rejects ids that do not decode to a known provider', () => {
        expect(aiUsageDimension.filterOf({ dimension: 'model', id: 'not-base64-at-all' })).toBeNull()
        expect(aiUsageDimension.filterOf({ dimension: 'key', id: 'unknown-nope' })).toBeNull()
    })

    it('maps the null project to the no-project id', () => {
        expect(aiUsageDimension.filterOf({ dimension: 'project', id: 'no-project' })).toEqual([{ column: 'projectId', value: null }])
    })

    it('gives every origin a source', () => {
        expect(Object.values(AiUsageOrigin).map((origin) => aiUsageDimension.sourceOf(origin))).not.toContain(undefined)
    })
})
