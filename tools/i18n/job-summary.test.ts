import { describe, expect, it } from 'bun:test'
import { fakeCrowdin, renameFixtures } from './fake-crowdin'
import { jobSummary } from './job-summary'
import { renameRun } from './rename-run'

const { dropboxPiece, collectJournalEntries } = renameFixtures

describe('jobSummary.renameSummary', () => {
    it('lists what was renamed, what needs review and what was skipped', async () => {
        const { crowdin } = fakeCrowdin.create()
        const { journalEntries, appendJournalEntry } = collectJournalEntries()
        const pieces = [dropboxPiece(), { ...dropboxPiece(), pieceName: 'community/brand-new' }]
        const totals = await renameRun.renamePieces({ crowdin, pieces, appendJournalEntry })

        const summary = jobSummary.renameSummary({ journalEntries, totals })

        expect(summary).toContain('1 renamed')
        expect(summary).toContain('| community/dropbox | Upload a file | Send a file | ja |')
        expect(summary).toContain('| community/brand-new | Upload a file | file-not-in-crowdin |')
    })
})

describe('jobSummary.undoSummary', () => {
    it('says how many renames went back and how many failed', () => {
        expect(jobSummary.undoSummary({ totals: { undone: 2, failed: 1 } })).toBe('## Crowdin rename undo\n\n2 renamed back, 1 failed.\n')
    })
})
