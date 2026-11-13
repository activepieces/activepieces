import { drive_v3 } from '@googleapis/drive'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { newFile } from '../src/lib/triggers/new-file'
import { newFolder } from '../src/lib/triggers/new-folder'
import { newOrUpdatedFile } from '../src/lib/triggers/new-or-updated-file'
import { driveTestContext, ListParams } from './drive-test-context'

const FOLDER = 'application/vnd.google-apps.folder'
const PDF = 'application/pdf'

const driveState: { files: FakeFile[], unsearchedDrives: Set<string>, calls: { corpora?: string, fields?: string }[] } = {
    files: [], unsearchedDrives: new Set(), calls: [],
}

const pollingNewFile = driveTestContext.asPolling(newFile)
const pollingNewFolder = driveTestContext.asPolling(newFolder)
const pollingNewOrUpdatedFile = driveTestContext.asPolling(newOrUpdatedFile)

const cases: Case[] = [
    {
        name: 'Google Drive / New File (Include Team Drives)',
        mimeType: PDF,
        runner: (store) => {
            const ctx = () => driveTestContext.triggerContext({ trigger: pollingNewFile, propsValue: { parentFolder: undefined, include_team_drives: true, include_file_content: false }, store })
            return { enable: () => pollingNewFile.onEnable(ctx()), run: () => pollingNewFile.run(ctx()) }
        },
    },
    {
        name: 'Google Drive / New Folder (Include Team Drives)',
        mimeType: FOLDER,
        runner: (store) => {
            const ctx = () => driveTestContext.triggerContext({ trigger: pollingNewFolder, propsValue: { parentFolder: undefined, include_team_drives: true }, store })
            return { enable: () => pollingNewFolder.onEnable(ctx()), run: () => pollingNewFolder.run(ctx()) }
        },
    },
    {
        name: 'Google Drive / New or Updated File (Include Team Drives)',
        mimeType: PDF,
        runner: (store) => {
            const ctx = () => driveTestContext.triggerContext({ trigger: pollingNewOrUpdatedFile, propsValue: { behaviourNote: undefined, parentFolder: undefined, file_types: undefined, include_team_drives: true, include_file_content: false }, store })
            return { enable: () => pollingNewOrUpdatedFile.onEnable(ctx()), run: () => pollingNewOrUpdatedFile.run(ctx()) }
        },
    },
]

function evalQuery({ q, f }: { q: string, f: FakeFile }): boolean {
    const changed = /\(modifiedTime > '([^']+)' or createdTime > '([^']+)'\)/.exec(q)
    if (changed) {
        const t = Date.parse(changed[1])
        if (!(Date.parse(f.modifiedTime) > t || Date.parse(f.createdTime) > t)) return false
    }
    else {
        const created = /createdTime > '([^']+)'/.exec(q)
        if (created && !(Date.parse(f.createdTime) > Date.parse(created[1]))) return false
    }
    for (const m of q.matchAll(/(?<![(\w])mimeType='([^']+)'/g)) {
        const before = q.slice(0, m.index)
        const insideGroup = (before.match(/\(/g)?.length ?? 0) > (before.match(/\)/g)?.length ?? 0)
        if (!insideGroup && f.mimeType !== m[1]) return false
    }
    for (const m of q.matchAll(/mimeType!='([^']+)'/g)) {
        if (f.mimeType === m[1]) return false
    }
    return true
}

function inCorpus({ params, f }: { params: ListParams, f: FakeFile }): boolean {
    if (params.corpora === 'allDrives') return true
    if (params.corpora === 'drive') return f.driveId === params.driveId
    return f.driveId === 'my-drive'
}

async function fakeFilesList(...args: unknown[]) {
    const params = driveTestContext.listParams(args)
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

async function fakeDrivesList() {
    const ids = [...new Set(driveState.files.map((f) => f.driveId).filter((id) => id !== 'my-drive'))]
    return { data: { kind: 'drive#driveList', drives: ids.map((id) => ({ id })) }, status: 200 }
}

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

describe('C0682 incomplete all-drive search must not move the cursor past files it did not search', () => {
    it.each(cases)('$name: a file skipped by an incomplete search is still emitted later', async ({ runner, mimeType }) => {
        const store = driveTestContext.memoryStore()
        const trigger = runner(store)

        await trigger.enable()
        const enabledAt = store.read('lastPoll')
        expect(typeof enabledAt).toBe('number')
        const start = Number(enabledAt) - 60_000
        store.write('lastPoll', start)

        const at = (ms: number) => new Date(start + ms).toISOString()
        driveState.files.push(
            { id: 'A-shared', name: 'Q3 contract (shared drive)', mimeType, createdTime: at(10_000), modifiedTime: at(10_000), driveId: 'shared-legal' },
            { id: 'B-mydrive', name: 'Notes (My Drive)', mimeType, createdTime: at(20_000), modifiedTime: at(20_000), driveId: 'my-drive' },
        )

        const emitted: string[] = []
        const runPoll = async () => {
            try {
                const out = driveTestContext.driveEvents(await trigger.run())
                emitted.push(...out.map((o) => o.id))
                return `ok:${JSON.stringify(out.map((o) => o.id))}`
            }
            catch (e) {
                return `failed:${String(e instanceof Error ? e.message : e).slice(0, 80)}`
            }
        }

        driveState.unsearchedDrives = new Set(['shared-legal'])
        const p1 = await runPoll()
        const cursorAfter1 = Number(store.read('lastPoll'))
        driveState.unsearchedDrives = new Set()
        const p2 = await runPoll()
        const p3 = await runPoll()

        console.log(JSON.stringify({ poll1: p1, cursorAfterPoll1: new Date(cursorAfter1).toISOString(), A_created: at(10_000), poll2: p2, poll3: p3, emitted, listCalls: driveState.calls }))

        expect(emitted).toContain('A-shared')
        expect(emitted.filter((id) => id === 'B-mydrive')).toHaveLength(1)
    })
})

type FakeFile = { id: string, name: string, mimeType: string, createdTime: string, modifiedTime: string, driveId: string }

type Case = {
    name: string
    mimeType: string
    runner: (store: ReturnType<typeof driveTestContext.memoryStore>) => { enable: () => Promise<void>, run: () => Promise<unknown[]> }
}
