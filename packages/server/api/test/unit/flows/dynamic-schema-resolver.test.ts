import { describe, expect, it, vi } from 'vitest'

vi.mock('../../../src/app/workers/user-interaction-watcher', () => ({
    userInteractionWatcher: { submitAndWaitForResponse: vi.fn() },
}))

const { dynamicSchemaResolver } = await import('../../../src/app/flows/flow-version/dynamic-schema-resolver')
type ResolvedSchema = Parameters<typeof dynamicSchemaResolver.merge>[0]['schema']

const merge = dynamicSchemaResolver.merge

describe('dynamicSchemaResolver.merge', () => {
    it('keeps a truthy old value over the new schema default (carryover wins)', () => {
        const result = merge({
            schema: {
                includeSources: { required: false, defaultValue: false },
            } satisfies ResolvedSchema,
            oldMap: { includeSources: true },
            propName: 'webSearchOptions',
            stepName: 'step_1',
            targetLabel: 'openai/gpt-5',
        })
        expect(result).toEqual({ verdict: 'passed', resolved: { includeSources: true } })
    })

    it('keeps a falsy old value over the new schema default', () => {
        const result = merge({
            schema: {
                includeSources: { required: false, defaultValue: true },
            },
            oldMap: { includeSources: false },
            propName: 'webSearchOptions',
            stepName: 'step_1',
            targetLabel: 'openai/gpt-5',
        })
        expect(result).toEqual({ verdict: 'passed', resolved: { includeSources: false } })
    })

    it('keeps a null old value (treats null as set)', () => {
        const result = merge({
            schema: {
                userLocationCity: { required: false, defaultValue: 'New York' },
            },
            oldMap: { userLocationCity: null },
            propName: 'webSearchOptions',
            stepName: 'step_1',
            targetLabel: 'openai/gpt-5',
        })
        expect(result).toEqual({ verdict: 'passed', resolved: { userLocationCity: null } })
    })

    it('returns identical merge when all sub-keys are present and schema unchanged', () => {
        const oldMap = { maxUses: 3, includeSources: true }
        const result = merge({
            schema: {
                maxUses: { required: false, defaultValue: 5 },
                includeSources: { required: false, defaultValue: false },
            },
            oldMap,
            propName: 'webSearchOptions',
            stepName: 'step_1',
            targetLabel: 'openai/gpt-5',
        })
        expect(result).toEqual({ verdict: 'passed', resolved: oldMap })
    })

    it('drops keys that are present in old map but absent from new schema', () => {
        const result = merge({
            schema: {
                maxUses: { required: false, defaultValue: 5 },
            },
            oldMap: { maxUses: 3, includeSources: true },
            propName: 'webSearchOptions',
            stepName: 'step_1',
            targetLabel: 'openrouter/some-model',
        })
        expect(result).toEqual({ verdict: 'passed', resolved: { maxUses: 3 } })
    })

    it('applies defaults for new optional keys that are not in the old map', () => {
        const result = merge({
            schema: {
                quality: { required: false, defaultValue: 'standard' },
                size: { required: false, defaultValue: '1024x1024' },
            },
            oldMap: { quality: 'high' },
            propName: 'advancedOptions',
            stepName: 'step_1',
            targetLabel: 'openai/dall-e-3',
        })
        expect(result).toEqual({
            verdict: 'passed',
            resolved: { quality: 'high', size: '1024x1024' },
        })
    })

    it('blocks when a new required key has no default and no carryover', () => {
        const result = merge({
            schema: {
                size: { required: true },
            },
            oldMap: {},
            propName: 'advancedOptions',
            stepName: 'step_3',
            targetLabel: 'newprovider/new-model',
        })
        expect(result).toEqual({
            verdict: 'blocked',
            reason: 'Step step_3 blocked: advancedOptions.size is required and has no default for newprovider/new-model.',
        })
    })

    it('preserves the entire old map verbatim when the new schema is empty', () => {
        const oldMap = { includeSources: true, maxUses: 3, userLocationCity: 'Paris' }
        const result = merge({
            schema: {},
            oldMap,
            propName: 'webSearchOptions',
            stepName: 'step_2',
            targetLabel: 'cloudflare/no-web-search',
        })
        expect(result).toEqual({ verdict: 'passed', resolved: oldMap })
        expect(result.verdict === 'passed' && result.resolved).not.toBe(oldMap)
    })

    it('returns an empty resolved object when both schema and old map are empty', () => {
        const result = merge({
            schema: {},
            oldMap: {},
            propName: 'webSearchOptions',
            stepName: 'step_2',
            targetLabel: 'cloudflare/no-web-search',
        })
        expect(result).toEqual({ verdict: 'passed', resolved: {} })
    })

    it('handles undefined oldMap as if empty', () => {
        const result = merge({
            schema: {
                maxUses: { required: false, defaultValue: 5 },
            },
            oldMap: undefined,
            propName: 'webSearchOptions',
            stepName: 'step_1',
            targetLabel: 'openai/gpt-5',
        })
        expect(result).toEqual({ verdict: 'passed', resolved: { maxUses: 5 } })
    })
})
