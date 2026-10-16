import { ListPieceSetsRequestQuery } from '../../src/lib/ee/piece-set'

describe('ListPieceSetsRequestQuery', () => {
    it('defaults limit to 10 and leaves name undefined', () => {
        const parsed = ListPieceSetsRequestQuery.parse({})
        expect(parsed.limit).toBe(10)
        expect(parsed.name).toBeUndefined()
        expect(parsed.cursor).toBeUndefined()
    })

    it('accepts an optional name filter', () => {
        const parsed = ListPieceSetsRequestQuery.parse({ name: 'Marketing' })
        expect(parsed.name).toBe('Marketing')
        expect(parsed.limit).toBe(10)
    })

    it('rejects a name that is not a string', () => {
        expect(() => ListPieceSetsRequestQuery.parse({ name: 42 })).toThrow()
    })
})
