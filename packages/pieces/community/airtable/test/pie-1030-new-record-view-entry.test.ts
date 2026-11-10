import * as http from 'node:http'
import { Store } from '@activepieces/pieces-framework'
import { newRecordContext, newRecordTrigger as airtableNewRecordTrigger } from './support/context'
import { ids, memoryStore, portOf } from './support/fake-airtable'

type Rec = { id: string, createdTime: string, fields: Record<string, unknown> }

let provider: http.Server
let table: Rec[] = []
const VIEW_ID = 'viwReadyQueue000'

beforeAll(async () => {
    provider = http.createServer((req, res) => {
        const url = new URL(req.url ?? '/', 'http://x')
        if (!url.pathname.startsWith('/v0/appTEST/tblTEST')) {
            res.writeHead(404, { 'content-type': 'application/json' })
            res.end(JSON.stringify({ error: 'NOT_FOUND' }))
            return
        }
        const view = url.searchParams.get('view')
        const rows = view === VIEW_ID ? table.filter((r) => r.fields['Status'] === 'Ready') : table
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(JSON.stringify({ records: rows }))
    })
    await new Promise<void>((r) => provider.listen(0, '127.0.0.1', () => r()))
    process.env.AIRTABLE_ENDPOINT_URL = `http://127.0.0.1:${portOf({ server: provider })}`
})

afterAll(async () => {
    provider.closeAllConnections()
    await new Promise<void>((r) => provider.close(() => r()))
})

async function engineStore() {
    return memoryStore().store
}

function ctx(store: Store) {
    return newRecordContext({ store, propsValue: { base: 'appTEST', tableId: 'tblTEST', viewId: VIEW_ID } })
}

const iso = (ms: number) => new Date(ms).toISOString()

describe('C1519 Airtable New Record scoped to a view', () => {
    it('control: a record that is created outside the view and later enters it fires when no later record was emitted first', async () => {
        const store = await engineStore()
        table = []
        await airtableNewRecordTrigger.onEnable(ctx(store))
        const t0 = Date.now()
        table = [{ id: 'recA', createdTime: iso(t0 + 1000), fields: { Name: 'A', Status: 'Draft' } }]
        expect(ids(await airtableNewRecordTrigger.run(ctx(store)))).toEqual([])
        table[0].fields['Status'] = 'Ready'
        expect(ids(await airtableNewRecordTrigger.run(ctx(store)))).toEqual(['recA'])
        expect(ids(await airtableNewRecordTrigger.run(ctx(store)))).toEqual([])
    })

    it('a record created after enabling that enters the view later fires once, even if a newer record was already emitted', async () => {
        const store = await engineStore()
        table = []
        await airtableNewRecordTrigger.onEnable(ctx(store))
        const t0 = Date.now()
        table = [
            { id: 'recA', createdTime: iso(t0 + 1000), fields: { Name: 'A', Status: 'Draft' } },
            { id: 'recB', createdTime: iso(t0 + 2000), fields: { Name: 'B', Status: 'Ready' } },
        ]
        expect(ids(await airtableNewRecordTrigger.run(ctx(store)))).toEqual(['recB'])
        table[0].fields['Status'] = 'Ready'
        expect(ids(await airtableNewRecordTrigger.run(ctx(store)))).toEqual(['recA'])
        expect(ids(await airtableNewRecordTrigger.run(ctx(store)))).toEqual([])
    })
})
