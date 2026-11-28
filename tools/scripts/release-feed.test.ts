import { describe, expect, it } from 'bun:test'
import { readFileSync } from 'fs'
import { ReleaseFeedEntry, ReleaseKind } from '../../packages/core/shared/src/lib/core/release-feed'
import { breakingChangesRender } from './breaking-changes-render'
import { RELEASE_NOTES_DIR, RELEASES_FILE, releaseFeed, WrittenReleaseNote } from './release-feed'

const DIGEST = `sha256:${'a'.repeat(64)}`
const MIGRATIONS = { blocking: 2, background: 1, breaking: ['DropOldColumn1880000000000'] }

const entryFile = ({ id, release, impact, order }: { id: string, release?: string, impact?: string, order?: number }) => breakingChangesRender.parseEntryFile({
    fileName: `${id}.md`,
    text: [
        '---',
        `id: ${id}`,
        `title: "${id} changed"`,
        'added: \'2026-11-26\'',
        ...(order === undefined ? [] : [`order: ${order}`]),
        ...(impact === undefined ? [] : [`impact: ${impact}`, 'affects:', '  editions: [ce, ee]', '  installMethods: [compose]']),
        ...(release === undefined ? [] : [`release: ${release}`]),
        '---',
        '',
        `Body of ${id}.`,
        '',
    ].join('\n'),
})

const feedEntry = ({ tag }: { tag: string }): ReleaseFeedEntry => releaseFeed.buildEntry({ tag, releasedAt: '2026-11-24T14:00:00Z', imageDigest: DIGEST, migrations: MIGRATIONS, entries: [] })

const writtenNote = ({ version, avoid, body }: { version: string, avoid?: string, body?: string }): WrittenReleaseNote => ({ version, avoid, body })

describe('releases.json', () => {
    it('matches the feed schema and is sorted newest first', () => {
        const text = readFileSync(RELEASES_FILE, 'utf-8')
        const feed = releaseFeed.parseFeed({ text, source: RELEASES_FILE })
        const tags = feed.map((entry) => entry.tag)
        expect(tags).toEqual([...tags].sort((a, b) => breakingChangesRender.compareVersions({ a: b, b: a })))
        expect(releaseFeed.serialize({ feed })).toBe(text)
    })

    it('has release note files that match their schema', () => {
        expect(() => releaseFeed.readReleaseNoteFiles({ dir: RELEASE_NOTES_DIR })).not.toThrow()
    })
})

describe('parseReleaseNoteFile', () => {
    it('reads the version, avoid and the markdown body', () => {
        const note = releaseFeed.parseReleaseNoteFile({
            fileName: '0.93.0.md',
            text: '---\nversion: 0.93.0\navoid: Upgrade to 0.93.1, which fixes a webhook regression.\n---\n\n## What is included\n\n- Faster runs\n',
        })
        expect(note).toEqual({ version: '0.93.0', avoid: 'Upgrade to 0.93.1, which fixes a webhook regression.', body: '## What is included\n\n- Faster runs' })
    })

    it('leaves avoid and the body unset when the file has neither', () => {
        expect(releaseFeed.parseReleaseNoteFile({ fileName: '0.92.3-hotfix.1.md', text: '---\nversion: 0.92.3-hotfix.1\n---\n' })).toEqual({ version: '0.92.3-hotfix.1', avoid: undefined, body: undefined })
    })

    it('rejects a version that does not match the file name', () => {
        expect(() => releaseFeed.parseReleaseNoteFile({ fileName: '0.93.1.md', text: '---\nversion: 0.93.0\n---\nNotes.\n' })).toThrow('must match the file name')
    })

    it('rejects an unknown front-matter field', () => {
        expect(() => releaseFeed.parseReleaseNoteFile({ fileName: '0.93.0.md', text: '---\nversion: 0.93.0\nsecurityFix: true\n---\nNotes.\n' })).toThrow('securityFix')
    })

    it('rejects a version that is not a release tag', () => {
        expect(() => releaseFeed.parseReleaseNoteFile({ fileName: '0.93.0-beta.1.md', text: '---\nversion: 0.93.0-beta.1\n---\nNotes.\n' })).toThrow()
    })
})

describe('kindOf', () => {
    it('derives the kind from the tag', () => {
        expect(releaseFeed.kindOf({ tag: '0.94.0' })).toBe(ReleaseKind.MINOR)
        expect(releaseFeed.kindOf({ tag: '0.94.2' })).toBe(ReleaseKind.PATCH)
        expect(releaseFeed.kindOf({ tag: '0.92.3-hotfix.2' })).toBe(ReleaseKind.HOTFIX)
        expect(releaseFeed.kindOf({ tag: '0.95.0-rc.1' })).toBe(ReleaseKind.RC)
    })

    it('rejects a prerelease that is neither rc nor hotfix', () => {
        expect(() => releaseFeed.kindOf({ tag: '0.94.0-beta.1' })).toThrow()
    })
})

describe('buildEntry', () => {
    it('takes notes from the entry files whose release is the tag, in the docs order', () => {
        const entry = releaseFeed.buildEntry({
            tag: '0.94.0',
            releasedAt: '2026-11-24T14:00:00Z',
            imageDigest: DIGEST,
            migrations: MIGRATIONS,
            entries: [
                entryFile({ id: 'behavior', release: '0.94.0', impact: 'behavior-changes' }),
                entryFile({ id: 'blocker', release: '0.94.0', impact: 'blocks-upgrade' }),
                entryFile({ id: 'older', release: '0.93.0', impact: 'flows-fail' }),
                entryFile({ id: 'unreleased', impact: 'flows-fail' }),
            ],
        })
        expect(entry.notes.map((note) => note.id)).toEqual(['blocker', 'behavior'])
        expect(entry.notes[0]).toEqual({
            id: 'blocker',
            title: 'blocker changed',
            impact: 'blocks-upgrade',
            affects: { editions: ['ce', 'ee'], installMethods: ['compose'] },
            body: 'Body of blocker.',
        })
        expect(entry).toMatchObject({
            tag: '0.94.0',
            line: '0.94',
            kind: ReleaseKind.MINOR,
            imageDigest: DIGEST,
            migrations: MIGRATIONS,
            pieceMigrations: [],
            supportedUntil: null,
        })
        expect(entry.avoid).toBeUndefined()
    })

    it('rejects a digest that is not a sha256 digest', () => {
        expect(() => releaseFeed.buildEntry({ tag: '0.94.0', releasedAt: '2026-11-24T14:00:00Z', imageDigest: 'latest', migrations: MIGRATIONS, entries: [] })).toThrow()
    })
})

describe('append', () => {
    it('adds the entry and keeps the feed newest first', () => {
        const feed = releaseFeed.append({ feed: [feedEntry({ tag: '0.93.0' }), feedEntry({ tag: '0.92.3-hotfix.1' })], entry: feedEntry({ tag: '0.93.1' }), releaseNotes: [] })
        expect(feed.map((entry) => entry.tag)).toEqual(['0.93.1', '0.93.0', '0.92.3-hotfix.1'])
        expect(feed[0].releaseNotes).toBeUndefined()
        expect(feed[0].avoid).toBeUndefined()
    })

    it('fills releaseNotes and avoid from the release note file for the tag', () => {
        const feed = releaseFeed.append({
            feed: [],
            entry: feedEntry({ tag: '0.93.1' }),
            releaseNotes: [writtenNote({ version: '0.93.1', avoid: 'Upgrade to 0.93.2 instead.', body: '## Highlights' }), writtenNote({ version: '0.93.0', body: 'Other release.' })],
        })
        expect(feed[0].releaseNotes).toBe('## Highlights')
        expect(feed[0].avoid).toEqual({ reason: 'Upgrade to 0.93.2 instead.' })
    })

    it('replaces an entry for the same tag on a rerun', () => {
        const feed = releaseFeed.append({ feed: [feedEntry({ tag: '0.93.0' })], entry: { ...feedEntry({ tag: '0.93.0' }), releasedAt: '2026-11-25T14:00:00Z' }, releaseNotes: [] })
        expect(feed).toHaveLength(1)
        expect(feed[0].releasedAt).toBe('2026-11-25T14:00:00Z')
    })

    it('brings older entries up to date with their release note files', () => {
        const feed = releaseFeed.append({ feed: [feedEntry({ tag: '0.93.0' })], entry: feedEntry({ tag: '0.93.1' }), releaseNotes: [writtenNote({ version: '0.93.0', avoid: 'Skip it.' })] })
        expect(feed.find((entry) => entry.tag === '0.93.0')?.avoid).toEqual({ reason: 'Skip it.' })
    })
})

describe('rebuild', () => {
    it('drops releaseNotes and avoid when the release note file no longer sets them', () => {
        const stale = { ...feedEntry({ tag: '0.93.0' }), avoid: { reason: 'Old reason.' }, releaseNotes: 'Old notes.' }
        const [entry] = releaseFeed.rebuild({ feed: [stale], releaseNotes: [writtenNote({ version: '0.93.0', body: 'New notes.' })] })
        expect(entry.releaseNotes).toBe('New notes.')
        expect(entry.avoid).toBeUndefined()
        const [bare] = releaseFeed.rebuild({ feed: [stale], releaseNotes: [] })
        expect(bare.releaseNotes).toBeUndefined()
        expect(bare.avoid).toBeUndefined()
    })
})

describe('merge', () => {
    it('lets the repo win for tags it has and keeps tags only the CDN has', () => {
        const repo = [{ ...feedEntry({ tag: '0.93.0' }), imageDigest: `sha256:${'b'.repeat(64)}` }, feedEntry({ tag: '0.92.0' })]
        const cdn = [feedEntry({ tag: '0.94.0' }), feedEntry({ tag: '0.93.0' })]
        const merged = releaseFeed.merge({ repo, cdn, releaseNotes: [] })
        expect(merged.map((entry) => entry.tag)).toEqual(['0.94.0', '0.93.0', '0.92.0'])
        expect(merged[1].imageDigest).toBe(`sha256:${'b'.repeat(64)}`)
    })

    it('rebuilds releaseNotes and avoid on tags only the CDN has', () => {
        const merged = releaseFeed.merge({ repo: [], cdn: [feedEntry({ tag: '0.94.0' })], releaseNotes: [writtenNote({ version: '0.94.0', avoid: 'Wait for 0.94.1.', body: 'Notes written after the tag.' })] })
        expect(merged[0].releaseNotes).toBe('Notes written after the tag.')
        expect(merged[0].avoid).toEqual({ reason: 'Wait for 0.94.1.' })
    })

    it('drops nothing when the CDN copy is empty', () => {
        const repo = [feedEntry({ tag: '0.93.0' })]
        expect(releaseFeed.merge({ repo, cdn: [], releaseNotes: [] })).toEqual(repo)
    })
})

describe('parseFeed', () => {
    it('rejects a feed that lists a tag twice', () => {
        const text = JSON.stringify([feedEntry({ tag: '0.93.0' }), feedEntry({ tag: '0.93.0' })])
        expect(() => releaseFeed.parseFeed({ text, source: 'test' })).toThrow('0.93.0 appears more than once')
    })

    it('rejects an entry missing a required field', () => {
        const { imageDigest: _imageDigest, ...rest } = feedEntry({ tag: '0.93.0' })
        expect(() => releaseFeed.parseFeed({ text: JSON.stringify([rest]), source: 'test' })).toThrow('imageDigest')
    })
})
