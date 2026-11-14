import { describe, expect, it } from 'bun:test'
import { crowdinClient, CrowdinError } from './crowdin-client'

const respond = ({ status = 200, body = {} }: { status?: number, body?: unknown }): Response => new Response(JSON.stringify(body), { status })

const stubFetch = ({ responses }: { responses: Response[] }) => {
    const calls: { url: string, method: string, body: string | null, authorization: string | null }[] = []
    const queue = [...responses]
    const fetchImpl = async (url: string, init: RequestInit): Promise<Response> => {
        calls.push({ url, method: init.method ?? 'GET', body: typeof init.body === 'string' ? init.body : null, authorization: new Headers(init.headers).get('Authorization') })
        const next = queue.shift()
        if (next === undefined) {
            throw new Error('no response queued')
        }
        return next
    }
    return { calls, fetchImpl }
}

const noSleep = async (): Promise<void> => undefined

describe('crowdinClient', () => {
    it('calls the project with the token', async () => {
        const { calls, fetchImpl } = stubFetch({ responses: [respond({ body: { data: { id: 7 } } })] })
        const client = crowdinClient.create({ token: 'secret', projectId: '42', fetchImpl, sleep: noSleep })

        const result = await client.get<{ data: { id: number } }>({ path: '/strings/7' })

        expect(result.data.id).toBe(7)
        expect(calls).toEqual([{ url: 'https://api.crowdin.com/api/v2/projects/42/strings/7', method: 'GET', body: null, authorization: 'Bearer secret' }])
    })

    it('retries a busy or failing server and then succeeds', async () => {
        const { calls, fetchImpl } = stubFetch({ responses: [respond({ status: 429 }), respond({ status: 409 }), respond({ status: 503 }), respond({ body: { ok: true } })] })
        const client = crowdinClient.create({ token: 't', projectId: '42', fetchImpl, sleep: noSleep })

        await client.patch({ path: '/strings/7?updateOption=keep_translations', body: [{ op: 'replace', path: '/text', value: 'New' }] })

        expect(calls.length).toBe(4)
        expect(calls[3].body).toBe(JSON.stringify([{ op: 'replace', path: '/text', value: 'New' }]))
    })

    it('does not repeat a POST after a server error', async () => {
        const { calls, fetchImpl } = stubFetch({ responses: [respond({ status: 503 })] })
        const client = crowdinClient.create({ token: 't', projectId: '42', fetchImpl, sleep: noSleep })

        const error = await client.post({ path: '/approvals', body: { translationId: 1 } }).catch((e: unknown) => e)

        expect(calls.length).toBe(1)
        expect(error instanceof CrowdinError ? error.status : null).toBe(503)
    })

    it('gives up after the retries and reports the status', async () => {
        const { fetchImpl } = stubFetch({ responses: Array.from({ length: 6 }, () => respond({ status: 429 })) })
        const client = crowdinClient.create({ token: 't', projectId: '42', fetchImpl, sleep: noSleep })

        const error = await client.get({ path: '/strings/7' }).catch((e: unknown) => e)

        expect(error).toBeInstanceOf(CrowdinError)
        expect(error instanceof CrowdinError ? error.status : null).toBe(429)
    })

    it('does not retry a refused call', async () => {
        const { calls, fetchImpl } = stubFetch({ responses: [respond({ status: 403, body: { error: { message: 'Forbidden' } } })] })
        const client = crowdinClient.create({ token: 't', projectId: '42', fetchImpl, sleep: noSleep })

        const error = await client.get({ path: '/strings/7' }).catch((e: unknown) => e)

        expect(calls.length).toBe(1)
        expect(error instanceof CrowdinError ? error.message : '').toContain('Forbidden')
    })

    it('reads every page of a list', async () => {
        const page = (count: number) => respond({ body: { data: Array.from({ length: count }, (_, id) => ({ data: { id } })) } })
        const { calls, fetchImpl } = stubFetch({ responses: [page(500), page(3)] })
        const client = crowdinClient.create({ token: 't', projectId: '42', fetchImpl, sleep: noSleep })

        const rows = await client.list<{ id: number }>({ path: '/strings?fileId=9' })

        expect(rows.length).toBe(503)
        expect(calls.map(({ url }) => url.split('/projects/42')[1])).toEqual(['/strings?fileId=9&limit=500&offset=0', '/strings?fileId=9&limit=500&offset=500'])
    })

    it('refuses to write when it is read-only', async () => {
        const { calls, fetchImpl } = stubFetch({ responses: [] })
        const client = crowdinClient.create({ token: 't', projectId: '42', readOnly: true, fetchImpl, sleep: noSleep })

        const error = await client.del({ path: '/translations/5' }).catch((e: unknown) => e)

        expect(error instanceof Error ? error.message : '').toContain('read-only')
        expect(calls).toEqual([])
    })
})
