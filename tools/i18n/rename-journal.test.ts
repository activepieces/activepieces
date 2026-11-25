import { afterEach, describe, expect, it } from 'bun:test'
import { mkdtempSync, readFileSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { JournalEntry, renameJournal } from './rename-journal'

const temporaryDirectories: string[] = []

const journalFileInTemporaryDirectory = (): string => {
    const directory = mkdtempSync(join(tmpdir(), 'ap-rename-journal-'))
    temporaryDirectories.push(directory)
    return join(directory, 'crowdin-rename-journal.jsonl')
}

afterEach(() => {
    temporaryDirectories.splice(0).forEach((directory) => rmSync(directory, { recursive: true, force: true }))
})

describe('renameJournal', () => {
    it('reads back every entry it wrote, in order, one JSON object per line with a timestamp', () => {
        const journalFile = journalFileInTemporaryDirectory()
        const appendJournalEntry = renameJournal.appenderTo({ journalFile })
        const pendingEntry: JournalEntry = { kind: 'pending', pieceName: 'community/dropbox', status: 'patching', stringId: 1, textBefore: { identifier: 'Old', text: 'Old' }, textAfter: { identifier: 'New', text: 'New' } }
        const renameEntry: JournalEntry = { ...pendingEntry, kind: 'rename', status: 'renamed' }

        appendJournalEntry(pendingEntry)
        appendJournalEntry(renameEntry)

        expect(renameJournal.readEntries({ journalFile })).toEqual([expect.objectContaining(pendingEntry), expect.objectContaining(renameEntry)])
        expect(readFileSync(journalFile, 'utf8').split('\n').filter((jsonLine) => jsonLine.length > 0).map((jsonLine) => typeof JSON.parse(jsonLine).at)).toEqual(['string', 'string'])
    })

    it('reads no entries from a journal that was never written', () => {
        expect(renameJournal.readEntries({ journalFile: journalFileInTemporaryDirectory() })).toEqual([])
    })

    it('gives the pending and the finished entry of one rename the same identity', () => {
        const pendingEntry: JournalEntry = { kind: 'pending', pieceName: 'community/dropbox', status: 'patching', stringId: 1, textBefore: { identifier: 'Old', text: 'Old' }, textAfter: { identifier: 'New', text: 'New' } }
        const secondRename: JournalEntry = { ...pendingEntry, kind: 'rename', status: 'renamed', textBefore: { identifier: 'New', text: 'New' }, textAfter: { identifier: 'Newer', text: 'Newer' } }

        expect(renameJournal.renameIdentityOf({ entry: { ...pendingEntry, kind: 'rename', status: 'renamed' } })).toBe(renameJournal.renameIdentityOf({ entry: pendingEntry }))
        expect(renameJournal.renameIdentityOf({ entry: secondRename })).not.toBe(renameJournal.renameIdentityOf({ entry: pendingEntry }))
    })
})
