import { describe, expect, it } from 'bun:test'
import { fakeCrowdin, renameFixtures } from './fake-crowdin'
import { jobSummary } from './job-summary'
import { renameRun } from './rename-run'

const { dropboxPiece, rewordingReviewIssue, collectJournalEntries } = renameFixtures

describe('renameRun.renamePieces', () => {
    it('renames a reworded string, keeps the human language and removes machine translations', async () => {
        const { crowdin, writes, state } = fakeCrowdin.create()
        const { journalEntries, appendJournalEntry } = collectJournalEntries()

        const totals = await renameRun.renamePieces({ crowdin, pieces: [dropboxPiece()], appendJournalEntry })

        expect(writes).toEqual([
            'PATCH /strings/1?updateOption=keep_translations',
            'DELETE /translations?stringId=1&languageId=de',
            'DELETE /translations/11',
            'POST /comments ja issue translation_mistake',
        ])
        expect(state.strings[0]).toEqual({ id: 1, identifier: 'Send a file', text: 'Send a file' })
        expect(state.issues[0]).toMatchObject({ stringId: 1, targetLanguageId: 'ja' })
        expect(state.issues[0].text).toContain('Old English: Upload a file\nNew English: Send a file')
        expect(totals).toMatchObject({ renamed: 1, failed: 0, skipped: 0, crowdinWrites: 4 })
        expect(journalEntries.find(({ kind }) => kind === 'rename')).toMatchObject({
            pieceName: 'community/dropbox',
            status: 'renamed',
            stringId: 1,
            textBefore: { identifier: 'Upload a file', text: 'Upload a file' },
            textAfter: { identifier: 'Send a file', text: 'Send a file' },
            updateOption: 'keep_translations',
            translationIdsToReapproveOnUndo: [10],
            needsReview: true,
        })
    })

    it('opens no review issue when translations and approvals are kept', async () => {
        const { crowdin, writes } = fakeCrowdin.create()
        const { appendJournalEntry } = collectJournalEntries()

        await renameRun.renamePieces({ crowdin, pieces: [dropboxPiece({ newEnglish: 'Upload a File.' })], appendJournalEntry })

        expect(writes).toEqual(['PATCH /strings/1?updateOption=keep_translations_and_approvals'])
    })

    it('opens no review issue when no human approved the translation', async () => {
        const { crowdin, writes } = fakeCrowdin.create({ approvals: { ja: [], de: fakeCrowdin.DEFAULT_APPROVALS.de } })
        const { appendJournalEntry } = collectJournalEntries()

        await renameRun.renamePieces({ crowdin, pieces: [dropboxPiece()], appendJournalEntry })

        expect(writes).toEqual(['PATCH /strings/1?updateOption=clear_translations_and_approvals'])
    })

    it('keeps the rename and counts a failure when the review issue cannot be opened', async () => {
        const { crowdin, state } = fakeCrowdin.create({ failIssues: true })
        const { journalEntries, appendJournalEntry } = collectJournalEntries()

        const totals = await renameRun.renamePieces({ crowdin, pieces: [dropboxPiece()], appendJournalEntry })

        expect(state.strings[0].text).toBe('Send a file')
        expect(totals).toMatchObject({ renamed: 1, failed: 1 })
        expect(journalEntries.find(({ kind, status }) => kind === 'review-issue' && status !== 'opening')).toMatchObject({ status: 'error', language: 'ja' })
        expect(jobSummary.renameSummary({ journalEntries, totals })).toContain('review-issue error')
    })

    it('keeps a human translation that still waits for review when the English changes again', async () => {
        const { crowdin, writes } = fakeCrowdin.create({ approvals: { ja: [], de: fakeCrowdin.DEFAULT_APPROVALS.de }, issues: [rewordingReviewIssue({ id: 50, language: 'ja' })] })
        const { journalEntries, appendJournalEntry } = collectJournalEntries()

        const totals = await renameRun.renamePieces({ crowdin, pieces: [dropboxPiece()], appendJournalEntry })

        expect(writes).toEqual([
            'PATCH /strings/1?updateOption=keep_translations',
            'DELETE /translations?stringId=1&languageId=de',
        ])
        expect(totals).toMatchObject({ renamed: 1, failed: 0 })
        expect(journalEntries.find(({ kind }) => kind === 'rename')).toMatchObject({ keptLanguages: ['ja'], translationIdsToReapproveOnUndo: [], needsReview: true })
    })

    it('leaves every translation of a waiting language alone, because the one a human approved may be machine-written', async () => {
        const { crowdin, writes } = fakeCrowdin.create({ approvals: { ja: [], de: fakeCrowdin.DEFAULT_APPROVALS.de }, issues: [rewordingReviewIssue({ id: 50, language: 'ja' })] })
        const { appendJournalEntry } = collectJournalEntries()

        await renameRun.renamePieces({ crowdin, pieces: [dropboxPiece()], appendJournalEntry })

        expect(writes.filter((write) => write.startsWith('DELETE /translations/'))).toEqual([])
    })

    it('clears a language whose only open issue came from a translator', async () => {
        const translatorIssue = { ...rewordingReviewIssue({ id: 50, language: 'ja' }), text: 'This translation is wrong' }
        const { crowdin, writes } = fakeCrowdin.create({ approvals: { ja: [], de: fakeCrowdin.DEFAULT_APPROVALS.de }, issues: [translatorIssue] })
        const { appendJournalEntry } = collectJournalEntries()

        await renameRun.renamePieces({ crowdin, pieces: [dropboxPiece()], appendJournalEntry })

        expect(writes).toEqual(['PATCH /strings/1?updateOption=clear_translations_and_approvals'])
    })

    it('asks for a review in a language whose old translations could not be removed', async () => {
        const { crowdin, writes, state } = fakeCrowdin.create({ failDeleteFor: ['/translations?stringId=1&languageId=de'] })
        const { journalEntries, appendJournalEntry } = collectJournalEntries()

        const totals = await renameRun.renamePieces({ crowdin, pieces: [dropboxPiece()], appendJournalEntry })

        expect(writes).toEqual([
            'PATCH /strings/1?updateOption=keep_translations',
            'DELETE /translations/11',
            'POST /comments ja issue translation_mistake',
            'POST /comments de issue translation_mistake',
        ])
        expect(state.issues.map(({ targetLanguageId }) => targetLanguageId)).toEqual(['ja', 'de'])
        expect(totals).toMatchObject({ renamed: 1, failed: 1 })
        expect(journalEntries.filter(({ kind, status }) => kind === 'review-issue' && status === 'opened').map(({ language }) => language)).toEqual(['ja', 'de'])
    })

    it('reports apart a string of which Crowdin holds only the new English', async () => {
        const { crowdin, writes } = fakeCrowdin.create({ strings: [{ id: 1, identifier: 'Send a file', text: 'Send a file' }] })
        const { journalEntries, appendJournalEntry } = collectJournalEntries()

        const totals = await renameRun.renamePieces({ crowdin, pieces: [dropboxPiece()], appendJournalEntry })

        expect(writes).toEqual([])
        expect(totals).toMatchObject({ renamed: 0, skipped: 1, failed: 0 })
        expect(journalEntries[0]).toMatchObject({ kind: 'skip', status: 'only-new-in-crowdin' })
        const summary = jobSummary.renameSummary({ journalEntries, totals })
        expect(summary).toContain('### Crowdin holds only the new English')
        expect(summary).toContain('or a Crowdin sync replaced the string and its translations are gone')
        expect(summary).not.toContain('### Not renamed')
    })

    it('does not treat a language whose old translations could not be removed as waiting for a human review', async () => {
        const { crowdin, state } = fakeCrowdin.create({ failDeleteFor: ['/translations?stringId=1&languageId=de'] })
        const firstRun = collectJournalEntries()
        await renameRun.renamePieces({ crowdin, pieces: [dropboxPiece()], appendJournalEntry: firstRun.appendJournalEntry })
        const secondRun = collectJournalEntries()
        const rewordedAgain = [{ pieceName: 'community/dropbox', oldEnglishByJsonPath: { 'actions.upload.description': 'Send a file' }, newEnglishByJsonPath: { 'actions.upload.description': 'Share a file' } }]

        await renameRun.renamePieces({ crowdin, pieces: rewordedAgain, appendJournalEntry: secondRun.appendJournalEntry })

        expect(state.issues.find(({ targetLanguageId }) => targetLanguageId === 'de')?.text).toContain('could not be removed')
        expect(secondRun.journalEntries.find(({ kind }) => kind === 'rename')).toMatchObject({ keptLanguages: ['ja'] })
    })

    it('recognises its own review issue when Crowdin wraps the text', async () => {
        const wrappedIssue = { ...rewordingReviewIssue({ id: 50, language: 'ja' }), text: `<p>${rewordingReviewIssue({ id: 50, language: 'ja' }).text}</p>` }
        const { crowdin, writes } = fakeCrowdin.create({ approvals: { ja: [], de: fakeCrowdin.DEFAULT_APPROVALS.de }, issues: [wrappedIssue] })
        const { appendJournalEntry } = collectJournalEntries()

        await renameRun.renamePieces({ crowdin, pieces: [dropboxPiece()], appendJournalEntry })

        expect(writes[0]).toBe('PATCH /strings/1?updateOption=keep_translations')
    })

    it('writes nothing for a piece when the waiting reviews of one of its strings cannot be read', async () => {
        const strings = [{ id: 1, identifier: 'Upload a file', text: 'Upload a file' }, { id: 2, identifier: 'Folder', text: 'Folder' }]
        const { crowdin, writes } = fakeCrowdin.create({ strings, failIssueListFor: [2] })
        const { journalEntries, appendJournalEntry } = collectJournalEntries()
        const pieces = [{
            pieceName: 'community/dropbox',
            oldEnglishByJsonPath: { a: 'Upload a file', b: 'Folder' },
            newEnglishByJsonPath: { a: 'Send a file', b: 'Folder Path' },
        }]

        const totals = await renameRun.renamePieces({ crowdin, pieces, appendJournalEntry })

        expect(writes).toEqual([])
        expect(totals).toMatchObject({ renamed: 0, failed: 2, crowdinWrites: 0 })
        expect(journalEntries.map(({ kind }) => kind)).toEqual(['piece-error'])
    })

    it('skips a piece that Crowdin does not hold yet', async () => {
        const { crowdin, writes } = fakeCrowdin.create()
        const { journalEntries, appendJournalEntry } = collectJournalEntries()

        const totals = await renameRun.renamePieces({ crowdin, pieces: [{ ...dropboxPiece(), pieceName: 'community/brand-new' }], appendJournalEntry })

        expect(writes).toEqual([])
        expect(totals).toMatchObject({ skipped: 1, failed: 0 })
        expect(journalEntries[0]).toMatchObject({ kind: 'skip', status: 'file-not-in-crowdin' })
    })

    it('does not touch a string that already has the new text', async () => {
        const { crowdin, writes } = fakeCrowdin.create({ strings: [{ id: 1, identifier: 'Upload a file', text: 'Upload a file' }, { id: 2, identifier: 'old folder', text: 'old folder' }] })
        const { appendJournalEntry } = collectJournalEntries()
        const pieces = [{ pieceName: 'community/dropbox', oldEnglishByJsonPath: { a: 'old folder' }, newEnglishByJsonPath: { a: 'Old Folder' } }]
        await renameRun.renamePieces({ crowdin, pieces, appendJournalEntry })
        const alreadyRenamed = fakeCrowdin.create({ strings: [{ id: 2, identifier: 'Old Folder', text: 'Old Folder' }] })

        const totals = await renameRun.renamePieces({ crowdin: alreadyRenamed.crowdin, pieces, appendJournalEntry })

        expect(writes).toEqual(['PATCH /strings/2?updateOption=keep_translations_and_approvals'])
        expect(alreadyRenamed.writes).toEqual([])
        expect(totals).toMatchObject({ renamed: 0, skipped: 1 })
    })

    it('counts a rename that landed although Crowdin answered with an error', async () => {
        const { crowdin, state } = fakeCrowdin.create({ patchLandsButErrorsFor: [1] })
        const { journalEntries, appendJournalEntry } = collectJournalEntries()

        const totals = await renameRun.renamePieces({ crowdin, pieces: [dropboxPiece()], appendJournalEntry })

        expect(state.strings[0].text).toBe('Send a file')
        expect(totals).toMatchObject({ renamed: 1, failed: 0 })
        expect(journalEntries.find(({ kind }) => kind === 'rename')?.status).toBe('renamed')
    })

    it('keeps going after one string fails and counts the failure', async () => {
        const strings = [{ id: 1, identifier: 'Upload a file', text: 'Upload a file' }, { id: 2, identifier: 'Folder', text: 'Folder' }]
        const { crowdin, writes } = fakeCrowdin.create({ strings, failPatchFor: [1] })
        const { journalEntries, appendJournalEntry } = collectJournalEntries()
        const pieces = [{
            pieceName: 'community/dropbox',
            oldEnglishByJsonPath: { a: 'Upload a file', b: 'Folder' },
            newEnglishByJsonPath: { a: 'Send a file', b: 'Folder Path' },
        }]

        const totals = await renameRun.renamePieces({ crowdin, pieces, appendJournalEntry })

        expect(writes).toEqual(['PATCH /strings/2?updateOption=clear_translations_and_approvals'])
        expect(totals).toMatchObject({ renamed: 1, failed: 1 })
        expect(journalEntries.filter(({ kind }) => kind === 'rename').map(({ status }) => status)).toEqual(['error', 'renamed'])
        expect(journalEntries.filter(({ stringId }) => stringId === 1).map(({ kind, status }) => `${kind} ${status}`)).toEqual(['pending patching', 'rename error'])
    })
})
