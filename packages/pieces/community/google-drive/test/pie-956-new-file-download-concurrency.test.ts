import { FilesService } from '@activepieces/pieces-framework'
import { drive_v3 } from '@googleapis/drive'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { newFile } from '../src/lib/triggers/new-file'
import { driveTestContext } from './drive-test-context'

const FILES_IN_BURST = 40
const FILE_BYTES = 256 * 1024
const SIBLING_CONCURRENCY = 5

type FakeFile = { id: string, name: string, mimeType: string, createdTime: string, modifiedTime: string }
const drive: { files: FakeFile[] } = { files: [] }
const trigger = driveTestContext.asPolling(newFile)

async function fakeFilesList(...args: unknown[]) {
    const created = /createdTime > '([^']+)'/.exec(driveTestContext.listParams(args).q ?? '')
    const files = drive.files
        .filter((f) => !created || Date.parse(f.createdTime) > Date.parse(created[1]))
        .sort((a, b) => Date.parse(b.createdTime) - Date.parse(a.createdTime))
    return { data: { files }, status: 200 }
}

const net = { inFlight: 0, peakInFlight: 0, downloadsInFlight: 0, peakDownloads: 0, rateLimitAbove: Infinity, rateLimited: 0 }
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function rateLimitedResponse(): Response {
    net.rateLimited++
    return new Response(JSON.stringify({ error: { code: 403, errors: [{ reason: 'userRateLimitExceeded' }], message: 'User rate limit exceeded' } }), { status: 403, statusText: 'Forbidden', headers: { 'content-type': 'application/json' } })
}

async function fakeFetch(input: string | URL | Request): Promise<Response> {
    const url = String(input instanceof Request ? input.url : input)
    if (!url.startsWith('https://www.googleapis.com/drive/v3/files/')) {
        throw new Error(`unexpected fetch ${url}`)
    }
    net.inFlight++
    net.peakInFlight = Math.max(net.peakInFlight, net.inFlight)
    if (net.inFlight > net.rateLimitAbove) {
        await sleep(2)
        net.inFlight--
        return rateLimitedResponse()
    }
    if (url.includes('fields=mimeType')) {
        await sleep(3)
        net.inFlight--
        return new Response(JSON.stringify({ mimeType: 'application/pdf' }), { status: 200, headers: { 'content-type': 'application/json' } })
    }
    net.downloadsInFlight++
    net.peakDownloads = Math.max(net.peakDownloads, net.downloadsInFlight)
    let sent = 0
    const chunk = FILE_BYTES / 4
    const body = new ReadableStream<Uint8Array>({
        async pull(controller) {
            await sleep(3)
            if (sent >= FILE_BYTES) {
                net.inFlight--
                net.downloadsInFlight--
                controller.close()
                return
            }
            controller.enqueue(new Uint8Array(chunk))
            sent += chunk
        },
    })
    return new Response(body, { status: 200, headers: { 'content-type': 'application/pdf' } })
}

const mem = { held: 0, peakHeld: 0 }
const filesService: FilesService = {
    write: async ({ fileName, data }) => {
        let size = 0
        const chunks: Buffer[] = []
        for await (const c of Buffer.isBuffer(data) ? [data] : data) {
            const piece = Buffer.isBuffer(c) ? c : Buffer.from(String(c))
            chunks.push(piece)
            size += piece.length
            mem.held += piece.length
            mem.peakHeld = Math.max(mem.peakHeld, mem.held)
        }
        const payload = Buffer.concat(chunks)
        await sleep(2)
        mem.held -= size
        return `https://files.example/${encodeURIComponent(fileName)}?bytes=${payload.length}`
    },
    upload: async () => { throw new Error('not used') },
}

const propsValue = { parentFolder: undefined, include_team_drives: false, include_file_content: true }

async function enableAndUploadBurst() {
    const store = driveTestContext.memoryStore()
    const ctx = () => driveTestContext.triggerContext({ trigger, propsValue, store, files: filesService })
    await trigger.onEnable(ctx())
    const start = Number(store.read('lastPoll')) - 120_000
    store.write('lastPoll', start)
    drive.files = Array.from({ length: FILES_IN_BURST }, (_, i) => ({
        id: `inv-${String(i + 1).padStart(2, '0')}`,
        name: `invoice-${i + 1}.pdf`,
        mimeType: 'application/pdf',
        createdTime: new Date(start + 1_000 * (i + 1)).toISOString(),
        modifiedTime: new Date(start + 1_000 * (i + 1)).toISOString(),
    }))
    return { store, ctx }
}

beforeEach(() => {
    Object.assign(net, { inFlight: 0, peakInFlight: 0, downloadsInFlight: 0, peakDownloads: 0, rateLimitAbove: Infinity, rateLimited: 0 })
    Object.assign(mem, { held: 0, peakHeld: 0 })
    vi.spyOn(drive_v3.Resource$Files.prototype, 'list').mockImplementation(fakeFilesList)
    vi.stubGlobal('fetch', fakeFetch)
    driveTestContext.routeFileLookupsToFetch()
})
afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
})

describe('C0900 New File downloads a bulk upload with no concurrency limit', () => {
    it('downloads (and buffers) at most as many files at once as its sibling New or Updated File', async () => {
        const { ctx } = await enableAndUploadBurst()
        const out = driveTestContext.driveEvents(await trigger.run(ctx()))
        console.log(JSON.stringify({ emitted: out.length, withContent: out.filter((o) => o.content).length, peakConcurrentDownloads: net.peakDownloads, peakConcurrentDriveRequests: net.peakInFlight, peakBytesBufferedAtOnce: mem.peakHeld, fileBytes: FILE_BYTES }))
        expect(out).toHaveLength(FILES_IN_BURST)
        expect(out.every((o) => typeof o.content === 'string')).toBe(true)
        expect(net.peakDownloads).toBeLessThanOrEqual(SIBLING_CONCURRENCY)
        expect(mem.peakHeld).toBeLessThanOrEqual(SIBLING_CONCURRENCY * FILE_BYTES)
    })

    it('a bulk upload against a per-user Drive rate limit still delivers every file (model: >10 requests in flight -> 403)', async () => {
        const { ctx } = await enableAndUploadBurst()
        net.rateLimitAbove = 10
        const delivered: string[] = []
        const polls: string[] = []
        for (let i = 0; i < 2; i++) {
            try {
                const out = driveTestContext.driveEvents(await trigger.run(ctx()))
                delivered.push(...out.map((o) => o.id))
                polls.push(`ok:${out.length}`)
            }
            catch (e) {
                polls.push(`failed:${String(e instanceof Error ? e.message : e).replace(/\s+/g, ' ').slice(0, 90)}`)
            }
        }
        console.log(JSON.stringify({ polls, delivered: delivered.length, rateLimitedResponses: net.rateLimited, peakConcurrentDriveRequests: net.peakInFlight }))
        expect(new Set(delivered).size).toBe(FILES_IN_BURST)
    })
})
