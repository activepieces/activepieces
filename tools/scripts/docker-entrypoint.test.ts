import { spawn } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'

const ENTRYPOINT = resolve(import.meta.dir, '../../docker-entrypoint.sh')
const WORKER_DRAIN_MS = 1_500

let root: string
let eventsFile: string

beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'ap-entrypoint-'))
    eventsFile = join(root, 'events.log')
    writeFileSync(eventsFile, '')
})

afterEach(() => {
    rmSync(root, { recursive: true, force: true })
})

describe('docker-entrypoint.sh in WORKER_AND_APP', () => {
    it('stops the worker first and keeps the app up until the worker has drained', async () => {
        writeStub({ name: 'app', exitDelayMs: 0 })
        writeStub({ name: 'worker', exitDelayMs: WORKER_DRAIN_MS })
        const container = startEntrypoint({ containerType: 'WORKER_AND_APP' })
        await waitForEvents(['app ready', 'worker ready'])

        container.kill('SIGTERM')
        const exitCode = await container.exited

        expect(exitCode).toBe(0)
        expect(eventNames()).toEqual(['worker TERM', 'worker exit', 'app TERM', 'app exit'])
        const at = eventTimes()
        expect(at['app TERM'] - at['worker TERM']).toBeGreaterThanOrEqual(WORKER_DRAIN_MS - 100)
    }, 15_000)

    it('still stops the app and exits non-zero when the worker dies on its own', async () => {
        writeStub({ name: 'app', exitDelayMs: 0 })
        writeStub({ name: 'worker', exitDelayMs: 0, crashWhenFileExists: crashFile() })
        const container = startEntrypoint({ containerType: 'WORKER_AND_APP' })
        await waitForEvents(['app ready', 'worker ready'])

        writeFileSync(crashFile(), '')
        const exitCode = await container.exited

        expect(exitCode).toBe(1)
        await waitForEvents(['app TERM'])
    }, 15_000)
})

function writeStub({ name, exitDelayMs, crashWhenFileExists }: { name: 'app' | 'worker', exitDelayMs: number, crashWhenFileExists?: string }): void {
    const dir = join(root, 'packages/server', name === 'app' ? 'api' : 'worker', 'dist/src')
    mkdirSync(dir, { recursive: true })
    const log = `(event) => require('fs').appendFileSync(${JSON.stringify(eventsFile)}, ${JSON.stringify(name)} + ' ' + event + ' ' + Date.now() + '\\n')`
    writeFileSync(join(dir, 'bootstrap.js'), `
const log = ${log}
const crashFile = ${JSON.stringify(crashWhenFileExists ?? null)}
process.on('SIGTERM', () => {
    log('TERM')
    setTimeout(() => { log('exit'); process.exit(0) }, ${exitDelayMs})
})
setInterval(() => {
    if (crashFile && require('fs').existsSync(crashFile)) process.exit(3)
}, 50)
log('ready')
`)
}

function crashFile(): string {
    return join(root, 'crash-worker')
}

function startEntrypoint({ containerType }: { containerType: string }): { kill: (signal: NodeJS.Signals) => void, exited: Promise<number | null> } {
    const child = spawn('sh', [ENTRYPOINT], {
        cwd: root,
        env: { PATH: process.env.PATH, AP_CONTAINER_TYPE: containerType },
        stdio: 'ignore',
    })
    const exited = new Promise<number | null>((done) => child.on('exit', (code) => done(code)))
    return { kill: (signal) => child.kill(signal), exited }
}

async function waitForEvents(expected: string[]): Promise<void> {
    const deadline = Date.now() + 10_000
    while (Date.now() < deadline) {
        const seen = allEvents()
        if (expected.every((event) => seen.includes(event))) {
            return
        }
        await new Promise((done) => setTimeout(done, 50))
    }
    throw new Error(`timed out waiting for ${expected.join(', ')}; saw ${allEvents().join(', ')}`)
}

function eventLines(): string[][] {
    return readFileSync(eventsFile, 'utf8').split('\n').filter(Boolean).map((line) => line.split(' '))
}

function allEvents(): string[] {
    return eventLines().map(([name, event]) => `${name} ${event}`)
}

function eventNames(): string[] {
    return allEvents().filter((event) => !event.endsWith(' ready'))
}

function eventTimes(): Record<string, number> {
    return Object.fromEntries(eventLines().map(([name, event, at]) => [`${name} ${event}`, Number(at)]))
}
