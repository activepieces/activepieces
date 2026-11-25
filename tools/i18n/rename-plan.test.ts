import { describe, expect, it } from 'bun:test'
import { EnglishEdit, renamePlan, TranslationApproval } from './rename-plan'

const englishEdit = ({ oldEnglish, newEnglish, jsonPaths = ['actions.a.displayName'] }: { oldEnglish: string, newEnglish: string, jsonPaths?: string[] }): EnglishEdit => ({
    oldEnglish,
    newEnglish,
    jsonPaths,
    editKind: renamePlan.classifyEdit({ oldEnglish, newEnglish }),
    blocker: null,
})

const crowdinUser = (username: string) => ({ username })

describe('renamePlan.classifyEdit', () => {
    it('sees a change of letter case only', () => {
        expect(renamePlan.classifyEdit({ oldEnglish: 'Upload file', newEnglish: 'Upload File' })).toBe('case-only')
    })

    it('sees a change of punctuation and spacing only', () => {
        expect(renamePlan.classifyEdit({ oldEnglish: 'Upload a file', newEnglish: 'Upload a file. ' })).toBe('punct-whitespace-only')
    })

    it('treats punctuation that changes a number as a rewording', () => {
        expect(renamePlan.classifyEdit({ oldEnglish: 'Up to 1.5 MB', newEnglish: 'Up to 15 MB' })).toBe('reworded')
    })

    it('treats a dash of another kind as punctuation', () => {
        expect(renamePlan.classifyEdit({ oldEnglish: 'Score (0–100)', newEnglish: 'Score (0-100)' })).toBe('punct-whitespace-only')
    })

    it('treats punctuation that carries meaning as a rewording', () => {
        expect(renamePlan.classifyEdit({ oldEnglish: 'Offset -1', newEnglish: 'Offset 1' })).toBe('reworded')
        expect(renamePlan.classifyEdit({ oldEnglish: 'Use {name}', newEnglish: 'Use name' })).toBe('reworded')
        expect(renamePlan.classifyEdit({ oldEnglish: 'Format: YYYY-MM-DD', newEnglish: 'Format: YYYYMMDD' })).toBe('reworded')
    })

    it('treats a case change inside a word, a code value or a format as a rewording', () => {
        expect(renamePlan.classifyEdit({ oldEnglish: 'Format: YYYY-MM-DD', newEnglish: 'Format: yyyy-mm-dd' })).toBe('reworded')
        expect(renamePlan.classifyEdit({ oldEnglish: 'Use {Name}', newEnglish: 'Use {name}' })).toBe('reworded')
        expect(renamePlan.classifyEdit({ oldEnglish: 'Open https://example.com/Settings', newEnglish: 'Open https://example.com/settings' })).toBe('reworded')
        expect(renamePlan.classifyEdit({ oldEnglish: 'Month as MM', newEnglish: 'Month as mm' })).toBe('reworded')
        expect(renamePlan.classifyEdit({ oldEnglish: 'Github', newEnglish: 'GitHub' })).toBe('reworded')
    })

    it('treats words that join or split as a rewording', () => {
        expect(renamePlan.classifyEdit({ oldEnglish: 'ageRanges', newEnglish: 'Age Ranges' })).toBe('reworded')
        expect(renamePlan.classifyEdit({ oldEnglish: 'Path user.name', newEnglish: 'Path username' })).toBe('reworded')
    })

    it('treats punctuation inside a word as a rewording', () => {
        expect(renamePlan.classifyEdit({ oldEnglish: 'Status != active', newEnglish: 'Status = active' })).toBe('reworded')
        expect(renamePlan.classifyEdit({ oldEnglish: 'Format key:value', newEnglish: 'Format key value' })).toBe('reworded')
    })

    it('keeps capitalised hyphenated words, quotes and brackets around words as trivial', () => {
        expect(renamePlan.classifyEdit({ oldEnglish: 'Send e-mail', newEnglish: 'Send E-Mail' })).toBe('case-only')
        expect(renamePlan.classifyEdit({ oldEnglish: 'Response is Binary ?', newEnglish: 'Response is Binary' })).toBe('punct-whitespace-only')
        expect(renamePlan.classifyEdit({ oldEnglish: 'Set to “true” (optional)', newEnglish: 'Set to "true" (Optional).' })).toBe('punct-whitespace-only')
    })

    it('sees a rewording', () => {
        expect(renamePlan.classifyEdit({ oldEnglish: 'Upload a file', newEnglish: 'Send a file to Dropbox' })).toBe('reworded')
    })
})

describe('renamePlan.englishEditsOf', () => {
    it('reports one change for the same edit at many paths', () => {
        const edits = renamePlan.englishEditsOf({
            oldEnglishByJsonPath: { 'actions.a.displayName': 'Folder', 'actions.b.displayName': 'Folder', 'actions.c.displayName': 'Same' },
            newEnglishByJsonPath: { 'actions.a.displayName': 'Folder Path', 'actions.b.displayName': 'Folder Path', 'actions.c.displayName': 'Same' },
        })

        expect(edits).toEqual([{
            oldEnglish: 'Folder',
            newEnglish: 'Folder Path',
            jsonPaths: ['actions.a.displayName', 'actions.b.displayName'],
            editKind: 'reworded',
            blocker: null,
        }])
    })

    it('ignores added and removed paths', () => {
        const edits = renamePlan.englishEditsOf({
            oldEnglishByJsonPath: { 'actions.gone.displayName': 'Gone' },
            newEnglishByJsonPath: { 'actions.fresh.displayName': 'Fresh' },
        })

        expect(edits).toEqual([])
    })

    it('ignores a change past the Crowdin key length', () => {
        const prefix = 'x'.repeat(512)
        const edits = renamePlan.englishEditsOf({
            oldEnglishByJsonPath: { description: `${prefix} old tail` },
            newEnglishByJsonPath: { description: `${prefix} new tail` },
        })

        expect(edits).toEqual([])
    })

    it('blocks a rename when the old English is still used at another path', () => {
        const [first] = renamePlan.englishEditsOf({
            oldEnglishByJsonPath: { 'actions.a.displayName': 'Name', 'actions.b.displayName': 'Name' },
            newEnglishByJsonPath: { 'actions.a.displayName': 'Full Name', 'actions.b.displayName': 'Name' },
        })

        expect(first.blocker).toBe('old-still-used')
    })

    it('blocks a rename when the new English already existed', () => {
        const [first] = renamePlan.englishEditsOf({
            oldEnglishByJsonPath: { 'actions.a.displayName': 'Name', 'actions.b.displayName': 'Title' },
            newEnglishByJsonPath: { 'actions.a.displayName': 'Title', 'actions.b.displayName': 'Title' },
        })

        expect(first.blocker).toBe('new-already-existed')
    })

    it('blocks a rename when one old English becomes two new strings', () => {
        const edits = renamePlan.englishEditsOf({
            oldEnglishByJsonPath: { 'actions.a.displayName': 'Name', 'actions.b.displayName': 'Name' },
            newEnglishByJsonPath: { 'actions.a.displayName': 'First Name', 'actions.b.displayName': 'Last Name' },
        })

        expect(edits.map(({ blocker }) => blocker)).toEqual(['old-splits', 'old-splits'])
    })

    it('blocks a rename when two old strings become one new English', () => {
        const edits = renamePlan.englishEditsOf({
            oldEnglishByJsonPath: { 'actions.a.displayName': 'First', 'actions.b.displayName': 'Second' },
            newEnglishByJsonPath: { 'actions.a.displayName': 'Both', 'actions.b.displayName': 'Both' },
        })

        expect(edits.map(({ blocker }) => blocker)).toEqual(['new-merges', 'new-merges'])
    })
})

describe('renamePlan.matchCrowdinStrings', () => {
    const crowdinStrings = [
        { id: 1, text: 'Folder', identifier: 'Folder' },
        { id: 2, text: 'Twice', identifier: 'Twice' },
        { id: 3, text: 'Twice', identifier: 'Twice' },
        { id: 4, text: 'Taken', identifier: 'Taken' },
    ]

    it('finds the Crowdin string that holds the old English', () => {
        const matches = renamePlan.matchCrowdinStrings({ edits: [englishEdit({ oldEnglish: 'Folder', newEnglish: 'Folder Path' })], crowdinStrings })

        expect(matches.matched.map(({ stringId }) => stringId)).toEqual([1])
        expect(matches.skipped).toEqual([])
    })

    it('skips what it cannot rename safely and says why', () => {
        const matches = renamePlan.matchCrowdinStrings({
            edits: [
                { ...englishEdit({ oldEnglish: 'Folder', newEnglish: 'Other' }), blocker: 'old-still-used' },
                englishEdit({ oldEnglish: 'Missing', newEnglish: 'Other' }),
                englishEdit({ oldEnglish: 'Twice', newEnglish: 'Other' }),
                englishEdit({ oldEnglish: 'Folder', newEnglish: 'Taken' }),
                englishEdit({ oldEnglish: 'Folder', newEnglish: 'y'.repeat(511) }),
            ],
            crowdinStrings,
        })

        expect(matches.matched).toEqual([])
        expect(matches.skipped.map(({ reason }) => reason)).toEqual(['old-still-used', 'not-in-crowdin', 'ambiguous', 'new-already-in-crowdin', 'long-key'])
    })
})

describe('renamePlan.matchCrowdinStrings at the longest renameable English', () => {
    it('renames English of 510 characters, whose quoted identifier still fits a Crowdin key', () => {
        const longestEnglish = `${'z'.repeat(509)}.`
        const edit = englishEdit({ oldEnglish: 'Folder', newEnglish: longestEnglish })

        const matches = renamePlan.matchCrowdinStrings({ edits: [edit], crowdinStrings: [{ id: 1, text: 'Folder' }] })
        const plannedRename = renamePlan.planRename({ edit, stringId: 1, translationsByLanguage: {}, approvalsByLanguage: {}, languagesWaitingForReview: [] })

        expect(matches.skipped).toEqual([])
        expect(plannedRename.newIdentifier.length).toBe(512)
    })
})

describe('renamePlan.matchCrowdinStrings after an earlier run', () => {
    it('tells apart a string of which Crowdin holds only the new English', () => {
        const matches = renamePlan.matchCrowdinStrings({
            edits: [englishEdit({ oldEnglish: 'Folder', newEnglish: 'Folder Path' })],
            crowdinStrings: [{ id: 1, text: 'Folder Path' }],
        })

        expect(matches.matched).toEqual([])
        expect(matches.skipped.map(({ reason }) => reason)).toEqual(['only-new-in-crowdin'])
    })
})

describe('renamePlan.planRename', () => {
    const translations = {
        ja: [{ stringId: 1 }, { stringId: 1 }],
        de: [{ stringId: 1 }],
        fr: [],
    }
    const approvals: Record<string, TranslationApproval[]> = {
        ja: [{ translationId: 10, stringId: 1, user: crowdinUser('human') }],
        de: [{ translationId: 20, stringId: 1, user: crowdinUser('abuaboud') }],
        fr: [],
    }
    const planRename = ({ oldEnglish, newEnglish, approvalsByLanguage = approvals, languagesWaitingForReview = [] }: { oldEnglish: string, newEnglish: string, approvalsByLanguage?: typeof approvals, languagesWaitingForReview?: string[] }) => renamePlan.planRename({
        edit: englishEdit({ oldEnglish, newEnglish }),
        stringId: 1,
        translationsByLanguage: translations,
        approvalsByLanguage,
        languagesWaitingForReview,
    })

    it('keeps translations and approvals for a same-words edit', () => {
        expect(planRename({ oldEnglish: 'Upload file', newEnglish: 'Upload File' })).toMatchObject({
            stringId: 1,
            oldEnglish: 'Upload file',
            newEnglish: 'Upload File',
            newIdentifier: 'Upload File',
            updateOption: 'keep_translations_and_approvals',
            keptLanguages: ['ja', 'de'],
            clearedLanguages: [],
            translationIdsToReapproveOnUndo: [],
            needsReview: false,
        })
    })

    it('keeps only human-approved languages for a rewording and flags them for review', () => {
        expect(planRename({ oldEnglish: 'Upload a file', newEnglish: 'Send a file' })).toMatchObject({
            updateOption: 'keep_translations',
            keptLanguages: ['ja'],
            clearedLanguages: ['de'],
            translationIdsToReapproveOnUndo: [10],
            needsReview: true,
        })
    })

    it('clears everything for a rewording that no human approved', () => {
        const approvalsByLanguage = { ...approvals, ja: [{ translationId: 11, stringId: 1, user: crowdinUser('abuaboud') }] }

        expect(planRename({ oldEnglish: 'Upload a file', newEnglish: 'Send a file', approvalsByLanguage })).toMatchObject({
            updateOption: 'clear_translations_and_approvals',
            keptLanguages: [],
            clearedLanguages: [],
            needsReview: false,
        })
    })

    it('flags only the kept languages for review', () => {
        expect(planRename({ oldEnglish: 'Upload a file', newEnglish: 'Send a file' }).humanApprovedLanguages).toEqual(['ja'])
    })

    it('keeps a language that still waits for review after an earlier rewording and does not flag it twice', () => {
        const approvalsByLanguage = { ...approvals, ja: [] }

        expect(planRename({ oldEnglish: 'Upload a file', newEnglish: 'Send a file', approvalsByLanguage, languagesWaitingForReview: ['ja'] })).toMatchObject({
            updateOption: 'keep_translations',
            keptLanguages: ['ja'],
            clearedLanguages: ['de'],
            translationIdsToReapproveOnUndo: [],
            humanApprovedLanguages: [],
            needsReview: true,
        })
    })

    it('flags a language again when a new human approval is dropped while an older review is still open', () => {
        expect(planRename({ oldEnglish: 'Upload a file', newEnglish: 'Send a file', languagesWaitingForReview: ['ja'] })).toMatchObject({
            keptLanguages: ['ja'],
            translationIdsToReapproveOnUndo: [10],
            humanApprovedLanguages: ['ja'],
        })
    })

    it('ignores a review that waits in a language with no translation', () => {
        const approvalsByLanguage = { ...approvals, ja: [] }

        expect(planRename({ oldEnglish: 'Upload a file', newEnglish: 'Send a file', approvalsByLanguage, languagesWaitingForReview: ['fr'] })).toMatchObject({
            updateOption: 'clear_translations_and_approvals',
            keptLanguages: [],
        })
    })

    it('quotes an identifier that contains a dot', () => {
        expect(planRename({ oldEnglish: 'Upload a file', newEnglish: 'Upload a file.' }).newIdentifier).toBe('"Upload a file."')
    })
})

describe('renamePlan.automaticTranslationIdsWithoutHumanApproval', () => {
    it('picks machine translations that no human approved', () => {
        const translations = [
            { id: 10, user: crowdinUser('human') },
            { id: 11, user: crowdinUser('abuaboud') },
            { id: 12, user: crowdinUser('abuaboud') },
            { id: 13, user: null },
        ]

        expect(renamePlan.automaticTranslationIdsWithoutHumanApproval({ translations, humanApprovedTranslationIds: [10, 12] })).toEqual([11])
    })
})
