import { activepiecesAdvisorySourceHelpers } from '../../../../src/app/security-advisory/sources/activepieces-advisory-source'

const { unwrapResponse, coerceEntry } = activepiecesAdvisorySourceHelpers

describe('unwrapResponse', () => {
    it('returns the inner array when the response is wrapped under a body key', () => {
        const wrapped = { body: [{ id: 'a' }, { id: 'b' }] }
        expect(unwrapResponse(wrapped)).toEqual([{ id: 'a' }, { id: 'b' }])
    })

    it('returns the raw value untouched when it is already an array', () => {
        const arr = [{ id: 'a' }]
        expect(unwrapResponse(arr)).toBe(arr)
    })

    it('returns the raw value when no recognized wrapper is present', () => {
        const obj = { foo: 'bar' }
        expect(unwrapResponse(obj)).toBe(obj)
    })

    it('returns the raw value when body is not an array', () => {
        const obj = { body: 'not-an-array' }
        expect(unwrapResponse(obj)).toBe(obj)
    })

    it('passes null and primitives through', () => {
        expect(unwrapResponse(null)).toBe(null)
        expect(unwrapResponse('plain')).toBe('plain')
    })
})

describe('coerceEntry', () => {
    it('namespaces the id with the activepieces: prefix', () => {
        const result = coerceEntry({ id: 'GHSA-1234', cvssScore: 7.5 })
        expect(result).toMatchObject({ id: 'activepieces:GHSA-1234' })
    })

    it('does not double-prefix an already-namespaced id', () => {
        const result = coerceEntry({ id: 'activepieces:already', cvssScore: null })
        expect(result).toMatchObject({ id: 'activepieces:already' })
    })

    it('leaves a non-string id alone', () => {
        const result = coerceEntry({ id: 42, cvssScore: null })
        expect(result).toMatchObject({ id: 42 })
    })

    it('coerces a numeric-string cvssScore to a number', () => {
        const result = coerceEntry({ id: 'x', cvssScore: '7.5' })
        expect(result).toMatchObject({ cvssScore: 7.5 })
    })

    it('coerces an empty-string cvssScore to null', () => {
        const result = coerceEntry({ id: 'x', cvssScore: '  ' })
        expect(result).toMatchObject({ cvssScore: null })
    })

    it('leaves a non-numeric cvssScore string untouched', () => {
        const result = coerceEntry({ id: 'x', cvssScore: 'not-a-number' })
        expect(result).toMatchObject({ cvssScore: 'not-a-number' })
    })

    it('passes a non-object entry through', () => {
        expect(coerceEntry(null)).toBe(null)
        expect(coerceEntry('string')).toBe('string')
        const arr = [1, 2]
        expect(coerceEntry(arr)).toBe(arr)
    })
})
