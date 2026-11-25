import { randomUUID } from 'crypto'
import { SourceFilesModel } from '@crowdin/crowdin-api-client'
import { CrowdinProjectApi, crowdinProjectApi } from './crowdin-project-api'
import { AppendJournalEntry, IdentifierAndText, JournalEntry } from './rename-journal'
import { EnglishEdit, PlannedRename, renamePlan } from './rename-plan'
import { ReviewIssueReason, reviewIssues } from './review-issues'
import { PieceTranslatableText } from './translatable-text-by-json-path'

async function renamePieces({ crowdin, pieces, appendJournalEntry }: RenamePiecesParams): Promise<RenameTotals> {
    const project = await crowdin.projectsGroupsApi.getProject(crowdin.projectId)
    const crowdinFiles = crowdinProjectApi.resourcesOf({ responseList: await crowdin.sourceFilesApi.withFetchAll().listProjectFiles(crowdin.projectId) })
    let totals = NO_RENAMES
    for (const piece of pieces) {
        const pieceTotals = await renamePiece({ crowdin, piece, crowdinFiles, targetLanguages: project.data.targetLanguageIds, appendJournalEntry })
        totals = sumOfTotals({ total: totals, added: pieceTotals })
    }
    return totals
}

async function renamePiece({ crowdin, piece, crowdinFiles, targetLanguages, appendJournalEntry }: RenamePieceParams): Promise<RenameTotals> {
    const { pieceName } = piece
    const edits = renamePlan.englishEditsOf({ oldEnglishByJsonPath: piece.oldEnglishByJsonPath, newEnglishByJsonPath: piece.newEnglishByJsonPath })
    if (edits.length === 0) {
        return NO_RENAMES
    }
    const pieceFiles = crowdinFiles.filter(({ path }) => path.endsWith(`/packages/pieces/${pieceName}/src/i18n/translation.json`))
    if (pieceFiles.length !== 1) {
        edits.forEach((edit) => appendJournalEntry(skipEntryOf({ pieceName, edit, reason: pieceFiles.length === 0 ? 'file-not-in-crowdin' : 'file-ambiguous' })))
        return { ...NO_RENAMES, skipped: edits.length }
    }
    const fileId = pieceFiles[0].id
    try {
        const crowdinStrings = crowdinProjectApi.resourcesOf({ responseList: await crowdin.sourceStringsApi.withFetchAll().listProjectStrings(crowdin.projectId, { fileId }) })
        const { matched, skipped } = renamePlan.matchCrowdinStrings({ edits, crowdinStrings })
        skipped.forEach(({ edit, reason }) => appendJournalEntry(skipEntryOf({ pieceName, edit, reason })))
        if (matched.length === 0) {
            return { ...NO_RENAMES, skipped: skipped.length }
        }
        const translationsByLanguage = await listPerLanguage({
            targetLanguages,
            listForLanguage: async (language) => crowdinProjectApi.resourcesOf({ responseList: await crowdin.stringTranslationsApi.withFetchAll().listLanguageTranslations(crowdin.projectId, language, { fileId }) }),
        })
        const approvalsByLanguage = await listPerLanguage({
            targetLanguages,
            listForLanguage: async (language) => crowdinProjectApi.resourcesOf({ responseList: await crowdin.stringTranslationsApi.withFetchAll().listTranslationApprovals(crowdin.projectId, { fileId, languageId: language }) }),
        })
        const languagesWaitingForReview = await reviewIssues.languagesWaitingForReviewByString({
            crowdin,
            rewordedStringIds: matched.filter(({ edit }) => edit.editKind === 'reworded').map(({ stringId }) => stringId),
        })
        let totals: RenameTotals = { ...NO_RENAMES, skipped: skipped.length }
        for (const { edit, stringId } of matched) {
            const plannedRename = renamePlan.planRename({
                edit,
                stringId,
                translationsByLanguage,
                approvalsByLanguage,
                languagesWaitingForReview: languagesWaitingForReview.get(stringId) ?? [],
            })
            const stringTotals = await renameString({ crowdin, pieceName, fileId, plannedRename, appendJournalEntry })
            totals = sumOfTotals({ total: totals, added: stringTotals })
        }
        return totals
    }
    catch (error) {
        appendJournalEntry({ kind: 'piece-error', pieceName, status: 'error', fileId, message: crowdinProjectApi.shortErrorMessageOf({ error }) })
        return { ...NO_RENAMES, failed: edits.length }
    }
}

async function renameString({ crowdin, pieceName, fileId, plannedRename, appendJournalEntry }: RenameStringParams): Promise<RenameTotals> {
    const { stringId } = plannedRename
    const textAfter = { identifier: plannedRename.newIdentifier, text: plannedRename.newEnglish }
    const renameEntry: Omit<JournalEntry, 'status'> = {
        kind: 'rename',
        pieceName,
        fileId,
        stringId,
        textAfter,
        updateOption: plannedRename.updateOption,
        editKind: plannedRename.editKind,
        keptLanguages: plannedRename.keptLanguages,
        translationIdsToReapproveOnUndo: plannedRename.translationIdsToReapproveOnUndo,
        needsReview: plannedRename.needsReview,
    }
    const oldEnglishCheck = await checkOldEnglishStillInCrowdin({ crowdin, plannedRename })
    if (!oldEnglishCheck.ok) {
        appendJournalEntry({ ...renameEntry, status: oldEnglishCheck.status, textBefore: oldEnglishCheck.textBefore, message: oldEnglishCheck.message })
        return { ...NO_RENAMES, failed: 1 }
    }
    const { textBefore } = oldEnglishCheck
    appendJournalEntry({ ...renameEntry, kind: 'pending', status: 'patching', textBefore })
    const renameFailure = await sendRename({ crowdin, plannedRename })
    if (renameFailure !== null) {
        appendJournalEntry({ ...renameEntry, status: 'error', textBefore, message: renameFailure })
        return { ...NO_RENAMES, failed: 1 }
    }
    appendJournalEntry({ ...renameEntry, status: 'renamed', textBefore })
    const outdatedTranslations = await listOutdatedTranslations({ crowdin, plannedRename })
    outdatedTranslations.listingFailures.forEach((message) => appendJournalEntry({ kind: 'cleanup', pieceName, fileId, stringId, status: 'error', message }))
    let totals: RenameTotals = { ...NO_RENAMES, renamed: 1, crowdinWrites: 1, failed: outdatedTranslations.listingFailures.length }
    const languagesWithUndeletedTranslations: string[] = []
    for (const { language, resource, sendDelete } of outdatedTranslations.deletions) {
        const deletion = await crowdinProjectApi.deleteUnlessAlreadyGone({ sendDelete })
        appendJournalEntry({ kind: 'cleanup', pieceName, fileId, stringId, language, status: deletion.ok ? 'deleted' : 'error', message: deletion.ok ? resource : `${resource}: ${deletion.message}` })
        totals = sumOfTotals({ total: totals, added: deletion.ok ? { ...NO_RENAMES, crowdinWrites: 1 } : { ...NO_RENAMES, failed: 1 } })
        if (!deletion.ok && plannedRename.clearedLanguages.includes(language)) {
            languagesWithUndeletedTranslations.push(language)
        }
    }
    const reviewIssuesToOpen = [
        ...plannedRename.humanApprovedLanguages.map((language): ReviewIssueToOpen => ({ language, reason: 'rewording' })),
        ...languagesWithUndeletedTranslations.map((language): ReviewIssueToOpen => ({ language, reason: 'undeleted-translation' })),
    ]
    for (const { language, reason } of reviewIssuesToOpen) {
        const reference = randomUUID()
        const reviewIssueEntry: Omit<JournalEntry, 'status'> = { kind: 'review-issue', pieceName, fileId, stringId, language, textBefore, textAfter, reviewIssueReference: reference }
        appendJournalEntry({ ...reviewIssueEntry, status: 'opening' })
        const opened = await reviewIssues.open({ crowdin, stringId, language, reason, oldEnglish: plannedRename.oldEnglish, newEnglish: plannedRename.newEnglish, reference })
        appendJournalEntry({
            ...reviewIssueEntry,
            status: opened.ok ? 'opened' : 'error',
            reviewIssueId: opened.ok ? opened.reviewIssueId : undefined,
            message: opened.ok ? undefined : opened.message,
        })
        totals = sumOfTotals({ total: totals, added: opened.ok ? { ...NO_RENAMES, crowdinWrites: 1 } : { ...NO_RENAMES, failed: 1 } })
    }
    return totals
}

async function checkOldEnglishStillInCrowdin({ crowdin, plannedRename }: { crowdin: CrowdinProjectApi, plannedRename: PlannedRename }): Promise<OldEnglishCheck> {
    const currentText = await crowdinProjectApi.readStringText({ crowdin, stringId: plannedRename.stringId })
    if (currentText === null) {
        return { ok: false, status: 'error', textBefore: { identifier: plannedRename.oldEnglish, text: plannedRename.oldEnglish }, message: 'could not read the string before renaming it' }
    }
    if (currentText.text !== plannedRename.oldEnglish) {
        return { ok: false, status: 'precondition-failed', textBefore: currentText, message: 'Crowdin no longer holds the old English' }
    }
    return { ok: true, textBefore: currentText }
}

async function sendRename({ crowdin, plannedRename }: { crowdin: CrowdinProjectApi, plannedRename: PlannedRename }): Promise<string | null> {
    try {
        await crowdin.sourceStringsApi.editString(crowdin.projectId, plannedRename.stringId, [
            { op: 'replace', path: '/identifier', value: plannedRename.newIdentifier },
            { op: 'replace', path: '/text', value: plannedRename.newEnglish },
        ], { updateOption: plannedRename.updateOption })
        return null
    }
    catch (error) {
        const textAfterError = await crowdinProjectApi.readStringText({ crowdin, stringId: plannedRename.stringId })
        return textAfterError !== null && textAfterError.text === plannedRename.newEnglish ? null : crowdinProjectApi.shortErrorMessageOf({ error })
    }
}

async function listOutdatedTranslations({ crowdin, plannedRename }: { crowdin: CrowdinProjectApi, plannedRename: PlannedRename }): Promise<OutdatedTranslations> {
    const { stringId } = plannedRename
    const clearedLanguageDeletions = plannedRename.clearedLanguages.map((language) => ({
        language,
        resource: `/translations?stringId=${stringId}&languageId=${language}`,
        sendDelete: () => crowdin.stringTranslationsApi.deleteAllTranslations(crowdin.projectId, { stringId, languageId: language }),
    }))
    if (plannedRename.updateOption !== 'keep_translations') {
        return { deletions: clearedLanguageDeletions, listingFailures: [] }
    }
    const automaticTranslationDeletions: TranslationDeletion[] = []
    const listingFailures: string[] = []
    for (const language of plannedRename.humanApprovedLanguages) {
        try {
            const translations = crowdinProjectApi.resourcesOf({ responseList: await crowdin.stringTranslationsApi.withFetchAll().listStringTranslations(crowdin.projectId, stringId, language) })
            const translationIds = renamePlan.automaticTranslationIdsWithoutHumanApproval({
                translations,
                humanApprovedTranslationIds: plannedRename.translationIdsToReapproveOnUndo,
            })
            automaticTranslationDeletions.push(...translationIds.map((translationId) => ({
                language,
                resource: `/translations/${translationId}`,
                sendDelete: () => crowdin.stringTranslationsApi.deleteTranslation(crowdin.projectId, translationId),
            })))
        }
        catch (error) {
            listingFailures.push(`could not list ${language} translations of string ${stringId}: ${crowdinProjectApi.shortErrorMessageOf({ error })}`)
        }
    }
    return { deletions: [...clearedLanguageDeletions, ...automaticTranslationDeletions], listingFailures }
}

async function listPerLanguage<T>({ targetLanguages, listForLanguage }: ListPerLanguageParams<T>): Promise<Record<string, T[]>> {
    const resourcesPerLanguage: [string, T[]][] = []
    for (const language of targetLanguages) {
        resourcesPerLanguage.push([language, await listForLanguage(language)])
    }
    return Object.fromEntries(resourcesPerLanguage)
}

function sumOfTotals({ total, added }: { total: RenameTotals, added: RenameTotals }): RenameTotals {
    return {
        renamed: total.renamed + added.renamed,
        skipped: total.skipped + added.skipped,
        failed: total.failed + added.failed,
        crowdinWrites: total.crowdinWrites + added.crowdinWrites,
    }
}

function skipEntryOf({ pieceName, edit, reason }: { pieceName: string, edit: EnglishEdit, reason: string }): JournalEntry {
    return {
        kind: 'skip',
        pieceName,
        status: reason,
        textBefore: { identifier: edit.oldEnglish, text: edit.oldEnglish },
        textAfter: { identifier: edit.newEnglish, text: edit.newEnglish },
    }
}

const NO_RENAMES: RenameTotals = { renamed: 0, skipped: 0, failed: 0, crowdinWrites: 0 }

export const renameRun = { renamePieces }

export type RenameTotals = {
    renamed: number
    skipped: number
    failed: number
    crowdinWrites: number
}

type OldEnglishCheck = { ok: true, textBefore: IdentifierAndText } | { ok: false, status: 'error' | 'precondition-failed', textBefore: IdentifierAndText, message: string }

type ReviewIssueToOpen = {
    language: string
    reason: ReviewIssueReason
}

type TranslationDeletion = {
    language: string
    resource: string
    sendDelete: () => Promise<unknown>
}

type OutdatedTranslations = {
    deletions: TranslationDeletion[]
    listingFailures: string[]
}

type RenamePiecesParams = {
    crowdin: CrowdinProjectApi
    pieces: PieceTranslatableText[]
    appendJournalEntry: AppendJournalEntry
}

type RenamePieceParams = Omit<RenamePiecesParams, 'pieces'> & {
    piece: PieceTranslatableText
    crowdinFiles: SourceFilesModel.File[]
    targetLanguages: string[]
}

type RenameStringParams = {
    crowdin: CrowdinProjectApi
    pieceName: string
    fileId: number
    plannedRename: PlannedRename
    appendJournalEntry: AppendJournalEntry
}

type ListPerLanguageParams<T> = {
    targetLanguages: string[]
    listForLanguage: (language: string) => Promise<T[]>
}
