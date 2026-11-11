import { createRequire } from 'node:module'
import { describe, expect, it, vi } from 'vitest'
import { rowEvents } from './support/engine-context'

type Cell = { value: string | number }
const sheet: { rows: Cell[][], amountFormat: (n: number) => string } = {
    rows: [[{ value: 'Name' }, { value: 'Amount' }], [{ value: 'Alice' }, { value: 1000 }], [{ value: 'Bob' }, { value: 250 }]],
    amountFormat: (n) => String(n),
}
const valuesGetCalls: Array<string | undefined> = []

function render(option?: string): Array<Array<string | number>> {
    return sheet.rows.map((row) => row.map((cell) => {
        if (typeof cell.value !== 'number') return cell.value
        return option === 'UNFORMATTED_VALUE' || option === 'FORMULA' ? cell.value : sheet.amountFormat(cell.value)
    }))
}

const sheetsFactory = () => ({
    sheets: () => ({
        spreadsheets: {
            get: async () => ({ data: { sheets: [{ properties: { sheetId: 0, title: 'Sheet1' } }] } }),
            values: {
                get: async (params: { range?: string, valueRenderOption?: string }) => {
                    valuesGetCalls.push(params.valueRenderOption)
                    const rowRange = /!(\d+):(\d+)$/.exec(params.range ?? '')
                    const values = render(params.valueRenderOption)
                    return { data: { values: rowRange ? values.slice(Number(rowRange[1]) - 1, Number(rowRange[2])) : values } }
                },
            },
        },
    }),
})
const driveFactory = () => ({
    drive: () => ({
        files: { watch: async () => ({ data: { id: 'channel-1', resourceId: 'res-1' } }) },
        channels: { stop: async () => ({ data: undefined }) },
    }),
})
const PIECE_DIR = new URL('../src/lib/triggers/', import.meta.url).pathname
const pieceRequire = createRequire(PIECE_DIR + 'helpers.ts')
for (const [name, factory] of [['@googleapis/sheets', sheetsFactory], ['@googleapis/drive', driveFactory]] as const) {
    vi.doMock(name, factory)
    vi.doMock(pieceRequire.resolve(name), factory)
    console.log('mocking', name, 'at', pieceRequire.resolve(name))
}
const { newOrUpdatedRowTrigger } = await import(PIECE_DIR + 'new-or-updated-row.trigger')

function memoryStore() {
    const data = new Map<string, unknown>()
    return {
        get: async <T>(k: string): Promise<T | null> => (data.has(k) ? Reflect.apply(Map.prototype.get, data, [k]) : null),
        put: async <T>(k: string, v: T) => { data.set(k, v); return v },
        delete: async (k: string) => { data.delete(k) },
    }
}

const contentChanged = { headers: { 'x-goog-resource-state': 'update', 'x-goog-changed': 'content' }, body: {}, queryParams: {} }

describe('Google Sheets - New or Updated Row', () => {
    it('reports only the inserted row when a row is inserted above existing rows', async () => {
        const store = memoryStore()
        const ctx = {
            auth: { type: 'OAUTH2', access_token: 'token', props: {} },
            propsValue: { spreadsheetId: 'spreadsheet-1', sheetId: 0, trigger_column: 'all_columns', includeTeamDrives: false },
            store,
            webhookUrl: 'http://localhost/api/v1/webhooks/flow-1',
            payload: contentChanged,
        }

        await newOrUpdatedRowTrigger.onEnable(ctx)

        sheet.rows.splice(1, 0, [{ value: 'Carol' }, { value: 75 }])
        const afterInsert = rowEvents({ value: await newOrUpdatedRowTrigger.run(ctx) })
        console.log('rows emitted after inserting Carol at row 2:', JSON.stringify(afterInsert.map((r) => [r.row, r.values])))

        sheet.rows[3][1] = { value: 300 }
        const afterEdit = rowEvents({ value: await newOrUpdatedRowTrigger.run(ctx) })
        console.log('rows emitted after editing Bob:', JSON.stringify(afterEdit.map((r) => [r.row, r.values])))

        expect(afterInsert.map((r) => r.values)).toEqual([{ A: 'Carol', B: '75' }])
        expect(afterEdit.map((r) => r.values)).toEqual([{ A: 'Bob', B: '300' }])
    })
})
