import assert from 'assert'
import { execFileSync } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import { basename } from 'path'
import { ReleaseFeed } from '../../packages/core/shared/src/lib/core/release-feed'
import { breakingChangesRender, ENTRIES_DIR, PUBLISHED_DOC, UNRELEASED_DOC } from './breaking-changes-render'
import { RELEASE_NOTES_DIR, RELEASES_FILE, releaseFeed } from './release-feed'

const BREAKING_LABEL = '⛓️‍💥 breaking-change'
const ENTRIES_REQUIRING_IMPACT_FROM = '2026-11-25'
const RELEASE_BOT_LOGIN = 'automated-commits-ap'

type TemplateChoice = 'yes' | 'no' | 'unset' | 'multiple'

function sectionChoice({ body, heading }: { body: string, heading: RegExp }): TemplateChoice {
    const match = heading.exec(body)
    if (!match) {
        return 'unset'
    }
    const rest = body.slice(match.index + match[0].length)
    const nextHeading = rest.search(/^\s{0,3}#{2,3}\s/m)
    const section = nextHeading === -1 ? rest : rest.slice(0, nextHeading)

    const checked = [...section.matchAll(/^\s*-\s*\[([ xX])\]\s*(no|yes)\b/gim)]
        .filter((box) => box[1].toLowerCase() === 'x')
        .map((box) => box[2].toLowerCase())
    if (checked.length === 0) {
        return 'unset'
    }
    if (checked.length > 1) {
        return 'multiple'
    }
    return checked[0] === 'yes' ? 'yes' : 'no'
}

function changedFiles({ baseRef, filter, path }: { baseRef: string, filter: string, path?: string }): string[] {
    const args = ['diff', '--name-only', `--diff-filter=${filter}`, `origin/${baseRef}...HEAD`, ...(path ? ['--', path] : [])]
    return execFileSync('git', args, { encoding: 'utf-8' }).split('\n').filter((line) => line.length > 0)
}

function isPieceOnly({ files }: { files: string[] }): boolean {
    return files.length > 0 && files.every((file) => file.startsWith('packages/pieces/'))
}

function readEntry({ file }: { file: string }): CheckedEntry {
    try {
        const entry = breakingChangesRender.parseEntryFile({ fileName: basename(file), text: readFileSync(file, 'utf-8') })
        return { file, isCurrent: !entry.meta.legacy && entry.meta.added >= ENTRIES_REQUIRING_IMPACT_FROM, missing: ['impact', 'affects'].filter((field) => !(field in entry.meta)), error: undefined }
    }
    catch (error) {
        return { file, isCurrent: true, missing: [], error: error instanceof Error ? error.message : String(error) }
    }
}

function releaseFeedViolations({ baseHasFile, head, author }: { baseHasFile: boolean, head: ReleaseFeed, author: string }): string[] {
    if (author === RELEASE_BOT_LOGIN) {
        return []
    }
    if (!baseHasFile && head.length === 0) {
        return []
    }
    return [`${RELEASES_FILE} is written only by the release workflow (${RELEASE_BOT_LOGIN}). Change avoid or the written notes in ${RELEASE_NOTES_DIR}/<version>.md instead.`]
}

function baseHasReleasesFile({ baseRef }: { baseRef: string }): boolean {
    return execFileSync('git', ['ls-tree', '--name-only', `origin/${baseRef}`, RELEASES_FILE], { encoding: 'utf-8' }).trim().length > 0
}

function checkReleaseFeed({ baseRef, author }: { baseRef: string, author: string }): string[] {
    if (changedFiles({ baseRef, filter: 'ACDMR', path: RELEASES_FILE }).length === 0) {
        return []
    }
    if (!existsSync(RELEASES_FILE)) {
        return [`${RELEASES_FILE} is deleted. The release feed is published from it.`]
    }
    try {
        const head = releaseFeed.parseFeed({ text: readFileSync(RELEASES_FILE, 'utf-8'), source: RELEASES_FILE })
        return releaseFeedViolations({ baseHasFile: baseHasReleasesFile({ baseRef }), head, author })
    }
    catch (error) {
        return [error instanceof Error ? error.message : String(error)]
    }
}

function checkReleaseNoteFiles({ baseRef }: { baseRef: string }): string[] {
    return changedFiles({ baseRef, filter: 'AM', path: `${RELEASE_NOTES_DIR}/` })
        .filter((file) => file.endsWith('.md') && existsSync(file))
        .flatMap((file) => {
            try {
                releaseFeed.parseReleaseNoteFile({ fileName: basename(file), text: readFileSync(file, 'utf-8') })
                return []
            }
            catch (error) {
                return [error instanceof Error ? error.message : String(error)]
            }
        })
}

function stalePages(): string[] {
    const pages = breakingChangesRender.renderPages({ entries: breakingChangesRender.readEntries({ dir: ENTRIES_DIR }) })
    return [
        { file: PUBLISHED_DOC, text: pages.published },
        { file: UNRELEASED_DOC, text: pages.unreleased },
    ].filter((page) => readFileSync(page.file, 'utf-8') !== page.text).map((page) => page.file)
}

function main(): void {
    const baseRef = process.env.BASE_REF ?? process.env.GITHUB_BASE_REF ?? 'main'
    const body = process.env.PR_BODY ?? ''
    const labels: string[] = JSON.parse(process.env.PR_LABELS ?? '[]')
    const author = process.env.PR_AUTHOR ?? ''

    const hasBreakingLabel = labels.includes(BREAKING_LABEL)
    const templateChoice = sectionChoice({ body, heading: /^#{2,3}\s*Breaking change\?/im })
    const securityChoice = sectionChoice({ body, heading: /^#{2,3}\s*Security impact\?/im })
    const addedFiles = changedFiles({ baseRef, filter: 'A', path: `${ENTRIES_DIR}/` }).filter((file) => file.endsWith('.md'))
    const touchedEntries = changedFiles({ baseRef, filter: 'AM', path: `${ENTRIES_DIR}/` }).filter((file) => file.endsWith('.md') && existsSync(file)).map((file) => readEntry({ file }))
    const addedEntries = touchedEntries.filter((entry) => addedFiles.includes(entry.file) && entry.isCurrent)
    const pieceOnly = isPieceOnly({ files: changedFiles({ baseRef, filter: 'ACDMR' }) })

    const errors: string[] = []

    if (templateChoice === 'unset') {
        errors.push('The "Breaking change?" section in the PR description is not filled in — tick exactly one box (no / yes-technical / yes-functional).')
    }
    else if (templateChoice === 'multiple') {
        errors.push('The "Breaking change?" section has more than one box ticked — tick exactly one.')
    }

    if (securityChoice === 'unset') {
        errors.push('The "Security impact?" section in the PR description is not filled in — tick exactly one box (no / yes-security-sensitive).')
    }
    else if (securityChoice === 'multiple') {
        errors.push('The "Security impact?" section has more than one box ticked — tick exactly one.')
    }

    if (hasBreakingLabel && addedEntries.length === 0 && !pieceOnly) {
        errors.push(`PR carries the "${BREAKING_LABEL}" label but adds no entry file to ${ENTRIES_DIR}/. Add one (what changed + What you need to do), then run: bun tools/scripts/breaking-changes-render.ts`)
    }
    if (addedEntries.length > 0 && !hasBreakingLabel) {
        errors.push(`PR adds an entry to ${ENTRIES_DIR}/ but is missing the "${BREAKING_LABEL}" label. Apply the label so it lands in the release notes.`)
    }
    if (templateChoice === 'yes' && !hasBreakingLabel) {
        errors.push(`The PR template declares a breaking change but the "${BREAKING_LABEL}" label is missing. Apply it.`)
    }
    if (templateChoice === 'no' && hasBreakingLabel) {
        errors.push(`The PR template declares "not breaking" but carries the "${BREAKING_LABEL}" label — reconcile the two.`)
    }
    for (const entry of touchedEntries) {
        if (entry.error) {
            errors.push(entry.error)
        }
    }
    for (const entry of touchedEntries) {
        if (entry.isCurrent && !entry.error && entry.missing.length > 0) {
            errors.push(`${entry.file}: an entry added on or after ${ENTRIES_REQUIRING_IMPACT_FROM} needs ${entry.missing.join(' and ')}.`)
        }
    }
    errors.push(...checkReleaseFeed({ baseRef, author }))
    errors.push(...checkReleaseNoteFiles({ baseRef }))
    if (errors.length === 0) {
        const stale = stalePages()
        if (stale.length > 0) {
            errors.push(`${stale.join(' and ')} no longer match the entry files. Run: bun tools/scripts/breaking-changes-render.ts`)
        }
    }

    if (errors.length > 0) {
        console.error('❌ Breaking-change check failed:\n')
        for (const error of errors) {
            console.error(`   - ${error}`)
        }
        console.error(`\nSee ${ENTRIES_DIR}/ and the PR template for guidance.`)
        process.exit(1)
    }

    console.log('✅ Breaking-change check passed.')
}

function runSelfCheck(): void {
    assert(isPieceOnly({ files: ['packages/pieces/community/github/src/index.ts', 'packages/pieces/community/github/package.json'] }) === true, 'a PR that only touches pieces is piece-only')
    assert(isPieceOnly({ files: ['packages/pieces/community/github/src/index.ts', 'packages/server/api/src/app/app.ts'] }) === false, 'a PR that also touches the server is not piece-only')
    assert(isPieceOnly({ files: [] }) === false, 'an empty diff is not piece-only')
    assert(sectionChoice({ body: '### Breaking change?\n- [x] no — reviewed\n- [ ] yes — technical', heading: /^#{2,3}\s*Breaking change\?/im }) === 'no', 'a single ticked box is read')
    assert(sectionChoice({ body: '### Breaking change?\n- [x] no\n- [x] yes — technical', heading: /^#{2,3}\s*Breaking change\?/im }) === 'multiple', 'two ticked boxes are rejected')
    assert(ENTRIES_REQUIRING_IMPACT_FROM > '2026-11-09', 'converted entries stay exempt from impact and affects')
    const released = releaseFeed.buildEntry({ tag: '0.94.0', releasedAt: '2026-11-24T14:00:00Z', imageDigest: `sha256:${'a'.repeat(64)}`, migrations: { blocking: 1, background: 0, breaking: [] }, entries: [] })
    assert(releaseFeedViolations({ baseHasFile: true, head: [released], author: 'a-human' }).length === 1, 'a human may not change releases.json')
    assert(releaseFeedViolations({ baseHasFile: true, head: [{ ...released, avoid: { reason: 'Skip it.' } }], author: 'a-human' }).length === 1, 'a human may not set avoid in releases.json')
    assert(releaseFeedViolations({ baseHasFile: false, head: [released], author: 'a-human' }).length === 1, 'a human may not create releases.json with entries')
    assert.deepStrictEqual(releaseFeedViolations({ baseHasFile: false, head: [], author: 'a-human' }), [], 'the PR that introduces releases.json adds it empty')
    assert.deepStrictEqual(releaseFeedViolations({ baseHasFile: true, head: [released], author: RELEASE_BOT_LOGIN }), [], 'the release bot writes releases.json')
    assert.doesNotThrow(() => releaseFeed.parseReleaseNoteFile({ fileName: '0.94.0.md', text: '---\nversion: 0.94.0\navoid: Wait for 0.94.1.\n---\nNotes.\n' }), 'a valid release note file parses')
    assert.throws(() => releaseFeed.parseReleaseNoteFile({ fileName: '0.94.1.md', text: '---\nversion: 0.94.0\n---\nNotes.\n' }), 'a release note file must be named after its version')
    console.log('breaking-change-check self-check passed')
}

type CheckedEntry = {
    file: string
    isCurrent: boolean
    missing: string[]
    error: string | undefined
}

if (process.argv.includes('--self-check')) {
    runSelfCheck()
}
else {
    main()
}
