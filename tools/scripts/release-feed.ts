import { existsSync, readdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { parseArgs } from 'util'
import { ReleaseFeed, ReleaseFeedEntry, ReleaseKind, ReleaseMigrations, ReleaseNote, ReleaseNoteFile, ReleaseTag } from '../../packages/core/shared/src/lib/core/release-feed'
import { breakingChangesRender, Entry, ENTRIES_DIR } from './breaking-changes-render'

function kindOf({ tag }: { tag: string }): ReleaseKind {
    const [core, prerelease] = tag.split('-', 2)
    if (prerelease === undefined) {
        return core.split('.')[2] === '0' ? ReleaseKind.MINOR : ReleaseKind.PATCH
    }
    if (/^rc\.\d+$/.test(prerelease)) {
        return ReleaseKind.RC
    }
    if (/^hotfix\.\d+$/.test(prerelease)) {
        return ReleaseKind.HOTFIX
    }
    throw new Error(`${tag}: a release tag is X.Y.Z, X.Y.Z-rc.N or X.Y.Z-hotfix.N`)
}

function lineOf({ tag }: { tag: string }): string {
    return tag.split('.').slice(0, 2).join('.')
}

function notesFor({ entries, tag }: { entries: Entry[], tag: string }): ReleaseNote[] {
    return breakingChangesRender.sortEntries({ entries: entries.filter((entry) => entry.meta.release === tag) }).map((entry) => ({
        id: entry.meta.id,
        title: entry.meta.title,
        impact: entry.meta.impact,
        affects: entry.meta.affects,
        body: entry.body,
    }))
}

function buildEntry({ tag, releasedAt, imageDigest, migrations, entries }: BuildEntryParams): ReleaseFeedEntry {
    return ReleaseFeedEntry.parse({
        tag: ReleaseTag.parse(tag),
        releasedAt,
        line: lineOf({ tag }),
        kind: kindOf({ tag }),
        imageDigest,
        migrations,
        notes: notesFor({ entries, tag }),
        pieceMigrations: [],
        supportedUntil: null,
    })
}

function append({ feed, entry, releaseNotes }: { feed: ReleaseFeed, entry: ReleaseFeedEntry, releaseNotes: WrittenReleaseNote[] }): ReleaseFeed {
    return rebuild({ feed: [...feed.filter((candidate) => candidate.tag !== entry.tag), entry], releaseNotes })
}

function merge({ repo, cdn, releaseNotes }: { repo: ReleaseFeed, cdn: ReleaseFeed, releaseNotes: WrittenReleaseNote[] }): ReleaseFeed {
    const repoTags = new Set(repo.map((entry) => entry.tag))
    return rebuild({ feed: [...repo, ...cdn.filter((entry) => !repoTags.has(entry.tag))], releaseNotes })
}

function rebuild({ feed, releaseNotes }: { feed: ReleaseFeed, releaseNotes: WrittenReleaseNote[] }): ReleaseFeed {
    const byVersion = new Map(releaseNotes.map((note) => [note.version, note]))
    return sortFeed({
        feed: feed.map(({ avoid: _avoid, releaseNotes: _releaseNotes, ...entry }) => {
            const note = byVersion.get(entry.tag)
            return {
                ...entry,
                ...(note?.avoid === undefined ? {} : { avoid: { reason: note.avoid } }),
                ...(note?.body === undefined ? {} : { releaseNotes: note.body }),
            }
        }),
    })
}

function parseReleaseNoteFile({ fileName, text }: { fileName: string, text: string }): WrittenReleaseNote {
    const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(text)
    if (!match) {
        throw new Error(`${fileName}: missing YAML front-matter between --- lines`)
    }
    const parsed = ReleaseNoteFile.safeParse(Bun.YAML.parse(match[1]))
    if (!parsed.success) {
        throw new Error(`${fileName}: ${parsed.error.issues.map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`).join('; ')}`)
    }
    if (`${parsed.data.version}.md` !== fileName) {
        throw new Error(`${fileName}: version "${parsed.data.version}" must match the file name`)
    }
    kindOf({ tag: parsed.data.version })
    const body = match[2].trim()
    return { version: parsed.data.version, avoid: parsed.data.avoid, body: body.length === 0 ? undefined : body }
}

function readReleaseNoteFiles({ dir }: { dir: string }): WrittenReleaseNote[] {
    if (!existsSync(dir)) {
        return []
    }
    return readdirSync(dir)
        .filter((fileName) => fileName.endsWith('.md'))
        .sort()
        .map((fileName) => parseReleaseNoteFile({ fileName, text: readFileSync(join(dir, fileName), 'utf-8') }))
}

function sortFeed({ feed }: { feed: ReleaseFeed }): ReleaseFeed {
    return [...feed].sort((a, b) => breakingChangesRender.compareVersions({ a: b.tag, b: a.tag }))
}

function parseFeed({ text, source }: { text: string, source: string }): ReleaseFeed {
    const parsed = ReleaseFeed.safeParse(JSON.parse(text))
    if (!parsed.success) {
        throw new Error(`${source}: ${parsed.error.issues.map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`).join('; ')}`)
    }
    const tags = parsed.data.map((entry) => entry.tag)
    const duplicate = tags.find((tag, index) => tags.indexOf(tag) !== index)
    if (duplicate !== undefined) {
        throw new Error(`${source}: ${duplicate} appears more than once`)
    }
    return parsed.data
}

function serialize({ feed }: { feed: ReleaseFeed }): string {
    return JSON.stringify(feed, null, 2) + '\n'
}

function readFeed({ file }: { file: string }): ReleaseFeed {
    return parseFeed({ text: readFileSync(file, 'utf-8'), source: file })
}

function main(): void {
    const { positionals, values } = parseArgs({
        allowPositionals: true,
        options: {
            'file': { type: 'string', default: RELEASES_FILE },
            'tag': { type: 'string' },
            'released-at': { type: 'string' },
            'digest': { type: 'string' },
            'migrations': { type: 'string' },
            'cdn': { type: 'string' },
            'out': { type: 'string' },
        },
    })
    const command = positionals[0]
    const file = values.file
    if (command === 'append') {
        const { tag, digest, migrations } = values
        const releasedAt = values['released-at']
        if (tag === undefined || digest === undefined || migrations === undefined || releasedAt === undefined) {
            fail({ message: USAGE })
        }
        const entry = buildEntry({
            tag,
            releasedAt,
            imageDigest: digest,
            migrations: ReleaseMigrations.parse(JSON.parse(migrations)),
            entries: breakingChangesRender.readEntries({ dir: ENTRIES_DIR }),
        })
        const feed = append({ feed: readFeed({ file }), entry, releaseNotes: readReleaseNoteFiles({ dir: RELEASE_NOTES_DIR }) })
        writeFileSync(file, serialize({ feed }))
        const written = feed.find((candidate) => candidate.tag === entry.tag)
        console.log(`${file}: ${entry.tag} (${entry.kind}, line ${entry.line}) with ${entry.notes.length} note(s), ${entry.migrations.blocking} blocking and ${entry.migrations.background} background migration(s), ${written?.releaseNotes === undefined ? 'no' : 'with'} written release notes${written?.avoid === undefined ? '' : ', marked avoid'}.`)
        return
    }
    if (command === 'merge') {
        const { cdn, out } = values
        if (cdn === undefined || out === undefined) {
            fail({ message: USAGE })
        }
        const releaseNotes = readReleaseNoteFiles({ dir: RELEASE_NOTES_DIR })
        const merged = merge({ repo: readFeed({ file }), cdn: readFeed({ file: cdn }), releaseNotes })
        writeFileSync(out, serialize({ feed: merged }))
        console.log(`${out}: ${merged.length} release(s) from ${file} merged with ${cdn}, releaseNotes and avoid rebuilt from ${releaseNotes.length} file(s) in ${RELEASE_NOTES_DIR}.`)
        return
    }
    if (command === 'check-notes') {
        const releaseNotes = readReleaseNoteFiles({ dir: RELEASE_NOTES_DIR })
        console.log(`${RELEASE_NOTES_DIR}: ${releaseNotes.length} release note file(s) match the schema.`)
        return
    }
    if (command === 'check') {
        const feed = readFeed({ file })
        const text = readFileSync(file, 'utf-8')
        if (text !== serialize({ feed: sortFeed({ feed }) })) {
            fail({ message: `${file} is not sorted newest first with two-space indentation.` })
        }
        console.log(`${file}: ${feed.length} release(s) match the schema.`)
        return
    }
    fail({ message: USAGE })
}

function fail({ message }: { message: string }): never {
    console.error(message)
    process.exit(1)
}

const USAGE = [
    'usage:',
    '  bun tools/scripts/release-feed.ts append --tag <tag> --released-at <iso> --digest <sha256:...> --migrations <json> [--file releases.json]',
    '  bun tools/scripts/release-feed.ts merge --cdn <cdn copy> --out <merged file> [--file releases.json]',
    '  bun tools/scripts/release-feed.ts check [--file releases.json]',
    '  bun tools/scripts/release-feed.ts check-notes',
].join('\n')

export const RELEASES_FILE = 'releases.json'
export const RELEASE_NOTES_DIR = 'docs/install/reference/releases'

export const releaseFeed = { kindOf, lineOf, notesFor, buildEntry, append, merge, rebuild, parseReleaseNoteFile, readReleaseNoteFiles, parseFeed, serialize }

export type WrittenReleaseNote = {
    version: string
    avoid: string | undefined
    body: string | undefined
}

type BuildEntryParams = {
    tag: string
    releasedAt: string
    imageDigest: string
    migrations: ReleaseMigrations
    entries: Entry[]
}

if (import.meta.main) {
    main()
}
