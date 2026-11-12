import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Store, TriggerStrategy } from '@activepieces/pieces-framework'
import { createMockActionContext, createMockPollingTriggerContext } from '../../../framework/src/lib/test'
import { youtube } from '../src/index'

const CHANNEL_A = 'UCaaaaaaaaaaaaaaaaaaaaaa'
const CHANNEL_B = 'UCbbbbbbbbbbbbbbbbbbbbbb'

function feed({ channelId, videoIds }: { channelId: string, videoIds: string[] }) {
    const entries = videoIds.map((id, i) => `<entry><id>yt:video:${id}</id><yt:videoId>${id}</yt:videoId><title>${channelId} video ${i}</title>
  <link rel="alternate" href="https://www.youtube.com/watch?v=${id}"/><published>2026-09-${String(20 - i).padStart(2, '0')}T10:00:00+00:00</published></entry>`).join('\n')
    return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns="http://www.w3.org/2005/Atom"><title>${channelId}</title>
<yt:channelId>${channelId}</yt:channelId>${entries}</feed>`
}
const FEEDS: Record<string, string> = {
    [CHANNEL_A]: feed({ channelId: CHANNEL_A, videoIds: ['aaaaaaaaaa1', 'aaaaaaaaaa2'] }),
    [CHANNEL_B]: feed({ channelId: CHANNEL_B, videoIds: ['bbbbbbbbbb1', 'bbbbbbbbbb2'] }),
}

function fakeYouTube(input: string | URL | Request): Response {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url)
    if (url.hostname === 'www.youtube.com' && url.pathname === '/feeds/videos.xml') {
        const body = FEEDS[url.searchParams.get('channel_id') ?? '']
        return body ? new Response(body, { status: 200, headers: { 'content-type': 'text/xml' } }) : new Response('', { status: 404 })
    }
    return new Response('not found', { status: 404 })
}

function flowStore(): Store {
    const data = new Map<string, unknown>()
    return {
        async get<T>(key: string): Promise<T | null> {
            return data.has(key) ? cloneJson(data.get(key)) : null
        },
        async put<T>(key: string, value: T): Promise<T> {
            data.set(key, value)
            return value
        },
        async delete(key: string): Promise<void> {
            data.delete(key)
        },
    }
}

function cloneJson(value: unknown) {
    return JSON.parse(JSON.stringify(value))
}

const trigger = () => pollingTrigger()

function pollingTrigger() {
    const found = youtube.getTrigger('new-video')
    if (found?.type !== TriggerStrategy.POLLING) {
        throw new Error('expected a polling trigger')
    }
    return found
}

function hookContext({ store, channel }: { store: Store, channel: string }) {
    return {
        ...createMockPollingTriggerContext({ propsValue: { channel_identifier: channel } }),
        auth: undefined,
        store,
        files: createMockActionContext({ propsValue: {} }).files,
    }
}

function guids(events: unknown[]): string[] {
    return events.map((event) => {
        if (typeof event !== 'object' || event === null || !('guid' in event)) {
            throw new Error('event has no guid')
        }
        return String(event.guid)
    })
}

beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async (input: string | URL | Request) => fakeYouTube(input)))
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
})

afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
})

describe('YouTube New Video trigger follows the channel currently configured', () => {
    it('Test after changing the channel returns the new channel videos', async () => {
        const testStore = flowStore()
        const first = await trigger().test(hookContext({ store: testStore, channel: CHANNEL_A }))
        expect(guids(first)).toContain('yt:video:aaaaaaaaaa1')

        const second = await trigger().test(hookContext({ store: testStore, channel: CHANNEL_B }))
        expect(guids(second)).toEqual(['yt:video:bbbbbbbbbb2', 'yt:video:bbbbbbbbbb1'])
    })

    it('publishing again after fixing a mistyped channel id succeeds', async () => {
        const liveStore = flowStore()
        const typo = CHANNEL_B.slice(0, -1)
        await expect(
            trigger().onEnable(hookContext({ store: liveStore, channel: typo })),
        ).rejects.toBeDefined()

        await expect(
            trigger().onEnable(hookContext({ store: liveStore, channel: CHANNEL_B })),
        ).resolves.toBeUndefined()
        expect(await liveStore.get('_seenVideoIds')).toEqual(['yt:video:bbbbbbbbbb1', 'yt:video:bbbbbbbbbb2'])
    })
})
