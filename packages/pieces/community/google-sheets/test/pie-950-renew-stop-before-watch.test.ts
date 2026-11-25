import { describe, expect, it, vi, beforeEach } from 'vitest'

const h = await vi.hoisted(async () => {
    const { createRequire } = await import('node:module')
    const nodePath = await import('node:path')
    const pieceRequire = createRequire(nodePath.resolve(__dirname, '../package.json'))
    return {
        sheetsPath: pieceRequire.resolve('@googleapis/sheets'),
        drivePath: pieceRequire.resolve('@googleapis/drive'),
        live: new Set<string>(),
        failNextWatch: false,
    }
})

vi.mock(h.sheetsPath, () => ({
    sheets: () => ({
        spreadsheets: {
            get: async () => ({ data: { sheets: [{ properties: { sheetId: 0, title: 'Sheet1', index: 0 } }] } }),
            values: { get: async () => ({ data: { values: [['Name'], ['Ann']] } }) },
        },
    }),
}))
vi.mock(h.drivePath, () => ({
    drive: () => ({
        files: {
            watch: async ({ requestBody }: { requestBody: { id: string } }) => {
                if (h.failNextWatch) {
                    h.failNextWatch = false
                    throw Object.assign(new Error('Backend Error'), { code: 503 })
                }
                h.live.add(requestBody.id)
                return { data: { kind: 'api#channel', id: requestBody.id, resourceId: 'res-1' } }
            },
        },
        channels: {
            stop: async ({ requestBody }: { requestBody: { id: string } }) => {
                if (!h.live.has(requestBody.id)) throw Object.assign(new Error(`Channel ${requestBody.id} not found for project`), { code: 404 })
                h.live.delete(requestBody.id)
                return { data: undefined }
            },
        },
    }),
}))

import { newRowAddedTrigger } from '../src/lib/triggers/new-row-added-webhook'
import { newOrUpdatedRowTrigger } from '../src/lib/triggers/new-or-updated-row.trigger'
import { engineContext, webhookTrigger } from './support/engine-context'

const newRowAdded = webhookTrigger({ trigger: newRowAddedTrigger })
const newOrUpdatedRow = webhookTrigger({ trigger: newOrUpdatedRowTrigger })

function memoryStore() {
    const data = new Map<string, unknown>()
    return {
        get: async <T>(k: string): Promise<T | null> => (data.has(k) ? JSON.parse(JSON.stringify(data.get(k))) : null),
        put: async <T>(k: string, v: T) => { data.set(k, JSON.parse(JSON.stringify(v))); return v },
        delete: async (k: string) => { data.delete(k) },
    }
}

const cases = [
    { name: 'New Row Added', trigger: newRowAdded },
    { name: 'New or Updated Row', trigger: newOrUpdatedRow },
]

beforeEach(() => {
    h.live.clear()
    h.failNextWatch = false
})

describe('PIE-950 Sheets webhook triggers renew create-then-stop', () => {
    it.each(cases)('$name: one failed watch during renew does not leave the trigger without a channel', async ({ trigger }) => {
        const store = memoryStore()
        const ctx: HookContext = engineContext({
            context: {
                auth: { type: 'OAUTH2', access_token: 'tok', props: {}, data: {} },
                propsValue: { spreadsheetId: 'ss1', sheetId: 0, trigger_column: 'all_columns', includeTeamDrives: false },
                store,
                webhookUrl: 'https://cloud.example/v1/webhooks/flow-1',
                payload: { headers: {}, body: {}, queryParams: {} },
            },
        })

        await trigger.onEnable(ctx)
        expect(h.live.size).toBe(1)

        h.failNextWatch = true
        await trigger.onRenew!(ctx).catch(() => undefined)
        expect(h.live.size).toBe(1)

        await expect(trigger.onRenew!(ctx)).resolves.toBeUndefined()
        expect(h.live.size).toBe(1)
    })
})

type HookContext = Parameters<typeof newRowAdded.onEnable>[0] & Parameters<typeof newOrUpdatedRow.onEnable>[0]
