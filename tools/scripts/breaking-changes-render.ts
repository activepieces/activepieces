import { readdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { BreakingChangeEntry, BreakingChangeImpact } from '../../packages/core/shared/src/lib/core/breaking-change'

function parseEntryFile({ fileName, text }: { fileName: string, text: string }): Entry {
    const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(text)
    if (!match) {
        throw new Error(`${fileName}: missing YAML front-matter between --- lines`)
    }
    const parsed = BreakingChangeEntry.safeParse(Bun.YAML.parse(match[1]))
    if (!parsed.success) {
        throw new Error(`${fileName}: ${parsed.error.issues.map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`).join('; ')}`)
    }
    if (`${parsed.data.id}.md` !== fileName) {
        throw new Error(`${fileName}: id "${parsed.data.id}" must match the file name`)
    }
    const body = match[2].trim()
    if (body.length === 0) {
        throw new Error(`${fileName}: the body must say what changed and what self-hosters need to do`)
    }
    return { meta: parsed.data, body }
}

function readEntries({ dir }: { dir: string }): Entry[] {
    return readdirSync(dir)
        .filter((fileName) => fileName.endsWith('.md'))
        .sort()
        .map((fileName) => parseEntryFile({ fileName, text: readFileSync(join(dir, fileName), 'utf-8') }))
}

function renderPages({ entries }: { entries: Entry[] }): RenderedPages {
    const released = entries.filter((entry) => entry.meta.release !== undefined)
    const unreleased = entries.filter((entry) => entry.meta.release === undefined)
    const releases = [...new Set(released.flatMap((entry) => entry.meta.release === undefined ? [] : [entry.meta.release]))].sort((a, b) => compareVersions({ a: b, b: a }))
    const sections = releases.map((release) => renderRelease({ release, entries: released.filter((entry) => entry.meta.release === release) }))
    const unreleasedEntries = sortEntries({ entries: unreleased }).map(renderEntry)
    return {
        published: [PUBLISHED_PREAMBLE, ...sections].join('\n\n') + '\n',
        unreleased: [UNRELEASED_PREAMBLE, '## What has changed?', ...unreleasedEntries].join('\n\n') + '\n',
    }
}

function setRelease({ text, release }: { text: string, release: string }): string {
    const end = text.indexOf('\n---\n', 4)
    const frontMatter = text.slice(0, end).split('\n').filter((line) => !line.startsWith('release:'))
    return [...frontMatter, `release: ${release}`].join('\n') + text.slice(end)
}

function renderRelease({ release, entries }: { release: string, entries: Entry[] }): string {
    const legacy = entries.filter((entry) => entry.meta.legacy)
    if (legacy.length > 0) {
        if (entries.length > 1) {
            throw new Error(`Release ${release} has a legacy entry and other entries; a legacy release holds exactly one file`)
        }
        return `## ${release}\n\n${legacy[0].body}`
    }
    return [`## ${release}`, '### What has changed?', ...sortEntries({ entries }).map(renderEntry)].join('\n\n')
}

function renderEntry(entry: Entry): string {
    return `#### ${entry.meta.title}\n\n${entry.body}`
}

function sortEntries({ entries }: { entries: Entry[] }): Entry[] {
    return [...entries].sort((x, y) => {
        const byOrder = (x.meta.order ?? Number.MAX_SAFE_INTEGER) - (y.meta.order ?? Number.MAX_SAFE_INTEGER)
        if (byOrder !== 0) {
            return byOrder
        }
        const byImpact = impactRank({ impact: x.meta.impact }) - impactRank({ impact: y.meta.impact })
        if (byImpact !== 0) {
            return byImpact
        }
        if (x.meta.added !== y.meta.added) {
            return x.meta.added < y.meta.added ? 1 : -1
        }
        return x.meta.id.localeCompare(y.meta.id)
    })
}

function impactRank({ impact }: { impact: BreakingChangeImpact | undefined }): number {
    return impact === undefined ? IMPACT_ORDER.length : IMPACT_ORDER.indexOf(impact)
}

function compareVersions({ a, b }: { a: string, b: string }): number {
    const [coreA, preA] = a.split('-', 2)
    const [coreB, preB] = b.split('-', 2)
    const partsA = coreA.split('.').map(Number)
    const partsB = coreB.split('.').map(Number)
    for (let i = 0; i < 3; i++) {
        if (partsA[i] !== partsB[i]) {
            return partsA[i] - partsB[i]
        }
    }
    if (preA === preB) {
        return 0
    }
    if (preA === undefined) {
        return -1
    }
    if (preB === undefined) {
        return 1
    }
    return preA.localeCompare(preB, undefined, { numeric: true })
}

function main(): void {
    const pages = renderPages({ entries: readEntries({ dir: ENTRIES_DIR }) })
    const targets = [
        { file: PUBLISHED_DOC, text: pages.published },
        { file: UNRELEASED_DOC, text: pages.unreleased },
    ]
    if (process.argv.includes('--check')) {
        const stale = targets.filter((target) => readFileSync(target.file, 'utf-8') !== target.text)
        if (stale.length > 0) {
            console.error(`Out of date: ${stale.map((target) => target.file).join(', ')}. Run: bun tools/scripts/breaking-changes-render.ts`)
            process.exit(1)
        }
        console.log('Breaking-changes pages match their entries.')
        return
    }
    for (const target of targets) {
        writeFileSync(target.file, target.text)
    }
    console.log(`Rendered ${PUBLISHED_DOC} and ${UNRELEASED_DOC}.`)
}

const GENERATED_NOTE = '{/* Generated from install/reference/breaking-changes/entries by tools/scripts/breaking-changes-render.ts. Edit the entry files, not this page. */}'

const PUBLISHED_PREAMBLE = `---
title: "Breaking Changes"
description: "This list shows all versions that include breaking changes and how to upgrade."
icon: "hammer"
---

${GENERATED_NOTE}`

const UNRELEASED_PREAMBLE = `---
title: "Unreleased breaking changes"
description: "Changes merged to main that no self-hosted release contains yet."
hidden: true
---

${GENERATED_NOTE}

Each entry is a file in \`docs/install/reference/breaking-changes/entries/\`. Entries move to [Breaking Changes](/install/reference/breaking-changes) when the release that contains them is tagged.`

const IMPACT_ORDER: BreakingChangeImpact[] = [
    BreakingChangeImpact.BLOCKS_UPGRADE,
    BreakingChangeImpact.FLOWS_FAIL,
    BreakingChangeImpact.FLOWS_MAY_FAIL,
    BreakingChangeImpact.BEHAVIOR_CHANGES,
    BreakingChangeImpact.FEATURE_REMOVED,
]

export const ENTRIES_DIR = 'docs/install/reference/breaking-changes/entries'
export const PUBLISHED_DOC = 'docs/install/reference/breaking-changes.mdx'
export const UNRELEASED_DOC = 'docs/install/reference/breaking-changes-unreleased.mdx'

export const breakingChangesRender = { parseEntryFile, readEntries, renderPages, setRelease, compareVersions }

type Entry = {
    meta: BreakingChangeEntry
    body: string
}

type RenderedPages = {
    published: string
    unreleased: string
}

if (import.meta.main) {
    main()
}
