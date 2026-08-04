import { PiecePropertyMap, PropertyType } from '@activepieces/pieces-framework'
import { describe, expect, it, vi } from 'vitest'
import { pieceDynamicResolver, PropsResolutionResult } from '../../../../../src/app/ee/agent/tools/piece-dynamic-resolver'

function prop(overrides: Record<string, unknown>): Record<string, unknown> {
    return { displayName: 'x', required: false, ...overrides }
}

const props = (map: Record<string, unknown>): PiecePropertyMap => map as never

function resolverFor(result: PropsResolutionResult, actionName = 'create_record') {
    const resolveProps = vi.fn(() => Promise.resolve(result))
    return {
        resolveProps,
        resolve: pieceDynamicResolver.createDynamicSchemaResolver({ actionName, resolveProps }),
    }
}

describe('pieceDynamicResolver', () => {
    it('turns the piece-reported sub-fields into a schema', async () => {
        const { resolve } = resolverFor({
            status: 'dynamic',
            props: props({ title: prop({ type: PropertyType.SHORT_TEXT, required: true }) }),
        })

        const schema = await resolve({ propertyName: 'fields', property: prop({ type: PropertyType.DYNAMIC }) as never, resolvedInput: {} })

        expect(schema.safeParse({ title: 'a' }).success).toBe(true)
        expect(schema.safeParse({ title: 1 }).success).toBe(false)
    })

    it('keeps sub-field objects loose, so keys the piece knows about are not stripped', async () => {
        const { resolve } = resolverFor({
            status: 'dynamic',
            props: props({ title: prop({ type: PropertyType.SHORT_TEXT, required: true }) }),
        })

        const schema = await resolve({ propertyName: 'fields', property: prop({ type: PropertyType.DYNAMIC }) as never, resolvedInput: {} })

        expect(schema.safeParse({ title: 'a', unlisted: 'kept' }).data).toEqual({ title: 'a', unlisted: 'kept' })
    })

    it('passes the values resolved so far, which is what makes the sub-fields correct', async () => {
        const { resolve, resolveProps } = resolverFor({ status: 'dynamic', props: props({}) })

        await resolve({ propertyName: 'fields', property: prop({ type: PropertyType.DYNAMIC }) as never, resolvedInput: { table: 'T1', auth: 'conn-1' } })

        expect(resolveProps).toHaveBeenCalledWith(expect.objectContaining({
            propertyName: 'fields',
            actionOrTriggerName: 'create_record',
            input: { table: 'T1' },
        }))
    })

    it('sends the connection separately rather than as an input value', async () => {
        const resolveProps = vi.fn(() => Promise.resolve<PropsResolutionResult>({ status: 'dynamic', props: props({}) }))
        const resolve = pieceDynamicResolver.createDynamicSchemaResolver({ actionName: 'a', connectionExternalId: 'conn-9', resolveProps })

        await resolve({ propertyName: 'fields', property: prop({ type: PropertyType.DYNAMIC }) as never, resolvedInput: { auth: 'ignored' } })

        expect(resolveProps).toHaveBeenCalledWith(expect.objectContaining({ auth: 'conn-9', input: {} }))
    })

    it('fails loudly when the piece cannot resolve the field', async () => {
        const { resolve } = resolverFor({ status: 'failed', message: 'connection expired' })

        await expect(resolve({ propertyName: 'fields', property: prop({ type: PropertyType.DYNAMIC }) as never, resolvedInput: {} }))
            .rejects.toThrow(/connection expired/)
    })

    it('fails loudly when the piece returns a dropdown where sub-fields were expected', async () => {
        const { resolve } = resolverFor({ status: 'options' })

        await expect(resolve({ propertyName: 'fields', property: prop({ type: PropertyType.DYNAMIC }) as never, resolvedInput: {} }))
            .rejects.toThrow(/options rather than fields/)
    })

    it('resolves a dynamic field nested inside another dynamic field', async () => {
        const resolveProps = vi.fn()
            .mockResolvedValueOnce({ status: 'dynamic', props: props({ inner: prop({ type: PropertyType.DYNAMIC, required: true }) }) })
            .mockResolvedValueOnce({ status: 'dynamic', props: props({ leaf: prop({ type: PropertyType.SHORT_TEXT, required: true }) }) })
        const resolve = pieceDynamicResolver.createDynamicSchemaResolver({ actionName: 'a', resolveProps })

        const schema = await resolve({ propertyName: 'outer', property: prop({ type: PropertyType.DYNAMIC }) as never, resolvedInput: {} })

        expect(resolveProps).toHaveBeenCalledTimes(2)
        expect(schema.safeParse({ inner: { leaf: 'a' } }).success).toBe(true)
    })
})
