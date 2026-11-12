import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppConnectionType, AppConnectionValueForAuthProperty, createMockActionContext, createMockPollingTriggerContext, TriggerStrategy } from '@activepieces/pieces-framework'
import '../src'
import type { wordpressAuth } from '../src'
import { wordpressNewPost } from '../src/lib/trigger/new-post.trigger'

const storeData = new Map<string, string>()
const vendorCalls: string[] = []

function json({ body, status = 200, headers = {} }: { body: unknown, status?: number, headers?: Record<string, string> }): Response {
    return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } })
}

type Post = { id: number, date: string, date_gmt: string, modified: string, modified_gmt: string, status: string, title: { rendered: string } }
const posts: Post[] = []
function addPost({ ms, i }: { ms: number, i: number }): Post {
    const d = new Date(ms).toISOString().slice(0, 19)
    const p = { id: 1000 + i, date: d, date_gmt: d, modified: d, modified_gmt: d, status: 'publish', title: { rendered: `Post ${i}` } }
    posts.push(p)
    return p
}
function wpList(url: URL): Response {
    const q = url.searchParams
    const after = q.get('after')
    const before = q.get('before')
    const modifiedAfter = q.get('modified_after')
    const perPage = Math.min(Number(q.get('per_page') ?? '10'), 100)
    const page = Number(q.get('page') ?? '1')
    const orderby = q.get('orderby') ?? 'date'
    const dateMs = (p: Post) => Date.parse(p.date + 'Z')
    const modifiedMs = (p: Post) => Date.parse(p.modified + 'Z')
    const key = (p: Post) => (orderby === 'id' ? p.id : orderby === 'modified' ? modifiedMs(p) : dateMs(p))
    const direction = q.get('order') === 'asc' ? 1 : -1
    const matching = posts
        .filter((p) => (q.get('status') ?? 'publish').split(',').includes(p.status))
        .filter(((ids: Set<number> | null) => (p: { id: number }) => ids === null || ids.has(p.id))(q.get('include') ? new Set(q.get('include')!.split(',').map(Number)) : null))
        .filter((p) => (after ? dateMs(p) > Date.parse(after) : true) && (before ? dateMs(p) < Date.parse(before) : true))
        .filter((p) => (modifiedAfter ? modifiedMs(p) > Date.parse(modifiedAfter) : true))
        .sort((a, b) => direction * (key(a) - key(b) || a.id - b.id))
    const totalPages = Math.ceil(matching.length / perPage)
    if (page > 1 && page > totalPages) {
        return json({ body: { code: 'rest_post_invalid_page_number', message: 'The page number requested is larger than the number of pages available.', data: { status: 400 } }, status: 400 })
    }
    return json({ body: matching.slice((page - 1) * perPage, page * perPage), headers: { 'x-wp-total': String(matching.length), 'x-wp-totalpages': String(totalPages) } })
}

function installFetch(): void {
    vi.stubGlobal('fetch', async (input: string | URL | Request, init?: RequestInit) => {
        const url = new URL(typeof input === 'string' || input instanceof URL ? String(input) : input.url)
        const method = (init?.method ?? 'GET').toUpperCase()
        vendorCalls.push(`${method} ${url.host}${url.pathname}${url.search}`)
        if (url.host === 'blog.example.com' && url.pathname === '/wp-json/wp/v2/posts' && method === 'GET') {
            return wpList(url)
        }
        throw new Error(`unexpected request ${method} ${url}`)
    })
}

const T0 = Date.parse('2026-09-01T10:00:00.000Z')
const sec = (n: number) => T0 + n * 1000
const min = (n: number) => T0 + n * 60_000

const store = {
    async put<T>(key: string, value: T) {
        storeData.set(key, JSON.stringify(value))
        return value
    },
    async get<T>(key: string): Promise<T | null> {
        const raw = storeData.get(key)
        return raw === undefined ? null : JSON.parse(raw)
    },
    async delete(key: string) {
        storeData.delete(key)
    },
}

const auth: AppConnectionValueForAuthProperty<typeof wordpressAuth> = {
    type: AppConnectionType.CUSTOM_AUTH,
    props: { website_url: 'https://blog.example.com', username: 'editor', password: 'app-pass' },
}

function ctx() {
    return {
        ...createMockPollingTriggerContext<typeof wordpressNewPost.props>({ propsValue: { authors: undefined } }),
        store,
        auth,
        files: createMockActionContext({ propsValue: {} }).files,
    }
}

const trigger = pollingTrigger()
const seedOld = () => {
    for (let i = 0; i < 10; i++) addPost({ ms: T0 - 86_400_000 + i * 1000, i: 9000 + i })
}
const burst = (n: number) => Array.from({ length: n }, (_, i) => String(addPost({ ms: sec(60 + i), i }).id))
const idOf = (event: unknown) => {
    if (typeof event !== 'object' || event === null || !('id' in event)) {
        throw new Error('event has no id')
    }
    return String(event.id)
}


function pollingTrigger() {
    if (wordpressNewPost.type !== TriggerStrategy.POLLING) {
        throw new Error('expected a polling trigger')
    }
    return wordpressNewPost
}

describe('PIE-980 WordPress New Post loses the rest of a burst', () => {
    beforeEach(() => {
        storeData.clear()
        vendorCalls.length = 0
        posts.length = 0
        installFetch()
        vi.useFakeTimers({ toFake: ['Date'] })
    })
    afterEach(() => {
        vi.useRealTimers()
        vi.unstubAllGlobals()
    })

    it('every item of a burst larger than one page starts the flow exactly once', async () => {
        seedOld()
        vi.setSystemTime(min(0))
        await trigger.onEnable(ctx())
        const burstIds = burst(130)
        const emitted: unknown[] = []
        for (const at of [5, 10, 15]) {
            vi.setSystemTime(min(at))
            emitted.push(...(await trigger.run(ctx())))
        }
        const ids = emitted.map(idOf)
        expect(new Set(ids).size).toBe(ids.length)
        expect([...ids].sort()).toEqual([...burstIds].sort())
    })

    it('control: a burst that fits one page is emitted exactly once', async () => {
        seedOld()
        vi.setSystemTime(min(0))
        await trigger.onEnable(ctx())
        const burstIds = burst(20)
        const emitted: unknown[] = []
        for (const at of [5, 10]) {
            vi.setSystemTime(min(at))
            emitted.push(...(await trigger.run(ctx())))
        }
        const ids = emitted.map(idOf)
        expect([...ids].sort()).toEqual([...burstIds].sort())
    })
})
