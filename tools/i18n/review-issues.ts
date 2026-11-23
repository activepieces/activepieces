import { StringCommentsModel } from '@crowdin/crowdin-api-client'
import { CrowdinProjectApi, crowdinProjectApi } from './crowdin-project-api'
import { JournalEntry, renameJournal } from './rename-journal'

async function open({ crowdin, stringId, language, reason, oldEnglish, newEnglish, reference }: OpenParams): Promise<OpenedReviewIssue> {
    try {
        const created = await crowdin.stringCommentsApi.addStringComment(crowdin.projectId, {
            stringId,
            targetLanguageId: language,
            type: 'issue',
            issueType: 'translation_mistake',
            text: reviewIssueText({ reason, oldEnglish, newEnglish, reference }),
        })
        return { ok: true, reviewIssueId: created.data.id }
    }
    catch (error) {
        return { ok: false, message: crowdinProjectApi.shortErrorMessageOf({ error }) }
    }
}

async function languagesWaitingForReviewByString({ crowdin, rewordedStringIds }: { crowdin: CrowdinProjectApi, rewordedStringIds: number[] }): Promise<Map<number, string[]>> {
    const languagesByString = new Map<number, string[]>()
    for (const stringId of rewordedStringIds) {
        const unresolvedIssues = await listUnresolvedIssues({ crowdin, stringId })
        const rewordingIssues = unresolvedIssues.filter(({ text }) => text.includes(REVIEW_ISSUE_WORDING.rewording.headline))
        languagesByString.set(stringId, [...new Set(rewordingIssues.map(({ languageId }) => languageId))])
    }
    return languagesByString
}

function openedForRename({ journalEntries, renameEntry }: { journalEntries: JournalEntry[], renameEntry: JournalEntry }): ReviewIssuesOfRename {
    const renameIdentity = renameJournal.renameIdentityOf({ entry: renameEntry })
    const reviewIssueEntries = journalEntries.filter((entry) => entry.kind === 'review-issue' && renameJournal.renameIdentityOf({ entry }) === renameIdentity)
    const recordedEntries = reviewIssueEntries.filter((entry) => entry.status === 'opened' && entry.reviewIssueId !== undefined)
    const recordedReferences = new Set(recordedEntries.map(({ reviewIssueReference }) => reviewIssueReference))
    return {
        reviewIssueIds: recordedEntries.flatMap(({ reviewIssueId }) => reviewIssueId === undefined ? [] : [reviewIssueId]),
        unrecordedReferences: [...new Set(reviewIssueEntries.flatMap(({ reviewIssueReference }) => reviewIssueReference === undefined || recordedReferences.has(reviewIssueReference) ? [] : [reviewIssueReference]))],
    }
}

async function deleteOpenedForRename({ crowdin, stringId, reviewIssuesOfRename }: DeleteOpenedForRenameParams): Promise<string | null> {
    const search = await findByReference({ crowdin, stringId, references: reviewIssuesOfRename.unrecordedReferences })
    if (!search.ok) {
        return `review issues not removed: ${search.message}`
    }
    const failureMessages: string[] = []
    for (const reviewIssueId of [...reviewIssuesOfRename.reviewIssueIds, ...search.reviewIssueIds]) {
        const deletion = await crowdinProjectApi.deleteUnlessAlreadyGone({ sendDelete: () => crowdin.stringCommentsApi.deleteStringComment(crowdin.projectId, reviewIssueId) })
        failureMessages.push(...(deletion.ok ? [] : [deletion.message]))
    }
    return failureMessages.length === 0 ? null : `review issues not removed: ${failureMessages.join('; ')}`
}

async function findByReference({ crowdin, stringId, references }: { crowdin: CrowdinProjectApi, stringId: number, references: string[] }): Promise<ReviewIssueSearch> {
    if (references.length === 0) {
        return { ok: true, reviewIssueIds: [] }
    }
    try {
        const unresolvedIssues = await listUnresolvedIssues({ crowdin, stringId })
        return { ok: true, reviewIssueIds: unresolvedIssues.filter(({ text }) => references.some((reference) => text.includes(reference))).map(({ id }) => id) }
    }
    catch (error) {
        return { ok: false, message: crowdinProjectApi.shortErrorMessageOf({ error }) }
    }
}

async function listUnresolvedIssues({ crowdin, stringId }: { crowdin: CrowdinProjectApi, stringId: number }): Promise<StringCommentsModel.StringComment[]> {
    const responseList = await crowdin.stringCommentsApi.withFetchAll().listStringComments(crowdin.projectId, { stringId, type: 'issue', issueStatus: 'unresolved' })
    return crowdinProjectApi.resourcesOf({ responseList })
}

function reviewIssueText({ reason, oldEnglish, newEnglish, reference }: Omit<OpenParams, 'crowdin' | 'stringId' | 'language'>): string {
    return [
        REVIEW_ISSUE_WORDING[reason].headline,
        '',
        `Old English: ${oldEnglish}`,
        `New English: ${newEnglish}`,
        '',
        REVIEW_ISSUE_WORDING[reason].request,
        '',
        `Reference: ${reference}`,
    ].join('\n')
}

const REVIEW_ISSUE_WORDING: Record<ReviewIssueReason, { headline: string, request: string }> = {
    'rewording': {
        headline: 'The English text of this string changed (automatic note from the Activepieces translations job).',
        request: 'This translation was written for the old English and is no longer approved. Please check it against the new English, correct it if needed, approve it, then resolve this issue.',
    },
    'undeleted-translation': {
        headline: 'The old translation of this string could not be removed (automatic note from the Activepieces translations job).',
        request: 'The English changed and this translation was written for the old English. Nobody approved it, and the job could not delete it. Please delete or correct it, then resolve this issue.',
    },
}

export const reviewIssues = { open, languagesWaitingForReviewByString, openedForRename, deleteOpenedForRename }

export type ReviewIssueReason = 'rewording' | 'undeleted-translation'

export type ReviewIssuesOfRename = {
    reviewIssueIds: number[]
    unrecordedReferences: string[]
}

type OpenedReviewIssue = { ok: true, reviewIssueId: number } | { ok: false, message: string }

type ReviewIssueSearch = { ok: true, reviewIssueIds: number[] } | { ok: false, message: string }

type OpenParams = {
    crowdin: CrowdinProjectApi
    stringId: number
    language: string
    reason: ReviewIssueReason
    oldEnglish: string
    newEnglish: string
    reference: string
}

type DeleteOpenedForRenameParams = {
    crowdin: CrowdinProjectApi
    stringId: number
    reviewIssuesOfRename: ReviewIssuesOfRename
}
