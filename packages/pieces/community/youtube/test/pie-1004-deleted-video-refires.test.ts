/// <reference types="vitest/globals" />
import { describe, expect, test, vi } from 'vitest'
import { httpClient } from '@activepieces/pieces-common'
import { Store, TriggerStrategy } from '@activepieces/pieces-framework'
import { createMockActionContext, createMockPollingTriggerContext } from '../../../framework/src/lib/test'
import { youtube } from '../src/index'

const memoryStore = new Map<string, unknown>()
const store: Store = {
    async put<T>(key: string, value: T): Promise<T> { memoryStore.set(key, value); return value },
    async get<T>(key: string): Promise<T | null> { return memoryStore.has(key) ? cloneJson(memoryStore.get(key)) : null },
    async delete(key: string): Promise<void> { memoryStore.delete(key) },
}

function cloneJson(value: unknown) {
    return JSON.parse(JSON.stringify(value))
}

type Video = { id: string, published: string }
let feed: Video[] = []
function feedXml(videos: Video[]): string {
    const entries = videos.map((v) => `<entry><id>yt:video:${v.id}</id><yt:videoId>${v.id}</yt:videoId><title>Video ${v.id}</title><link rel="alternate" href="https://www.youtube.com/watch?v=${v.id}"/><published>${v.published}</published><updated>${v.published}</updated></entry>`).join('')
    return `<?xml version="1.0" encoding="UTF-8"?><feed xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns="http://www.w3.org/2005/Atom"><id>yt:channel:UCchan</id><title>Chan</title>${entries}</feed>`
}
vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (req: { url: string }) => {
    if (!req.url.startsWith('https://www.youtube.com/feeds/videos.xml')) {
        throw new Error('unexpected request ' + req.url)
    }
    return { status: 200, headers: {}, body: Buffer.from(feedXml(feed)) }
})

const trigger = () => pollingTrigger()

function pollingTrigger() {
    const found = youtube.getTrigger('new-video')
    if (found?.type !== TriggerStrategy.POLLING) {
        throw new Error('expected a polling trigger')
    }
    return found
}

function ctx({ isRepublish = false }: { isRepublish?: boolean } = {}) {
    return {
        ...createMockPollingTriggerContext({ propsValue: { channel_identifier: 'UCchan' } }),
        auth: undefined,
        store,
        files: createMockActionContext({ propsValue: {} }).files,
        isRepublish,
    }
}

function guidOf(event: unknown): { guid?: string } {
    if (typeof event !== 'object' || event === null || !('guid' in event)) {
        return {}
    }
    return typeof event.guid === 'string' ? { guid: event.guid } : {}
}

async function hook(hookType: 'ON_ENABLE' | 'RUN'): Promise<Array<{ guid?: string }>> {
    if (hookType === 'ON_ENABLE') {
        await trigger().onEnable(ctx())
        return []
    }
    return (await trigger().run(ctx())).map(guidOf)
}

const vid = (n: number) => ({ id: `VIDEO${String(n).padStart(6, '0')}`, published: new Date(Date.UTC(2026, 8, 1 + n, 10)).toISOString() })
const newestFirst = ({ from, to }: { from: number, to: number }) => Array.from({ length: to - from + 1 }, (_, i) => vid(to - i))

describe('C0270-n1 YouTube New Video when the newest video is removed', () => {
    test('control: a genuinely new upload is emitted once', async () => {
        memoryStore.clear()
        feed = newestFirst({ from: 0, to: 14 })
        await hook('ON_ENABLE')
        feed = newestFirst({ from: 1, to: 15 })
        const out = await hook('RUN')
        expect(out.map((i) => i.guid)).toEqual([`yt:video:${vid(15).id}`])
    })

    test('deleting the newest video does not re-emit an old video as new', async () => {
        memoryStore.clear()
        feed = newestFirst({ from: 0, to: 14 })
        await hook('ON_ENABLE')
        feed = newestFirst({ from: 1, to: 15 })
        expect((await hook('RUN')).map((i) => i.guid)).toEqual([`yt:video:${vid(15).id}`])
        feed = newestFirst({ from: 0, to: 14 })
        const out = await hook('RUN')
        expect(out.map((i) => i.guid)).toEqual([])
    })
})
