import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { rssNewItemListTrigger } from '../src/lib/triggers/new-item-list-triggers'
import { rssNewItemTrigger } from '../src/lib/triggers/new-item-trigger'
import { DatedItem, fakeFeeds, RouteFeedServer } from './helpers/fake-feeds'

const single = fakeFeeds.asPolling(rssNewItemTrigger)
const multi = fakeFeeds.asPolling(rssNewItemListTrigger)
const { guids, memoryStore } = fakeFeeds
let srv: RouteFeedServer

beforeAll(async () => {
    srv = await fakeFeeds.startRouteServer()
})
afterAll(async () => { await srv.stop() })

describe('C0372 RSS date guard lost on publish', () => {
    it('multi-feed: after republishing, no already-seen entries are re-sent when feed response order changes', async () => {
        const store = memoryStore()
        const ctx = fakeFeeds.triggerContext({ trigger: multi, propsValue: { rss_feed_urls: [srv.url('/r1-a.xml'), srv.url('/r1-b.xml')] }, store })
        const feedA = [entry({ guid: 'a3', hhmm: '11:00' }), entry({ guid: 'a2', hhmm: '10:00' }), entry({ guid: 'a1', hhmm: '09:00' })]
        const feedB = [entry({ guid: 'b3', hhmm: '10:30' }), entry({ guid: 'b2', hhmm: '09:30' }), entry({ guid: 'b1', hhmm: '08:30' })]
        srv.set('/r1-a.xml', { body: rss({ title: 'A', items: feedA }), delayMs: 0 })
        srv.set('/r1-b.xml', { body: rss({ title: 'B', items: feedB }), delayMs: 250 })

        await multi.onEnable(ctx)
        srv.set('/r1-a.xml', { body: rss({ title: 'A', items: [entry({ guid: 'a4', hhmm: '12:00' }), ...feedA] }), delayMs: 0 })
        const first = guids(await multi.run(ctx))
        expect(first).toEqual(['a4'])

        await multi.onDisable(ctx)
        await multi.onEnable({ ...ctx, isRepublish: true })

        srv.set('/r1-a.xml', { body: rss({ title: 'A', items: [entry({ guid: 'a4', hhmm: '12:00' }), ...feedA] }), delayMs: 250 })
        srv.set('/r1-b.xml', { body: rss({ title: 'B', items: feedB }), delayMs: 0 })
        const afterPublish = guids(await multi.run(ctx))

        expect(afterPublish).toEqual([])
    })

    it('single feed: after republishing, removing the newest post does not re-send the rest of the feed', async () => {
        const store = memoryStore()
        const ctx = fakeFeeds.triggerContext({ trigger: single, propsValue: { rss_feed_url: srv.url('/r2.xml') }, store })
        const older = olderPosts()
        srv.set('/r2.xml', { body: rss({ title: 'Blog', items: older }) })

        await single.onEnable(ctx)
        srv.set('/r2.xml', { body: rss({ title: 'Blog', items: [entry({ guid: 'p6', hhmm: '12:00' }), ...older] }) })
        expect(guids(await single.run(ctx))).toEqual(['p6'])

        await single.onDisable(ctx)
        await single.onEnable({ ...ctx, isRepublish: true })
        srv.set('/r2.xml', { body: rss({ title: 'Blog', items: older }) })
        const afterPublish = guids(await single.run(ctx))

        expect(afterPublish).toEqual([])
    })

    it('control: same steps without the publish in between re-send nothing', async () => {
        const store = memoryStore()
        const ctx = fakeFeeds.triggerContext({ trigger: single, propsValue: { rss_feed_url: srv.url('/r3.xml') }, store })
        const older = olderPosts()
        srv.set('/r3.xml', { body: rss({ title: 'Blog', items: older }) })

        await single.onEnable(ctx)
        srv.set('/r3.xml', { body: rss({ title: 'Blog', items: [entry({ guid: 'p6', hhmm: '12:00' }), ...older] }) })
        expect(guids(await single.run(ctx))).toEqual(['p6'])

        srv.set('/r3.xml', { body: rss({ title: 'Blog', items: older }) })
        expect(guids(await single.run(ctx))).toEqual([])
    })
})

function olderPosts(): DatedItem[] {
    return [
        entry({ guid: 'p5', hhmm: '11:00' }),
        entry({ guid: 'p4', hhmm: '10:00' }),
        entry({ guid: 'p3', hhmm: '09:00' }),
        entry({ guid: 'p2', hhmm: '08:00' }),
        entry({ guid: 'p1', hhmm: '07:00' }),
    ]
}

function entry({ guid, hhmm }: { guid: string; hhmm: string }): DatedItem {
    return { guid, title: guid, pubDate: new Date(`2026-09-01T${hhmm}:00Z`) }
}

function rss({ title, items }: { title: string; items: DatedItem[] }): string {
    return fakeFeeds.rssDocument({ title, items })
}
