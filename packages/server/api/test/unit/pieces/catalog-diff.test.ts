import { describe, expect, it } from 'vitest'

import { CatalogEntry, diffCatalog } from '../../../src/app/pieces/piece-catalog/catalog-diff'

const entry = (name: string, version: string): CatalogEntry => ({
    name,
    displayName: name,
    version,
    minimumSupportedRelease: null,
    deprecated: false,
})

describe('diffCatalog', () => {
    it('new piece → piece created with changeType new', () => {
        const result = diffCatalog({ snapshot: {}, current: [entry('gmail', '0.1.0')] })
        expect(result.changes).toEqual([{ ...entry('gmail', '0.1.0'), previousVersion: null, changeType: 'new' }])
        expect(result.nextSnapshot).toEqual({ gmail: '0.1.0' })
    })

    it('S3 minor bump 1.0.0 → 1.1.0', () => {
        const result = diffCatalog({ snapshot: { gmail: '1.0.0' }, current: [entry('gmail', '1.1.0')] })
        expect(result.changes).toEqual([{ ...entry('gmail', '1.1.0'), previousVersion: '1.0.0', changeType: 'minor' }])
        expect(result.nextSnapshot).toEqual({ gmail: '1.1.0' })
    })

    it('patch 0.3.1 → 0.3.2 is a patch change', () => {
        const result = diffCatalog({ snapshot: { gmail: '0.3.1' }, current: [entry('gmail', '0.3.2')] })
        expect(result.changes).toEqual([{ ...entry('gmail', '0.3.2'), previousVersion: '0.3.1', changeType: 'patch' }])
        expect(result.nextSnapshot).toEqual({ gmail: '0.3.2' })
    })

    it('major 1.9.0 → 2.0.0 is major', () => {
        const result = diffCatalog({ snapshot: { gmail: '1.9.0' }, current: [entry('gmail', '2.0.0')] })
        expect(result.changes).toEqual([{ ...entry('gmail', '2.0.0'), previousVersion: '1.9.0', changeType: 'major' }])
        expect(result.nextSnapshot).toEqual({ gmail: '2.0.0' })
    })

    it('0.x minor 0.3.9 → 0.4.0 is minor', () => {
        const result = diffCatalog({ snapshot: { gmail: '0.3.9' }, current: [entry('gmail', '0.4.0')] })
        expect(result.changes).toEqual([{ ...entry('gmail', '0.4.0'), previousVersion: '0.3.9', changeType: 'minor' }])
        expect(result.nextSnapshot).toEqual({ gmail: '0.4.0' })
    })

    it('S4 backfill: current latest equals snapshot → no change', () => {
        const result = diffCatalog({ snapshot: { gmail: '1.1.0' }, current: [entry('gmail', '1.1.0')] })
        expect(result.changes).toEqual([])
        expect(result.nextSnapshot).toEqual({ gmail: '1.1.0' })
    })

    it('lower latest version is ignored and snapshot keeps the higher one', () => {
        const result = diffCatalog({ snapshot: { gmail: '1.1.0' }, current: [entry('gmail', '1.0.5')] })
        expect(result.changes).toEqual([])
        expect(result.nextSnapshot).toEqual({ gmail: '1.1.0' })
    })

    it('S5 three versions in one run collapse to one change', () => {
        const result = diffCatalog({ snapshot: { gmail: '1.1.0' }, current: [entry('gmail', '1.1.3')] })
        expect(result.changes).toEqual([{ ...entry('gmail', '1.1.3'), previousVersion: '1.1.0', changeType: 'patch' }])
        expect(result.nextSnapshot).toEqual({ gmail: '1.1.3' })
    })

    it('S6 piece missing from current stays in snapshot', () => {
        const result = diffCatalog({ snapshot: { gmail: '1.1.3' }, current: [] })
        expect(result.changes).toEqual([])
        expect(result.nextSnapshot).toEqual({ gmail: '1.1.3' })
    })

    it('invalid semver never throws', () => {
        expect(diffCatalog({ snapshot: { x: '1.0' }, current: [entry('x', '1.0.0-weird.build')] })).toEqual({
            changes: [{ ...entry('x', '1.0.0-weird.build'), previousVersion: '1.0', changeType: 'patch' }],
            nextSnapshot: { x: '1.0.0-weird.build' },
        })
        expect(diffCatalog({ snapshot: { x: '1.0' }, current: [entry('x', 'abc')] })).toEqual({
            changes: [{ ...entry('x', 'abc'), previousVersion: '1.0', changeType: 'patch' }],
            nextSnapshot: { x: 'abc' },
        })
        expect(diffCatalog({ snapshot: { x: 'abc' }, current: [entry('x', '1.0')] })).toEqual({
            changes: [],
            nextSnapshot: { x: 'abc' },
        })
    })

    it('output order is by piece name', () => {
        const result = diffCatalog({ snapshot: {}, current: [entry('slack', '0.2.0'), entry('gmail', '0.1.0')] })
        expect(result.changes.map((change) => change.name)).toEqual(['gmail', 'slack'])
    })
})
