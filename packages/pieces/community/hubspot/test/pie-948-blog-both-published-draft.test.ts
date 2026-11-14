import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { hubspotTestKit } from './support/hubspot-test-kit'
import { newBlogArticleTrigger } from '../src/lib/triggers/new-blog-article'

type Post = { id: string, name: string, state: string, currentState: string, created: string, updated: string, publishDate: string }
const posts: Post[] = []
const iso = (ms: number) => new Date(ms).toISOString()

function addPost(p: { id: string, state: 'PUBLISHED' | 'DRAFT', created: number, publishDate: number }): void {
    posts.push({ id: p.id, name: p.id, state: p.state, currentState: p.state, created: iso(p.created), updated: iso(p.created), publishDate: iso(p.publishDate) })
}

function listPosts(url: URL): unknown {
    let rows = [...posts]
    const state = url.searchParams.get('state')
    if (state) rows = rows.filter((p) => p.state === state)
    const pub = url.searchParams.get('publishDate__gt')
    if (pub) rows = rows.filter((p) => Date.parse(p.publishDate) > Number(pub))
    const created = url.searchParams.get('createdAt__gt')
    if (created) rows = rows.filter((p) => Date.parse(p.created) > Number(created))
    rows.sort((a, b) => Date.parse(b.created) - Date.parse(a.created))
    const limit = Number(url.searchParams.get('limit') ?? '20')
    const offset = Number(url.searchParams.get('after') ?? '0')
    const page = rows.slice(offset, offset + limit)
    const next = offset + limit < rows.length ? { paging: { next: { after: String(offset + limit), link: '' } } } : {}
    return { total: rows.length, results: page, ...next }
}

beforeEach(() => {
    posts.length = 0
    vi.stubGlobal('fetch', vi.fn(async (input: string | URL | Request) => {
        const url = hubspotTestKit.requestUrl({ input })
        if (url.pathname !== '/cms/v3/blogs/posts') {
            return new Response(JSON.stringify({ message: 'not modelled' }), { status: 404 })
        }
        return new Response(JSON.stringify(listPosts(url)), { status: 200, headers: { 'content-type': 'application/json' } })
    }))
})

afterEach(() => {
    vi.unstubAllGlobals()
})

async function scenario({ articleState }: { articleState: string }): Promise<string[]> {
    const store = hubspotTestKit.memoryStore()
    const ctx = hubspotTestKit.pollingContext({ store, propsValue: { articleState } })
    const enabledAt = Date.now() - 60 * 60_000
    addPost({ id: 'old-draft', state: 'DRAFT', created: enabledAt - 5 * 24 * 3600_000, publishDate: enabledAt - 5 * 24 * 3600_000 })
    addPost({ id: 'old-live', state: 'PUBLISHED', created: enabledAt - 9 * 24 * 3600_000, publishDate: enabledAt - 9 * 24 * 3600_000 })
    await store.put('lastPoll', enabledAt)
    const fired: string[] = []
    const poll = async () => fired.push(...hubspotTestKit.ids({ events: await newBlogArticleTrigger.run(ctx) }))
    await poll()
    const draft = posts.find((p) => p.id === 'old-draft')!
    draft.state = 'PUBLISHED'
    draft.currentState = 'PUBLISHED'
    draft.publishDate = iso(enabledAt + 10 * 60_000)
    await poll()
    if (articleState === 'BOTH') {
        addPost({ id: 'new-draft', state: 'DRAFT', created: enabledAt + 20 * 60_000, publishDate: enabledAt + 20 * 60_000 })
    }
    await poll()
    await poll()
    return fired
}

describe('PIE-948 HubSpot New Blog Post: Both includes what Published Only and Draft Only include', () => {
    it('control - Published Only: publishing an older draft starts the flow once', async () => {
        const ids = await scenario({ articleState: 'PUBLISHED' })
        expect(ids).toEqual(['old-draft'])
    })

    it('Both: publishing an older draft starts the flow once, and a new draft starts it once', async () => {
        const ids = await scenario({ articleState: 'BOTH' })
        expect(ids.filter((id) => id === 'old-draft')).toHaveLength(1)
        expect(ids.filter((id) => id === 'new-draft')).toHaveLength(1)
        expect(ids).not.toContain('old-live')
    })
})
