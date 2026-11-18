import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { rssNewItemListTrigger } from '../src/lib/triggers/new-item-list-triggers'
import { rssNewItemTrigger } from '../src/lib/triggers/new-item-trigger'
import { DatedItem, fakeFeeds, RawFeedServer } from './helpers/fake-feeds'

const single = fakeFeeds.asPolling(rssNewItemTrigger)
const multi = fakeFeeds.asPolling(rssNewItemListTrigger)
const { guids, memoryStore } = fakeFeeds
const routes = new Map<string, string>()
const base = new Date('2026-09-01T08:00:00Z')
let srv: RawFeedServer

beforeAll(async () => {
    srv = await fakeFeeds.startServer((req, res) => {
        const body = routes.get(req.url ?? '')
        if (body === undefined) {
            res.writeHead(404)
            res.end('not found')
            return
        }
        res.writeHead(200, { 'content-type': 'application/rss+xml; charset=utf-8' })
        res.end(body)
    })
})
afterAll(async () => { await srv.stop() })

describe('C0263 RSS oldest-first feeds', () => {
    it('single feed, append-only: each newly appended entry triggers once', async () => {
        routes.set('/a1.xml', oldestFirst({ from: 1, to: 5 }))
        const ctx = fakeFeeds.triggerContext({ trigger: single, propsValue: { rss_feed_url: srv.base + '/a1.xml' }, store: memoryStore() })
        await single.onEnable(ctx)

        const emitted: string[] = []
        routes.set('/a1.xml', oldestFirst({ from: 1, to: 6 }))
        emitted.push(...guids(await single.run(ctx)))
        routes.set('/a1.xml', oldestFirst({ from: 1, to: 7 }))
        emitted.push(...guids(await single.run(ctx)))

        expect(emitted).toEqual(['post-6', 'post-7'])
    })

    it('single feed, rolling window of 5: only the new entry triggers when the oldest rolls off', async () => {
        routes.set('/a2.xml', oldestFirst({ from: 1, to: 5 }))
        const ctx = fakeFeeds.triggerContext({ trigger: single, propsValue: { rss_feed_url: srv.base + '/a2.xml' }, store: memoryStore() })
        await single.onEnable(ctx)

        const emitted: string[] = []
        routes.set('/a2.xml', oldestFirst({ from: 2, to: 6 }))
        emitted.push(...guids(await single.run(ctx)))
        routes.set('/a2.xml', oldestFirst({ from: 3, to: 7 }))
        emitted.push(...guids(await single.run(ctx)))

        expect(emitted).toEqual(['post-6', 'post-7'])
    })

    it('multiple-feeds trigger with one append-only feed: each newly appended entry triggers once', async () => {
        routes.set('/a3.xml', oldestFirst({ from: 1, to: 5 }))
        const ctx = fakeFeeds.triggerContext({ trigger: multi, propsValue: { rss_feed_urls: [srv.base + '/a3.xml'] }, store: memoryStore() })
        await multi.onEnable(ctx)

        const emitted: string[] = []
        routes.set('/a3.xml', oldestFirst({ from: 1, to: 6 }))
        emitted.push(...guids(await multi.run(ctx)))
        routes.set('/a3.xml', oldestFirst({ from: 1, to: 7 }))
        emitted.push(...guids(await multi.run(ctx)))

        expect(emitted).toEqual(['post-6', 'post-7'])
    })
})

function oldestFirst({ from, to }: { from: number; to: number }): string {
    const items: DatedItem[] = []
    for (let n = from; n <= to; n++) items.push(item({ n }))
    return rss({ title: 'Changelog', items })
}

function item({ n }: { n: number }): DatedItem {
    return { guid: `post-${n}`, title: `post ${n}`, pubDate: new Date(base.getTime() + n * 60_000) }
}

function rss({ title, items }: { title: string; items: DatedItem[] }): string {
    return fakeFeeds.rssDocument({ title, items })
}
