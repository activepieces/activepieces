import { execFileSync } from 'child_process'
import { appendFileSync, existsSync, readFileSync } from 'fs'
import { CrowdinClient, crowdinClient } from './crowdin-client'
import { ChangedString, CrowdinApproval, CrowdinString, CrowdinTranslation, RenameAction, renamePlan } from './rename-plan'

async function run({ client, pieces, autoApprovers, dryRun, journal }: RunParams): Promise<RunCounts> {
    const project = await client.get<{ data: { targetLanguageIds: string[] } }>({ path: '' })
    const files = await client.list<CrowdinFile>({ path: '/files' })
    let counts = EMPTY_COUNTS
    for (const piece of pieces) {
        const pieceCounts = await renamePiece({ client, piece, files, languages: project.data.targetLanguageIds, autoApprovers, dryRun, journal })
        counts = addCounts({ left: counts, right: pieceCounts })
    }
    return counts
}

async function undo({ client, lines, journal }: UndoParams): Promise<UndoCounts> {
    const attempted = lines.filter((line) => line.kind === 'pending' || (line.kind === 'rename' && line.status === 'renamed'))
    const latestByRename = new Map(attempted.map((line) => [`${line.stringId}\u0000${line.before?.text}\u0000${line.after?.text}`, line]))
    let counts: UndoCounts = { undone: 0, failed: 0 }
    for (const line of [...latestByRename.values()].reverse()) {
        const outcome = await undoOne({ client, line, journal })
        counts = { undone: counts.undone + outcome.undone, failed: counts.failed + outcome.failed }
    }
    return counts
}

function exitCode({ counts, dryRun }: { counts: RunCounts, dryRun: boolean }): number {
    return !dryRun && counts.failed > 0 && counts.writes === 0 ? 1 : 0
}

function summarize({ lines, counts, dryRun }: SummarizeParams): string {
    const renames = lines.filter((line) => line.kind === 'rename')
    const review = renames.filter((line) => line.needsReview === true && (line.status === 'renamed' || line.status === 'would-rename'))
    const problems = lines.filter((line) => line.kind === 'skip' || line.status === 'error' || line.status === 'precondition-failed')
    const heading = dryRun ? '## Crowdin rename (dry run, nothing written)' : '## Crowdin rename'
    const reviewHeading = dryRun
        ? '### Translations kept after a rewording (a Crowdin issue would ask a translator to review each)'
        : '### Translations kept after a rewording (a Crowdin issue asks a translator to review each)'
    const totals = `${dryRun ? counts.wouldRename : counts.renamed} ${dryRun ? 'would be renamed' : 'renamed'}, ${counts.skipped} skipped, ${counts.failed} failed.`
    const reviewTable = review.length === 0 ? [] : [
        '',
        reviewHeading,
        '',
        '| Piece | Old English | New English | Languages |',
        '|---|---|---|---|',
        ...review.map((line) => `| ${line.piece} | ${cell(line.before?.text)} | ${cell(line.after?.text)} | ${(line.keptLanguages ?? []).join(', ')} |`),
    ]
    const problemTable = problems.length === 0 ? [] : [
        '',
        '### Not renamed',
        '',
        '| Piece | Old English | Reason |',
        '|---|---|---|',
        ...problems.map((line) => `| ${line.piece} | ${cell(line.before?.text)} | ${line.kind === 'skip' ? line.status : `${line.kind} ${line.status}: ${cell(line.message)}`} |`),
    ]
    return [heading, '', totals, ...reviewTable, ...problemTable, ''].join('\n')
}

function pieceOf({ pathsFile }: { pathsFile: string }): string {
    return pathsFile.slice(`${PATHS_FOLDER}/`.length, -'.json'.length)
}

async function renamePiece({ client, piece, files, languages, autoApprovers, dryRun, journal }: RenamePieceParams): Promise<RunCounts> {
    const changes = renamePlan.changedStrings({ oldEnglishByPath: piece.oldEnglishByPath, newEnglishByPath: piece.newEnglishByPath })
    if (changes.length === 0) {
        return EMPTY_COUNTS
    }
    const holders = files.filter(({ path }) => path.endsWith(`/packages/pieces/${piece.piece}/src/i18n/translation.json`))
    if (holders.length !== 1) {
        changes.forEach((change) => journal(skipLine({ piece: piece.piece, change, reason: holders.length === 0 ? 'file-not-in-crowdin' : 'file-ambiguous' })))
        return { ...EMPTY_COUNTS, skipped: changes.length }
    }
    const fileId = holders[0].id
    try {
        const crowdinStrings = await client.list<CrowdinString>({ path: `/strings?fileId=${fileId}` })
        const { matched, skipped } = renamePlan.match({ changes, crowdinStrings })
        skipped.forEach(({ change, reason }) => journal(skipLine({ piece: piece.piece, change, reason })))
        if (matched.length === 0) {
            return { ...EMPTY_COUNTS, skipped: skipped.length }
        }
        const translationsByLanguage: Record<string, CrowdinTranslation[]> = await readPerLanguage({ client, languages, pathFor: (language) => `/languages/${language}/translations?fileId=${fileId}` })
        const approvalsByLanguage: Record<string, CrowdinApproval[]> = await readPerLanguage({ client, languages, pathFor: (language) => `/approvals?fileId=${fileId}&languageId=${language}` })
        let counts: RunCounts = { ...EMPTY_COUNTS, skipped: skipped.length }
        for (const { change, stringId } of matched) {
            const action = renamePlan.decide({ change, stringId, translationsByLanguage, approvalsByLanguage, autoApprovers })
            const actionCounts = await applyRename({ client, piece: piece.piece, fileId, action, dryRun, journal })
            counts = addCounts({ left: counts, right: actionCounts })
        }
        return counts
    }
    catch (error) {
        journal({ kind: 'piece-error', piece: piece.piece, status: 'error', fileId, message: messageOf({ error }) })
        return { ...EMPTY_COUNTS, failed: changes.length }
    }
}

async function applyRename({ client, piece, fileId, action, dryRun, journal }: ApplyRenameParams): Promise<RunCounts> {
    const after = { identifier: action.identifier, text: action.newText }
    const line: Omit<JournalLine, 'status'> = {
        kind: 'rename',
        piece,
        fileId,
        stringId: action.stringId,
        after,
        updateOption: action.updateOption,
        changeClass: action.changeClass,
        keptLanguages: action.keptLanguages,
        reapproveOnUndo: action.reapproveOnUndo,
        needsReview: action.needsReview,
    }
    if (dryRun) {
        journal({ ...line, status: 'would-rename', before: { identifier: action.oldText, text: action.oldText } })
        return { ...EMPTY_COUNTS, wouldRename: 1 }
    }
    const checked = await readBeforeRename({ client, action })
    if (!checked.ok) {
        journal({ ...line, status: checked.status, before: checked.before, message: checked.message })
        return { ...EMPTY_COUNTS, failed: 1 }
    }
    journal({ ...line, kind: 'pending', status: 'patching', before: checked.before })
    const problem = await patchString({ client, action })
    if (problem !== null) {
        journal({ ...line, status: 'error', before: checked.before, message: problem })
        return { ...EMPTY_COUNTS, failed: 1 }
    }
    journal({ ...line, status: 'renamed', before: checked.before })
    const cleanup = await cleanupPaths({ client, action })
    cleanup.problems.forEach((message) => journal({ kind: 'cleanup', piece, fileId, stringId: action.stringId, status: 'error', message }))
    let counts: RunCounts = { ...EMPTY_COUNTS, renamed: 1, writes: 1, failed: cleanup.problems.length }
    for (const path of cleanup.paths) {
        const deleted = await deleteIfPresent({ client, path })
        journal({ kind: 'cleanup', piece, fileId, stringId: action.stringId, status: deleted.ok ? 'deleted' : 'error', message: deleted.ok ? path : `${path}: ${deleted.message}` })
        counts = addCounts({ left: counts, right: deleted.ok ? { ...EMPTY_COUNTS, writes: 1 } : { ...EMPTY_COUNTS, failed: 1 } })
    }
    for (const language of action.needsReview ? action.keptLanguages : []) {
        const problem = await openReviewIssue({ client, action, language })
        journal({ kind: 'review-issue', piece, fileId, stringId: action.stringId, language, before: checked.before, after, status: problem === null ? 'opened' : 'error', message: problem ?? undefined })
        counts = addCounts({ left: counts, right: problem === null ? { ...EMPTY_COUNTS, writes: 1 } : { ...EMPTY_COUNTS, failed: 1 } })
    }
    return counts
}

async function openReviewIssue({ client, action, language }: { client: CrowdinClient, action: RenameAction, language: string }): Promise<string | null> {
    try {
        await client.post({
            path: '/comments',
            body: {
                stringId: action.stringId,
                targetLanguageId: language,
                type: 'issue',
                issueType: 'translation_mistake',
                text: reviewIssueText({ oldText: action.oldText, newText: action.newText }),
            },
        })
        return null
    }
    catch (error) {
        return messageOf({ error })
    }
}

function reviewIssueText({ oldText, newText }: { oldText: string, newText: string }): string {
    return [
        REVIEW_ISSUE_PREFIX,
        '',
        `Old English: ${oldText}`,
        `New English: ${newText}`,
        '',
        'This translation was written for the old English and is no longer approved. Please check it against the new English, correct it if needed, approve it, then resolve this issue.',
    ].join('\n')
}

async function deleteReviewIssues({ client, line }: { client: CrowdinClient, line: JournalLine }): Promise<string | null> {
    if (line.needsReview !== true || line.stringId === undefined) {
        return null
    }
    try {
        const issues = await client.list<{ id: number, text: string }>({ path: `/comments?stringId=${line.stringId}&type=issue&issueStatus=unresolved` })
        const problems: string[] = []
        for (const { id } of issues.filter(({ text }) => text.startsWith(REVIEW_ISSUE_PREFIX))) {
            const deleted = await deleteIfPresent({ client, path: `/comments/${id}` })
            problems.push(...(deleted.ok ? [] : [deleted.message]))
        }
        return problems.length === 0 ? null : `review issues not removed: ${problems.join('; ')}`
    }
    catch (error) {
        return `review issues not removed: ${messageOf({ error })}`
    }
}

async function readBeforeRename({ client, action }: { client: CrowdinClient, action: RenameAction }): Promise<BeforeRename> {
    const current = await readString({ client, stringId: action.stringId })
    if (current === null) {
        return { ok: false, status: 'error', before: { identifier: action.oldText, text: action.oldText }, message: 'could not read the string before renaming it' }
    }
    if (current.text !== action.oldText) {
        return { ok: false, status: 'precondition-failed', before: current, message: 'Crowdin no longer holds the old English' }
    }
    return { ok: true, before: current }
}

async function patchString({ client, action }: { client: CrowdinClient, action: RenameAction }): Promise<string | null> {
    try {
        await client.patch({
            path: `/strings/${action.stringId}?updateOption=${action.updateOption}`,
            body: [
                { op: 'replace', path: '/identifier', value: action.identifier },
                { op: 'replace', path: '/text', value: action.newText },
            ],
        })
        return null
    }
    catch (error) {
        const afterError = await readString({ client, stringId: action.stringId })
        return afterError !== null && afterError.text === action.newText ? null : messageOf({ error })
    }
}

async function readString({ client, stringId }: { client: CrowdinClient, stringId: number }): Promise<StringText | null> {
    try {
        const current = await client.get<{ data: CrowdinString }>({ path: `/strings/${stringId}` })
        return { identifier: current.data.identifier, text: current.data.text }
    }
    catch {
        return null
    }
}

async function cleanupPaths({ client, action }: { client: CrowdinClient, action: RenameAction }): Promise<{ paths: string[], problems: string[] }> {
    const cleared = action.clearedLanguages.map((language) => `/translations?stringId=${action.stringId}&languageId=${language}`)
    if (action.updateOption !== 'keep_translations') {
        return { paths: cleared, problems: [] }
    }
    const machine: string[] = []
    const problems: string[] = []
    for (const language of action.keptLanguages) {
        try {
            const rows = await client.list<{ id: number, user?: { username?: string } | null }>({ path: `/translations?stringId=${action.stringId}&languageId=${language}` })
            const ids = renamePlan.machineTranslationIds({
                translations: rows.map(({ id, user }) => ({ id, userName: user?.username ?? null })),
                humanApprovedIds: action.reapproveOnUndo,
                autoApprovers: action.autoApprovers,
            })
            machine.push(...ids.map((id) => `/translations/${id}`))
        }
        catch (error) {
            problems.push(`could not list ${language} translations of string ${action.stringId}: ${messageOf({ error })}`)
        }
    }
    return { paths: [...cleared, ...machine], problems }
}

async function deleteIfPresent({ client, path }: { client: CrowdinClient, path: string }): Promise<{ ok: true } | { ok: false, message: string }> {
    try {
        await client.del({ path })
        return { ok: true }
    }
    catch (error) {
        return isNotFound({ error }) ? { ok: true } : { ok: false, message: messageOf({ error }) }
    }
}

async function undoOne({ client, line, journal }: { client: CrowdinClient, line: JournalLine, journal: Journal }): Promise<UndoCounts> {
    const { stringId, before, after } = line
    if (stringId === undefined || before === undefined || after === undefined) {
        return { undone: 0, failed: 1 }
    }
    const undoLine: Omit<JournalLine, 'status'> = { kind: 'undo', piece: line.piece, fileId: line.fileId, stringId, before: after, after: before }
    const current = await readString({ client, stringId })
    if (current === null) {
        journal({ ...undoLine, status: 'error', message: 'could not read the string' })
        return { undone: 0, failed: 1 }
    }
    if (current.text === before.text && current.identifier === before.identifier) {
        const leftovers = await restoreAfterUndo({ client, line })
        journal({ ...undoLine, status: 'already-undone', message: leftovers ?? undefined })
        return { undone: 0, failed: leftovers === null ? 0 : 1 }
    }
    if (current.text !== after.text) {
        journal({ ...undoLine, status: 'precondition-failed', message: 'Crowdin no longer holds the renamed English' })
        return { undone: 0, failed: 1 }
    }
    try {
        await client.patch({
            path: `/strings/${stringId}?updateOption=keep_translations_and_approvals`,
            body: [
                { op: 'replace', path: '/identifier', value: before.identifier },
                { op: 'replace', path: '/text', value: before.text },
            ],
        })
    }
    catch (error) {
        journal({ ...undoLine, status: 'error', message: messageOf({ error }) })
        return { undone: 0, failed: 1 }
    }
    const leftovers = await restoreAfterUndo({ client, line })
    journal({ ...undoLine, status: 'undone', message: leftovers ?? undefined })
    return { undone: 1, failed: leftovers === null ? 0 : 1 }
}

async function restoreAfterUndo({ client, line }: { client: CrowdinClient, line: JournalLine }): Promise<string | null> {
    const lostApprovals = await restoreApprovals({ client, translationIds: line.reapproveOnUndo ?? [] })
    const issueProblem = await deleteReviewIssues({ client, line })
    const problems = [
        ...(lostApprovals.length === 0 ? [] : [`approvals not restored for translations ${lostApprovals.join(', ')}`]),
        ...(issueProblem === null ? [] : [issueProblem]),
    ]
    return problems.length === 0 ? null : problems.join('; ')
}

async function restoreApprovals({ client, translationIds }: { client: CrowdinClient, translationIds: number[] }): Promise<number[]> {
    const lostApprovals: number[] = []
    for (const translationId of translationIds) {
        try {
            const approvals = await client.list<{ id: number }>({ path: `/approvals?translationId=${translationId}` })
            if (approvals.length === 0) {
                await client.post({ path: '/approvals', body: { translationId } })
            }
        }
        catch {
            lostApprovals.push(translationId)
        }
    }
    return lostApprovals
}

async function readPerLanguage({ client, languages, pathFor }: ReadPerLanguageParams): Promise<Record<string, Attribution[]>> {
    const entries: [string, Attribution[]][] = []
    for (const language of languages) {
        const rows = await client.list<AttributedRow>({ path: pathFor(language) })
        entries.push([language, rows.map(({ translationId, stringId, user }) => ({ translationId, stringId, userName: user?.username ?? null }))])
    }
    return Object.fromEntries(entries)
}

function skipLine({ piece, change, reason }: { piece: string, change: ChangedString, reason: string }): JournalLine {
    return { kind: 'skip', piece, status: reason, before: { identifier: change.oldEnglish, text: change.oldEnglish }, after: { identifier: change.newEnglish, text: change.newEnglish } }
}

function addCounts({ left, right }: { left: RunCounts, right: RunCounts }): RunCounts {
    return {
        renamed: left.renamed + right.renamed,
        wouldRename: left.wouldRename + right.wouldRename,
        skipped: left.skipped + right.skipped,
        failed: left.failed + right.failed,
        writes: left.writes + right.writes,
    }
}

function isNotFound({ error }: { error: unknown }): boolean {
    return typeof error === 'object' && error !== null && 'status' in error && error.status === 404
}

function messageOf({ error }: { error: unknown }): string {
    return (error instanceof Error ? error.message : String(error)).split('\n')[0].slice(0, 300)
}

function cell(text: string | undefined): string {
    const oneLine = (text ?? '').replace(/\s+/g, ' ').replace(/\|/g, '\\|')
    return oneLine.length > MAX_CELL_LENGTH ? `${oneLine.slice(0, MAX_CELL_LENGTH)}…` : oneLine
}

function changedPieces({ base: baseRef, cwd }: { base: string, cwd?: string }): PieceChange[] {
    const git = ({ args }: { args: string[] }): string => execFileSync('git', args, { encoding: 'utf8', maxBuffer: GIT_MAX_BUFFER, cwd })
    const base = git({ args: ['merge-base', baseRef, 'HEAD'] }).trim()
    const changed = git({ args: ['diff', '--name-status', '--no-renames', base, 'HEAD', '--', PATHS_FOLDER] })
        .split('\n')
        .map((row) => row.split('\t'))
        .filter(([status, file]) => status === 'M' && file !== undefined && file.endsWith('.json'))
        .map(([, file]) => file)
    return changed.map((pathsFile) => {
        const oldEnglishByPath: Record<string, string> = JSON.parse(git({ args: ['show', `${base}:${pathsFile}`] }))
        const newEnglishByPath: Record<string, string> = JSON.parse(git({ args: ['show', `HEAD:${pathsFile}`] }))
        return { piece: pieceOf({ pathsFile }), oldEnglishByPath, newEnglishByPath }
    })
}

function readJournal({ file }: { file: string }): JournalLine[] {
    if (!existsSync(file)) {
        return []
    }
    return readFileSync(file, 'utf8').split('\n').filter((row) => row.length > 0).map((row) => {
        const line: JournalLine = JSON.parse(row)
        return line
    })
}

function option({ name, fallback }: { name: string, fallback: string }): string {
    const index = process.argv.indexOf(name)
    return index === -1 ? fallback : process.argv[index + 1] ?? fallback
}

function report({ summary, outputs }: { summary: string, outputs: Record<string, number> }): void {
    console.log(summary)
    if (process.env.GITHUB_STEP_SUMMARY) {
        appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`)
    }
    if (process.env.GITHUB_OUTPUT) {
        appendFileSync(process.env.GITHUB_OUTPUT, Object.entries(outputs).map(([name, value]) => `${name}=${value}\n`).join(''))
    }
}

async function main(): Promise<void> {
    const token = process.env.CROWDIN_RENAME_TOKEN
    const projectId = process.env.CROWDIN_PROJECT_ID
    if (!token || !projectId) {
        report({ summary: '## Crowdin rename\n\nSkipped: CROWDIN_RENAME_TOKEN or CROWDIN_PROJECT_ID is not set.\n', outputs: { renamed: 0, failed: 0 } })
        return
    }
    const dryRun = process.env.CROWDIN_RENAME_DRY_RUN === 'true'
    try {
        await renameOrUndo({ token, projectId, dryRun })
    }
    catch (error) {
        report({ summary: `## Crowdin rename\n\nStopped before any change in Crowdin: ${messageOf({ error })}\n`, outputs: { renamed: 0, failed: dryRun ? 0 : 1 } })
        process.exitCode = dryRun ? 0 : 1
    }
}

async function renameOrUndo({ token, projectId, dryRun }: { token: string, projectId: string, dryRun: boolean }): Promise<void> {
    const journalFile = option({ name: '--journal', fallback: 'crowdin-rename-journal.jsonl' })
    const journal: Journal = (line) => appendFileSync(journalFile, `${JSON.stringify({ at: new Date().toISOString(), ...line })}\n`)
    const undoFile = option({ name: '--undo', fallback: '' })
    if (undoFile.length > 0) {
        const counts = await undo({ client: crowdinClient.create({ token, projectId }), lines: readJournal({ file: undoFile }), journal })
        report({ summary: `## Crowdin rename undo\n\n${counts.undone} renamed back, ${counts.failed} failed.\n`, outputs: { undone: counts.undone, failed: counts.failed } })
        process.exitCode = counts.failed > 0 ? 1 : 0
        return
    }
    const autoApprovers = (process.env.CROWDIN_AUTO_APPROVERS ?? '').split(',').map((name) => name.trim()).filter((name) => name.length > 0)
    const pieces = changedPieces({ base: option({ name: '--base', fallback: 'origin/main' }) })
        .filter(({ oldEnglishByPath, newEnglishByPath }) => renamePlan.changedStrings({ oldEnglishByPath, newEnglishByPath }).length > 0)
    if (pieces.length === 0) {
        report({ summary: '## Crowdin rename\n\nNo English text changed, nothing to rename.\n', outputs: { renamed: 0, failed: 0 } })
        return
    }
    const lines: JournalLine[] = []
    const counts = await run({
        client: crowdinClient.create({ token, projectId, readOnly: dryRun }),
        pieces,
        autoApprovers,
        dryRun,
        journal: (line) => {
            lines.push(line)
            journal(line)
        },
    })
    report({ summary: summarize({ lines, counts, dryRun }), outputs: { renamed: counts.renamed, failed: dryRun ? 0 : counts.failed } })
    process.exitCode = exitCode({ counts, dryRun })
}

const PATHS_FOLDER = 'tools/i18n-paths'
const MAX_CELL_LENGTH = 120
const REVIEW_ISSUE_PREFIX = 'The English text of this string changed (automatic note from the Activepieces translations job).'
const GIT_MAX_BUFFER = 256 * 1024 * 1024
const EMPTY_COUNTS: RunCounts = { renamed: 0, wouldRename: 0, skipped: 0, failed: 0, writes: 0 }

export const crowdinRename = { run, undo, exitCode, summarize, pieceOf, changedPieces }

export type JournalLine = {
    kind: 'rename' | 'pending' | 'skip' | 'cleanup' | 'review-issue' | 'undo' | 'piece-error'
    piece: string
    status: string
    fileId?: number
    stringId?: number
    before?: StringText
    after?: StringText
    updateOption?: RenameAction['updateOption']
    changeClass?: RenameAction['changeClass']
    keptLanguages?: string[]
    language?: string
    reapproveOnUndo?: number[]
    needsReview?: boolean
    message?: string
}

export type RunCounts = {
    renamed: number
    wouldRename: number
    skipped: number
    failed: number
    writes: number
}

type Journal = (line: JournalLine) => void

type StringText = {
    identifier: string
    text: string
}

type BeforeRename = { ok: true, before: StringText } | { ok: false, status: 'error' | 'precondition-failed', before: StringText, message: string }

type UndoCounts = {
    undone: number
    failed: number
}

type CrowdinFile = {
    id: number
    path: string
}

type PieceChange = {
    piece: string
    oldEnglishByPath: Record<string, string>
    newEnglishByPath: Record<string, string>
}

type RunParams = {
    client: CrowdinClient
    pieces: PieceChange[]
    autoApprovers: string[]
    dryRun: boolean
    journal: Journal
}

type UndoParams = {
    client: CrowdinClient
    lines: JournalLine[]
    journal: Journal
}

type SummarizeParams = {
    lines: JournalLine[]
    counts: RunCounts
    dryRun: boolean
}

type RenamePieceParams = Omit<RunParams, 'pieces'> & {
    piece: PieceChange
    files: CrowdinFile[]
    languages: string[]
}

type ApplyRenameParams = {
    client: CrowdinClient
    piece: string
    fileId: number
    action: RenameAction
    dryRun: boolean
    journal: Journal
}

type Attribution = {
    translationId: number
    stringId: number
    userName: string | null
}

type AttributedRow = {
    translationId: number
    stringId: number
    user?: { username?: string } | null
}

type ReadPerLanguageParams = {
    client: CrowdinClient
    languages: string[]
    pathFor: (language: string) => string
}

if (import.meta.main) {
    main().catch((error: unknown) => {
        console.error(`❌ Crowdin rename failed: ${messageOf({ error })}`)
        process.exit(1)
    })
}
