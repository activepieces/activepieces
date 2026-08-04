import { FieldControlMode } from '@activepieces/core-piece-types'
import { PiecePropertyMap, PropertyType } from '@activepieces/pieces-framework'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'

const unusedResolver = (): never => { throw new Error('no dynamic property expected in this case') }
import { piecePropExtraction } from '../../../../../src/app/ee/agent/tools/piece-prop-extraction'

function prop(overrides: Record<string, unknown>): Record<string, unknown> {
    return { displayName: 'x', required: false, ...overrides }
}

const props = (map: Record<string, unknown>): PiecePropertyMap => map as never

describe('piecePropExtraction.sortPropertiesByDependencies', () => {
    it('puts a refresher ahead of the property that depends on it', () => {
        const waves = piecePropExtraction.sortPropertiesByDependencies(props({
            channel: prop({ type: PropertyType.DROPDOWN, refreshers: ['workspace'] }),
            workspace: prop({ type: PropertyType.DROPDOWN, refreshers: [] }),
        }))

        expect(waves[0]).toContain('workspace')
        expect(waves[1]).toContain('channel')
    })

    it('keeps independent properties in a single wave', () => {
        const waves = piecePropExtraction.sortPropertiesByDependencies(props({
            subject: prop({ type: PropertyType.SHORT_TEXT }),
            body: prop({ type: PropertyType.LONG_TEXT }),
        }))

        expect(waves).toHaveLength(1)
        expect(waves[0].sort()).toEqual(['body', 'subject'])
    })

    it('ignores a refresher that is not a real property', () => {
        const waves = piecePropExtraction.sortPropertiesByDependencies(props({
            channel: prop({ type: PropertyType.DROPDOWN, refreshers: ['does_not_exist'] }),
        }))

        expect(waves[0]).toEqual(['channel'])
    })

    it('drops properties caught in a dependency cycle rather than looping forever', () => {
        const waves = piecePropExtraction.sortPropertiesByDependencies(props({
            a: prop({ type: PropertyType.DROPDOWN, refreshers: ['b'] }),
            b: prop({ type: PropertyType.DROPDOWN, refreshers: ['a'] }),
        }))

        expect(waves.flat()).toEqual([])
    })
})

describe('piecePropExtraction.pinnedValues', () => {
    it('unwraps a single-string auth object to the bare value', () => {
        expect(piecePropExtraction.normalizeAuth({ externalId: 'conn-1' })).toBe('conn-1')
    })

    it('leaves a multi-field auth object alone', () => {
        const auth = { username: 'u', password: 'p' }
        expect(piecePropExtraction.normalizeAuth(auth)).toEqual(auth)
    })

    it('takes the operator-chosen value and blanks a leave-empty field', () => {
        const pinned = piecePropExtraction.pinnedValues({
            predefinedInput: {
                fields: {
                    channel: { mode: FieldControlMode.CHOOSE_YOURSELF, value: 'C123' },
                    threadTs: { mode: FieldControlMode.LEAVE_EMPTY },
                    text: { mode: FieldControlMode.AGENT_DECIDE },
                },
            } as never,
        })

        expect(pinned.channel).toBe('C123')
        expect(pinned).toHaveProperty('threadTs', undefined)
        expect(pinned).not.toHaveProperty('text')
    })
})

describe('piecePropExtraction.buildExtractionWaves', () => {
    it('never asks the model for a field the operator already pinned', () => {
        const waves = piecePropExtraction.buildExtractionWaves({
            resolveDynamic: unusedResolver,
            properties: props({
                channel: prop({ type: PropertyType.SHORT_TEXT }),
                text: prop({ type: PropertyType.SHORT_TEXT }),
            }),
            predefinedInput: { fields: { channel: { mode: FieldControlMode.CHOOSE_YOURSELF, value: 'C123' } } } as never,
        })

        expect(waves.flatMap((w) => w.propertyNames)).toEqual(['text'])
    })

    it('skips auth and markdown properties, which the model must never fill', () => {
        const waves = piecePropExtraction.buildExtractionWaves({
            resolveDynamic: unusedResolver,
            properties: props({
                auth: prop({ type: PropertyType.OAUTH2 }),
                notice: prop({ type: PropertyType.MARKDOWN }),
                text: prop({ type: PropertyType.SHORT_TEXT }),
            }),
        })

        expect(waves.flatMap((w) => w.propertyNames)).toEqual(['text'])
    })

    it('produces a strict schema, so the model cannot invent extra keys', () => {
        const [wave] = piecePropExtraction.buildExtractionWaves({
            resolveDynamic: unusedResolver,
            properties: props({ text: prop({ type: PropertyType.SHORT_TEXT, required: true }) }),
        })

        expect(wave.schema.safeParse({ text: 'hi' }).success).toBe(true)
        expect(wave.schema.safeParse({ text: 'hi', sneaky: 1 }).success).toBe(false)
    })

    it('makes an optional property nullable and keeps a required one strict', () => {
        const [wave] = piecePropExtraction.buildExtractionWaves({
            resolveDynamic: unusedResolver,
            properties: props({
                required: prop({ type: PropertyType.SHORT_TEXT, required: true }),
                optional: prop({ type: PropertyType.SHORT_TEXT, required: false }),
            }),
        })

        expect(wave.schema.safeParse({ required: 'a', optional: null }).success).toBe(true)
        expect(wave.schema.safeParse({ required: null, optional: null }).success).toBe(false)
    })

    it('asks the caller to resolve a dynamic property instead of guessing its shape', () => {
        const [wave] = piecePropExtraction.buildExtractionWaves({
            properties: props({ fields: prop({ type: PropertyType.DYNAMIC, required: true }) }),
            resolveDynamic: () => z.object({ name: z.string() }),
        })

        expect(wave.schema.safeParse({ fields: { name: 'a' } }).success).toBe(true)
        expect(wave.schema.safeParse({ fields: { name: 1 } }).success).toBe(false)
    })

    it('returns no waves when every property is pinned or unfillable', () => {
        const waves = piecePropExtraction.buildExtractionWaves({
            resolveDynamic: unusedResolver,
            properties: props({ auth: prop({ type: PropertyType.OAUTH2 }) }),
        })

        expect(waves).toEqual([])
    })
})
