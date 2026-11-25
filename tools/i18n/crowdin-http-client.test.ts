import { describe, expect, it } from 'bun:test'
import { CrowdinError } from '@crowdin/crowdin-api-client'
import { SendRequest } from './crowdin-http-client'
import { crowdinProjectApi } from './crowdin-project-api'

const respondWith = ({ status = 200, responseBody = {} }: { status?: number, responseBody?: unknown }): Response => new Response(JSON.stringify(responseBody), { status })

const queuedCrowdin = ({ responses, token = 't' }: { responses: (Response | Error)[], token?: string }) => {
    const sentRequests: SentRequest[] = []
    const queue = [...responses]
    const sendRequest: SendRequest = async (url, init) => {
        sentRequests.push({
            url,
            method: init.method ?? 'GET',
            body: typeof init.body === 'string' ? init.body : null,
            authorization: new Headers(init.headers).get('Authorization'),
        })
        const nextResponse = queue.shift()
        if (nextResponse === undefined) {
            throw new Error('no response queued')
        }
        if (nextResponse instanceof Error) {
            throw nextResponse
        }
        return nextResponse
    }
    const crowdin = crowdinProjectApi.create({ token, projectId: 42, sendRequest, waitBeforeRetry: async () => undefined })
    return { crowdin, sentRequests }
}

const statusOf = (error: unknown): number | null => error instanceof CrowdinError ? error.code : null

const messageOf = (error: unknown): string => error instanceof Error ? error.message : ''

const RENAME_TO_NEW = [{ op: 'replace' as const, path: '/text', value: 'New' }]

describe('crowdinHttpClient through the Crowdin SDK', () => {
    it('calls the project with the token', async () => {
        const { crowdin, sentRequests } = queuedCrowdin({ token: 'secret', responses: [respondWith({ responseBody: { data: { id: 7 } } })] })

        const crowdinString = await crowdin.sourceStringsApi.getString(42, 7)

        expect(crowdinString.data.id).toBe(7)
        expect(sentRequests).toEqual([{ url: 'https://api.crowdin.com/api/v2/projects/42/strings/7', method: 'GET', body: null, authorization: 'Bearer secret' }])
    })

    it('retries a busy or failing server and then succeeds', async () => {
        const { crowdin, sentRequests } = queuedCrowdin({ responses: [respondWith({ status: 429 }), respondWith({ status: 409 }), respondWith({ status: 503 }), respondWith({ responseBody: { data: { id: 7 } } })] })

        await crowdin.sourceStringsApi.editString(42, 7, RENAME_TO_NEW, { updateOption: 'keep_translations' })

        expect(sentRequests.length).toBe(4)
        expect(sentRequests[3].url).toBe('https://api.crowdin.com/api/v2/projects/42/strings/7?updateOption=keep_translations')
        expect(sentRequests[3].body).toBe(JSON.stringify(RENAME_TO_NEW))
    })

    it('retries a POST that Crowdin turned away as busy', async () => {
        const { crowdin, sentRequests } = queuedCrowdin({ responses: [respondWith({ status: 429 }), respondWith({ status: 409 }), respondWith({ responseBody: { data: { id: 3 } } })] })

        const approval = await crowdin.stringTranslationsApi.addApproval(42, { translationId: 1 })

        expect(approval.data.id).toBe(3)
        expect(sentRequests.map(({ method }) => method)).toEqual(['POST', 'POST', 'POST'])
    })

    it('does not repeat a POST after a server error', async () => {
        const { crowdin, sentRequests } = queuedCrowdin({ responses: [respondWith({ status: 503 })] })

        const error = await crowdin.stringTranslationsApi.addApproval(42, { translationId: 1 }).catch((thrown: unknown) => thrown)

        expect(sentRequests.length).toBe(1)
        expect(statusOf(error)).toBe(503)
    })

    it('gives up after the retries and reports the status', async () => {
        const { crowdin, sentRequests } = queuedCrowdin({ responses: Array.from({ length: 6 }, () => respondWith({ status: 429 })) })

        const error = await crowdin.sourceStringsApi.getString(42, 7).catch((thrown: unknown) => thrown)

        expect(error).toBeInstanceOf(CrowdinError)
        expect(statusOf(error)).toBe(429)
        expect(sentRequests.length).toBe(6)
    })

    it('retries a read after the connection drops', async () => {
        const { crowdin, sentRequests } = queuedCrowdin({ responses: [new TypeError('fetch failed: ECONNRESET'), respondWith({ responseBody: { data: { id: 7 } } })] })

        const crowdinString = await crowdin.sourceStringsApi.getString(42, 7)

        expect(crowdinString.data.id).toBe(7)
        expect(sentRequests.length).toBe(2)
    })

    it('retries a rename and a delete after the connection drops', async () => {
        const { crowdin, sentRequests } = queuedCrowdin({ responses: [new TypeError('fetch failed: ECONNRESET'), respondWith({}), new TypeError('fetch failed: ECONNRESET'), new Response(null, { status: 204 })] })

        await crowdin.sourceStringsApi.editString(42, 7, RENAME_TO_NEW, { updateOption: 'keep_translations' })
        await crowdin.stringTranslationsApi.deleteTranslation(42, 5)

        expect(sentRequests.map(({ method }) => method)).toEqual(['PATCH', 'PATCH', 'DELETE', 'DELETE'])
    })

    it('does not repeat a POST after the connection drops', async () => {
        const { crowdin, sentRequests } = queuedCrowdin({ responses: [new TypeError('fetch failed: ECONNRESET'), respondWith({ responseBody: { data: { id: 1 } } })] })

        const error = await crowdin.stringCommentsApi.addStringComment(42, { stringId: 1, targetLanguageId: 'ja', type: 'issue', issueType: 'translation_mistake', text: 'Check' }).catch((thrown: unknown) => thrown)

        expect(sentRequests.length).toBe(1)
        expect(messageOf(error)).toContain('ECONNRESET')
    })

    it('gives up on a connection that keeps dropping and reports the last error without the token', async () => {
        const { crowdin, sentRequests } = queuedCrowdin({ token: 'secret-token', responses: Array.from({ length: 6 }, () => new TypeError('fetch failed: ECONNRESET')) })

        const error = await crowdin.sourceStringsApi.getString(42, 7).catch((thrown: unknown) => thrown)

        expect(sentRequests.length).toBe(6)
        expect(messageOf(error)).toContain('ECONNRESET')
        expect(messageOf(error)).not.toContain('secret-token')
    })

    it('names the call and the status in the error, but never the token', async () => {
        const { crowdin } = queuedCrowdin({ token: 'secret-token', responses: [respondWith({ status: 400, responseBody: { errors: [{ error: { key: 'text', errors: [{ code: 'tooLong', message: 'Text is too long' }] } }] } })] })

        const error = await crowdin.sourceStringsApi.editString(42, 7, RENAME_TO_NEW, { updateOption: 'keep_translations' }).catch((thrown: unknown) => thrown)

        expect(messageOf(error)).toBe('PATCH /projects/42/strings/7?updateOption=keep_translations -> HTTP 400: Text is too long')
        expect(statusOf(error)).toBe(400)
        expect(messageOf(error)).not.toContain('secret-token')
    })

    it('does not retry a refused call', async () => {
        const { crowdin, sentRequests } = queuedCrowdin({ responses: [respondWith({ status: 403, responseBody: { error: { code: 403, message: 'Forbidden' } } })] })

        const error = await crowdin.sourceStringsApi.getString(42, 7).catch((thrown: unknown) => thrown)

        expect(sentRequests.length).toBe(1)
        expect(messageOf(error)).toContain('Forbidden')
        expect(statusOf(error)).toBe(403)
    })

    it('reads every page of a list', async () => {
        const page = (rowCount: number) => respondWith({ responseBody: { data: Array.from({ length: rowCount }, (_, id) => ({ data: { id } })), pagination: { offset: 0, limit: 500 } } })
        const { crowdin, sentRequests } = queuedCrowdin({ responses: [page(500), page(3)] })

        const crowdinStrings = crowdinProjectApi.resourcesOf({ responseList: await crowdin.sourceStringsApi.withFetchAll().listProjectStrings(42, { fileId: 9 }) })

        expect(crowdinStrings.length).toBe(503)
        expect(sentRequests.map(({ url }) => url.split('/projects/42')[1])).toEqual(['/strings?fileId=9&limit=500&offset=0', '/strings?fileId=9&limit=500&offset=500'])
    })

    it('treats a missing resource as already deleted', async () => {
        const { crowdin } = queuedCrowdin({ responses: [respondWith({ status: 404, responseBody: { error: { code: 404, message: 'Translation Not Found' } } })] })

        const deletion = await crowdinProjectApi.deleteUnlessAlreadyGone({ sendDelete: () => crowdin.stringTranslationsApi.deleteTranslation(42, 5) })

        expect(deletion).toEqual({ ok: true })
    })
})

type SentRequest = {
    url: string
    method: string
    body: string | null
    authorization: string | null
}
