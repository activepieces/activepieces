import http from 'http'
import { vi } from 'vitest'
import { newRecordContext, newRecordTrigger as airtableNewRecordTrigger, updatedRecordContext, updatedRecordTrigger as airtableUpdatedRecordTrigger } from './support/context'
import { ids, memoryStore, portOf } from './support/fake-airtable'

const now = Date.now()
const daysAgo = (d: number) => now - d * 24 * 60 * 60 * 1000
const airtableTables: Record<string, { id: string, createdTime: string, fields: Record<string, unknown> }[]> = {
    tblOld: [3, 5, 10].map((d, i) => ({
        id: `recOld${i}`,
        createdTime: new Date(daysAgo(d + 30)).toISOString(),
        fields: { Name: `row ${i}`, 'Last Modified': new Date(daysAgo(d)).toISOString() },
    })),
    tblRecent: [{
        id: 'recRecent',
        createdTime: new Date(daysAgo(30)).toISOString(),
        fields: { Name: 'recent', 'Last Modified': new Date(now - 60 * 60 * 1000).toISOString() },
    }],
}
const seenFormulas: string[] = []

let server: http.Server
let baseUrl = ''

beforeAll(async () => {
    server = http.createServer((req, res) => {
        const url = new URL(req.url ?? '/', 'http://localhost')
        const formula = url.searchParams.get('filterByFormula')
        if (formula) seenFormulas.push(formula)
        const airtableMatch = url.pathname.match(/^\/v0\/[^/]+\/([^/]+)$/)
        if (airtableMatch) {
            let records = airtableTables[decodeURIComponent(airtableMatch[1])] ?? []
            const isAfter = formula?.match(/IS_AFTER\(\{(.+?)\},DATETIME_PARSE\("([^"]+)"/)
            if (isAfter) {
                const [, field, iso] = isAfter
                records = records.filter((r) => {
                    const value = r.fields[field]
                    return typeof value === 'string' && Date.parse(value) > Date.parse(iso)
                })
            }
            res.setHeader('content-type', 'application/json')
            res.end(JSON.stringify({ records }))
            return
        }
        const metaMatch = url.pathname.match(/^\/v0\/meta\/bases\/[^/]+\/tables$/)
        if (metaMatch) {
            const fields = [
                { id: 'fldName0000000001', name: 'Name', type: 'singleLineText', description: '' },
                { id: 'fldLastMod0000001', name: 'Last Modified', type: 'lastModifiedTime', description: '' },
            ]
            res.setHeader('content-type', 'application/json')
            res.end(JSON.stringify({ tables: Object.keys(airtableTables).map((id) => ({ id, name: id, description: '', primaryFieldId: 'fldName0000000001', views: [], fields })) }))
            return
        }
        res.statusCode = 404
        res.end('{}')
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    baseUrl = `http://127.0.0.1:${portOf({ server })}`
    process.env.AIRTABLE_ENDPOINT_URL = baseUrl
    const realFetch = globalThis.fetch
    vi.stubGlobal('fetch', (input: string | URL, init?: RequestInit) => realFetch(String(input).replace('https://api.airtable.com', baseUrl), init))
})

afterAll(async () => {
    vi.unstubAllGlobals()
    await new Promise((resolve) => server.close(resolve))
})


describe('PIE-989 (C1139) testing a polling trigger on a populated but quiet source', () => {
    it('control: Airtable New Record returns sample rows from the same table', async () => {
        const out = await airtableNewRecordTrigger.test(newRecordContext({
            store: memoryStore().store,
            propsValue: { base: 'appBase', tableId: 'tblOld', viewId: undefined },
        }))
        expect(out.length).toBeGreaterThan(0)
    })

    it('control: Airtable New or Updated Record returns a row modified an hour ago', async () => {
        const out = await airtableUpdatedRecordTrigger.test(updatedRecordContext({
            store: memoryStore().store,
            propsValue: { base: 'appBase', tableId: 'tblRecent', sortFields: 'Last Modified', viewId: undefined },
        }))
        expect(out.length).toBe(1)
    })

    it('Airtable New or Updated Record test returns the newest rows when the last change was 3 days ago', async () => {
        const out = await airtableUpdatedRecordTrigger.test(updatedRecordContext({
            store: memoryStore().store,
            propsValue: { base: 'appBase', tableId: 'tblOld', sortFields: 'Last Modified', viewId: undefined },
        }))
        expect(out.length).toBeGreaterThan(0)
        expect(ids(out).at(-1)).toBe('recOld0')
    })

    it('Airtable New or Updated Record test also works with the field id saved by the current dropdown', async () => {
        const out = await airtableUpdatedRecordTrigger.test(updatedRecordContext({
            store: memoryStore().store,
            propsValue: { base: 'appBase', tableId: 'tblOld', sortFields: 'fldLastMod0000001', viewId: undefined },
        }))
        expect(ids(out)).toEqual(['recOld2', 'recOld1', 'recOld0'])
    })
})
