import http from 'http'
import { AddressInfo } from 'net'
import { AppConnectionType, AppConnectionValueForAuthProperty, TriggerStrategy } from '@activepieces/pieces-framework'
import { createMockActionContext, createMockPollingTriggerContext } from '../../../framework/src/lib/test'
import { APITableAuth } from '../src/lib/auth'
import { newRecordTrigger } from '../src/lib/triggers/new-record'

const now = Date.now()
const daysAgo = (d: number) => now - d * 24 * 60 * 60 * 1000
const apitableRecords = [3, 5, 10].map((d, i) => ({
    recordId: `recApi${i}`,
    createdAt: daysAgo(d),
    updatedAt: daysAgo(d),
    fields: { Title: `row ${i}` },
}))
const seenFormulas: string[] = []

let server: http.Server
let baseUrl = ''

beforeAll(async () => {
    server = http.createServer((req, res) => {
        const url = new URL(req.url ?? '/', 'http://localhost')
        const formula = url.searchParams.get('filterByFormula')
        if (formula) seenFormulas.push(formula)
        if (/^\/fusion\/v1\/datasheets\/[^/]+\/records$/.test(url.pathname)) {
            let records = apitableRecords
            const createdAfter = formula?.match(/CREATED_TIME\(\)\s*>\s*(\d+)/)
            if (createdAfter) {
                records = records.filter((r) => r.createdAt > Number(createdAfter[1]))
            }
            res.setHeader('content-type', 'application/json')
            res.end(JSON.stringify({ success: true, code: 200, message: 'SUCCESS', data: { total: records.length, pageNum: 1, pageSize: 100, records } }))
            return
        }
        res.statusCode = 404
        res.end('{}')
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    baseUrl = `http://127.0.0.1:${listeningPort({ address: server.address() })}`
})

afterAll(async () => {
    await new Promise((resolve) => server.close(resolve))
})

function listeningPort({ address }: { address: AddressInfo | string | null }): number {
    if (address === null || typeof address === 'string') throw new Error('server is not listening on a port')
    return address.port
}

const apitableNewRecordTrigger = pollingTrigger()

function pollingTrigger() {
    if (newRecordTrigger.type !== TriggerStrategy.POLLING) {
        throw new Error('expected a polling trigger')
    }
    return newRecordTrigger
}

function testContext({ auth, propsValue }: {
    auth: AppConnectionValueForAuthProperty<typeof APITableAuth>
    propsValue: { space_id: string, datasheet_id: string }
}) {
    const base = createMockActionContext({ propsValue: {} })
    return {
        ...createMockPollingTriggerContext<typeof newRecordTrigger.props>({ propsValue }),
        auth,
        store: base.store,
        files: base.files,
    }
}

function recordIdOf({ event }: { event: unknown }): string {
    if (typeof event !== 'object' || event === null || !('recordId' in event)) {
        throw new Error('event has no recordId')
    }
    return String(event.recordId)
}

describe('PIE-989 (C1139) testing a polling trigger on a populated but quiet source', () => {
    it('APITable New Record test returns sample rows when the last record was created 3 days ago', async () => {
        const out = await apitableNewRecordTrigger.test(testContext({
            auth: { type: AppConnectionType.CUSTOM_AUTH, props: { token: 'tok', apiTableUrl: baseUrl } },
            propsValue: { space_id: 'spc1', datasheet_id: 'dst1' },
        }))
        expect(out.length).toBeGreaterThan(0)
        expect(out.map((event) => recordIdOf({ event }))).toEqual(['recApi2', 'recApi1', 'recApi0'])
    })
})
