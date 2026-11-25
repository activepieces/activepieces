import { CrowdinProjectApi, crowdinProjectApi } from './crowdin-project-api'
import { AppendJournalEntry, JournalEntry, renameJournal } from './rename-journal'
import { ReviewIssuesOfRename, reviewIssues } from './review-issues'

async function undoRenames({ crowdin, journalEntries, appendJournalEntry }: UndoRenamesParams): Promise<UndoTotals> {
    const attemptedRenames = journalEntries.filter((entry) => entry.kind === 'pending' || (entry.kind === 'rename' && entry.status === 'renamed'))
    const latestEntryByRename = new Map(attemptedRenames.map((entry) => [renameJournal.renameIdentityOf({ entry }), entry]))
    let totals: UndoTotals = { undone: 0, failed: 0 }
    for (const renameEntry of [...latestEntryByRename.values()].reverse()) {
        const renameTotals = await undoRename({
            crowdin,
            renameEntry,
            reviewIssuesOfRename: reviewIssues.openedForRename({ journalEntries, renameEntry }),
            appendJournalEntry,
        })
        totals = { undone: totals.undone + renameTotals.undone, failed: totals.failed + renameTotals.failed }
    }
    return totals
}

async function undoRename({ crowdin, renameEntry, reviewIssuesOfRename, appendJournalEntry }: UndoRenameParams): Promise<UndoTotals> {
    const { stringId, textBefore, textAfter } = renameEntry
    if (stringId === undefined || textBefore === undefined || textAfter === undefined) {
        return { undone: 0, failed: 1 }
    }
    const undoEntry: Omit<JournalEntry, 'status'> = { kind: 'undo', pieceName: renameEntry.pieceName, fileId: renameEntry.fileId, stringId, textBefore: textAfter, textAfter: textBefore }
    const currentText = await crowdinProjectApi.readStringText({ crowdin, stringId })
    if (currentText === null) {
        appendJournalEntry({ ...undoEntry, status: 'error', message: 'could not read the string' })
        return { undone: 0, failed: 1 }
    }
    if (currentText.text === textBefore.text && currentText.identifier === textBefore.identifier) {
        const cleanupFailure = await restoreApprovalsAndDeleteReviewIssues({ crowdin, renameEntry, reviewIssuesOfRename })
        appendJournalEntry({ ...undoEntry, status: 'already-undone', message: cleanupFailure ?? undefined })
        return { undone: 0, failed: cleanupFailure === null ? 0 : 1 }
    }
    if (currentText.text !== textAfter.text) {
        appendJournalEntry({ ...undoEntry, status: 'precondition-failed', message: 'Crowdin no longer holds the renamed English' })
        return { undone: 0, failed: 1 }
    }
    try {
        await crowdin.sourceStringsApi.editString(crowdin.projectId, stringId, [
            { op: 'replace', path: '/identifier', value: textBefore.identifier },
            { op: 'replace', path: '/text', value: textBefore.text },
        ], { updateOption: 'keep_translations_and_approvals' })
    }
    catch (error) {
        appendJournalEntry({ ...undoEntry, status: 'error', message: crowdinProjectApi.shortErrorMessageOf({ error }) })
        return { undone: 0, failed: 1 }
    }
    const cleanupFailure = await restoreApprovalsAndDeleteReviewIssues({ crowdin, renameEntry, reviewIssuesOfRename })
    appendJournalEntry({ ...undoEntry, status: 'undone', message: cleanupFailure ?? undefined })
    return { undone: 1, failed: cleanupFailure === null ? 0 : 1 }
}

async function restoreApprovalsAndDeleteReviewIssues({ crowdin, renameEntry, reviewIssuesOfRename }: Omit<UndoRenameParams, 'appendJournalEntry'>): Promise<string | null> {
    const unrestoredTranslationIds = await restoreHumanApprovals({ crowdin, translationIds: renameEntry.translationIdsToReapproveOnUndo ?? [] })
    const reviewIssueFailure = renameEntry.stringId === undefined ? null : await reviewIssues.deleteOpenedForRename({ crowdin, stringId: renameEntry.stringId, reviewIssuesOfRename })
    const failureMessages = [
        ...(unrestoredTranslationIds.length === 0 ? [] : [`approvals not restored for translations ${unrestoredTranslationIds.join(', ')}`]),
        ...(reviewIssueFailure === null ? [] : [reviewIssueFailure]),
    ]
    return failureMessages.length === 0 ? null : failureMessages.join('; ')
}

async function restoreHumanApprovals({ crowdin, translationIds }: { crowdin: CrowdinProjectApi, translationIds: number[] }): Promise<number[]> {
    const unrestoredTranslationIds: number[] = []
    for (const translationId of translationIds) {
        try {
            const approvals = await crowdin.stringTranslationsApi.withFetchAll().listTranslationApprovals(crowdin.projectId, { translationId })
            if (approvals.data.length === 0) {
                await crowdin.stringTranslationsApi.addApproval(crowdin.projectId, { translationId })
            }
        }
        catch {
            unrestoredTranslationIds.push(translationId)
        }
    }
    return unrestoredTranslationIds
}

export const renameUndo = { undoRenames }

export type UndoTotals = {
    undone: number
    failed: number
}

type UndoRenamesParams = {
    crowdin: CrowdinProjectApi
    journalEntries: JournalEntry[]
    appendJournalEntry: AppendJournalEntry
}

type UndoRenameParams = {
    crowdin: CrowdinProjectApi
    renameEntry: JournalEntry
    reviewIssuesOfRename: ReviewIssuesOfRename
    appendJournalEntry: AppendJournalEntry
}
