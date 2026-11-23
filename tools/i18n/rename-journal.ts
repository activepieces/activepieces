import { appendFileSync, existsSync, readFileSync } from 'fs'
import { SourceStringsModel } from '@crowdin/crowdin-api-client'
import { EditKind } from './rename-plan'

function appenderTo({ journalFile }: { journalFile: string }): AppendJournalEntry {
    return (entry) => appendFileSync(journalFile, `${JSON.stringify({ at: new Date().toISOString(), ...entry })}\n`)
}

function readEntries({ journalFile }: { journalFile: string }): JournalEntry[] {
    if (!existsSync(journalFile)) {
        return []
    }
    return readFileSync(journalFile, 'utf8').split('\n').filter((jsonLine) => jsonLine.length > 0).map((jsonLine) => {
        const entry: JournalEntry = JSON.parse(jsonLine)
        return entry
    })
}

function renameIdentityOf({ entry }: { entry: JournalEntry }): string {
    return `${entry.stringId}\u0000${entry.textBefore?.text}\u0000${entry.textAfter?.text}`
}

export const renameJournal = { appenderTo, readEntries, renameIdentityOf }

export type JournalEntry = {
    kind: 'rename' | 'pending' | 'skip' | 'cleanup' | 'review-issue' | 'undo' | 'piece-error'
    pieceName: string
    status: string
    fileId?: number
    stringId?: number
    textBefore?: IdentifierAndText
    textAfter?: IdentifierAndText
    updateOption?: SourceStringsModel.UpdateOption
    editKind?: EditKind
    keptLanguages?: string[]
    language?: string
    reviewIssueId?: number
    reviewIssueReference?: string
    translationIdsToReapproveOnUndo?: number[]
    needsReview?: boolean
    message?: string
}

export type IdentifierAndText = {
    identifier: string
    text: string
}

export type AppendJournalEntry = (entry: JournalEntry) => void
