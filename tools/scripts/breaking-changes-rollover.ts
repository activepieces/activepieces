import { execSync } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'

function isEntryHeading({ line }: { line: string }): boolean {
    return line.startsWith('#### ') && !line.startsWith('#### What you need to do')
}

function trimTrailingBlanks({ lines }: { lines: string[] }): string[] {
    const copy = [...lines]
    while (copy.length > 0 && copy[copy.length - 1].trim() === '') {
        copy.pop()
    }
    return copy
}

function parseEntries({ text }: { text: string }): ParsedPage {
    const lines = text.split('\n')
    const firstEntry = lines.findIndex((line) => isEntryHeading({ line }))
    if (firstEntry === -1) {
        return { preamble: trimTrailingBlanks({ lines }), blocks: [] }
    }
    const blocks: string[][] = []
    for (const line of lines.slice(firstEntry)) {
        if (isEntryHeading({ line })) {
            blocks.push([line])
            continue
        }
        blocks[blocks.length - 1].push(line)
    }
    return {
        preamble: trimTrailingBlanks({ lines: lines.slice(0, firstEntry) }),
        blocks: blocks.map((block) => trimTrailingBlanks({ lines: block })),
    }
}

function joinBlocks({ blocks }: { blocks: string[][] }): string[] {
    return blocks.flatMap((block, index) => (index === 0 ? block : ['', ...block]))
}

function renderHidden({ preamble, blocks }: ParsedPage): string {
    const body = blocks.length === 0 ? [] : ['', ...joinBlocks({ blocks })]
    return [...preamble, ...body, ''].join('\n')
}

function insertUnderVersion({ published, tag, blocks }: { published: string, tag: string, blocks: string[][] }): string {
    const lines = published.split('\n')
    const heading = `## ${tag}`
    const existing = lines.indexOf(heading)
    if (existing !== -1) {
        let at = existing + 1
        while (at < lines.length && (lines[at].trim() === '' || lines[at].startsWith('### What has changed?'))) {
            at += 1
        }
        return [...lines.slice(0, at), ...joinBlocks({ blocks }), '', ...lines.slice(at)].join('\n')
    }
    const frontmatterEnd = lines.indexOf('---', 1)
    const at = frontmatterEnd + 1
    const section = ['', heading, '', '### What has changed?', '', ...joinBlocks({ blocks })]
    return [...lines.slice(0, at), ...section, ...lines.slice(at)].join('\n')
}

function rollover({ hidden, snapshot, published, tag }: RolloverParams): RolloverResult {
    const current = parseEntries({ text: hidden })
    const shipped = new Set(parseEntries({ text: snapshot }).blocks.map((block) => block[0].trim()))
    const moving = current.blocks.filter((block) => shipped.has(block[0].trim()))
    if (moving.length === 0) {
        return { hidden, published, moved: [] }
    }
    const staying = current.blocks.filter((block) => !shipped.has(block[0].trim()))
    return {
        hidden: renderHidden({ preamble: current.preamble, blocks: staying }),
        published: insertUnderVersion({ published, tag, blocks: moving }),
        moved: moving.map((block) => block[0].slice(5).trim()),
    }
}

function readSnapshot({ tag }: { tag: string }): string {
    try {
        return execSync(`git show ${tag}:${UNRELEASED_DOC}`, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] })
    }
    catch {
        return ''
    }
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
    const snapshot = readSnapshot({ tag })
    if (snapshot === '') {
        console.log(`No ${UNRELEASED_DOC} at ${tag}, nothing to roll over.`)
        return
    }
    const result = rollover({
        hidden: readFileSync(UNRELEASED_DOC, 'utf-8'),
        snapshot,
        published: readFileSync(PUBLISHED_DOC, 'utf-8'),
        tag,
    })
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
    writeFileSync(UNRELEASED_DOC, result.hidden)
    writeFileSync(PUBLISHED_DOC, result.published)
}

export const breakingChangesRollover = { parseEntries, rollover }

export const UNRELEASED_DOC = 'docs/install/reference/breaking-changes-unreleased.mdx'
export const PUBLISHED_DOC = 'docs/install/reference/breaking-changes.mdx'

type ParsedPage = {
    preamble: string[]
    blocks: string[][]
}

type RolloverParams = {
    hidden: string
    snapshot: string
    published: string
    tag: string
}

type RolloverResult = {
    hidden: string
    published: string
    moved: string[]
}

if (import.meta.main) {
    main()
}
