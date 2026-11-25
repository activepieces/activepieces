import { SendRequest } from './crowdin-http-client'
import { CrowdinProjectApi, crowdinProjectApi } from './crowdin-project-api'
import { JournalEntry } from './rename-journal'
import { PieceTranslatableText } from './translatable-text-by-json-path'

function create({
    strings = [{ id: 1, identifier: 'Upload a file', text: 'Upload a file' }],
    failPatchFor = [],
    patchLandsButErrorsFor = [],
    failApprovals = false,
    failIssues = false,
    issueResponseLost = false,
    failDeleteFor = [],
    failIssueListFor = [],
    approvals = DEFAULT_APPROVALS,
    issues = [],
}: FakeCrowdinOptions = {}): FakeCrowdin {
    const state: FakeCrowdinState = {
        strings: copyOf(strings),
        translationsByLanguage: {
            ja: [{ translationId: 10, stringId: 1, user: { username: 'human' } }],
            de: [{ translationId: 20, stringId: 1, user: { username: 'abuaboud' } }],
        },
        jaTranslationsOfStringOne: [{ id: 10, user: { username: 'human' } }, { id: 11, user: { username: 'abuaboud' } }],
        approvals: copyOf(approvals),
        issues: copyOf(issues),
    }
    const writes: string[] = []

    const respondTo = ({ method, resource, query, page, requestBody }: FakeRequest): FakeResponse => {
        const resourceWithQuery = `${resource}${query.size > 0 ? `?${query.toString()}` : ''}`
        const stringIdInPath = /^\/strings\/(\d+)$/.exec(resource)?.[1]
        const languageOfTranslations = /^\/languages\/(ja|de)\/translations$/.exec(resource)?.[1]
        const commentIdInPath = /^\/comments\/(\d+)$/.exec(resource)?.[1]
        if (method === 'GET' && resource === '') {
            return found({ responseBody: { data: { id: FAKE_PROJECT_ID, targetLanguageIds: ['ja', 'de'] } } })
        }
        if (method === 'GET' && resource === '/files') {
            return listed({ page, rows: [{ id: 5, path: FILE_PATH }, { id: 6, path: '/main/packages/pieces/community/other/src/i18n/translation.json' }] })
        }
        if (method === 'GET' && resource === '/strings' && query.get('fileId') === '5') {
            return listed({ page, rows: state.strings })
        }
        if (method === 'GET' && stringIdInPath !== undefined) {
            const crowdinString = state.strings.find(({ id }) => String(id) === stringIdInPath)
            return crowdinString === undefined ? failed({ status: 404, message: 'String Not Found' }) : found({ responseBody: { data: crowdinString } })
        }
        if (method === 'PATCH' && stringIdInPath !== undefined) {
            const stringId = Number(stringIdInPath)
            if (failPatchFor.includes(stringId)) {
                return failed({ status: 400, message: 'Invalid' })
            }
            const operations = copyOf<{ path: string, value: string }[]>(requestBody)
            state.strings = state.strings.map((crowdinString) => crowdinString.id === stringId
                ? {
                    ...crowdinString,
                    identifier: operations.find((operation) => operation.path === '/identifier')?.value ?? crowdinString.identifier,
                    text: operations.find((operation) => operation.path === '/text')?.value ?? crowdinString.text,
                }
                : crowdinString)
            if (query.get('updateOption') !== 'keep_translations_and_approvals') {
                state.approvals = {
                    ja: state.approvals.ja.filter((approval) => approval.stringId !== stringId),
                    de: state.approvals.de.filter((approval) => approval.stringId !== stringId),
                }
            }
            if (patchLandsButErrorsFor.includes(stringId)) {
                return failed({ status: 502, message: 'Bad Gateway' })
            }
            writes.push(`PATCH ${resourceWithQuery}`)
            return found({ responseBody: { data: state.strings.find(({ id }) => id === stringId) } })
        }
        if (method === 'GET' && languageOfTranslations !== undefined && query.get('fileId') === '5') {
            return listed({ page, rows: languageOfTranslations === 'ja' ? state.translationsByLanguage.ja : state.translationsByLanguage.de })
        }
        if (method === 'GET' && resource === '/translations' && query.get('stringId') === '1' && query.get('languageId') === 'ja') {
            return listed({ page, rows: state.jaTranslationsOfStringOne })
        }
        if (method === 'GET' && resource === '/approvals' && query.get('fileId') === '5') {
            return listed({ page, rows: query.get('languageId') === 'ja' ? state.approvals.ja : state.approvals.de })
        }
        if (method === 'GET' && resource === '/approvals' && query.has('translationId')) {
            return listed({ page, rows: [...state.approvals.ja, ...state.approvals.de].filter(({ translationId }) => String(translationId) === query.get('translationId')) })
        }
        if (method === 'POST' && resource === '/approvals') {
            if (failApprovals) {
                return failed({ status: 400, message: 'Invalid' })
            }
            const { translationId } = copyOf<{ translationId: number }>(requestBody)
            writes.push(`POST ${resource} ${JSON.stringify(requestBody)}`)
            state.approvals.ja.push({ translationId, stringId: 1, user: { username: 'ci' } })
            return found({ responseBody: { data: { id: 900, translationId } } })
        }
        if (method === 'GET' && resource === '/comments' && query.get('type') === 'issue' && query.get('issueStatus') === 'unresolved') {
            if (failIssueListFor.includes(Number(query.get('stringId')))) {
                return failed({ status: 500, message: 'Internal Server Error' })
            }
            const issuesOfString = state.issues.filter(({ stringId }) => String(stringId) === query.get('stringId'))
            return listed({ page, rows: issuesOfString.map(({ targetLanguageId, ...issue }) => ({ ...issue, languageId: targetLanguageId })) })
        }
        if (method === 'POST' && resource === '/comments') {
            if (failIssues) {
                return failed({ status: 403, message: 'Forbidden' })
            }
            const issue = copyOf<Omit<FakeIssue, 'id'>>(requestBody)
            const id = 100 + state.issues.length
            state.issues.push({ ...issue, id })
            writes.push(`POST ${resource} ${issue.targetLanguageId} ${issue.type} ${issue.issueType}`)
            return issueResponseLost ? failed({ status: 502, message: 'Bad Gateway' }) : found({ responseBody: { data: { ...issue, id } } })
        }
        if (method === 'DELETE' && (resource === '/translations' || resource.startsWith('/translations/') || commentIdInPath !== undefined)) {
            if (failDeleteFor.includes(resourceWithQuery)) {
                return failed({ status: 403, message: 'Forbidden' })
            }
            state.issues = state.issues.filter(({ id }) => String(id) !== commentIdInPath)
            writes.push(`DELETE ${resourceWithQuery}`)
            return { status: 204, responseBody: null }
        }
        return failed({ status: 400, message: `fake Crowdin has no route for ${method} ${resourceWithQuery}` })
    }

    const sendRequest: SendRequest = async (url, init) => {
        const { pathname, searchParams } = new URL(url)
        const fakeResponse = respondTo({
            method: init.method ?? 'GET',
            resource: pathname.replace(PROJECT_PATH, ''),
            query: new URLSearchParams([...searchParams].filter(([name]) => !PAGE_PARAMETERS.includes(name))),
            page: { offset: Number(searchParams.get('offset') ?? 0), limit: Number(searchParams.get('limit') ?? DEFAULT_PAGE_SIZE) },
            requestBody: typeof init.body === 'string' ? JSON.parse(init.body) : undefined,
        })
        return new Response(fakeResponse.responseBody === null ? null : JSON.stringify(fakeResponse.responseBody), { status: fakeResponse.status })
    }

    const crowdin = crowdinProjectApi.create({ token: FAKE_TOKEN, projectId: FAKE_PROJECT_ID, sendRequest, waitBeforeRetry: async () => undefined })
    return { crowdin, writes, state }
}

function dropboxPiece({ newEnglish = 'Send a file' }: { newEnglish?: string } = {}): PieceTranslatableText {
    return {
        pieceName: 'community/dropbox',
        oldEnglishByJsonPath: { 'actions.upload.description': 'Upload a file' },
        newEnglishByJsonPath: { 'actions.upload.description': newEnglish },
    }
}

function rewordingReviewIssue({ id, language }: { id: number, language: string }): FakeIssue {
    return {
        id,
        stringId: 1,
        targetLanguageId: language,
        type: 'issue',
        issueType: 'translation_mistake',
        text: 'The English text of this string changed (automatic note from the Activepieces translations job).\n\nOld English: Upload file\nNew English: Upload a file',
    }
}

function collectJournalEntries(): { journalEntries: JournalEntry[], appendJournalEntry: (entry: JournalEntry) => void } {
    const journalEntries: JournalEntry[] = []
    return { journalEntries, appendJournalEntry: (entry) => { journalEntries.push(entry) } }
}

function found({ responseBody }: { responseBody: unknown }): FakeResponse {
    return { status: 200, responseBody }
}

function failed({ status, message }: { status: number, message: string }): FakeResponse {
    return { status, responseBody: { error: { code: status, message } } }
}

function listed({ page, rows }: { page: FakePage, rows: unknown[] }): FakeResponse {
    return {
        status: 200,
        responseBody: {
            data: copyOf<unknown[]>(rows).slice(page.offset, page.offset + page.limit).map((row) => ({ data: row })),
            pagination: page,
        },
    }
}

function copyOf<T>(value: unknown): T {
    return JSON.parse(JSON.stringify(value))
}

const FAKE_TOKEN = 'fake-crowdin-token'
const FAKE_PROJECT_ID = 42
const PROJECT_PATH = `/api/v2/projects/${FAKE_PROJECT_ID}`
const PAGE_PARAMETERS = ['limit', 'offset']
const DEFAULT_PAGE_SIZE = 25
const FILE_PATH = '/main/packages/pieces/community/dropbox/src/i18n/translation.json'
const DEFAULT_APPROVALS: FakeApprovals = {
    ja: [{ translationId: 10, stringId: 1, user: { username: 'human' } }],
    de: [{ translationId: 20, stringId: 1, user: { username: 'abuaboud' } }],
}

export const fakeCrowdin = { create, DEFAULT_APPROVALS }

export const renameFixtures = { dropboxPiece, rewordingReviewIssue, collectJournalEntries }

export type FakeIssue = {
    id: number
    stringId: number
    targetLanguageId: string
    type: string
    issueType: string
    text: string
}

export type FakeApprovals = {
    ja: FakeApproval[]
    de: FakeApproval[]
}

type FakeString = {
    id: number
    identifier: string
    text: string
}

type FakeApproval = {
    translationId: number
    stringId: number
    user: { username: string }
}

type FakeCrowdinState = {
    strings: FakeString[]
    translationsByLanguage: { ja: FakeApproval[], de: FakeApproval[] }
    jaTranslationsOfStringOne: { id: number, user: { username: string } }[]
    approvals: FakeApprovals
    issues: FakeIssue[]
}

type FakeCrowdinOptions = {
    strings?: FakeString[]
    failPatchFor?: number[]
    patchLandsButErrorsFor?: number[]
    failApprovals?: boolean
    failIssues?: boolean
    issueResponseLost?: boolean
    failDeleteFor?: string[]
    failIssueListFor?: number[]
    approvals?: FakeApprovals
    issues?: FakeIssue[]
}

type FakeCrowdin = {
    crowdin: CrowdinProjectApi
    writes: string[]
    state: FakeCrowdinState
}

type FakeRequest = {
    method: string
    resource: string
    query: URLSearchParams
    page: FakePage
    requestBody: unknown
}

type FakePage = {
    offset: number
    limit: number
}

type FakeResponse = {
    status: number
    responseBody: unknown
}
