import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { OptionalArrayFromQuery } from '../src/lib/base-model'

describe('OptionalArrayFromQuery', () => {
    const Query = z.object({ pieceName: OptionalArrayFromQuery(z.string()) })

    it('turns one value into a list and keeps a list as it is', () => {
        expect(Query.parse({ pieceName: 'github' }).pieceName).toEqual(['github'])
        expect(Query.parse({ pieceName: ['github', 'openai'] }).pieceName).toEqual(['github', 'openai'])
    })

    it('accepts a missing value', () => {
        expect(Query.parse({}).pieceName).toBeUndefined()
    })

    it('is not documented as required', () => {
        const jsonSchema = z.toJSONSchema(Query, { io: 'input' })
        expect(jsonSchema.required ?? []).not.toContain('pieceName')
        expect(jsonSchema.properties?.pieceName).toEqual({ type: 'array', items: { type: 'string' } })
    })
})
