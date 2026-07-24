import { ChildProcess } from 'node:child_process'
import { EventEmitter } from 'node:events'
import { unlink, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { noOpCodeSandbox } from '../../../src/lib/core/code/no-op-code-sandbox'

const spawnState = vi.hoisted(() => ({ failNextSpawnWith: null as string | null }))

vi.mock('node:child_process', async (importOriginal) => {
    const actual = await importOriginal<typeof import('node:child_process')>()
    return {
        ...actual,
        spawn: (...args: Parameters<typeof actual.spawn>): ChildProcess => {
            if (spawnState.failNextSpawnWith === null) {
                return actual.spawn(...args)
            }
            const errorCode = spawnState.failNextSpawnWith
            spawnState.failNextSpawnWith = null
            const child = new EventEmitter() as ChildProcess
            setImmediate(() => child.emit('error', Object.assign(new Error(`spawn ${errorCode}`), { code: errorCode })))
            return child
        },
    }
})

describe('noOpCodeSandbox', () => {
    describe('runCodeModule', () => {
        let tmpFile: string

        beforeEach(() => {
            spawnState.failNextSpawnWith = null
            tmpFile = path.join(os.tmpdir(), `no-op-sandbox-test-${Date.now()}.js`)
        })

        afterEach(async () => {
            await unlink(tmpFile).catch(() => undefined)
        })

        async function runWithSource(source: string, inputs: Record<string, unknown> = {}): Promise<unknown> {
            await writeFile(tmpFile, source, 'utf8')
            return noOpCodeSandbox.runCodeModule({ codeFilePath: tmpFile, inputs })
        }

        it('executes exports.code and returns the result', async () => {
            const result = await runWithSource('exports.code = async (inputs) => ({ doubled: inputs.n * 2 })', { n: 3 })
            expect(result).toEqual({ doubled: 6 })
        })

        it('propagates user errors thrown inside code', async () => {
            await expect(runWithSource('exports.code = async () => { throw new Error(\'user error\') }')).rejects.toThrow('user error')
        })

        it('rejects with the spawn error instead of a send TypeError when the child has no IPC channel (GIT-1650)', async () => {
            spawnState.failNextSpawnWith = 'EMFILE'
            await expect(runWithSource('exports.code = async () => 1')).rejects.toThrow('spawn EMFILE')
        })
    })
})
