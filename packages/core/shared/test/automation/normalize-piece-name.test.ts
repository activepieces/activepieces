import { describe, expect, it } from 'vitest'
import { normalizePieceName } from '../../src/lib/automation/pieces/utils'

describe('normalizePieceName', () => {
    it.each([
        ['attio', '@activepieces/piece-attio'],
        ['Attio', '@activepieces/piece-attio'],
        ['ATTIO', '@activepieces/piece-attio'],
        ['google-sheets', '@activepieces/piece-google-sheets'],
        ['google_sheets', '@activepieces/piece-google-sheets'],
        ['GOOGLE_SHEETS', '@activepieces/piece-google-sheets'],
        ['Google Sheets', '@activepieces/piece-google-sheets'],
        ['google.sheets', '@activepieces/piece-google-sheets'],
        ['piece-attio', '@activepieces/piece-attio'],
        ['piece-google-sheets', '@activepieces/piece-google-sheets'],
        ['@activepieces/piece-attio', '@activepieces/piece-attio'],
        ['@activepieces/piece-Attio', '@activepieces/piece-attio'],
        ['  Attio  ', '@activepieces/piece-attio'],
        ['google__sheets', '@activepieces/piece-google-sheets'],
    ])('canonicalizes %s -> %s', (input, expected) => {
        expect(normalizePieceName(input)).toBe(expected)
    })

    it('lowercases but preserves third-party scopes', () => {
        expect(normalizePieceName('@my-company/piece-Custom')).toBe(
            '@my-company/piece-custom',
        )
    })

    it('is idempotent', () => {
        for (const input of ['Attio', 'Google Sheets', 'google_sheets', '@activepieces/piece-Attio']) {
            const once = normalizePieceName(input)
            expect(normalizePieceName(once)).toBe(once)
        }
    })
})
