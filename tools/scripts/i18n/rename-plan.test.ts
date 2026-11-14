import { describe, expect, it } from 'bun:test'
import { renamePlan } from './rename-plan'

const change = ({ oldEnglish, newEnglish, paths = ['actions.a.displayName'] }: { oldEnglish: string, newEnglish: string, paths?: string[] }) => ({
    oldEnglish,
    newEnglish,
    paths,
    changeClass: renamePlan.classifyChange({ oldEnglish, newEnglish }),
    blocker: null,
})

describe('classifyChange', () => {
    it('sees a change of letter case only', () => {
        expect(renamePlan.classifyChange({ oldEnglish: 'Upload file', newEnglish: 'Upload File' })).toBe('case-only')
    })

    it('sees a change of punctuation and spacing only', () => {
        expect(renamePlan.classifyChange({ oldEnglish: 'Upload a file', newEnglish: 'Upload a file. ' })).toBe('punct-whitespace-only')
    })

    it('treats punctuation that changes a number as a rewording', () => {
        expect(renamePlan.classifyChange({ oldEnglish: 'Up to 1.5 MB', newEnglish: 'Up to 15 MB' })).toBe('reworded')
    })

    it('treats a dash of another kind as punctuation', () => {
        expect(renamePlan.classifyChange({ oldEnglish: 'Score (0–100)', newEnglish: 'Score (0-100)' })).toBe('punct-whitespace-only')
    })

    it('treats punctuation that carries meaning as a rewording', () => {
        expect(renamePlan.classifyChange({ oldEnglish: 'Offset -1', newEnglish: 'Offset 1' })).toBe('reworded')
        expect(renamePlan.classifyChange({ oldEnglish: 'Use {name}', newEnglish: 'Use name' })).toBe('reworded')
        expect(renamePlan.classifyChange({ oldEnglish: 'Format: YYYY-MM-DD', newEnglish: 'Format: YYYYMMDD' })).toBe('reworded')
    })

    it('treats a case change inside a word, a code value or a format as a rewording', () => {
        expect(renamePlan.classifyChange({ oldEnglish: 'Format: YYYY-MM-DD', newEnglish: 'Format: yyyy-mm-dd' })).toBe('reworded')
        expect(renamePlan.classifyChange({ oldEnglish: 'Use {Name}', newEnglish: 'Use {name}' })).toBe('reworded')
        expect(renamePlan.classifyChange({ oldEnglish: 'Open https://example.com/Settings', newEnglish: 'Open https://example.com/settings' })).toBe('reworded')
        expect(renamePlan.classifyChange({ oldEnglish: 'Month as MM', newEnglish: 'Month as mm' })).toBe('reworded')
        expect(renamePlan.classifyChange({ oldEnglish: 'Github', newEnglish: 'GitHub' })).toBe('reworded')
    })

    it('treats words that join or split as a rewording', () => {
        expect(renamePlan.classifyChange({ oldEnglish: 'ageRanges', newEnglish: 'Age Ranges' })).toBe('reworded')
        expect(renamePlan.classifyChange({ oldEnglish: 'Path user.name', newEnglish: 'Path username' })).toBe('reworded')
    })

    it('treats punctuation inside a word as a rewording', () => {
        expect(renamePlan.classifyChange({ oldEnglish: 'Status != active', newEnglish: 'Status = active' })).toBe('reworded')
        expect(renamePlan.classifyChange({ oldEnglish: 'Format key:value', newEnglish: 'Format key value' })).toBe('reworded')
    })

    it('keeps capitalised hyphenated words, quotes and brackets around words as trivial', () => {
        expect(renamePlan.classifyChange({ oldEnglish: 'Send e-mail', newEnglish: 'Send E-Mail' })).toBe('case-only')
        expect(renamePlan.classifyChange({ oldEnglish: 'Response is Binary ?', newEnglish: 'Response is Binary' })).toBe('punct-whitespace-only')
        expect(renamePlan.classifyChange({ oldEnglish: 'Set to “true” (optional)', newEnglish: 'Set to "true" (Optional).' })).toBe('punct-whitespace-only')
    })

    it('sees a rewording', () => {
        expect(renamePlan.classifyChange({ oldEnglish: 'Upload a file', newEnglish: 'Send a file to Dropbox' })).toBe('reworded')
    })
})

describe('changedStrings', () => {
    it('reports one change for the same edit at many paths', () => {
        const changes = renamePlan.changedStrings({
            oldEnglishByPath: { 'actions.a.displayName': 'Folder', 'actions.b.displayName': 'Folder', 'actions.c.displayName': 'Same' },
            newEnglishByPath: { 'actions.a.displayName': 'Folder Path', 'actions.b.displayName': 'Folder Path', 'actions.c.displayName': 'Same' },
        })

        expect(changes).toEqual([{
            oldEnglish: 'Folder',
            newEnglish: 'Folder Path',
            paths: ['actions.a.displayName', 'actions.b.displayName'],
            changeClass: 'reworded',
            blocker: null,
        }])
    })

    it('ignores added and removed paths', () => {
        const changes = renamePlan.changedStrings({
            oldEnglishByPath: { 'actions.gone.displayName': 'Gone' },
            newEnglishByPath: { 'actions.fresh.displayName': 'Fresh' },
        })

        expect(changes).toEqual([])
    })

    it('ignores a change past the Crowdin key length', () => {
        const prefix = 'x'.repeat(512)
        const changes = renamePlan.changedStrings({
            oldEnglishByPath: { description: `${prefix} old tail` },
            newEnglishByPath: { description: `${prefix} new tail` },
        })

        expect(changes).toEqual([])
    })

    it('blocks a rename when the old English is still used at another path', () => {
        const [first] = renamePlan.changedStrings({
            oldEnglishByPath: { 'actions.a.displayName': 'Name', 'actions.b.displayName': 'Name' },
            newEnglishByPath: { 'actions.a.displayName': 'Full Name', 'actions.b.displayName': 'Name' },
        })

        expect(first.blocker).toBe('old-still-used')
    })

    it('blocks a rename when the new English already existed', () => {
        const [first] = renamePlan.changedStrings({
            oldEnglishByPath: { 'actions.a.displayName': 'Name', 'actions.b.displayName': 'Title' },
            newEnglishByPath: { 'actions.a.displayName': 'Title', 'actions.b.displayName': 'Title' },
        })

        expect(first.blocker).toBe('new-already-existed')
    })

    it('blocks a rename when one old English becomes two new strings', () => {
        const changes = renamePlan.changedStrings({
            oldEnglishByPath: { 'actions.a.displayName': 'Name', 'actions.b.displayName': 'Name' },
            newEnglishByPath: { 'actions.a.displayName': 'First Name', 'actions.b.displayName': 'Last Name' },
        })

        expect(changes.map(({ blocker }) => blocker)).toEqual(['old-splits', 'old-splits'])
    })

    it('blocks a rename when two old strings become one new English', () => {
        const changes = renamePlan.changedStrings({
            oldEnglishByPath: { 'actions.a.displayName': 'First', 'actions.b.displayName': 'Second' },
            newEnglishByPath: { 'actions.a.displayName': 'Both', 'actions.b.displayName': 'Both' },
        })

        expect(changes.map(({ blocker }) => blocker)).toEqual(['new-merges', 'new-merges'])
    })
})

describe('match', () => {
    const crowdinStrings = [
        { id: 1, text: 'Folder', identifier: 'Folder' },
        { id: 2, text: 'Twice', identifier: 'Twice' },
        { id: 3, text: 'Twice', identifier: 'Twice' },
        { id: 4, text: 'Taken', identifier: 'Taken' },
    ]

    it('finds the Crowdin string that holds the old English', () => {
        const result = renamePlan.match({ changes: [change({ oldEnglish: 'Folder', newEnglish: 'Folder Path' })], crowdinStrings })

        expect(result.matched.map(({ stringId }) => stringId)).toEqual([1])
        expect(result.skipped).toEqual([])
    })

    it('skips what it cannot rename safely and says why', () => {
        const result = renamePlan.match({
            changes: [
                { ...change({ oldEnglish: 'Folder', newEnglish: 'Other' }), blocker: 'old-still-used' },
                change({ oldEnglish: 'Missing', newEnglish: 'Other' }),
                change({ oldEnglish: 'Twice', newEnglish: 'Other' }),
                change({ oldEnglish: 'Folder', newEnglish: 'Taken' }),
                change({ oldEnglish: 'Folder', newEnglish: 'y'.repeat(511) }),
            ],
            crowdinStrings,
        })

        expect(result.matched).toEqual([])
        expect(result.skipped.map(({ reason }) => reason)).toEqual(['old-still-used', 'not-in-crowdin', 'ambiguous', 'new-already-in-crowdin', 'long-key'])
    })
})

describe('decide', () => {
    const translations = {
        ja: [{ translationId: 10, stringId: 1, userName: 'human' }, { translationId: 11, stringId: 1, userName: 'robot' }],
        de: [{ translationId: 20, stringId: 1, userName: 'robot' }],
        fr: [],
    }
    const approvals = {
        ja: [{ translationId: 10, stringId: 1, userName: 'human' }],
        de: [{ translationId: 20, stringId: 1, userName: 'robot' }],
        fr: [],
    }
    const decide = ({ oldEnglish, newEnglish, approvalsByLanguage = approvals }: { oldEnglish: string, newEnglish: string, approvalsByLanguage?: typeof approvals }) => renamePlan.decide({
        change: change({ oldEnglish, newEnglish }),
        stringId: 1,
        translationsByLanguage: translations,
        approvalsByLanguage,
        autoApprovers: ['robot'],
    })

    it('keeps translations and approvals for a trivial change', () => {
        expect(decide({ oldEnglish: 'Upload file', newEnglish: 'Upload File' })).toMatchObject({
            stringId: 1,
            oldText: 'Upload file',
            newText: 'Upload File',
            identifier: 'Upload File',
            updateOption: 'keep_translations_and_approvals',
            keptLanguages: ['ja', 'de'],
            clearedLanguages: [],
            reapproveOnUndo: [],
            needsReview: false,
        })
    })

    it('keeps only human-approved languages for a rewording and flags them for review', () => {
        expect(decide({ oldEnglish: 'Upload a file', newEnglish: 'Send a file' })).toMatchObject({
            updateOption: 'keep_translations',
            keptLanguages: ['ja'],
            clearedLanguages: ['de'],
            reapproveOnUndo: [10],
            needsReview: true,
        })
    })

    it('clears everything for a rewording that no human approved', () => {
        const approvalsByLanguage = { ...approvals, ja: [{ translationId: 11, stringId: 1, userName: 'robot' }] }

        expect(decide({ oldEnglish: 'Upload a file', newEnglish: 'Send a file', approvalsByLanguage })).toMatchObject({
            updateOption: 'clear_translations_and_approvals',
            keptLanguages: [],
            clearedLanguages: [],
            needsReview: false,
        })
    })

    it('quotes an identifier that contains a dot', () => {
        expect(decide({ oldEnglish: 'Upload a file', newEnglish: 'Upload a file.' }).identifier).toBe('"Upload a file."')
    })
})

describe('machineTranslationIds', () => {
    it('picks machine translations that no human approved', () => {
        const translations = [
            { id: 10, userName: 'human' },
            { id: 11, userName: 'robot' },
            { id: 12, userName: 'robot' },
            { id: 13, userName: null },
        ]

        expect(renamePlan.machineTranslationIds({ translations, humanApprovedIds: [10, 12], autoApprovers: ['robot'] })).toEqual([11])
    })
})
