import { describe, expect, it } from 'bun:test'
import { execFileSync } from 'child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { CrowdinClient, CrowdinError } from './crowdin-client'
import { crowdinRename, JournalLine } from './crowdin-rename'

const FILE_PATH = '/main/packages/pieces/community/dropbox/src/i18n/translation.json'

const clone = <T>(value: unknown): T => JSON.parse(JSON.stringify(value))

const fakeCrowdin = ({ strings = [{ id: 1, identifier: 'Upload a file', text: 'Upload a file' }], failPatchFor = [], patchLandsButErrorsFor = [], failApprovals = false, failIssues = false, approvals = DEFAULT_APPROVALS, issues = [] }: FakeParams = {}) => {
    const state = {
        strings: clone<FakeString[]>(strings),
        translations: {
            ja: [{ translationId: 10, stringId: 1, user: { username: 'human' } }],
            de: [{ translationId: 20, stringId: 1, user: { username: 'robot' } }],
        },
        everyJaTranslation: [{ id: 10, user: { username: 'human' } }, { id: 11, user: { username: 'robot' } }],
        approvals: clone<FakeApprovals>(approvals),
        issues: clone<FakeIssue[]>(issues),
    }
    const writes: string[] = []
    const read = (path: string): unknown => {
        if (path === '') {
            return { data: { targetLanguageIds: ['ja', 'de'] } }
        }
        const stringId = /^\/strings\/(\d+)$/.exec(path)?.[1]
        const found = state.strings.find(({ id }) => String(id) === stringId)
        if (found === undefined) {
            throw new CrowdinError({ method: 'GET', path, status: 404, detail: 'String Not Found' })
        }
        return { data: found }
    }
    const rows = (path: string): unknown[] => {
        if (path === '/files') {
            return [{ id: 5, path: FILE_PATH }, { id: 6, path: '/main/packages/pieces/community/other/src/i18n/translation.json' }]
        }
        if (path === '/strings?fileId=5') {
            return state.strings
        }
        const translations = /^\/languages\/(ja|de)\/translations\?fileId=5$/.exec(path)
        if (translations) {
            return translations[1] === 'ja' ? state.translations.ja : state.translations.de
        }
        if (path === '/translations?stringId=1&languageId=ja') {
            return state.everyJaTranslation
        }
        const approvals = /^\/approvals\?fileId=5&languageId=(ja|de)$/.exec(path)
        if (approvals) {
            return approvals[1] === 'ja' ? state.approvals.ja : state.approvals.de
        }
        const issuesOfString = /^\/comments\?stringId=(\d+)&type=issue&issueStatus=unresolved$/.exec(path)
        if (issuesOfString) {
            return state.issues.filter(({ stringId }) => String(stringId) === issuesOfString[1])
        }
        const approvalsOfTranslation = /^\/approvals\?translationId=(\d+)$/.exec(path)
        if (approvalsOfTranslation) {
            return [...state.approvals.ja, ...state.approvals.de].filter(({ translationId }) => String(translationId) === approvalsOfTranslation[1])
        }
        throw new Error(`fake Crowdin has no list for ${path}`)
    }
    const client: CrowdinClient = {
        get: async <T>({ path }: { path: string }) => clone<T>(read(path)),
        list: async <T>({ path }: { path: string }) => clone<T[]>(rows(path)),
        patch: async ({ path, body }) => {
            const id = Number(/^\/strings\/(\d+)\?/.exec(path)?.[1])
            if (failPatchFor.includes(id)) {
                throw new CrowdinError({ method: 'PATCH', path, status: 400, detail: 'Invalid' })
            }
            const operations = clone<{ path: string, value: string }[]>(body)
            state.strings = state.strings.map((string) => string.id === id
                ? { ...string, identifier: operations.find((operation) => operation.path === '/identifier')?.value ?? string.identifier, text: operations.find((operation) => operation.path === '/text')?.value ?? string.text }
                : string)
            if (!path.endsWith('keep_translations_and_approvals')) {
                state.approvals = { ja: state.approvals.ja.filter(({ stringId }) => stringId !== id), de: state.approvals.de.filter(({ stringId }) => stringId !== id) }
            }
            if (patchLandsButErrorsFor.includes(id)) {
                throw new CrowdinError({ method: 'PATCH', path, status: 502, detail: 'Bad Gateway' })
            }
            writes.push(`PATCH ${path}`)
            return {}
        },
        post: async <T>({ path, body }: { path: string, body: unknown }) => {
            if (path === '/comments') {
                if (failIssues) {
                    throw new CrowdinError({ method: 'POST', path, status: 403, detail: 'Forbidden' })
                }
                const issue = clone<Omit<FakeIssue, 'id'>>(body)
                state.issues.push({ ...issue, id: 100 + state.issues.length })
                writes.push(`POST ${path} ${issue.targetLanguageId} ${issue.type} ${issue.issueType}`)
                return clone<T>({})
            }
            if (failApprovals) {
                throw new CrowdinError({ method: 'POST', path, status: 400, detail: 'Invalid' })
            }
            writes.push(`POST ${path} ${JSON.stringify(body)}`)
            state.approvals.ja.push({ translationId: clone<{ translationId: number }>(body).translationId, stringId: 1, user: { username: 'ci' } })
            return clone<T>({})
        },
        del: async ({ path }) => {
            const issueId = /^\/comments\/(\d+)$/.exec(path)?.[1]
            state.issues = state.issues.filter(({ id }) => String(id) !== issueId)
            writes.push(`DELETE ${path}`)
            return {}
        },
    }
    return { client, writes, state }
}

const DEFAULT_APPROVALS: FakeApprovals = {
    ja: [{ translationId: 10, stringId: 1, user: { username: 'human' } }],
    de: [{ translationId: 20, stringId: 1, user: { username: 'robot' } }],
}

const dropbox = ({ newEnglish = 'Send a file' }: { newEnglish?: string } = {}) => ({
    piece: 'community/dropbox',
    oldEnglishByPath: { 'actions.upload.description': 'Upload a file' },
    newEnglishByPath: { 'actions.upload.description': newEnglish },
})

const collect = () => {
    const lines: JournalLine[] = []
    return { lines, journal: (line: JournalLine): void => { lines.push(line) } }
}

describe('crowdinRename.run', () => {
    it('renames a reworded string, keeps the human language and removes machine translations', async () => {
        const { client, writes, state } = fakeCrowdin()
        const { lines, journal } = collect()

        const counts = await crowdinRename.run({ client, pieces: [dropbox()], autoApprovers: ['robot'], dryRun: false, journal })

        expect(writes).toEqual([
            'PATCH /strings/1?updateOption=keep_translations',
            'DELETE /translations?stringId=1&languageId=de',
            'DELETE /translations/11',
            'POST /comments ja issue translation_mistake',
        ])
        expect(state.strings[0]).toEqual({ id: 1, identifier: 'Send a file', text: 'Send a file' })
        expect(state.issues[0]).toMatchObject({ stringId: 1, targetLanguageId: 'ja' })
        expect(state.issues[0].text).toContain('Old English: Upload a file\nNew English: Send a file')
        expect(counts).toMatchObject({ renamed: 1, failed: 0, skipped: 0, writes: 4 })
        expect(lines.find(({ kind }) => kind === 'rename')).toMatchObject({
            piece: 'community/dropbox',
            status: 'renamed',
            stringId: 1,
            before: { identifier: 'Upload a file', text: 'Upload a file' },
            after: { identifier: 'Send a file', text: 'Send a file' },
            updateOption: 'keep_translations',
            reapproveOnUndo: [10],
            needsReview: true,
        })
    })

    it('opens no review issue when translations and approvals are kept', async () => {
        const { client, writes } = fakeCrowdin()
        const { journal } = collect()

        await crowdinRename.run({ client, pieces: [dropbox({ newEnglish: 'Upload a File.' })], autoApprovers: ['robot'], dryRun: false, journal })

        expect(writes).toEqual(['PATCH /strings/1?updateOption=keep_translations_and_approvals'])
    })

    it('opens no review issue when no human approved the translation', async () => {
        const { client, writes } = fakeCrowdin()
        const { journal } = collect()

        await crowdinRename.run({ client, pieces: [dropbox()], autoApprovers: ['robot', 'human'], dryRun: false, journal })

        expect(writes).toEqual(['PATCH /strings/1?updateOption=clear_translations_and_approvals'])
    })

    it('keeps the rename and counts a failure when the review issue cannot be opened', async () => {
        const { client, state } = fakeCrowdin({ failIssues: true })
        const { lines, journal } = collect()

        const counts = await crowdinRename.run({ client, pieces: [dropbox()], autoApprovers: ['robot'], dryRun: false, journal })

        expect(state.strings[0].text).toBe('Send a file')
        expect(counts).toMatchObject({ renamed: 1, failed: 1 })
        expect(lines.find(({ kind }) => kind === 'review-issue')).toMatchObject({ status: 'error', language: 'ja' })
        expect(crowdinRename.summarize({ lines, counts, dryRun: false })).toContain('review-issue error')
    })

    it('writes nothing on a dry run', async () => {
        const { client, writes } = fakeCrowdin()
        const { lines, journal } = collect()

        const counts = await crowdinRename.run({ client, pieces: [dropbox()], autoApprovers: ['robot'], dryRun: true, journal })

        expect(writes).toEqual([])
        expect(counts).toMatchObject({ renamed: 0, wouldRename: 1, writes: 0 })
        expect(lines.map(({ status }) => status)).toEqual(['would-rename'])
    })

    it('skips a piece that Crowdin does not hold yet', async () => {
        const { client, writes } = fakeCrowdin()
        const { lines, journal } = collect()

        const counts = await crowdinRename.run({ client, pieces: [{ ...dropbox(), piece: 'community/brand-new' }], autoApprovers: [], dryRun: false, journal })

        expect(writes).toEqual([])
        expect(counts).toMatchObject({ skipped: 1, failed: 0 })
        expect(lines[0]).toMatchObject({ kind: 'skip', status: 'file-not-in-crowdin' })
    })

    it('does not touch a string that already has the new text', async () => {
        const { client, writes } = fakeCrowdin({ strings: [{ id: 1, identifier: 'Upload a file', text: 'Upload a file' }, { id: 2, identifier: 'old folder', text: 'old folder' }] })
        const { journal } = collect()
        const pieces = [{ piece: 'community/dropbox', oldEnglishByPath: { a: 'old folder' }, newEnglishByPath: { a: 'Old Folder' } }]
        await crowdinRename.run({ client, pieces, autoApprovers: [], dryRun: false, journal })
        const second = fakeCrowdin({ strings: [{ id: 2, identifier: 'Old Folder', text: 'Old Folder' }] })

        const counts = await crowdinRename.run({ client: second.client, pieces, autoApprovers: [], dryRun: false, journal })

        expect(writes).toEqual(['PATCH /strings/2?updateOption=keep_translations_and_approvals'])
        expect(second.writes).toEqual([])
        expect(counts).toMatchObject({ renamed: 0, skipped: 1 })
    })

    it('counts a rename that landed although Crowdin answered with an error', async () => {
        const { client, state } = fakeCrowdin({ patchLandsButErrorsFor: [1] })
        const { lines, journal } = collect()

        const counts = await crowdinRename.run({ client, pieces: [dropbox()], autoApprovers: ['robot'], dryRun: false, journal })

        expect(state.strings[0].text).toBe('Send a file')
        expect(counts).toMatchObject({ renamed: 1, failed: 0 })
        expect(lines.find(({ kind }) => kind === 'rename')?.status).toBe('renamed')
    })

    it('keeps going after one string fails and counts the failure', async () => {
        const strings = [{ id: 1, identifier: 'Upload a file', text: 'Upload a file' }, { id: 2, identifier: 'Folder', text: 'Folder' }]
        const { client, writes } = fakeCrowdin({ strings, failPatchFor: [1] })
        const { lines, journal } = collect()
        const pieces = [{
            piece: 'community/dropbox',
            oldEnglishByPath: { a: 'Upload a file', b: 'Folder' },
            newEnglishByPath: { a: 'Send a file', b: 'Folder Path' },
        }]

        const counts = await crowdinRename.run({ client, pieces, autoApprovers: ['robot'], dryRun: false, journal })

        expect(writes).toEqual(['PATCH /strings/2?updateOption=clear_translations_and_approvals'])
        expect(counts).toMatchObject({ renamed: 1, failed: 1 })
        expect(lines.filter(({ kind }) => kind === 'rename').map(({ status }) => status)).toEqual(['error', 'renamed'])
        expect(lines.filter(({ stringId }) => stringId === 1).map(({ kind, status }) => `${kind} ${status}`)).toEqual(['pending patching', 'rename error'])
    })
})

describe('crowdinRename.undo', () => {
    it('renames back in reverse order and approves the human translations again', async () => {
        const { client, writes, state } = fakeCrowdin()
        const { lines, journal } = collect()
        await crowdinRename.run({ client, pieces: [dropbox()], autoApprovers: ['robot'], dryRun: false, journal })
        writes.length = 0

        const counts = await crowdinRename.undo({ client, lines, journal })

        expect(writes).toEqual([
            'PATCH /strings/1?updateOption=keep_translations_and_approvals',
            'POST /approvals {"translationId":10}',
            'DELETE /comments/100',
        ])
        expect(state.strings[0]).toEqual({ id: 1, identifier: 'Upload a file', text: 'Upload a file' })
        expect(state.issues).toEqual([])
        expect(counts).toEqual({ undone: 1, failed: 0 })
    })

    it('reports an approval it could not restore', async () => {
        const first = fakeCrowdin()
        const { lines, journal } = collect()
        await crowdinRename.run({ client: first.client, pieces: [dropbox()], autoApprovers: ['robot'], dryRun: false, journal })
        const second = fakeCrowdin({ strings: first.state.strings, approvals: first.state.approvals, failApprovals: true })

        const counts = await crowdinRename.undo({ client: second.client, lines, journal })

        expect(second.state.strings[0].text).toBe('Upload a file')
        expect(counts).toEqual({ undone: 1, failed: 1 })
        expect(lines.find(({ kind }) => kind === 'undo')?.message).toContain('10')
    })

    it('renames back a string whose rename landed although the run recorded an error', async () => {
        const { client, writes, state } = fakeCrowdin({ strings: [{ id: 1, identifier: 'Send a file', text: 'Send a file' }] })
        const { journal } = collect()
        const before = { identifier: 'Upload a file', text: 'Upload a file' }
        const after = { identifier: 'Send a file', text: 'Send a file' }
        const lines: JournalLine[] = [
            { kind: 'pending', piece: 'community/dropbox', status: 'patching', stringId: 1, before, after, reapproveOnUndo: [] },
            { kind: 'rename', piece: 'community/dropbox', status: 'error', stringId: 1, before, after, message: 'Bad Gateway' },
        ]

        const counts = await crowdinRename.undo({ client, lines, journal })

        expect(writes).toEqual(['PATCH /strings/1?updateOption=keep_translations_and_approvals'])
        expect(state.strings[0].text).toBe('Upload a file')
        expect(counts).toEqual({ undone: 1, failed: 0 })
    })

    it('leaves a string alone when its unfinished rename never landed', async () => {
        const { client, writes } = fakeCrowdin()
        const { journal } = collect()
        const lines: JournalLine[] = [{
            kind: 'pending',
            piece: 'community/dropbox',
            status: 'patching',
            stringId: 1,
            before: { identifier: 'Upload a file', text: 'Upload a file' },
            after: { identifier: 'Send a file', text: 'Send a file' },
            reapproveOnUndo: [10],
        }]

        const counts = await crowdinRename.undo({ client, lines, journal })

        expect(writes).toEqual([])
        expect(counts).toEqual({ undone: 0, failed: 0 })
    })

    it('restores a missing approval on a second undo when the English is already back', async () => {
        const first = fakeCrowdin()
        const { lines, journal } = collect()
        await crowdinRename.run({ client: first.client, pieces: [dropbox()], autoApprovers: ['robot'], dryRun: false, journal })
        const failing = fakeCrowdin({ strings: first.state.strings, approvals: first.state.approvals, failApprovals: true })
        await crowdinRename.undo({ client: failing.client, lines, journal })
        const retry = fakeCrowdin({ strings: failing.state.strings, approvals: failing.state.approvals })

        const counts = await crowdinRename.undo({ client: retry.client, lines, journal })

        expect(retry.writes).toEqual(['POST /approvals {"translationId":10}'])
        expect(counts).toEqual({ undone: 0, failed: 0 })
    })

    it('leaves an issue that a translator opened on the same string', async () => {
        const translatorIssue = { id: 7, stringId: 1, targetLanguageId: 'ja', type: 'issue', issueType: 'general_question', text: 'What does this mean?' }
        const { client, writes, state } = fakeCrowdin({ issues: [translatorIssue] })
        const { lines, journal } = collect()
        await crowdinRename.run({ client, pieces: [dropbox()], autoApprovers: ['robot'], dryRun: false, journal })
        writes.length = 0

        await crowdinRename.undo({ client, lines, journal })

        expect(writes.filter((write) => write.startsWith('DELETE'))).toEqual(['DELETE /comments/101'])
        expect(state.issues).toEqual([translatorIssue])
    })

    it('undoes two renames of the same string in reverse order', async () => {
        const { client, state } = fakeCrowdin()
        const { lines, journal } = collect()
        await crowdinRename.run({ client, pieces: [dropbox()], autoApprovers: ['robot', 'human'], dryRun: false, journal })
        const second = { piece: 'community/dropbox', oldEnglishByPath: { a: 'Send a file' }, newEnglishByPath: { a: 'Send a file to Dropbox' } }
        await crowdinRename.run({ client, pieces: [second], autoApprovers: ['robot', 'human'], dryRun: false, journal })
        expect(state.strings[0].text).toBe('Send a file to Dropbox')

        const counts = await crowdinRename.undo({ client, lines, journal })

        expect(state.strings[0].text).toBe('Upload a file')
        expect(counts).toEqual({ undone: 2, failed: 0 })
    })

    it('has nothing to undo when nothing was renamed', async () => {
        const { client, writes } = fakeCrowdin()
        const { journal } = collect()

        const counts = await crowdinRename.undo({ client, lines: [], journal })

        expect(writes).toEqual([])
        expect(counts).toEqual({ undone: 0, failed: 0 })
    })
})

describe('crowdinRename.changedPieces', () => {
    it('reads the old and new English of every paths file the branch changed', () => {
        const repo = mkdtempSync(join(tmpdir(), 'ap-crowdin-rename-'))
        const git = (...args: string[]): string => execFileSync('git', ['-c', 'user.email=bot@example.com', '-c', 'user.name=bot', ...args], { cwd: repo, encoding: 'utf8' })
        const write = (piece: string, content: Record<string, string>): void => {
            mkdirSync(join(repo, 'tools', 'i18n-paths', 'community'), { recursive: true })
            writeFileSync(join(repo, 'tools', 'i18n-paths', 'community', `${piece}.json`), JSON.stringify(content))
        }
        git('init', '-q', '-b', 'main')
        write('dropbox', { description: 'Old' })
        write('untouched', { description: 'Same' })
        git('add', '-A')
        git('commit', '-q', '-m', 'base')
        git('checkout', '-q', '-b', 'night')
        write('dropbox', { description: 'New' })
        write('fresh', { description: 'Added' })
        git('add', '-A')
        git('commit', '-q', '-m', 'night')
        git('checkout', '-q', 'main')
        write('untouched', { description: 'Moved on main' })
        git('add', '-A')
        git('commit', '-q', '-m', 'main moved')
        git('checkout', '-q', 'night')

        const pieces = crowdinRename.changedPieces({ base: 'main', cwd: repo })
        rmSync(repo, { recursive: true, force: true })

        expect(pieces).toEqual([{ piece: 'community/dropbox', oldEnglishByPath: { description: 'Old' }, newEnglishByPath: { description: 'New' } }])
    })
})

describe('crowdinRename.exitCode', () => {
    it('fails closed only when something failed before any write', () => {
        const base = { renamed: 0, wouldRename: 0, skipped: 0, failed: 0, writes: 0 }

        expect(crowdinRename.exitCode({ counts: { ...base, failed: 2 }, dryRun: false })).toBe(1)
        expect(crowdinRename.exitCode({ counts: { ...base, failed: 1, renamed: 3, writes: 3 }, dryRun: false })).toBe(0)
        expect(crowdinRename.exitCode({ counts: base, dryRun: false })).toBe(0)
    })

    it('never blocks the translations PR on a dry run', () => {
        expect(crowdinRename.exitCode({ counts: { renamed: 0, wouldRename: 0, skipped: 0, failed: 2, writes: 0 }, dryRun: true })).toBe(0)
    })
})

describe('crowdinRename.summarize', () => {
    it('lists what was renamed, what needs review and what was skipped', async () => {
        const { client } = fakeCrowdin()
        const { lines, journal } = collect()
        const pieces = [dropbox(), { ...dropbox(), piece: 'community/brand-new' }]
        const counts = await crowdinRename.run({ client, pieces, autoApprovers: ['robot'], dryRun: false, journal })

        const summary = crowdinRename.summarize({ lines, counts, dryRun: false })

        expect(summary).toContain('1 renamed')
        expect(summary).toContain('| community/dropbox | Upload a file | Send a file | ja |')
        expect(summary).toContain('| community/brand-new | Upload a file | file-not-in-crowdin |')
    })
})

describe('crowdinRename.pieceOf', () => {
    it('reads the piece from its paths file', () => {
        expect(crowdinRename.pieceOf({ pathsFile: 'tools/i18n-paths/community/dropbox.json' })).toBe('community/dropbox')
    })
})

type FakeString = {
    id: number
    identifier: string
    text: string
}

type FakeParams = {
    strings?: FakeString[]
    failPatchFor?: number[]
    patchLandsButErrorsFor?: number[]
    failApprovals?: boolean
    failIssues?: boolean
    approvals?: FakeApprovals
    issues?: FakeIssue[]
}

type FakeIssue = {
    id: number
    stringId: number
    targetLanguageId: string
    type: string
    issueType: string
    text: string
}

type FakeApproval = {
    translationId: number
    stringId: number
    user: { username: string }
}

type FakeApprovals = {
    ja: FakeApproval[]
    de: FakeApproval[]
}
