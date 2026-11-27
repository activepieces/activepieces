import { describe, expect, it } from 'bun:test'
import { fakeCrowdin, renameFixtures } from './fake-crowdin'
import { JournalEntry } from './rename-journal'
import { renameRun } from './rename-run'
import { renameUndo } from './rename-undo'

const { dropboxPiece, collectJournalEntries } = renameFixtures

const EARLIER_MERGED_REVIEW_ISSUE = {
    id: 50,
    stringId: 1,
    targetLanguageId: 'ja',
    type: 'issue',
    issueType: 'translation_mistake',
    text: 'The English text of this string changed (automatic note from the Activepieces translations job).\n\nOld English: Upload the file\nNew English: Upload a file',
}

describe('renameUndo.undoRenames', () => {
    it('renames back in reverse order and approves the human translations again', async () => {
        const { crowdin, writes, state } = fakeCrowdin.create()
        const { journalEntries, appendJournalEntry } = collectJournalEntries()
        await renameRun.renamePieces({ crowdin, pieces: [dropboxPiece()], appendJournalEntry })
        writes.length = 0

        const totals = await renameUndo.undoRenames({ crowdin, journalEntries, appendJournalEntry })

        expect(writes).toEqual([
            'PATCH /strings/1?updateOption=keep_translations_and_approvals',
            'POST /approvals {"translationId":10}',
            'DELETE /comments/100',
        ])
        expect(state.strings[0]).toEqual({ id: 1, identifier: 'Upload a file', text: 'Upload a file' })
        expect(state.issues).toEqual([])
        expect(totals).toEqual({ undone: 1, failed: 0 })
    })

    it('reports an approval it could not restore', async () => {
        const renamedIn = fakeCrowdin.create()
        const { journalEntries, appendJournalEntry } = collectJournalEntries()
        await renameRun.renamePieces({ crowdin: renamedIn.crowdin, pieces: [dropboxPiece()], appendJournalEntry })
        const refusingApprovals = fakeCrowdin.create({ strings: renamedIn.state.strings, approvals: renamedIn.state.approvals, failApprovals: true })

        const totals = await renameUndo.undoRenames({ crowdin: refusingApprovals.crowdin, journalEntries, appendJournalEntry })

        expect(refusingApprovals.state.strings[0].text).toBe('Upload a file')
        expect(totals).toEqual({ undone: 1, failed: 1 })
        expect(journalEntries.find(({ kind }) => kind === 'undo')?.message).toContain('10')
    })

    it('renames back a string whose rename landed although the run recorded an error', async () => {
        const { crowdin, writes, state } = fakeCrowdin.create({ strings: [{ id: 1, identifier: 'Send a file', text: 'Send a file' }] })
        const { appendJournalEntry } = collectJournalEntries()
        const textBefore = { identifier: 'Upload a file', text: 'Upload a file' }
        const textAfter = { identifier: 'Send a file', text: 'Send a file' }
        const journalEntries: JournalEntry[] = [
            { kind: 'pending', pieceName: 'community/dropbox', status: 'patching', stringId: 1, textBefore, textAfter, translationIdsToReapproveOnUndo: [] },
            { kind: 'rename', pieceName: 'community/dropbox', status: 'error', stringId: 1, textBefore, textAfter, message: 'Bad Gateway' },
        ]

        const totals = await renameUndo.undoRenames({ crowdin, journalEntries, appendJournalEntry })

        expect(writes).toEqual(['PATCH /strings/1?updateOption=keep_translations_and_approvals'])
        expect(state.strings[0].text).toBe('Upload a file')
        expect(totals).toEqual({ undone: 1, failed: 0 })
    })

    it('leaves a string alone when its unfinished rename never landed', async () => {
        const { crowdin, writes } = fakeCrowdin.create()
        const { appendJournalEntry } = collectJournalEntries()
        const journalEntries: JournalEntry[] = [{
            kind: 'pending',
            pieceName: 'community/dropbox',
            status: 'patching',
            stringId: 1,
            textBefore: { identifier: 'Upload a file', text: 'Upload a file' },
            textAfter: { identifier: 'Send a file', text: 'Send a file' },
            translationIdsToReapproveOnUndo: [10],
        }]

        const totals = await renameUndo.undoRenames({ crowdin, journalEntries, appendJournalEntry })

        expect(writes).toEqual([])
        expect(totals).toEqual({ undone: 0, failed: 0 })
    })

    it('restores a missing approval on a second undo when the English is already back', async () => {
        const renamedIn = fakeCrowdin.create()
        const { journalEntries, appendJournalEntry } = collectJournalEntries()
        await renameRun.renamePieces({ crowdin: renamedIn.crowdin, pieces: [dropboxPiece()], appendJournalEntry })
        const refusingApprovals = fakeCrowdin.create({ strings: renamedIn.state.strings, approvals: renamedIn.state.approvals, failApprovals: true })
        await renameUndo.undoRenames({ crowdin: refusingApprovals.crowdin, journalEntries, appendJournalEntry })
        const acceptingApprovals = fakeCrowdin.create({ strings: refusingApprovals.state.strings, approvals: refusingApprovals.state.approvals })

        const totals = await renameUndo.undoRenames({ crowdin: acceptingApprovals.crowdin, journalEntries, appendJournalEntry })

        expect(acceptingApprovals.writes).toEqual(['POST /approvals {"translationId":10}', 'DELETE /comments/100'])
        expect(totals).toEqual({ undone: 0, failed: 0 })
    })

    it('leaves an issue that a translator opened on the same string', async () => {
        const translatorIssue = { id: 7, stringId: 1, targetLanguageId: 'ja', type: 'issue', issueType: 'general_question', text: 'What does this mean?' }
        const { crowdin, writes, state } = fakeCrowdin.create({ issues: [translatorIssue] })
        const { journalEntries, appendJournalEntry } = collectJournalEntries()
        await renameRun.renamePieces({ crowdin, pieces: [dropboxPiece()], appendJournalEntry })
        writes.length = 0

        await renameUndo.undoRenames({ crowdin, journalEntries, appendJournalEntry })

        expect(writes.filter((write) => write.startsWith('DELETE'))).toEqual(['DELETE /comments/101'])
        expect(state.issues).toEqual([translatorIssue])
    })

    it('undoes two renames of the same string in reverse order', async () => {
        const { crowdin, state } = fakeCrowdin.create({ approvals: { ja: [], de: fakeCrowdin.DEFAULT_APPROVALS.de } })
        const { journalEntries, appendJournalEntry } = collectJournalEntries()
        await renameRun.renamePieces({ crowdin, pieces: [dropboxPiece()], appendJournalEntry })
        const renamedAgain = { pieceName: 'community/dropbox', oldEnglishByJsonPath: { a: 'Send a file' }, newEnglishByJsonPath: { a: 'Send a file to Dropbox' } }
        await renameRun.renamePieces({ crowdin, pieces: [renamedAgain], appendJournalEntry })
        expect(state.strings[0].text).toBe('Send a file to Dropbox')

        const totals = await renameUndo.undoRenames({ crowdin, journalEntries, appendJournalEntry })

        expect(state.strings[0].text).toBe('Upload a file')
        expect(totals).toEqual({ undone: 2, failed: 0 })
    })

    it('leaves a review issue that an earlier, merged rename opened on the same string', async () => {
        const { crowdin, state } = fakeCrowdin.create({ issues: [EARLIER_MERGED_REVIEW_ISSUE] })
        const { journalEntries, appendJournalEntry } = collectJournalEntries()
        await renameRun.renamePieces({ crowdin, pieces: [dropboxPiece()], appendJournalEntry })

        await renameUndo.undoRenames({ crowdin, journalEntries, appendJournalEntry })

        expect(state.issues).toEqual([EARLIER_MERGED_REVIEW_ISSUE])
    })

    it('deletes the review issue it opened when Crowdin lost the response', async () => {
        const { crowdin, state } = fakeCrowdin.create({ issueResponseLost: true })
        const { journalEntries, appendJournalEntry } = collectJournalEntries()
        await renameRun.renamePieces({ crowdin, pieces: [dropboxPiece()], appendJournalEntry })
        expect(state.issues).toHaveLength(1)

        const totals = await renameUndo.undoRenames({ crowdin, journalEntries, appendJournalEntry })

        expect(state.issues).toEqual([])
        expect(totals).toEqual({ undone: 1, failed: 0 })
    })

    it('deletes the review issue it opened when the job stopped before recording its id', async () => {
        const { crowdin, state } = fakeCrowdin.create({ issues: [EARLIER_MERGED_REVIEW_ISSUE] })
        const { journalEntries, appendJournalEntry } = collectJournalEntries()
        await renameRun.renamePieces({ crowdin, pieces: [dropboxPiece()], appendJournalEntry })
        const journalCutBeforeIssueId = journalEntries.filter((entry) => !(entry.kind === 'review-issue' && entry.status === 'opened'))

        const totals = await renameUndo.undoRenames({ crowdin, journalEntries: journalCutBeforeIssueId, appendJournalEntry })

        expect(state.issues).toEqual([EARLIER_MERGED_REVIEW_ISSUE])
        expect(totals).toEqual({ undone: 1, failed: 0 })
    })

    it('has nothing to undo when nothing was renamed', async () => {
        const { crowdin, writes } = fakeCrowdin.create()
        const { appendJournalEntry } = collectJournalEntries()

        const totals = await renameUndo.undoRenames({ crowdin, journalEntries: [], appendJournalEntry })

        expect(writes).toEqual([])
        expect(totals).toEqual({ undone: 0, failed: 0 })
    })
})
