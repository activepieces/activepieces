import { normalizeAgentToolAuth } from '../../src/lib/tools'

const CONNECTION_REF = "{{connections['my-notion']}}"

describe('normalizeAgentToolAuth', () => {
    it('passes a bare connection reference string through unchanged', () => {
        expect(normalizeAgentToolAuth(CONNECTION_REF)).toBe(CONNECTION_REF)
    })

    it('unwraps a single-key object wrapping the reference (the OAuth bug)', () => {
        expect(normalizeAgentToolAuth({ accessToken: CONNECTION_REF })).toBe(CONNECTION_REF)
    })

    it('unwraps regardless of the wrapper key name', () => {
        expect(normalizeAgentToolAuth({ token: CONNECTION_REF })).toBe(CONNECTION_REF)
    })

    it('returns undefined and null untouched (auth-less pieces)', () => {
        expect(normalizeAgentToolAuth(undefined)).toBeUndefined()
        expect(normalizeAgentToolAuth(null)).toBeNull()
    })

    it('leaves a multi-key object unchanged (cannot safely pick a value)', () => {
        const multiKey = { accessToken: CONNECTION_REF, extra: 'x' }
        expect(normalizeAgentToolAuth(multiKey)).toBe(multiKey)
    })

    it('leaves a single-key object whose value is not a string unchanged', () => {
        const nested = { token: { value: CONNECTION_REF } }
        expect(normalizeAgentToolAuth(nested)).toBe(nested)
    })
})
