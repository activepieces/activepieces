import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { hubspotTestKit } from './support/hubspot-test-kit'
import { newBlogArticleTrigger as trigger } from '../src/lib/triggers/new-blog-article'

type Post = { id: string, state: string, created: string, publishDate: string }
const blog: { posts: Post[] } = { posts: [] }
let clock = Date.parse('2026-11-01T10:00:00.000Z')
const tick = (ms = 60_000) => {
    clock += ms
    return new Date(clock).toISOString()
}

function draft({ id, at }: { id: string, at?: string }) {
    const time = at ?? tick()
    blog.posts.push({ id, state: 'DRAFT', created: time, publishDate: time })
}

function publish({ id }: { id: string }) {
    const post = blog.posts.find((candidate) => candidate.id === id)!
    post.state = 'PUBLISHED'
    post.publishDate = tick()
}

function route(url: URL): unknown {
    let rows = blog.posts.filter((post) => post.state === url.searchParams.get('state'))
    const pub = url.searchParams.get('publishDate__gt')
    if (pub) rows = rows.filter((post) => Date.parse(post.publishDate) > Number(pub))
    const created = url.searchParams.get('createdAt__gt')
    if (created) rows = rows.filter((post) => Date.parse(post.created) > Number(created))
    rows.sort((a, b) => Date.parse(b.created) - Date.parse(a.created))
    const limit = Number(url.searchParams.get('limit') ?? 20)
    const offset = Number(url.searchParams.get('after') ?? 0)
    const page = rows.slice(offset, offset + limit)
    return { total: rows.length, results: page, ...(offset + limit < rows.length ? { paging: { next: { after: String(offset + limit) } } } : {}) }
}

function memoryStore() {
    const data = new Map<string, string>()
    return {
        put: async <T>(k: string, v: T) => {
            data.set(k, JSON.stringify(v))
            return v
        },
        get: async <T>(k: string): Promise<T | null> => {
            const raw = data.get(k)
            return raw === undefined ? null : JSON.parse(raw)
        },
        delete: async (k: string) => {
            data.delete(k)
        },
    }
}

type Store = ReturnType<typeof memoryStore>
const ctx = ({ store, articleState = 'BOTH', isRepublish }: { store: Store, articleState?: string, isRepublish?: boolean }) =>
    hubspotTestKit.pollingContext({ store, propsValue: { articleState }, isRepublish })
const ids = (events: unknown[]) => hubspotTestKit.ids({ events })

beforeEach(() => {
    blog.posts = []
    clock = Date.parse('2026-11-01T10:00:00.000Z')
    vi.spyOn(Date, 'now').mockImplementation(() => clock)
    vi.stubGlobal('fetch', vi.fn(async (input: string | URL | Request) => {
        const url = new URL(typeof input === 'string' || input instanceof URL ? String(input) : input.url)
        return new Response(JSON.stringify(route(url)), { status: 200, headers: { 'content-type': 'application/json' } })
    }))
})

afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
})

describe('New Blog Post behaviour (Both)', () => {
    it('fires for a new draft and again when an old draft is published, once each, across a republish', async () => {
        draft({ id: 'old-draft' })
        const store = memoryStore()
        tick()
        await trigger.onEnable(ctx({ store }))
        expect(await trigger.run(ctx({ store }))).toEqual([])
        draft({ id: 'new-draft' })
        expect(ids(await trigger.run(ctx({ store })))).toEqual(['new-draft'])
        expect(await trigger.run(ctx({ store }))).toEqual([])
        publish({ id: 'old-draft' })
        await trigger.onDisable(ctx({ store, isRepublish: true }))
        await trigger.onEnable(ctx({ store, isRepublish: true }))
        expect(ids(await trigger.run(ctx({ store })))).toEqual(['old-draft'])
        expect(await trigger.run(ctx({ store }))).toEqual([])
    })

    it('emits a burst of more than one page oldest first', async () => {
        const store = memoryStore()
        await trigger.onEnable(ctx({ store }))
        const burst = Array.from({ length: 130 }, (_, index) => `post-${String(index).padStart(3, '0')}`)
        burst.forEach((id) => draft({ id, at: tick(1000) }))
        expect(ids(await trigger.run(ctx({ store })))).toEqual(burst)
        expect(await trigger.run(ctx({ store }))).toEqual([])
    })

    it('test() returns the newest posts, oldest to newest', async () => {
        draft({ id: 'older' })
        draft({ id: 'newest' })
        expect(ids(await trigger.test(ctx({ store: memoryStore() }))).at(-1)).toBe('newest')
    })
})
