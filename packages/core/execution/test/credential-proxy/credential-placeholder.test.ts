import { describe, expect, it } from 'vitest'
import { CREDENTIAL_PLACEHOLDER_PATTERN, credentialPlaceholder } from '../../src/lib/credential-proxy/credential-placeholder'

const GRANT_ID = 'AbCdEfGhIjKlMnOpQrStU'

describe('credentialPlaceholder', () => {
    it('builds a header-safe token that parses back to the grant and field', () => {
        const placeholder = credentialPlaceholder.build({ grantId: GRANT_ID, fieldIndex: 3 })

        expect(placeholder).toBe(`apcred1_${GRANT_ID}_3`)
        expect(placeholder).toMatch(/^[A-Za-z0-9_]+$/)
        expect(credentialPlaceholder.parse(`Bearer ${placeholder}`)).toEqual([
            { placeholder, grantId: GRANT_ID, fieldIndex: 3 },
        ])
    })

    it('finds every placeholder in a larger string and ignores look-alikes', () => {
        const first = credentialPlaceholder.build({ grantId: GRANT_ID, fieldIndex: 0 })
        const second = credentialPlaceholder.build({ grantId: 'ZyXwVuTsRqPoNmLkJiHgF', fieldIndex: 12 })

        const refs = credentialPlaceholder.parse(`${first}:${second} apcred1_short_1`)

        expect(refs.map((ref) => ref.placeholder)).toEqual([first, second])
        expect(credentialPlaceholder.containsAny('apcred1_short_1')).toBe(false)
        expect(credentialPlaceholder.containsAny(`x${first}`)).toBe(true)
    })

    it('exposes a reusable global pattern that does not keep state between calls', () => {
        const placeholder = credentialPlaceholder.build({ grantId: GRANT_ID, fieldIndex: 1 })

        expect([...placeholder.matchAll(CREDENTIAL_PLACEHOLDER_PATTERN)]).toHaveLength(1)
        expect([...placeholder.matchAll(CREDENTIAL_PLACEHOLDER_PATTERN)]).toHaveLength(1)
    })
})
