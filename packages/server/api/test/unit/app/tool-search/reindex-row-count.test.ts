import { describe, expect, it } from 'vitest'
import { rawWriteRowCount } from '../../../../src/app/tool-search/tool-search-reindex.service'

// Guards the cross-driver count bug: node-postgres returns `[rows, affectedCount]` from a
// DELETE … RETURNING, while PGlite (and every SELECT) returns the rows array directly. Reading
// `.length` on the node-postgres tuple is always 2, which over-counted reconcile deletes on real
// Postgres while the PGlite-only test suite stayed green. This unit test fails on either substrate.
describe('rawWriteRowCount', () => {
    it('reads the affected count from the node-postgres [rows, count] tuple', () => {
        expect(rawWriteRowCount([[], 0])).toBe(0)
        expect(rawWriteRowCount([[{ id: 'a' }], 1])).toBe(1)
        expect(rawWriteRowCount([[{ id: 'a' }, { id: 'b' }], 2])).toBe(2)
    })

    it('reads the row count from a PGlite/SELECT rows array', () => {
        expect(rawWriteRowCount([])).toBe(0)
        expect(rawWriteRowCount([{ id: 'a' }])).toBe(1)
        expect(rawWriteRowCount([{ id: 'a' }, { id: 'b' }])).toBe(2)
        expect(rawWriteRowCount([{ id: 'a' }, { id: 'b' }, { id: 'c' }])).toBe(3)
    })

    it('treats a non-array result as zero', () => {
        expect(rawWriteRowCount(undefined)).toBe(0)
        expect(rawWriteRowCount(null)).toBe(0)
    })
})
