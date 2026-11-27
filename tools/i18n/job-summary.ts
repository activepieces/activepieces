import { JournalEntry } from './rename-journal'
import { RenameTotals } from './rename-run'
import { UndoTotals } from './rename-undo'

function renameSummary({ journalEntries, totals }: RenameSummaryParams): string {
    const renameEntries = journalEntries.filter((entry) => entry.kind === 'rename')
    const keptForReview = renameEntries.filter((entry) => entry.needsReview === true && entry.status === 'renamed')
    const onlyNewInCrowdin = journalEntries.filter((entry) => entry.kind === 'skip' && entry.status === 'only-new-in-crowdin')
    const notRenamed = journalEntries.filter((entry) => (entry.kind === 'skip' && entry.status !== 'only-new-in-crowdin') || entry.status === 'error' || entry.status === 'precondition-failed')
    const totalsSentence = `${totals.renamed} renamed, ${totals.skipped} skipped, ${totals.failed} failed.`
    const keptForReviewTable = keptForReview.length === 0 ? [] : [
        '',
        '### Translations kept after a rewording (a Crowdin issue asks a translator to review each)',
        '',
        '| Piece | Old English | New English | Languages |',
        '|---|---|---|---|',
        ...keptForReview.map((entry) => `| ${entry.pieceName} | ${tableCell(entry.textBefore?.text)} | ${tableCell(entry.textAfter?.text)} | ${(entry.keptLanguages ?? []).join(', ')} |`),
    ]
    const notRenamedTable = notRenamed.length === 0 ? [] : [
        '',
        '### Not renamed',
        '',
        '| Piece | Old English | Reason |',
        '|---|---|---|',
        ...notRenamed.map((entry) => `| ${entry.pieceName} | ${tableCell(entry.textBefore?.text)} | ${entry.kind === 'skip' ? entry.status : `${entry.kind} ${entry.status}: ${tableCell(entry.message)}`} |`),
    ]
    const onlyNewInCrowdinTable = onlyNewInCrowdin.length === 0 ? [] : [
        '',
        '### Crowdin holds only the new English',
        '',
        'Nothing was written for these. Either an earlier run already renamed the string, or a Crowdin sync replaced the string and its translations are gone. If an earlier run stopped part-way through a rewording, translations of the old English may still be on the string: check that run\'s journal.',
        '',
        '| Piece | Old English | New English |',
        '|---|---|---|',
        ...onlyNewInCrowdin.map((entry) => `| ${entry.pieceName} | ${tableCell(entry.textBefore?.text)} | ${tableCell(entry.textAfter?.text)} |`),
    ]
    return [RENAME_HEADING, '', totalsSentence, ...keptForReviewTable, ...notRenamedTable, ...onlyNewInCrowdinTable, ''].join('\n')
}

function undoSummary({ totals }: { totals: UndoTotals }): string {
    return `${RENAME_HEADING} undo\n\n${totals.undone} renamed back, ${totals.failed} failed.\n`
}

function noticeSummary({ notice }: { notice: string }): string {
    return `${RENAME_HEADING}\n\n${notice}\n`
}

function tableCell(text: string | undefined): string {
    const oneLineText = (text ?? '').replace(/\s+/g, ' ').replace(/\|/g, '\\|')
    return oneLineText.length > MAX_TABLE_CELL_LENGTH ? `${oneLineText.slice(0, MAX_TABLE_CELL_LENGTH)}…` : oneLineText
}

const RENAME_HEADING = '## Crowdin rename'
const MAX_TABLE_CELL_LENGTH = 120

export const jobSummary = { renameSummary, undoSummary, noticeSummary }

type RenameSummaryParams = {
    journalEntries: JournalEntry[]
    totals: RenameTotals
}
