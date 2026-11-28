import { drive_v3 } from '@googleapis/drive'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { newSpreadsheetTrigger } from '../src/lib/triggers/new-spreadsheet'
import { engineContext, isRecord, pollingTrigger, records } from './support/engine-context'

const newSpreadsheet = pollingTrigger({ trigger: newSpreadsheetTrigger })

const SHEET = 'application/vnd.google-apps.spreadsheet'

type FakeFile = { id: string, name: string, mimeType: string, createdTime: string, modifiedTime: string, driveId: string }
type ListParams = { q?: string, fields?: string, corpora?: string, driveId?: string, orderBy?: string }

const driveState: { files: FakeFile[], unsearchedDrives: Set<string>, calls: { corpora?: string, fields?: string }[] } = {
    files: [], unsearchedDrives: new Set(), calls: [],
}

function evalQuery({ q, f }: { q: string, f: FakeFile }): boolean {
    const created = /createdTime > '([^']+)'/.exec(q)
    if (created && !(Date.parse(f.createdTime) > Date.parse(created[1]))) return false
    for (const m of q.matchAll(/(?<![(\w])mimeType='([^']+)'/g)) {
        if (f.mimeType !== m[1]) return false
    }
    return true
}

function inCorpus({ params, f }: { params: ListParams, f: FakeFile }): boolean {
    if (params.corpora === 'allDrives') return true
    if (params.corpora === 'drive') return f.driveId === params.driveId
    return f.driveId === 'my-drive'
}

async function fakeFilesList(...args: unknown[]) {
    const params = listParams({ value: args[0] })
    driveState.calls.push({ corpora: params.corpora, fields: params.fields })
    const allDrives = params.corpora === 'allDrives'
    const incomplete = allDrives && driveState.unsearchedDrives.size > 0
    const files = driveState.files
        .filter((f) => inCorpus({ params, f }))
        .filter((f) => !(incomplete && driveState.unsearchedDrives.has(f.driveId)))
        .filter((f) => evalQuery({ q: params.q ?? '', f }))
        .sort((a, b) => Date.parse(b.createdTime) - Date.parse(a.createdTime))
    const fields = params.fields ?? ''
    const reportsIncomplete = fields === '*' || fields.includes('incompleteSearch')
    return { data: { kind: 'drive#fileList', files, ...(reportsIncomplete ? { incompleteSearch: incomplete } : {}) }, status: 200 }
}

function listParams({ value }: { value: unknown }): ListParams {
    if (!isRecord(value)) return {}
    return {
        q: optionalString({ value: value['q'] }),
        fields: optionalString({ value: value['fields'] }),
        corpora: optionalString({ value: value['corpora'] }),
        driveId: optionalString({ value: value['driveId'] }),
        orderBy: optionalString({ value: value['orderBy'] }),
    }
}

function optionalString({ value }: { value: unknown }): string | undefined {
    return typeof value === 'string' ? value : undefined
}

async function fakeDrivesList() {
    const ids = [...new Set(driveState.files.map((f) => f.driveId).filter((id) => id !== 'my-drive'))]
    return { data: { kind: 'drive#driveList', drives: ids.map((id) => ({ id })) }, status: 200 }
}

function makeStore() {
    const m = new Map<string, unknown>()
    return {
        map: m,
        get: async <T>(k: string): Promise<T | null> => (m.has(k) ? JSON.parse(JSON.stringify(m.get(k))) : null),
        put: async <T>(k: string, v: T) => { m.set(k, JSON.parse(JSON.stringify(v))); return v },
        delete: async (k: string) => { m.delete(k) },
    }
}
const auth = { type: 'OAUTH2', access_token: 'ya29.test', refresh_token: 'r', token_type: 'Bearer', expires_in: 3600, scope: '', data: {}, props: {} }

beforeEach(() => {
    driveState.files = []
    driveState.unsearchedDrives = new Set()
    driveState.calls = []
    vi.spyOn(drive_v3.Resource$Files.prototype, 'list').mockImplementation(fakeFilesList)
    vi.spyOn(drive_v3.Resource$Drives.prototype, 'list').mockImplementation(fakeDrivesList)
})

afterEach(() => {
    vi.restoreAllMocks()
})

describe('C0682 (Sheets) incomplete all-drive search must not move the cursor past files it did not search', () => {
    it('Google Sheets / New Spreadsheet (Include Team Drives): a file skipped by an incomplete search is still emitted later', async () => {
        const store = makeStore()
        const ctx = (): Parameters<typeof newSpreadsheet.run>[0] => engineContext({ context: { auth, propsValue: { includeTeamDrives: true }, store, files: { write: async () => 'unused' }, server: undefined, webhookUrl: '', payload: {} } })

        await newSpreadsheet.onEnable(ctx())
        const enabledAt = store.map.get('lastPoll')
        expect(typeof enabledAt).toBe('number')
        if (typeof enabledAt !== 'number') throw new Error('lastPoll is not a number')
        const start = enabledAt - 60_000
        store.map.set('lastPoll', start)

        const at = (ms: number) => new Date(start + ms).toISOString()
        driveState.files.push(
            { id: 'A-shared', name: 'Q3 contract (shared drive)', mimeType: SHEET, createdTime: at(10_000), modifiedTime: at(10_000), driveId: 'shared-legal' },
            { id: 'B-mydrive', name: 'Notes (My Drive)', mimeType: SHEET, createdTime: at(20_000), modifiedTime: at(20_000), driveId: 'my-drive' },
        )

        const emitted: unknown[] = []
        const runPoll = async () => {
            try {
                const out = records({ value: await newSpreadsheet.run(ctx()) })
                emitted.push(...out.map((o) => o['id']))
                return `ok:${JSON.stringify(out.map((o) => o['id']))}`
            }
            catch (e) {
                return `failed:${String(e instanceof Error ? e.message : e).slice(0, 80)}`
            }
        }

        driveState.unsearchedDrives = new Set(['shared-legal'])
        const p1 = await runPoll()
        driveState.unsearchedDrives = new Set()
        const p2 = await runPoll()
        const p3 = await runPoll()

        console.log(JSON.stringify({ poll1: p1, poll2: p2, poll3: p3, emitted, listCalls: driveState.calls }))

        expect(emitted).toContain('A-shared')
        expect(emitted.filter((id) => id === 'B-mydrive')).toHaveLength(1)
    })
})
