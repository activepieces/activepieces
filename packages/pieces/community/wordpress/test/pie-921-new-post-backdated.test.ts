import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppConnectionType, AppConnectionValueForAuthProperty, createMockActionContext, createMockPollingTriggerContext, TriggerStrategy } from '@activepieces/pieces-framework'
import '../src/index'
import type { wordpressAuth } from '../src/index'
import { wordpressNewPost } from '../src/lib/trigger/new-post.trigger'
import { createWordPressPost } from '../src/lib/actions/create-post.action'

const SITE = 'https://blog.test'
const T0 = Date.UTC(2026, 9, 1, 9, 0, 0)
const MIN = 60_000

type WpPost = { id: number, status: string, title: { rendered: string }, date: string, date_gmt: string, modified: string, modified_gmt: string, _date: number, _modified: number }
let storeRows: Map<string, string>
let posts: WpPost[]
let nextId: number

function localWpDate(ms: number): string {
    const d = new Date(ms)
    const p = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}
function gmtWpDate(ms: number): string {
    return new Date(ms).toISOString().slice(0, 19)
}
function parseLocalWpDate(s: string): number {
    const [date, time] = s.split('T')
    const [y, m, d] = date.split('-').map(Number)
    const [hh, mm, ss] = (time ?? '00:00:00').split(':').map(Number)
    return new Date(y, m - 1, d, hh, mm, ss ?? 0).getTime()
}
function setModified({ post, ms }: { post: WpPost, ms: number }): void {
    post._modified = ms
    post.modified = localWpDate(ms)
    post.modified_gmt = gmtWpDate(ms)
}
function addPost({ title, dateMs, modifiedMs, status = 'publish' }: { title: string, dateMs: number, modifiedMs: number, status?: string }): WpPost {
    const post = {
        id: nextId++,
        status,
        title: { rendered: title },
        date: localWpDate(dateMs),
        date_gmt: gmtWpDate(dateMs),
        modified: localWpDate(modifiedMs),
        modified_gmt: gmtWpDate(modifiedMs),
        _date: dateMs,
        _modified: modifiedMs,
    }
    posts.push(post)
    return post
}
function publicPost(p: WpPost) {
    const { _date, _modified, ...rest } = p
    return rest
}

function jsonResponse({ status, body, headers = {} }: { status: number, body: unknown, headers?: Record<string, string> }): Response {
    return new Response(typeof body === 'string' ? body : JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } })
}

function wpList(url: URL): Response {
    const q = url.searchParams
    let list = posts.filter((p) => (q.get('status') ?? 'publish').split(',').includes(p.status))
    if (q.get('include')) list = list.filter(((ids: Set<number> | null) => (p: { id: number }) => ids === null || ids.has(p.id))(q.get('include') ? new Set(q.get('include')!.split(',').map(Number)) : null))
    if (q.get('after')) list = list.filter((p) => p._date > Date.parse(q.get('after')!))
    if (q.get('before')) list = list.filter((p) => p._date < Date.parse(q.get('before')!))
    if (q.get('modified_after')) list = list.filter((p) => p._modified > Date.parse(q.get('modified_after')!))
    const orderby = q.get('orderby') ?? 'date'
    const key = (p: WpPost) => (orderby === 'id' ? p.id : orderby === 'modified' ? p._modified : p._date)
    list.sort((a, b) => (q.get('order') === 'asc' ? key(a) - key(b) || a.id - b.id : key(b) - key(a) || b.id - a.id))
    const perPage = Math.min(Number(q.get('per_page') ?? 10), 100)
    const page = Number(q.get('page') ?? 1)
    const totalPages = Math.ceil(list.length / perPage)
    if (page > 1 && page > totalPages) {
        return jsonResponse({ status: 400, body: { code: 'rest_post_invalid_page_number', message: 'The page number requested is larger than the number of pages available.', data: { status: 400 } } })
    }
    return jsonResponse({ status: 200, body: list.slice((page - 1) * perPage, page * perPage).map(publicPost), headers: { 'x-wp-total': String(list.length), 'x-wp-totalpages': String(totalPages) } })
}

function wpCreate(body: Record<string, unknown>): Response {
    const now = Date.now()
    const dateMs = body['date'] ? parseLocalWpDate(String(body['date'])) : now
    let status = String(body['status'] ?? 'draft')
    if (status === 'publish' && dateMs > now) status = 'future'
    const post = addPost({ title: String(body['title']), dateMs, modifiedMs: body['date'] ? dateMs : now, status })
    return jsonResponse({ status: 201, body: publicPost(post) })
}

async function fakeFetch(...[input, init]: Parameters<typeof fetch>): Promise<Response> {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url)
    const method = (init?.method ?? 'GET').toUpperCase()
    if (url.origin === SITE && (url.pathname === '' || url.pathname === '/')) {
        return new Response('<html></html>', { status: 200, headers: { 'content-type': 'text/html' } })
    }
    if (url.origin === SITE && url.pathname === '/wp-json/wp/v2/posts') {
        return method === 'POST' ? wpCreate(JSON.parse(String(init?.body))) : wpList(url)
    }
    throw new Error('unexpected fetch ' + method + ' ' + url.href)
}

const auth: AppConnectionValueForAuthProperty<typeof wordpressAuth> = { type: AppConnectionType.CUSTOM_AUTH, props: { website_url: SITE, username: 'editor', password: 'app pass' } }
const store = {
    async put<T>(key: string, value: T) {
        storeRows.set(key, JSON.stringify(value))
        return value
    },
    async get<T>(key: string): Promise<T | null> {
        const raw = storeRows.get(key)
        return raw === undefined ? null : JSON.parse(raw)
    },
    async delete(key: string) {
        storeRows.delete(key)
    },
}
function triggerCtx() {
    return {
        ...createMockPollingTriggerContext<typeof wordpressNewPost.props>({ propsValue: { authors: undefined } }),
        auth,
        store,
        files: createMockActionContext({ propsValue: {} }).files,
    }
}
async function createPostAction(changes: Partial<CreatePostPropsValue>): Promise<void> {
    const propsValue: CreatePostPropsValue = { ...EMPTY_CREATE_FORM, ...changes }
    await createWordPressPost.run({ ...createMockActionContext<CreatePostProps>({ propsValue }), auth })
}
function renderedTitle(event: unknown): string {
    if (typeof event !== 'object' || event === null || !('title' in event)) {
        throw new Error('event has no title')
    }
    const title = event.title
    if (typeof title !== 'object' || title === null || !('rendered' in title) || typeof title.rendered !== 'string') {
        throw new Error('title has no rendered text')
    }
    return title.rendered
}
async function poll(): Promise<string[]> {
    const out = await newPostTrigger.run(triggerCtx())
    return out.map(renderedTitle).sort()
}

const newPostTrigger = pollingTrigger()

function pollingTrigger() {
    if (wordpressNewPost.type !== TriggerStrategy.POLLING) {
        throw new Error('expected a polling trigger')
    }
    return wordpressNewPost
}

beforeEach(() => {
    storeRows = new Map()
    posts = []
    nextId = 100
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.stubGlobal('fetch', fakeFetch)
    addPost({ title: 'Old post A', dateMs: T0 - 30 * 24 * 60 * MIN, modifiedMs: T0 - 30 * 24 * 60 * MIN })
    addPost({ title: 'Old post B', dateMs: T0 - 3 * 24 * 60 * MIN, modifiedMs: T0 - 3 * 24 * 60 * MIN })
})
afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
})

describe('PIE-921 WordPress New Post and backdated publishing', () => {
    it('control: a post published normally after enable fires once; an edit of an old post does not', async () => {
        vi.setSystemTime(T0)
        await newPostTrigger.onEnable(triggerCtx())
        vi.setSystemTime(T0 + 2 * MIN)
        await createPostAction({ title: 'Fresh post', content: '<p>x</p>', status: 'publish' })
        vi.setSystemTime(T0 + 3 * MIN)
        setModified({ post: posts[0], ms: Date.now() })
        vi.setSystemTime(T0 + 5 * MIN)
        const first = await poll()
        vi.setSystemTime(T0 + 10 * MIN)
        const second = await poll()
        expect({ first, second }).toEqual({ first: ['Fresh post'], second: [] })
    })

    it('a post published after enable with an earlier Publish Date (Create Post action) fires once', async () => {
        vi.setSystemTime(T0)
        await newPostTrigger.onEnable(triggerCtx())
        vi.setSystemTime(T0 + 2 * MIN)
        await createPostAction({ title: 'Fresh post', content: '<p>x</p>', status: 'publish' })
        vi.setSystemTime(T0 + 5 * MIN)
        const first = await poll()
        vi.setSystemTime(T0 + 7 * MIN)
        const yesterday = new Date(T0 - 24 * 60 * MIN)
        yesterday.setHours(18, 0, 0, 0)
        await createPostAction({ title: 'Imported article', content: '<p>y</p>', status: 'publish', date: localWpDate(yesterday.getTime()) })
        vi.setSystemTime(T0 + 8 * MIN)
        setModified({ post: posts[1], ms: Date.now() })
        vi.setSystemTime(T0 + 10 * MIN)
        const second = await poll()
        vi.setSystemTime(T0 + 15 * MIN)
        const third = await poll()
        expect({ first, second, third }).toEqual({ first: ['Fresh post'], second: ['Imported article'], third: [] })
    })
})

const EMPTY_CREATE_FORM: CreatePostPropsValue = {
    title: '',
    content: '',
    status: undefined,
    date: undefined,
    categories: undefined,
    tags: undefined,
    featured_media: undefined,
    featured_media_file: undefined,
    excerpt: undefined,
    slug: undefined,
    acfFields: undefined,
    comment_status: undefined,
    ping_status: undefined,
}

type CreatePostProps = typeof createWordPressPost.props

type CreatePostPropsValue = Parameters<typeof createMockActionContext<CreatePostProps>>[0]['propsValue']
