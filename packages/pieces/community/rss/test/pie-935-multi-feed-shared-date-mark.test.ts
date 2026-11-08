import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { rssNewItemListTrigger } from '../src/lib/triggers/new-item-list-triggers'
import { DatedItem, fakeFeeds, RouteFeedServer } from './helpers/fake-feeds'

const multi = fakeFeeds.asPolling(rssNewItemListTrigger)
const { guids, memoryStore } = fakeFeeds
const FAST = 0
const SLOW = 250
let srv: RouteFeedServer

beforeAll(async () => {
    srv = await fakeFeeds.startRouteServer()
})
afterAll(async () => { await srv.stop() })

describe('C0360 multi-feed shared pubDate mark', () => {
    it('a new item from a feed that was temporarily failing is still delivered after it recovers', async () => {
        const store = memoryStore()
        const ctx = fakeFeeds.triggerContext({ trigger: multi, propsValue: { rss_feed_urls: [srv.url('/c1-a.xml'), srv.url('/c1-b.xml')] }, store })

        srv.set('/c1-a.xml', { body: rss({ title: 'A', items: [entry({ guid: 'a0', hhmm: '10:00' })] }), delayMs: FAST })
        srv.set('/c1-b.xml', { body: rss({ title: 'B', items: [entry({ guid: 'b0', hhmm: '09:00' })] }), delayMs: SLOW })
        await multi.onEnable(ctx)

        const emitted: string[] = []
        srv.set('/c1-a.xml', { body: rss({ title: 'A', items: [entry({ guid: 'a1', hhmm: '12:02' }), entry({ guid: 'a0', hhmm: '10:00' })] }), delayMs: FAST })
        srv.set('/c1-b.xml', { status: 500, body: 'temporarily unavailable', contentType: 'text/plain' })
        emitted.push(...guids(await multi.run(ctx)))

        srv.set('/c1-b.xml', { body: rss({ title: 'B', items: [entry({ guid: 'b1', hhmm: '12:00' }), entry({ guid: 'b0', hhmm: '09:00' })] }), delayMs: FAST })
        srv.set('/c1-a.xml', { body: rss({ title: 'A', items: [entry({ guid: 'a1', hhmm: '12:02' }), entry({ guid: 'a0', hhmm: '10:00' })] }), delayMs: SLOW })
        emitted.push(...guids(await multi.run(ctx)))
        srv.set('/c1-b.xml', { body: rss({ title: 'B', items: [entry({ guid: 'b1', hhmm: '12:00' }), entry({ guid: 'b0', hhmm: '09:00' })] }), delayMs: SLOW })
        srv.set('/c1-a.xml', { body: rss({ title: 'A', items: [entry({ guid: 'a1', hhmm: '12:02' }), entry({ guid: 'a0', hhmm: '10:00' })] }), delayMs: FAST })
        emitted.push(...guids(await multi.run(ctx)))

        expect(emitted.sort()).toEqual(['a1', 'b1'])
    })

    it('a new item that shows up in a slower-updating feed after another feed\'s newer item is still delivered', async () => {
        const store = memoryStore()
        const ctx = fakeFeeds.triggerContext({ trigger: multi, propsValue: { rss_feed_urls: [srv.url('/c2-a.xml'), srv.url('/c2-b.xml')] }, store })

        srv.set('/c2-a.xml', { body: rss({ title: 'A', items: [entry({ guid: 'a0', hhmm: '10:00' })] }), delayMs: FAST })
        srv.set('/c2-b.xml', { body: rss({ title: 'B', items: [entry({ guid: 'b0', hhmm: '09:00' })] }), delayMs: SLOW })
        await multi.onEnable(ctx)

        const emitted: string[] = []
        srv.set('/c2-a.xml', { body: rss({ title: 'A', items: [entry({ guid: 'a1', hhmm: '12:02' }), entry({ guid: 'a0', hhmm: '10:00' })] }), delayMs: FAST })
        srv.set('/c2-b.xml', { body: rss({ title: 'B', items: [entry({ guid: 'b0', hhmm: '09:00' })] }), delayMs: SLOW })
        emitted.push(...guids(await multi.run(ctx)))

        srv.set('/c2-b.xml', { body: rss({ title: 'B', items: [entry({ guid: 'b1', hhmm: '12:00' }), entry({ guid: 'b0', hhmm: '09:00' })] }), delayMs: FAST })
        srv.set('/c2-a.xml', { body: rss({ title: 'A', items: [entry({ guid: 'a1', hhmm: '12:02' }), entry({ guid: 'a0', hhmm: '10:00' })] }), delayMs: SLOW })
        emitted.push(...guids(await multi.run(ctx)))
        srv.set('/c2-b.xml', { body: rss({ title: 'B', items: [entry({ guid: 'b1', hhmm: '12:00' }), entry({ guid: 'b0', hhmm: '09:00' })] }), delayMs: SLOW })
        srv.set('/c2-a.xml', { body: rss({ title: 'A', items: [entry({ guid: 'a1', hhmm: '12:02' }), entry({ guid: 'a0', hhmm: '10:00' })] }), delayMs: FAST })
        emitted.push(...guids(await multi.run(ctx)))

        expect(emitted.sort()).toEqual(['a1', 'b1'])
    })
})

function rss({ title, items }: { title: string; items: DatedItem[] }): string {
    return fakeFeeds.rssDocument({ title, items })
}

function entry({ guid, hhmm }: { guid: string; hhmm: string }): DatedItem {
    return { guid, title: guid, pubDate: new Date(`2026-09-01T${hhmm}:00Z`) }
}
