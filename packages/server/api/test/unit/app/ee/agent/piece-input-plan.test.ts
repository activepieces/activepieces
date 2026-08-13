import { FieldControlMode } from '@activepieces/core-piece-types'
import { PiecePropertyMap, PropertyType } from '@activepieces/pieces-framework'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { ActivepiecesError } from '@activepieces/core-utils'
import { pieceInputPlan } from '../../../../../src/app/ee/agent/tools/piece-input-plan'

function prop(overrides: Record<string, unknown>): Record<string, unknown> {
    return { displayName: 'x', required: false, ...overrides }
}

const props = (map: Record<string, unknown>): PiecePropertyMap => map as never

const rejectDynamic = vi.fn(() => Promise.reject(new Error('no dynamic property expected here')))



async function schemaFor(properties: PiecePropertyMap, propertyNames: string[], resolvedInput: Record<string, unknown> = {}): Promise<z.ZodObject> {
    return pieceInputPlan.schemaForWave({ properties, propertyNames, resolvedInput, resolveDynamic: rejectDynamic })
}

describe('pieceInputPlan.plan — ordering', () => {
    it('puts a refresher in an earlier wave than the dropdown that depends on it', () => {
        const { waves } = pieceInputPlan.plan({
            properties: props({
                channel: prop({ type: PropertyType.DROPDOWN, refreshers: ['workspace'] }),
                workspace: prop({ type: PropertyType.DROPDOWN, refreshers: [] }),
            }),
        })

        expect(waves).toEqual([['workspace'], ['channel']])
    })

    it('keeps independent properties in one wave', () => {
        const { waves } = pieceInputPlan.plan({
            properties: props({
                subject: prop({ type: PropertyType.SHORT_TEXT }),
                body: prop({ type: PropertyType.LONG_TEXT }),
            }),
        })

        expect(waves).toHaveLength(1)
        expect([...waves[0]].sort()).toEqual(['body', 'subject'])
    })

    it('ignores a refresher naming a property the action does not have', () => {
        const { waves } = pieceInputPlan.plan({
            properties: props({ channel: prop({ type: PropertyType.DROPDOWN, refreshers: ['nope'] }) }),
        })

        expect(waves).toEqual([['channel']])
    })

    it('drops properties caught in a dependency cycle rather than looping forever', () => {
        const { waves } = pieceInputPlan.plan({
            properties: props({
                a: prop({ type: PropertyType.DROPDOWN, refreshers: ['b'] }),
                b: prop({ type: PropertyType.DROPDOWN, refreshers: ['a'] }),
            }),
        })

        expect(waves.flat()).toEqual([])
    })
})

describe('pieceInputPlan.plan — what the model is allowed to fill', () => {
    it('unwraps a single-string auth object and exposes it as pinned input', () => {
        const { pinned } = pieceInputPlan.plan({
            properties: props({}),
            predefinedInput: { auth: { externalId: 'conn-1' } } as never,
        })

        expect(pinned.auth).toBe('conn-1')
    })

    it('leaves a multi-field auth object alone', () => {
        const { pinned } = pieceInputPlan.plan({
            properties: props({}),
            predefinedInput: { auth: { username: 'u', password: 'p' } } as never,
        })

        expect(pinned.auth).toEqual({ username: 'u', password: 'p' })
    })

    it('never offers a pinned field to the model, and hands its value back to the caller', () => {
        const { pinned, waves } = pieceInputPlan.plan({
            properties: props({
                channel: prop({ type: PropertyType.SHORT_TEXT }),
                threadTs: prop({ type: PropertyType.SHORT_TEXT }),
                text: prop({ type: PropertyType.SHORT_TEXT }),
            }),
            predefinedInput: {
                fields: {
                    channel: { mode: FieldControlMode.CHOOSE_YOURSELF, value: 'C123' },
                    threadTs: { mode: FieldControlMode.LEAVE_EMPTY },
                    text: { mode: FieldControlMode.AGENT_DECIDE },
                },
            } as never,
        })

        expect(waves.flat()).toEqual(['text'])
        expect(pinned.channel).toBe('C123')
        expect(pinned).toHaveProperty('threadTs', undefined)
    })

    it('never offers auth or markdown properties', () => {
        const { waves } = pieceInputPlan.plan({
            properties: props({
                auth: prop({ type: PropertyType.OAUTH2 }),
                notice: prop({ type: PropertyType.MARKDOWN }),
                text: prop({ type: PropertyType.SHORT_TEXT }),
            }),
        })

        expect(waves.flat()).toEqual(['text'])
    })

    it('produces no waves when everything is pinned or unfillable', () => {
        const { waves } = pieceInputPlan.plan({ properties: props({ auth: prop({ type: PropertyType.OAUTH2 }) }) })

        expect(waves).toEqual([])
    })
})

describe('pieceInputPlan.schemaForWave', () => {
    it('is strict at the top level, so the model cannot invent keys the action lacks', async () => {
        const properties = props({ text: prop({ type: PropertyType.SHORT_TEXT, required: true }) })
        const schema = await schemaFor(properties, ['text'])

        expect(schema.safeParse({ text: 'hi' }).success).toBe(true)
        expect(schema.safeParse({ text: 'hi', sneaky: 1 }).success).toBe(false)
    })

    it('is loose inside array items, so extra keys reach the piece instead of being stripped', async () => {
        const properties = props({
            rows: prop({
                type: PropertyType.ARRAY,
                required: true,
                properties: { name: prop({ type: PropertyType.SHORT_TEXT, required: true }) },
            }),
        })
        const schema = await schemaFor(properties, ['rows'])

        const parsed = schema.safeParse({ rows: [{ name: 'a', extra: 'kept' }] })
        expect(parsed.success).toBe(true)
        expect(parsed.data?.rows).toEqual([{ name: 'a', extra: 'kept' }])
    })

    it('makes an optional property nullable and keeps a required one strict', async () => {
        const properties = props({
            wanted: prop({ type: PropertyType.SHORT_TEXT, required: true }),
            spare: prop({ type: PropertyType.SHORT_TEXT, required: false }),
        })
        const schema = await schemaFor(properties, ['wanted', 'spare'])

        expect(schema.safeParse({ wanted: 'a', spare: null }).success).toBe(true)
        expect(schema.safeParse({ wanted: null, spare: null }).success).toBe(false)
    })

    it('refuses to build a schema for a property the model must never fill', async () => {
        const properties = props({ secret: prop({ type: PropertyType.SECRET_TEXT, required: true }) })

        await expect(schemaFor(properties, ['secret'])).rejects.toThrow(ActivepiecesError)
    })

    it('hands a dynamic property its name and the values resolved so far', async () => {
        const properties = props({
            workspace: prop({ type: PropertyType.SHORT_TEXT }),
            fields: prop({ type: PropertyType.DYNAMIC, required: true }),
        })
        const resolveDynamic = vi.fn(() => Promise.resolve(z.object({ label: z.string() })))

        const schema = await pieceInputPlan.schemaForWave({
            properties,
            propertyNames: ['fields'],
            resolvedInput: { workspace: 'W1' },
            resolveDynamic,
        })

        expect(resolveDynamic).toHaveBeenCalledWith({
            propertyName: 'fields',
            resolvedInput: { workspace: 'W1' },
        })
        expect(schema.safeParse({ fields: { label: 'a' } }).success).toBe(true)
    })
})
