import { execFileSync } from 'child_process'
import { readdirSync, readFileSync, writeFileSync } from 'fs'
import { basename, join } from 'path'
import { breakingChangesRender, ENTRIES_DIR, PUBLISHED_DOC, UNRELEASED_DOC } from './breaking-changes-render'

function rollover({ files, idsAtTag, tag }: { files: EntryFile[], idsAtTag: Set<string>, tag: string }): RolloverResult {
    const moving = files
        .map((file) => ({ file, entry: breakingChangesRender.parseEntryFile({ fileName: file.fileName, text: file.text }) }))
        .filter(({ entry }) => entry.meta.release === undefined && idsAtTag.has(entry.meta.id))
    return {
        updated: moving.map(({ file }) => ({ fileName: file.fileName, text: breakingChangesRender.setRelease({ text: file.text, release: tag }) })),
        moved: moving.map(({ entry }) => entry.meta.title),
    }
}

function readIdsAtTag({ tag }: { tag: string }): Set<string> {
    const listing = execFileSync('git', ['ls-tree', '--name-only', tag, `${ENTRIES_DIR}/`], { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] })
    return new Set(listing.split('\n').filter((path) => path.endsWith('.md')).map((path) => basename(path, '.md')))
}

function main(): void {
    const tag = process.argv[2]
    const dryRun = process.argv.includes('--dry-run')
    if (!tag) {
        console.error('usage: bun tools/scripts/breaking-changes-rollover.ts <tag> [--dry-run]')
        process.exit(1)
    }
    if (/-rc\./.test(tag)) {
        console.log(`${tag} is a release candidate, nothing to roll over.`)
        return
    }
    const files = readdirSync(ENTRIES_DIR)
        .filter((fileName) => fileName.endsWith('.md'))
        .map((fileName) => ({ fileName, text: readFileSync(join(ENTRIES_DIR, fileName), 'utf-8') }))
    const result = rollover({ files, idsAtTag: readIdsAtTag({ tag }), tag })
    if (result.moved.length === 0) {
        console.log(`No unreleased entry is contained in ${tag}.`)
        return
    }
    for (const title of result.moved) {
        console.log(`${dryRun ? 'would move' : 'moved'} under ## ${tag}: ${title}`)
    }
    if (dryRun) {
        return
    }
    for (const file of result.updated) {
        writeFileSync(join(ENTRIES_DIR, file.fileName), file.text)
    }
    const pages = breakingChangesRender.renderPages({ entries: breakingChangesRender.readEntries({ dir: ENTRIES_DIR }) })
    writeFileSync(PUBLISHED_DOC, pages.published)
    writeFileSync(UNRELEASED_DOC, pages.unreleased)
}

export const breakingChangesRollover = { rollover }

type EntryFile = {
    fileName: string
    text: string
}

type RolloverResult = {
    updated: EntryFile[]
    moved: string[]
}

if (import.meta.main) {
    main()
}
