import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppConnectionType, AppConnectionValueForAuthProperty, TriggerStrategy } from '@activepieces/pieces-framework'
import { googleTasksAuth } from '../src/lib/auth'
import { createMockActionContext, createMockPollingTriggerContext } from '../../../framework/src/lib/test'
import { newTaskTrigger } from '../src/lib/triggers/new-task'

type FakeTask = { kind: 'tasks#task', id: string, title: string, status: 'needsAction' | 'completed', updated: string, completed?: string }
const storeData = new Map<string, string>()
const tasks: FakeTask[] = []

function json({ body }: { body: unknown }): Response {
    return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } })
}

function installFetch(): void {
    vi.stubGlobal('fetch', vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
        const url = new URL(typeof input === 'string' || input instanceof URL ? String(input) : input.url)
        const method = (init?.method ?? 'GET').toUpperCase()
        if (url.host === 'tasks.googleapis.com' && url.pathname === '/tasks/v1/lists/list-1/tasks' && method === 'GET') {
            const updatedMin = url.searchParams.get('updatedMin')
            const visible = tasks.filter((t) => updatedMin === null || Date.parse(t.updated) >= Date.parse(updatedMin))
            return json({ body: { kind: 'tasks#tasks', etag: 'e', items: visible.map((t) => ({ ...t })) } })
        }
        throw new Error(`unexpected request ${method} ${url}`)
    }))
}

const auth: AppConnectionValueForAuthProperty<typeof googleTasksAuth> = {
    type: AppConnectionType.OAUTH2,
    access_token: 'ya29.test',
    refresh_token: 'refresh',
    token_type: 'Bearer',
    client_id: 'client',
    client_secret: 'secret',
    redirect_url: 'https://example.com/redirect',
    claimed_at: 0,
    scope: 'https://www.googleapis.com/auth/tasks',
    token_url: 'https://oauth2.googleapis.com/token',
    props: {},
    data: {},
}

const T0 = Date.parse('2026-09-01T10:00:00.000Z')
const min = (n: number) => T0 + n * 60_000
const iso = (ms: number) => new Date(ms).toISOString()

function ctx({ runOn }: { runOn?: string }) {
    return {
        ...createMockPollingTriggerContext<typeof newTaskTrigger.props>({ propsValue: { tasks_list: 'list-1', run_on: runOn, info: undefined } }),
        store: {
            put: async <T>(k: string, v: T) => { storeData.set(k, JSON.stringify(v)); return v },
            get: async <T>(k: string): Promise<T | null> => {
                const raw = storeData.get(k)
                return raw === undefined ? null : JSON.parse(raw)
            },
            delete: async (k: string) => { storeData.delete(k) },
        },
        auth,
        files: createMockActionContext({ propsValue: {} }).files,
    }
}

const trigger = pollingTrigger()

function pollingTrigger() {
    if (newTaskTrigger.type !== TriggerStrategy.POLLING) {
        throw new Error('expected a polling trigger')
    }
    return newTaskTrigger
}

function field({ event, key }: { event: unknown; key: string }): unknown {
    if (typeof event !== 'object' || event === null || !(key in event)) {
        throw new Error(`event has no ${key}`)
    }
    return Object.entries(event).find(([name]) => name === key)?.[1]
}

const ids = (events: unknown[]) => events.map((event) => String(field({ event, key: 'id' })))

async function editExistingTasks(): Promise<void> {
    const quote = tasks.find((t) => t.id === 'old-quote')
    const invoice = tasks.find((t) => t.id === 'old-invoice')
    if (!quote || !invoice) throw new Error('seed tasks missing')
    quote.title = 'Send quote (v2)'
    quote.updated = iso(min(7))
    invoice.status = 'completed'
    invoice.completed = iso(min(8))
    invoice.updated = iso(min(8))
}

describe("PIE-997 Google Tasks 'New Task'", () => {
    beforeEach(() => {
        storeData.clear()
        tasks.length = 0
        installFetch()
        vi.useFakeTimers({ toFake: ['Date'] })
        tasks.push({ kind: 'tasks#task', id: 'old-quote', title: 'Send quote', status: 'needsAction', updated: '2026-08-01T09:00:00.000Z' })
        tasks.push({ kind: 'tasks#task', id: 'old-invoice', title: 'Chase invoice', status: 'needsAction', updated: '2026-08-02T09:00:00.000Z' })
    })
    afterEach(() => {
        vi.useRealTimers()
        vi.unstubAllGlobals()
    })

    it('does not start the flow when an existing task is edited or completed, only when one is created (Run on = new_only)', async () => {
        vi.setSystemTime(min(0))
        await trigger.onEnable(ctx({ runOn: 'new_only' }))

        vi.setSystemTime(min(5))
        expect(await trigger.run(ctx({ runOn: 'new_only' }))).toEqual([])

        await editExistingTasks()
        vi.setSystemTime(min(10))
        expect(ids(await trigger.run(ctx({ runOn: 'new_only' })))).toEqual([])

        tasks.unshift({ kind: 'tasks#task', id: 'new-call', title: 'Call supplier', status: 'needsAction', updated: iso(min(12)) })
        vi.setSystemTime(min(15))
        expect(ids(await trigger.run(ctx({ runOn: 'new_only' })))).toEqual(['new-call'])

        tasks[0].title = 'Call supplier re: delivery'
        tasks[0].updated = iso(min(17))
        vi.setSystemTime(min(20))
        expect(ids(await trigger.run(ctx({ runOn: 'new_only' })))).toEqual([])
    })

    it.each([
        { label: 'Run on left empty (existing flows)', runOn: undefined },
        { label: 'Run on = new_and_edited', runOn: 'new_and_edited' },
    ])('keeps firing once per edit when $label', async ({ runOn }) => {
        vi.setSystemTime(min(0))
        await trigger.onEnable(ctx({ runOn }))

        vi.setSystemTime(min(5))
        expect(await trigger.run(ctx({ runOn }))).toEqual([])

        await editExistingTasks()
        vi.setSystemTime(min(10))
        expect(ids(await trigger.run(ctx({ runOn })))).toEqual(['old-invoice', 'old-quote'])

        vi.setSystemTime(min(12))
        expect(await trigger.run(ctx({ runOn }))).toEqual([])

        tasks.unshift({ kind: 'tasks#task', id: 'new-call', title: 'Call supplier', status: 'needsAction', updated: iso(min(13)) })
        vi.setSystemTime(min(15))
        expect(ids(await trigger.run(ctx({ runOn })))).toEqual(['new-call'])
    })

    it('a flow enabled before the upgrade (only lastPoll stored, Run on empty) behaves like main', async () => {
        storeData.set('lastPoll', JSON.stringify(min(0)))
        await editExistingTasks()
        vi.setSystemTime(min(10))
        expect(ids(await trigger.run(ctx({})))).toEqual(['old-invoice', 'old-quote'])
        vi.setSystemTime(min(12))
        expect(await trigger.run(ctx({}))).toEqual([])
    })
})
