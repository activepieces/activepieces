import { EventEmitter } from 'node:events'
import { vi } from 'vitest'

const spawnMock = vi.fn()

vi.mock('node:child_process', () => ({
    spawn: (...args: unknown[]) => spawnMock(...args),
}))

// A spawn that failed with EMFILE: node skipped setupChannel(), so `send` was never
// attached, and it reports the real errno on 'error' one tick later.
function emfileChild(): EventEmitter {
    const child = new EventEmitter()
    process.nextTick(() => child.emit('error', Object.assign(new Error('spawn EMFILE'), { code: 'EMFILE' })))
    return child
}

describe('noOpCodeSandbox', () => {
    describe('runCodeModule when spawn runs out of file descriptors', () => {
        beforeEach(() => {
            spawnMock.mockReset()
        })

        it('rejects with the real errno instead of a TypeError about send', async () => {
            spawnMock.mockImplementation(() => emfileChild())
            const { noOpCodeSandbox } = await import('../../../src/lib/core/code/no-op-code-sandbox')

            const result = noOpCodeSandbox.runCodeModule({ codeFilePath: '/tmp/whatever.js', inputs: {} })

            await expect(result).rejects.toThrow(/EMFILE/)
            await expect(result).rejects.not.toThrow(/send is not a function/)
        })

        it('still sends inputs over IPC when the channel exists', async () => {
            const child = Object.assign(new EventEmitter(), {
                send: vi.fn((message: unknown) => {
                    ;(child as EventEmitter).emit('message', { success: true, result: message })
                }),
            })
            spawnMock.mockImplementation(() => child)
            const { noOpCodeSandbox } = await import('../../../src/lib/core/code/no-op-code-sandbox')

            const inputs = { hello: 'world' }
            await expect(noOpCodeSandbox.runCodeModule({ codeFilePath: '/tmp/whatever.js', inputs })).resolves.toEqual({
                codeFilePath: '/tmp/whatever.js',
                inputs,
            })
            expect(child.send).toHaveBeenCalledTimes(1)
        })
    })
})
