import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import * as path from 'path'
import * as http from 'http'
import { AddressInfo } from 'net'


type FeedItem = { guid: string; title: string; pubDate: Date }

type Route = {
    status?: number
    delayMs?: number
    contentType?: string
    body: Buffer | string
}

class FeedServer {
    routes = new Map<string, Route>()
    server!: http.Server
    base = ''

    async start() {
        this.server = http.createServer((req, res) => {
            const route = this.routes.get(req.url ?? '')
            const reply = () => {
                if (!route) {
                    res.writeHead(404)
                    return res.end('not found')
                }
                res.writeHead(route.status ?? 200, { 'content-type': route.contentType ?? 'application/rss+xml; charset=utf-8' })
                res.end(route.body)
            }
            if (route?.delayMs) setTimeout(reply, route.delayMs)
            else reply()
        })
        await new Promise<void>((r) => this.server.listen(0, '127.0.0.1', () => r()))
        this.base = `http://127.0.0.1:${(this.server.address() as AddressInfo).port}`
    }

    async stop() {
        await new Promise<void>((r) => this.server.close(() => r()))
    }

    url(p: string) {
        return this.base + p
    }

    set(p: string, route: Route) {
        this.routes.set(p, route)
    }
}

function rss(title: string, items: FeedItem[]): string {
    const body = items
        .map((i) => `    <item>\n      <title>${i.title}</title>\n      <link>https://example.com/${i.guid}</link>\n      <guid isPermaLink="false">${i.guid}</guid>\n      <pubDate>${i.pubDate.toUTCString()}</pubDate>\n    </item>`)
        .join('\n')
    return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n  <channel>\n    <title>${title}</title>\n    <link>https://example.com/</link>\n    <description>${title}</description>\n${body}\n  </channel>\n</rss>\n`
}

function memoryStore() {
    const m = new Map<string, unknown>()
    return {
        map: m,
        async get<T>(k: string) { return (m.has(k) ? m.get(k) : null) as T },
        async put<T>(k: string, v: T) { m.set(k, v); return v },
        async delete(k: string) { m.delete(k) },
    }
}

function item(n: number, base: Date, prefix = 'post'): FeedItem {
    return { guid: `${prefix}-${n}`, title: `${prefix} ${n}`, pubDate: new Date(base.getTime() + n * 60_000) }
}

const guids = (out: unknown[]) => (out as { guid: string }[]).map((i) => i.guid)

let srv: FeedServer
let single: any
let multi: any

beforeAll(async () => {
    srv = new FeedServer()
    await srv.start()
    single = (await import('../src/lib/triggers/new-item-trigger')).rssNewItemTrigger
    multi = (await import('../src/lib/triggers/new-item-list-triggers')).rssNewItemListTrigger
})
afterAll(async () => { await srv.stop() })

const at = (hhmm: string) => new Date(`2026-09-01T${hhmm}:00Z`)

function feedText(encodingLabel: string, titles: { guid: string; title: string; hhmm: string }[]): string {
    const items = titles
        .map((t) => `<item><title>${t.title}</title><guid isPermaLink="false">${t.guid}</guid><pubDate>${at(t.hhmm).toUTCString()}</pubDate></item>`)
        .join('')
    return `<?xml version="1.0" encoding="${encodingLabel}"?>\n<rss version="2.0"><channel><title>Feed</title><link>https://example.com/</link><description>d</description>${items}</channel></rss>\n`
}

const latin1 = (s: string) => Buffer.from(s, 'latin1')
const SJIS_NEWS = Buffer.from([0x83, 0x6a, 0x83, 0x85, 0x81, 0x5b, 0x83, 0x58])

async function newTitlesFromSingle(route: string, before: Buffer, after: Buffer, contentType: string) {
    const store = memoryStore()
    const ctx = { auth: undefined, propsValue: { rss_feed_url: srv.url(route) }, store, files: {} } as any
    srv.set(route, { body: before, contentType })
    await single.onEnable(ctx)
    srv.set(route, { body: after, contentType })
    return ((await single.run(ctx)) as { title: string }[]).map((i) => i.title)
}

describe('C0558 RSS feed charset', () => {
    it('ISO-8859-1 feed (declared in HTTP and XML): titles arrive intact', async () => {
        const before = latin1(feedText('ISO-8859-1', [{ guid: 'g1', title: 'Alte Meldung', hhmm: '09:00' }]))
        const after = latin1(feedText('ISO-8859-1', [
            { guid: 'g2', title: 'Grüße aus Köln – Straßenfest', hhmm: '10:00' },
            { guid: 'g1', title: 'Alte Meldung', hhmm: '09:00' },
        ]).replace('–', '-'))
        const titles = await newTitlesFromSingle('/latin1.xml', before, after, 'application/rss+xml; charset=ISO-8859-1')
        expect(titles).toEqual(['Grüße aus Köln - Straßenfest'])
    })

    it('Shift_JIS feed in the multiple-feeds trigger: titles arrive intact', async () => {
        const route = '/sjis.xml'
        const head = (extra: Buffer[]) => Buffer.concat([
            Buffer.from(`<?xml version="1.0" encoding="Shift_JIS"?>\n<rss version="2.0"><channel><title>JP</title><link>https://example.jp/</link><description>d</description>`, 'ascii'),
            ...extra,
            Buffer.from(`<item><title>old</title><guid isPermaLink="false">j1</guid><pubDate>${at('09:00').toUTCString()}</pubDate></item></channel></rss>\n`, 'ascii'),
        ])
        const newItem = Buffer.concat([
            Buffer.from('<item><title>', 'ascii'), SJIS_NEWS,
            Buffer.from(`</title><guid isPermaLink="false">j2</guid><pubDate>${at('10:00').toUTCString()}</pubDate></item>`, 'ascii'),
        ])
        const store = memoryStore()
        const ctx = { auth: undefined, propsValue: { rss_feed_urls: [srv.url(route)] }, store, files: {} } as any
        srv.set(route, { body: head([]), contentType: 'application/xml' })
        await multi.onEnable(ctx)
        srv.set(route, { body: head([newItem]), contentType: 'application/xml' })
        const titles = ((await multi.run(ctx)) as { title: string }[]).map((i) => i.title)
        expect(titles).toEqual(['ニュース'])
    })

    it('control: the same ISO-8859-1 text served as UTF-8 arrives intact', async () => {
        const before = Buffer.from(feedText('UTF-8', [{ guid: 'g1', title: 'Alte Meldung', hhmm: '09:00' }]), 'utf8')
        const after = Buffer.from(feedText('UTF-8', [
            { guid: 'g2', title: 'Grüße aus Köln - Straßenfest', hhmm: '10:00' },
            { guid: 'g1', title: 'Alte Meldung', hhmm: '09:00' },
        ]), 'utf8')
        const titles = await newTitlesFromSingle('/utf8.xml', before, after, 'application/rss+xml; charset=utf-8')
        expect(titles).toEqual(['Grüße aus Köln - Straßenfest'])
    })
})
