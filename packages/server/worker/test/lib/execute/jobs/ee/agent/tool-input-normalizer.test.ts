import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { toolInputNormalizer } from '../../../../../../src/lib/execute/jobs/ee/agent/tool-input-normalizer'

function schemaOf(schema: z.ZodType): unknown {
    return z.toJSONSchema(schema)
}

const LAZY_SCHEMA = schemaOf(z.object({
    tool: z.string(),
    input: z.record(z.string(), z.unknown()),
    title: z.string().optional(),
}))

describe('toolInputNormalizer', () => {
    it('unwraps a lazy-tool call the model nested inside an extra input object', () => {
        const input = { input: { tool: 'ap_execute_action', input: { pieceName: '@activepieces/piece-gmail' } } }

        expect(toolInputNormalizer.normalize({ input, schema: LAZY_SCHEMA })).toEqual({
            tool: 'ap_execute_action',
            input: { pieceName: '@activepieces/piece-gmail' },
        })
    })

    it('unwraps a direct tool call wrapped in an input envelope the schema does not declare', () => {
        const schema = schemaOf(z.object({ flowId: z.string(), stepName: z.string() }))
        const input = { input: { flowId: 'f1', stepName: 'step_1' }, doneTitle: 'Read it' }

        expect(toolInputNormalizer.normalize({ input, schema })).toEqual({ flowId: 'f1', stepName: 'step_1' })
    })

    it('keeps a declared input property that is the real step input', () => {
        const schema = schemaOf(z.object({ flowId: z.string(), stepName: z.string(), input: z.record(z.string(), z.unknown()) }))
        const input = { flowId: 'f1', stepName: 'step_1', input: { flowId: 'other' } }

        expect(toolInputNormalizer.normalize({ input, schema })).toEqual(input)
    })

    it('turns an array sent as an item wrapper into an array', () => {
        const schema = schemaOf(z.object({ phase: z.string(), steps: z.array(z.object({ id: z.string(), done: z.boolean() })) }))

        expect(toolInputNormalizer.normalize({ input: { phase: 'building', steps: { item: [{ id: 'a', done: 'false' }] } }, schema })).toEqual({
            phase: 'building',
            steps: [{ id: 'a', done: false }],
        })
        expect(toolInputNormalizer.normalize({ input: { phase: 'done', steps: { item: { id: 'b', done: 'true' } } }, schema })).toEqual({
            phase: 'done',
            steps: [{ id: 'b', done: true }],
        })
    })

    it('coerces numbers and booleans that arrive as strings', () => {
        const schema = schemaOf(z.object({ limit: z.number().int(), publish: z.boolean(), agentId: z.string() }))

        expect(toolInputNormalizer.normalize({ input: { limit: '20', publish: 'true', agentId: 'a1' }, schema })).toEqual({ limit: 20, publish: true, agentId: 'a1' })
    })

    it('turns a number into a string where the schema wants a string', () => {
        const schema = schemaOf(z.object({ sheet_id: z.string() }))

        expect(toolInputNormalizer.normalize({ input: { sheet_id: 210000001 }, schema })).toEqual({ sheet_id: '210000001' })
    })

    it('parses an object or array that arrives as JSON text', () => {
        const schema = schemaOf(z.object({ fields: z.array(z.object({ name: z.string() })), options: z.object({ strict: z.boolean() }) }))

        expect(toolInputNormalizer.normalize({ input: { fields: '[{"name":"a"}]', options: '{"strict":"false"}' }, schema })).toEqual({
            fields: [{ name: 'a' }],
            options: { strict: false },
        })
    })

    it('handles optional and nullable fields', () => {
        const schema = schemaOf(z.object({ limit: z.number().optional(), cursor: z.string().nullable() }))

        expect(toolInputNormalizer.normalize({ input: { limit: '5', cursor: null }, schema })).toEqual({ limit: 5, cursor: null })
    })

    it('leaves text that only looks numeric alone when the schema wants a string', () => {
        const schema = schemaOf(z.object({ phone: z.string() }))

        expect(toolInputNormalizer.normalize({ input: { phone: '4043756638' }, schema })).toEqual({ phone: '4043756638' })
    })

    it('renames a near-miss key to the required one when exactly one candidate fits', () => {
        const search = schemaOf(z.object({ query: z.string() }))
        const run = schemaOf(z.object({ flowRunId: z.string() }))

        expect(toolInputNormalizer.normalize({ input: { searchQuery: 'activepieces pricing' }, schema: search })).toEqual({ query: 'activepieces pricing' })
        expect(toolInputNormalizer.normalize({ input: { runId: 'r1' }, schema: run })).toEqual({ flowRunId: 'r1' })
    })

    it('does not guess when two keys could be the missing one', () => {
        const schema = schemaOf(z.object({ query: z.string() }))
        const input = { searchQuery: 'a', subQuery: 'b' }

        expect(toolInputNormalizer.normalize({ input, schema })).toEqual(input)
    })

    it('drops an empty string sent for an optional object or list', () => {
        const schema = schemaOf(z.object({ pieceName: z.string(), currentInput: z.record(z.string(), z.unknown()).optional(), tags: z.array(z.string()).optional() }))

        expect(toolInputNormalizer.normalize({ input: { pieceName: 'p', currentInput: '', tags: '' }, schema })).toEqual({ pieceName: 'p' })
    })

    it('returns undefined from normalizeJsonText when nothing changes, so callers fall back', () => {
        const schema = schemaOf(z.object({ query: z.string() }))

        expect(toolInputNormalizer.normalizeJsonText({ text: '{"query":"x"}', schema })).toBeUndefined()
        expect(toolInputNormalizer.normalizeJsonText({ text: 'not json', schema })).toBeUndefined()
        expect(toolInputNormalizer.normalizeJsonText({ text: '{"input":{"query":"x"}}', schema })).toBe('{"query":"x"}')
    })
})
