import http from 'node:http'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { auth, propertyContext, updatedRecordContext, updatedRecordTrigger as airtableUpdatedRecordTrigger } from './support/context'
import { memoryStore, portOf } from './support/fake-airtable'

const BASE_ID = 'appBase000000001'
const TABLE_ID = 'tblTable00000001'
const MOD_FIELD_ID = 'fldLastMod0000001'
const airtable = { modFieldName: 'Last Modified', recordModifiedAt: new Date().toISOString() }

function tablesResponse() {
    return {
        tables: [{
            id: TABLE_ID, name: 'Tasks', description: '', primaryFieldId: 'fldName0000000001', views: [],
            fields: [
                { id: 'fldName0000000001', name: 'Name', type: 'singleLineText', description: '' },
                { id: MOD_FIELD_ID, name: airtable.modFieldName, type: 'lastModifiedTime', description: '' },
            ],
        }],
    }
}

function listRecords(formula: string): { status: number, body: unknown } {
    const referenced = /^IS_AFTER\(\{(.*)\},DATETIME_PARSE\("([^"]+)"/.exec(formula)
    if (!referenced || referenced[1] !== airtable.modFieldName) {
        return { status: 422, body: { error: { type: 'INVALID_FILTER_BY_FORMULA', message: `The formula for filtering records is invalid: Unknown field names: ${referenced?.[1]?.toLowerCase()}` } } }
    }
    const after = Date.parse(referenced[2])
    const records = Date.parse(airtable.recordModifiedAt) > after
        ? [{ id: 'recRow0000000001', createdTime: airtable.recordModifiedAt, fields: { Name: 'Row 1', [airtable.modFieldName]: airtable.recordModifiedAt } }]
        : []
    return { status: 200, body: { records } }
}

let server: http.Server
let baseUrl: string

beforeAll(async () => {
    server = http.createServer((req, res) => {
        const url = new URL(req.url ?? '/', 'http://localhost')
        let chunks = ''
        req.on('data', (c) => { chunks += c })
        req.on('end', () => {
            let out: { status: number, body: unknown } = { status: 404, body: { error: 'NOT_FOUND' } }
            if (url.pathname === `/v0/meta/bases/${BASE_ID}/tables`) {
                out = { status: 200, body: tablesResponse() }
            }
            else if (url.pathname === `/v0/${BASE_ID}/${TABLE_ID}`) {
                out = listRecords(url.searchParams.get('filterByFormula') ?? '')
            }
            else if (url.pathname === `/v0/${BASE_ID}/${TABLE_ID}/listRecords`) {
                out = listRecords(formulaFromBody(chunks))
            }
            res.writeHead(out.status, { 'content-type': 'application/json' })
            res.end(JSON.stringify(out.body))
        })
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()))
    baseUrl = `http://127.0.0.1:${portOf({ server })}`
    process.env.AIRTABLE_ENDPOINT_URL = baseUrl
    const realFetch = globalThis.fetch
    vi.stubGlobal('fetch', (input: string | URL, init?: RequestInit) => realFetch(String(input).replace('https://api.airtable.com', baseUrl), init))
})

afterAll(async () => {
    vi.unstubAllGlobals()
    await new Promise<void>((resolve) => server.close(() => resolve()))
})

function formulaFromBody(chunks: string): string {
    const body: unknown = JSON.parse(chunks || '{}')
    if (typeof body === 'object' && body !== null && 'filterByFormula' in body && typeof body.filterByFormula === 'string') {
        return body.filterByFormula
    }
    return ''
}

async function configureTriggerFieldThroughDropdown(): Promise<string> {
    const state = await airtableUpdatedRecordTrigger.props.sortFields.options({ auth, base: BASE_ID, tableId: TABLE_ID }, propertyContext())
    const option = state.options.find((o) => o.label === 'Last Modified')
    expect(option).toBeDefined()
    if (!option) {
        throw new Error('no Last Modified option')
    }
    return option.value
}

async function pollOnce(sortFields: string): Promise<unknown[]> {
    const { store } = memoryStore()
    await store.put('lastPoll', Date.now() - 10 * 60 * 1000)
    airtable.recordModifiedAt = new Date(Date.now() - 60 * 1000).toISOString()
    return airtableUpdatedRecordTrigger.run(updatedRecordContext({ store, propsValue: { base: BASE_ID, tableId: TABLE_ID, sortFields, viewId: undefined } }))
}

describe('Airtable "New or Updated Record" keeps working after the Last Modified field is renamed (C0943)', () => {
    it('control: without a rename the poll delivers the edited row', async () => {
        airtable.modFieldName = 'Last Modified'
        const sortFields = await configureTriggerFieldThroughDropdown()
        await expect(pollOnce(sortFields)).resolves.toHaveLength(1)
    })

    it('after renaming the field in Airtable the poll still delivers the edited row', async () => {
        airtable.modFieldName = 'Last Modified'
        const sortFields = await configureTriggerFieldThroughDropdown()
        airtable.modFieldName = 'Last Edited'
        await expect(pollOnce(sortFields)).resolves.toHaveLength(1)
    })
})
