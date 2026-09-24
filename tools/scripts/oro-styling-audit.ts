import { execSync } from 'child_process'
import path from 'path'

/**
 * Reports what an upstream upgrade changed in the app's layout and styling.
 *
 * Standalone: git history is the only input. It diffs the two upstream
 * snapshots the fork has merged and reports four surfaces -- elements added or
 * removed, class changes attributed to the element carrying them, theme tokens,
 * and whether anything stopped being rendered -- translating Tailwind classes
 * into the CSS properties they control, so the output reads as "this got
 * narrower" rather than "this string changed".
 *
 *   bun tools/scripts/oro-styling-audit.ts
 *   bun tools/scripts/oro-styling-audit.ts --range <old>..<new>
 *   bun tools/scripts/oro-styling-audit.ts --detail        full listing, never summarised
 *   bun tools/scripts/oro-styling-audit.ts --file <name>   one file only
 *   bun tools/scripts/oro-styling-audit.ts --scope ui      narrow the search
 *   bun tools/scripts/oro-styling-audit.ts --all           unrecognised classes too
 */

const REPO_ROOT = path.resolve(__dirname, '../..')

const APP_DIR = 'packages/web/src'

/**
 * The whole app is the default. A narrower scope silently reports "no changes"
 * for edits that happened just outside it, which is worse than a long report --
 * so narrowing is opt-in, and whatever a narrowed run skips is always counted
 * in the header.
 */
const SCOPES: Record<string, string[]> = {
    ui: ['packages/web/src/components/ui'],
    features: ['packages/web/src/components/ui', 'packages/web/src/features'],
    all: ['packages/web/src'],
}

function git(command: string): string {
    return execSync(command, { cwd: REPO_ROOT, encoding: 'utf-8', maxBuffer: 64 * 1024 * 1024 })
}

function gitQuiet(command: string): string {
    try {
        return git(command)
    }
    catch {
        return ''
    }
}

function fail(message: string): never {
    console.error(`\noro-styling-audit: ${message}\n`)
    process.exit(2)
}

function resolveScope(argv: string[]): { name: string, dirs: string[] } {
    const index = argv.indexOf('--scope')
    const name = index === -1 ? 'all' : argv[index + 1] ?? ''
    if (!SCOPES[name]) {
        fail(`--scope must be one of ${Object.keys(SCOPES).join(', ')}, got "${name}"`)
    }
    return { name, dirs: SCOPES[name] }
}

// ---------------------------------------------------------------- the range

/**
 * Every upstream intake in this fork is a merge commit, and its second parent is
 * the upstream snapshot that came in. Diffing two such parents keeps the fork's
 * own commits out of the diff entirely, so there is nothing local to filter out.
 *
 * ORIG_HEAD would be the obvious alternative but it includes the fork's commits
 * and is clobbered by any later rebase or reset, so an audit stops being
 * reproducible the next day.
 */
function resolveRange(argv: string[]): { from: string, to: string } {
    const explicit = argv.indexOf('--range')
    if (explicit !== -1) {
        const value = argv[explicit + 1] ?? ''
        const [from, to] = value.split('..')
        if (!from || !to) {
            fail(`--range needs <A>..<B>, got "${value}"`)
        }
        return { from, to }
    }

    const merges = gitQuiet(
        `git log --merges --format=%H --grep="Merge remote-tracking branch '\\(upstream\\|origin\\)/main'"`,
    )
        .split('\n')
        .filter(Boolean)

    if (merges.length < 2) {
        fail(
            'could not find two upstream merge commits to compare.\n' +
            'Upstream may have been brought in by rebase or squash, which leaves no\n' +
            'second parent to diff. Pass the range explicitly:\n' +
            '  bun tools/scripts/oro-styling-audit.ts --range <old>..<new>',
        )
    }

    return {
        from: git(`git rev-parse ${merges[1]}^2`).trim(),
        to: git(`git rev-parse ${merges[0]}^2`).trim(),
    }
}

function versionAt(rev: string): string {
    try {
        return JSON.parse(gitQuiet(`git show ${rev}:package.json`)).version ?? '?'
    }
    catch {
        return '?'
    }
}

// ------------------------------------------------ tailwind class -> property

type Group = 'Size & spacing' | 'Colour & border' | 'Typography' | 'Position & flow' | 'Effects'

/**
 * Enough of the shadcn vocabulary to name the CSS property a class controls.
 * Order matters: the first entries are the more specific prefixes.
 */
const CLASS_PROPERTIES: [RegExp, string, Group][] = [
    [/^-?translate-[xy]-/, 'translate', 'Position & flow'],
    [/^min-w-/, 'min-width', 'Size & spacing'],
    [/^min-h-/, 'min-height', 'Size & spacing'],
    [/^max-w-/, 'max-width', 'Size & spacing'],
    [/^max-h-/, 'max-height', 'Size & spacing'],
    [/^rounded(-|$)/, 'border-radius', 'Colour & border'],
    [/^border-[0-9]/, 'border-width', 'Colour & border'],
    [/^border-(solid|dashed|dotted|none)$/, 'border-style', 'Colour & border'],
    [/^border(-[trblxy])?(-|$)/, 'border', 'Colour & border'],
    [/^bg-/, 'background', 'Colour & border'],
    [/^text-(xs|sm|base|lg|xl|[0-9])/, 'font-size', 'Typography'],
    [/^text-(left|center|right|justify)$/, 'text-align', 'Typography'],
    [/^text-/, 'color', 'Colour & border'],
    [/^font-(thin|light|normal|medium|semibold|bold|extrabold|black)$/, 'font-weight', 'Typography'],
    [/^leading-/, 'line-height', 'Typography'],
    [/^tracking-/, 'letter-spacing', 'Typography'],
    [/^(size|w)-/, 'width', 'Size & spacing'],
    [/^(size|h)-/, 'height', 'Size & spacing'],
    [/^p[xytrbl]?-/, 'padding', 'Size & spacing'],
    [/^m[xytrbl]?-/, 'margin', 'Size & spacing'],
    [/^gap(-[xy])?-/, 'gap', 'Size & spacing'],
    [/^space-[xy]-/, 'margin', 'Size & spacing'],
    [/^(flex|grid|block|inline-\w+|inline|hidden|table)$/, 'display', 'Position & flow'],
    [/^(absolute|relative|fixed|sticky|static)$/, 'position', 'Position & flow'],
    [/^(items|justify|content|self|place)-/, 'alignment', 'Position & flow'],
    [/^(shrink|grow|basis|order)-/, 'flex', 'Position & flow'],
    [/^overflow-/, 'overflow', 'Position & flow'],
    [/^z-/, 'z-index', 'Position & flow'],
    [/^opacity-/, 'opacity', 'Effects'],
    [/^shadow(-|$)/, 'box-shadow', 'Effects'],
    [/^(stroke|fill)-/, 'svg paint', 'Colour & border'],
    [/^cursor-/, 'cursor', 'Effects'],
    [/^transition(-|$)/, 'transition', 'Effects'],
    [/^flex-(row|col)(-reverse)?$/, 'flex-direction', 'Position & flow'],
    [/^flex-(wrap|nowrap|wrap-reverse)$/, 'flex-wrap', 'Position & flow'],
    [/^(grid-cols|grid-rows|col-span|row-span|col-start|row-start)-/, 'grid', 'Position & flow'],
    [/^(inset|top|right|bottom|left)-/, 'offset', 'Position & flow'],
    [/^(truncate|whitespace-|break-|line-clamp-)/, 'text overflow', 'Typography'],
    [/^(uppercase|lowercase|capitalize|normal-case)$/, 'text-transform', 'Typography'],
    [/^(underline|no-underline|line-through|overline)$/, 'text-decoration', 'Typography'],
    [/^(italic|not-italic)$/, 'font-style', 'Typography'],
    [/^ring(-|$)/, 'ring', 'Effects'],
    [/^outline(-|$)/, 'outline', 'Effects'],
    [/^divide-/, 'divide', 'Colour & border'],
    [/^(rotate|scale|skew)-/, 'transform', 'Position & flow'],
    [/^aspect-/, 'aspect-ratio', 'Size & spacing'],
    [/^object-/, 'object-fit', 'Size & spacing'],
    [/^(visible|invisible|collapse)$/, 'visibility', 'Position & flow'],
    [/^pointer-events-/, 'pointer-events', 'Effects'],
    [/^select-/, 'user-select', 'Effects'],
    [/^(animate|duration|delay|ease)-/, 'animation', 'Effects'],
    [/^sr-only$/, 'screen-reader', 'Position & flow'],
]

type Meaning = { property: string, group: Group } | null

/** `size-` legitimately matches both width and height; the first hit names the row. */
function meaningOf(token: string): Meaning {
    for (const [pattern, property, group] of CLASS_PROPERTIES) {
        if (pattern.test(token)) {
            return { property, group }
        }
    }
    return null
}

/** `data-[state=checked]:hover:translate-x-5` -> `translate-x-5`. */
function baseToken(token: string): string {
    let depth = 0
    let start = 0
    for (let i = 0; i < token.length; i++) {
        const ch = token[i]
        if (ch === '[') depth++
        else if (ch === ']') depth--
        else if (ch === ':' && depth === 0) start = i + 1
    }
    return token.slice(start)
}

/** The variant prefix, so `hover:bg-red` and `bg-red` are not reported as the same change. */
function variantOf(token: string): string {
    const base = baseToken(token)
    return token.length === base.length ? '' : token.slice(0, token.length - base.length - 1)
}

// ------------------------------------------------------------ diff scanning

// `=` and `,` must be inside the class or arbitrary values are cut short:
// `data-[state=checked]:translate-x-5` would stop at the `=`, and
// `shadow-[0_1px_2px_rgba(15,23,42,0.18)]` at the first comma.
const CLASS_TOKEN = /[A-Za-z][\w:,=./[\]()#%-]*/g

/** One class or attribute token, with the JSX element it sits on. */
type Token = {
    value: string
    owner: string
    /** The owning tag's own line was deleted too, so the whole element went. */
    ownerGone: boolean
}

type Change = {
    removed: Token[]
    added: Token[]
    attrsRemoved: Token[]
    attrsAdded: Token[]
    elementsRemoved: string[]
    elementsAdded: string[]
}

/**
 * Opening and self-closing JSX tags. Closing tags are skipped so an element is
 * counted once, and a re-indented line nets to zero because the same tag shows
 * on both sides of the diff. The `$` alternative matters: a multi-line element
 * puts `<CreateNewMenu` alone at the end of its line, with props beneath.
 */
const JSX_TAG = /<([A-Z][\w.]*|[a-z][\w-]*)(?=[\s/>]|$)/gm
const JSX_TAG_ONCE = /<([A-Z][\w.]*|[a-z][\w-]*)(?=[\s/>]|$)/

/**
 * Dozens of files are called index.tsx, so a bare basename collapses unrelated
 * components onto one row. Qualify those with their directory.
 */
function shortName(file: string): string {
    const base = path.basename(file, '.tsx')
    return base === 'index' ? `${path.basename(path.dirname(file))}/index` : base
}

const fileCache = new Map<string, string[]>()

function fileLines(rev: string, file: string): string[] {
    const key = `${rev}:${file}`
    const cached = fileCache.get(key)
    if (cached) {
        return cached
    }
    const lines = gitQuiet(`git show ${rev}:${file}`).split('\n')
    fileCache.set(key, lines)
    return lines
}

/**
 * The element a line belongs to: the nearest opening tag at or above it.
 *
 * JSX here is prettier-formatted, so a className sits either on the tag line
 * itself or in the prop block directly beneath it. Walking back to the first
 * `<Tag` therefore lands on the element that owns the prop. This is a
 * heuristic, not a parser -- a className built in a helper far from any JSX
 * will attribute to whatever tag happens to precede it.
 */
function ownerAt(lines: string[], index: number): { tag: string, line: number } | null {
    for (let i = index; i >= 0 && i > index - 60; i--) {
        const match = JSX_TAG_ONCE.exec(lines[i] ?? '')
        if (match) {
            return { tag: match[1], line: i }
        }
    }
    return null
}

const scanCache = new Map<string, Change>()

function scanFile(range: string, file: string): Change {
    const key = `${range}:${file}`
    const cached = scanCache.get(key)
    if (cached) {
        return cached
    }
    const result = scanFileUncached(range, file)
    scanCache.set(key, result)
    return result
}

function scanFileUncached(range: string, file: string): Change {
    const [from, to] = range.split('..')
    const removed: Token[] = []
    const added: Token[] = []
    const attrsRemoved: Token[] = []
    const attrsAdded: Token[] = []
    const elementsRemoved: string[] = []
    const elementsAdded: string[] = []

    const before = fileLines(from, file)
    const after = fileLines(to, file)

    // Line numbers are needed to locate the owning element in the original
    // file, so the diff is read hunk by hunk rather than line by line.
    const deletedLines = new Set<number>()
    type Pending = { adding: boolean, body: string, index: number }
    const pending: Pending[] = []

    let oldNo = 0
    let newNo = 0
    for (const line of gitQuiet(`git diff -U0 ${range} -- ${file}`).split('\n')) {
        const hunk = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(line)
        if (hunk) {
            oldNo = Number(hunk[1])
            newNo = Number(hunk[2])
            continue
        }
        if (/^[+-]{3}/.test(line) || !/^[+-]/.test(line)) {
            continue
        }
        const adding = line.startsWith('+')
        pending.push({ adding, body: line.slice(1), index: (adding ? newNo : oldNo) - 1 })
        if (adding) {
            newNo++
        }
        else {
            deletedLines.add(oldNo - 1)
            oldNo++
        }
    }

    // A deleted owner line is not proof the element went: on a single-line
    // element the tag and its className share a line, so editing the class
    // deletes that line and re-adds it. Only a net drop in the tag's count
    // means the element actually disappeared.
    const netTags = new Map<string, number>()
    for (const entry of pending) {
        for (const match of entry.body.matchAll(JSX_TAG)) {
            netTags.set(match[1], (netTags.get(match[1]) ?? 0) + (entry.adding ? 1 : -1))
        }
    }

    for (const entry of pending) {
        const lines = entry.adding ? after : before
        const owner = ownerAt(lines, entry.index)
        const tag = owner?.tag ?? '?'
        const ownerGone = !entry.adding
            && owner !== null
            && deletedLines.has(owner.line)
            && (netTags.get(tag) ?? 0) < 0

        for (const attr of entry.body.matchAll(/\b(data-[a-z-]+|role)\s*=/g)) {
            ;(entry.adding ? attrsAdded : attrsRemoved).push({ value: attr[1], owner: tag, ownerGone })
        }
        for (const match of entry.body.matchAll(JSX_TAG)) {
            ;(entry.adding ? elementsAdded : elementsRemoved).push(match[1])
        }
        // Class names only live in string literals; scanning the whole line would
        // pull in identifiers, imports and prop names.
        for (const literal of entry.body.matchAll(/'([^']*)'|"([^"]*)"|`([^`]*)`/g)) {
            const text = literal[1] ?? literal[2] ?? literal[3] ?? ''
            for (const token of text.match(CLASS_TOKEN) ?? []) {
                ;(entry.adding ? added : removed).push({ value: token, owner: tag, ownerGone })
            }
        }
    }

    return { removed, added, attrsRemoved, attrsAdded, elementsRemoved, elementsAdded }
}

// --------------------------------------------------------------- the report

type Row = { file: string, what: string, detail: string }

function auditComponents(
    range: string,
    files: string[],
    status: Map<string, string>,
): Map<Group | 'Attributes', Row[]> {
    const groups = new Map<Group | 'Attributes', Row[]>()
    const push = (group: Group | 'Attributes', row: Row) => {
        groups.set(group, [...(groups.get(group) ?? []), row])
    }

    for (const file of files) {
        const change = scanFile(range, file)
        const name = shortName(file)

        // A wholly new or deleted component has every class on one side of the
        // diff. Listing all of them drowns the edits that are actually changes.
        const state = status.get(file)
        if (state === 'A' || state === 'D') {
            const tokens = new Set(
                (state === 'A' ? change.added : change.removed)
                    .filter((token) => meaningOf(baseToken(token.value)))
                    .map((token) => token.value),
            )
            push('Attributes', {
                file: name,
                what: state === 'A' ? 'new component' : 'component deleted',
                detail: `${tokens.size} styled class(es)${state === 'A' ? ' — nothing could have depended on it yet' : ''}`,
            })
            continue
        }

        const values = (tokens: Token[]) => new Set(tokens.map((token) => token.value))
        const addedAttrs = values(change.attrsAdded)
        const removedAttrs = values(change.attrsRemoved)

        for (const attr of change.attrsRemoved) {
            if (!addedAttrs.has(attr.value) && !attr.ownerGone) {
                push('Attributes', {
                    file: name,
                    what: `<${attr.owner}>  ${attr.value} removed`,
                    detail: 'selectors keyed on it stop matching',
                })
            }
        }
        for (const attr of change.attrsAdded) {
            if (!removedAttrs.has(attr.value)) {
                push('Attributes', {
                    file: name,
                    what: `<${attr.owner}>  ${attr.value} added`,
                    detail: 'new hook available',
                })
            }
        }

        const addedValues = values(change.added)
        const removedValues = values(change.removed)

        // Classes that vanished only because their element did are not a styling
        // change -- the element removal above already says what happened, and
        // repeating its classes buries the edits that are real.
        const gone = change.removed.filter(
            (token) => !addedValues.has(token.value) && !token.ownerGone,
        )
        const fresh = change.added.filter((token) => !removedValues.has(token.value))

        const claimed = new Set<Token>()
        const seen = new Set<string>()

        for (const token of gone) {
            const key = `${token.owner}:${token.value}`
            if (seen.has(key)) {
                continue
            }
            seen.add(key)

            const meaning = meaningOf(baseToken(token.value))
            if (!meaning && !process.argv.includes('--all')) {
                continue
            }

            // Pair a removal with the addition on the SAME element controlling the
            // same property, so the output reads as a change rather than a delete
            // plus an unrelated add.
            const replacement = fresh.find(
                (other) =>
                    !claimed.has(other) &&
                    other.owner === token.owner &&
                    variantOf(other.value) === variantOf(token.value) &&
                    meaningOf(baseToken(other.value))?.property === meaning?.property,
            )
            if (replacement) {
                claimed.add(replacement)
                // Claim the value too, not just this object: the same class can
                // change on several elements of one kind, and the unclaimed
                // duplicates would otherwise print as spurious "added" rows.
                seen.add(`${replacement.owner}:${replacement.value}`)
            }

            push(meaning?.group ?? 'Effects', {
                file: name,
                what: `<${token.owner}>  ${token.value}${replacement ? `  ->  ${replacement.value}` : '  removed'}`,
                detail: meaning?.property ?? 'unrecognised class',
            })
        }

        for (const token of fresh) {
            const key = `${token.owner}:${token.value}`
            if (claimed.has(token) || seen.has(key)) {
                continue
            }
            seen.add(key)

            const meaning = meaningOf(baseToken(token.value))
            if (!meaning && !process.argv.includes('--all')) {
                continue
            }
            push(meaning?.group ?? 'Effects', {
                file: name,
                what: `<${token.owner}>  ${token.value}  added`,
                detail: meaning?.property ?? 'unrecognised class',
            })
        }
    }

    return groups
}

/**
 * Elements added to or removed from the markup.
 *
 * The class-token scan alone cannot see this: deleting a whole component shows
 * up only as whatever classes happened to be on it, and an element carrying no
 * className vanishes silently. Counting tags per file catches the removal
 * itself, which is usually the bigger layout change.
 */
function auditStructure(range: string, files: string[], status: Map<string, string>): Row[] {
    const rows: Row[] = []

    for (const file of files) {
        if (status.get(file) === 'A' || status.get(file) === 'D') {
            continue
        }

        const { elementsRemoved, elementsAdded } = scanFile(range, file)
        const tally = (list: string[]) => {
            const counts = new Map<string, number>()
            for (const tag of list) {
                counts.set(tag, (counts.get(tag) ?? 0) + 1)
            }
            return counts
        }
        const before = tally(elementsRemoved)
        const after = tally(elementsAdded)
        const name = shortName(file)

        for (const tag of new Set([...before.keys(), ...after.keys()])) {
            const was = before.get(tag) ?? 0
            const now = after.get(tag) ?? 0
            if (was === now) {
                continue
            }
            rows.push({
                file: name,
                what: `<${tag}>`,
                detail: now === 0
                    ? `removed (${was} occurrence${was === 1 ? '' : 's'})`
                    : was === 0
                        ? `added (${now} occurrence${now === 1 ? '' : 's'})`
                        : `${was} occurrence(s) removed, ${now} added`,
            })
        }
    }

    return rows
}

/**
 * Changes in every stylesheet in scope, reported against the CSS selector that
 * owns them -- the same idea as attributing a class to its JSX element.
 *
 * Deliberately not a single hardcoded file scanned for custom properties only:
 * the theme is split across styles.css and styles/globals.css, and a whole new
 * rule added to the second was being reported as "no token changes".
 */
function auditStyleSheets(range: string, dirs: string[]): Row[] {
    const [from, to] = range.split('..')
    const sheets = git(`git diff --name-only ${range} -- ${dirs.join(' ')}`)
        .split('\n')
        .filter((file) => file.endsWith('.css'))

    const rows: Row[] = []

    for (const sheet of sheets) {
        const before = fileLines(from, sheet)
        const after = fileLines(to, sheet)

        // selector -> properties touched, so one rule is one row however many
        // declarations moved inside it
        const touched = new Map<string, { added: Set<string>, removed: Set<string> }>()

        let oldNo = 0
        let newNo = 0
        for (const line of gitQuiet(`git diff -U0 ${range} -- ${sheet}`).split('\n')) {
            const hunk = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(line)
            if (hunk) {
                oldNo = Number(hunk[1])
                newNo = Number(hunk[2])
                continue
            }
            if (/^[+-]{3}/.test(line) || !/^[+-]/.test(line)) {
                continue
            }

            const adding = line.startsWith('+')
            const index = (adding ? newNo : oldNo) - 1
            if (adding) {
                newNo++
            }
            else {
                oldNo++
            }

            const body = line.slice(1)
            const declaration = /^\s*(-{0,2}[\w-]+)\s*:/.exec(body)
            if (!declaration) {
                continue
            }

            const selector = selectorAt(adding ? after : before, index)
            const entry = touched.get(selector) ?? { added: new Set<string>(), removed: new Set<string>() }
            ;(adding ? entry.added : entry.removed).add(declaration[1])
            touched.set(selector, entry)
        }

        for (const [selector, entry] of touched) {
            const changed = [...entry.added].filter((property) => entry.removed.has(property))
            const added = [...entry.added].filter((property) => !entry.removed.has(property))
            const removed = [...entry.removed].filter((property) => !entry.added.has(property))
            const parts = [
                changed.length ? `changed: ${changed.join(', ')}` : '',
                added.length ? `added: ${added.join(', ')}` : '',
                removed.length ? `removed: ${removed.join(', ')}` : '',
            ].filter(Boolean)

            rows.push({ file: path.basename(sheet), what: selector, detail: parts.join('   ') })
        }
    }

    return rows
}

/**
 * The rule a declaration belongs to: the nearest line above it that opens a
 * block. `:root` and `@theme` blocks come back as themselves, so custom
 * property changes still read as theme changes.
 */
function selectorAt(lines: string[], index: number): string {
    for (let i = index; i >= 0 && i > index - 200; i--) {
        const line = (lines[i] ?? '').trim()
        if (line.endsWith('{') && !line.startsWith('@media') && !line.startsWith('@supports')) {
            return line.slice(0, -1).trim() || '(anonymous block)'
        }
    }
    return '(top level)'
}

/**
 * A component file can be untouched while the pages stop rendering it, which
 * changes the layout just as surely as editing the component would.
 */
function auditRendering(from: string, to: string, dirs: string[]): Row[] {
    // Taken from the BEFORE revision, and from every primitive rather than only
    // the ones whose file changed. Reading it from the after revision silently
    // skips exactly what this check exists for: a slot that used to be rendered
    // and now is not, whether the component changed or a page moved off it.
    const slots = new Set(
        [...gitQuiet(`git grep -ho 'data-slot="[^"]*"' ${from} -- ${dirs.join(' ')}`)
            .matchAll(/data-slot="([^"]+)"/g)].map((match) => match[1]),
    )

    // One grep per revision rather than one per slot: 26 slots against two trees
    // is otherwise a hundred git invocations and twenty seconds.
    const usage = (rev: string): Map<string, Set<string>> => {
        const counts = new Map<string, Set<string>>()
        for (const line of gitQuiet(`git grep -o 'data-slot="[^"]*"' ${rev} -- ${APP_DIR}`).split('\n')) {
            const match = /^(.*?):(.*?):data-slot="([^"]+)"$/.exec(line)
            if (!match) {
                continue
            }
            const files = counts.get(match[3]) ?? new Set<string>()
            files.add(match[2])
            counts.set(match[3], files)
        }
        return counts
    }

    const before = usage(from)
    const after = usage(to)

    const rows: Row[] = []
    for (const slot of [...slots].sort()) {
        const was = before.get(slot)?.size ?? 0
        const now = after.get(slot)?.size ?? 0
        // Only a drop matters. More call sites is not a regression.
        if (was > now) {
            rows.push({
                file: 'packages/web',
                what: `data-slot="${slot}"`,
                detail: now === 0
                    ? `no longer rendered anywhere (was in ${was} file(s))`
                    : `rendered in ${was} file(s) -> ${now}`,
            })
        }
    }

    return rows
}

/**
 * A five-week upgrade touches 255 files and produces ~800 rows, which nobody
 * reads. Past a threshold the report rolls up per file, ranked by structural
 * change, since an element appearing or disappearing matters more than a colour
 * being retuned. --detail forces the full listing, --file narrows to one.
 */
const DETAIL_THRESHOLD = 60

function summarise(components: Row[], structure: Row[]): void {
    const files = new Map<string, { structure: number, style: number }>()
    const bump = (rows: Row[], key: 'structure' | 'style') => {
        for (const row of rows) {
            const entry = files.get(row.file) ?? { structure: 0, style: 0 }
            entry[key]++
            files.set(row.file, entry)
        }
    }
    bump(structure, 'structure')
    bump(components, 'style')

    const ranked = [...files.entries()].sort(
        (a, b) => b[1].structure - a[1].structure || b[1].style - a[1].style,
    )
    const width = Math.max(...ranked.map(([file]) => file.length))

    console.log(`\n  ${'file'.padEnd(width)}  elements  styles`)
    for (const [file, counts] of ranked) {
        console.log(
            `  ${file.padEnd(width)}  ${String(counts.structure).padStart(8)}  ${String(counts.style).padStart(6)}`,
        )
    }
    console.log(`\n  ${ranked.length} file(s). Full listing: --detail   One file: --file <name>`)
}

function print(title: string, rows: Row[]): void {
    if (!rows.length) {
        return
    }
    console.log(`\n  ${title}`)
    const width = Math.max(...rows.map((row) => row.file.length))
    for (const row of rows) {
        console.log(`    ${row.file.padEnd(width)}  ${row.what}`)
        console.log(`    ${' '.repeat(width)}  ${row.detail}`)
    }
}

const GROUP_ORDER: (Group | 'Attributes')[] = [
    'Attributes',
    'Size & spacing',
    'Position & flow',
    'Colour & border',
    'Typography',
    'Effects',
]

function main(): void {
    const scope = resolveScope(process.argv)
    const { from, to } = resolveRange(process.argv)
    const range = `${from}..${to}`

    const status = new Map<string, string>()
    for (const line of git(`git diff --name-status ${range} -- ${scope.dirs.join(' ')}`).split('\n')) {
        const [state, file] = line.split('\t')
        if (file?.endsWith('.tsx')) {
            status.set(file, state[0])
        }
    }
    const files = [...status.keys()]

    console.log('\nLayout & styling audit')
    console.log(`  range    : ${from.slice(0, 10)}..${to.slice(0, 10)}`)
    console.log(`  versions : Activepieces ${versionAt(from)} -> ${versionAt(to)}`)
    console.log(`  scope    : ${scope.name} (${scope.dirs.join(', ')})`)
    console.log(`  changed  : ${files.length} component file(s)`)

    if (scope.name !== 'all') {
        const everything = git(`git diff --name-only ${range} -- ${SCOPES.all.join(' ')}`)
            .split('\n')
            .filter((file) => file.endsWith('.tsx'))
        const skipped = everything.length - files.length
        if (skipped > 0) {
            console.log(`  SKIPPED  : ${skipped} changed file(s) outside this scope -- rerun without --scope to include them`)
        }
    }

    const components = auditComponents(range, files, status)
    const structure = auditStructure(range, files, status)
    const theme = auditStyleSheets(range, scope.dirs)
    const rendering = auditRendering(from, to, scope.dirs)

    const only = process.argv.indexOf('--file')
    const filter = only === -1 ? null : process.argv[only + 1] ?? ''
    const keep = (rows: Row[]) => filter ? rows.filter((row) => row.file.includes(filter)) : rows

    const flatComponents = keep(GROUP_ORDER.flatMap((group) => components.get(group) ?? []))
    const flatStructure = keep(structure)
    const rowCount = flatComponents.length + flatStructure.length
    const detailed = process.argv.includes('--detail') || filter !== null || rowCount <= DETAIL_THRESHOLD

    console.log(`\nCOMPONENTS (${flatComponents.length})   STRUCTURE (${flatStructure.length})`)
    if (!rowCount) {
        console.log('  no layout or styling changes')
    }
    else if (!detailed) {
        summarise(flatComponents, flatStructure)
    }
    else {
        print('Elements added or removed', flatStructure)
        for (const group of GROUP_ORDER) {
            print(group, keep(components.get(group) ?? []))
        }
    }

    console.log(`\nSTYLESHEETS (${theme.length})`)
    if (!theme.length) {
        console.log('  no stylesheet changes')
    }
    print('Rules', theme)

    console.log(`\nRENDERING (${rendering.length})`)
    if (!rendering.length) {
        console.log('  every component is still rendered as before')
    }
    print('Usage', rendering)

    console.log('')
}

main()
