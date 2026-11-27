import { describe, expect, it } from 'bun:test'
import { breakingChangesRollover } from './breaking-changes-rollover'

const entryFile = ({ id, release }: { id: string, release?: string }) => ({
    fileName: `${id}.md`,
    text: `---\nid: ${id}\ntitle: "${id} changed"\nadded: '2026-11-20'\n${release ? `release: ${release}\n` : ''}---\n\nBody of ${id}.\n`,
})

describe('rollover', () => {
    it('sets the release on unreleased entries that exist at the tag', () => {
        const result = breakingChangesRollover.rollover({
            files: [entryFile({ id: 'alpha' }), entryFile({ id: 'gamma' })],
            idsAtTag: new Set(['alpha']),
            tag: '0.94.0',
        })
        expect(result.moved).toEqual(['alpha changed'])
        expect(result.updated).toHaveLength(1)
        expect(result.updated[0].fileName).toBe('alpha.md')
        expect(result.updated[0].text).toContain('\nrelease: 0.94.0\n---\n\nBody of alpha.\n')
    })

    it('leaves entries merged after the tag untouched', () => {
        const result = breakingChangesRollover.rollover({
            files: [entryFile({ id: 'gamma' })],
            idsAtTag: new Set(['alpha']),
            tag: '0.94.0',
        })
        expect(result.moved).toEqual([])
        expect(result.updated).toEqual([])
    })

    it('never moves an entry that already shipped in an earlier release', () => {
        const result = breakingChangesRollover.rollover({
            files: [entryFile({ id: 'alpha', release: '0.93.0' })],
            idsAtTag: new Set(['alpha']),
            tag: '0.94.0',
        })
        expect(result.moved).toEqual([])
    })

    it('files a hotfix entry under the hotfix tag', () => {
        const result = breakingChangesRollover.rollover({
            files: [entryFile({ id: 'beta' })],
            idsAtTag: new Set(['beta']),
            tag: '0.93.0-hotfix.1',
        })
        expect(result.updated[0].text).toContain('release: 0.93.0-hotfix.1\n')
    })
})
