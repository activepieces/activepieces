import { ChildProcess } from 'child_process'
import { EventEmitter } from 'node:events'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { io as ioClient, type Socket as ClientSocket } from 'socket.io-client'
import { ActivepiecesError, EngineResponseStatus, ErrorCode, WorkerContract } from '@activepieces/shared'
import { createSandbox } from '../../../src/lib/sandbox/sandbox'
import { Sandbox, SandboxLogger, SandboxProcessMaker } from '../../../src/lib/sandbox/types'

const { treeKillMock } = vi.hoisted(() => ({
    treeKillMock: vi.fn((_pid: number, _signal: string, cb: (err?: Error) => void) => cb()),
}))

vi.mock('tree-kill', () => ({
    default: treeKillMock,
}))

vi.mock('../../../src/lib/cache/cache-paths', () => ({
    getGlobalCachePathLatestVersion: vi.fn(() => '/tmp/test-cache'),
}))

function createMockLogger(): SandboxLogger {
    return {
        info: vi.fn(),
        debug: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
    }
}

function createMockWorkerHandlers(): WorkerContract {
    return {
        updateRunProgress: vi.fn().mockResolvedValue(undefined),
        uploadRunLog: vi.fn().mockResolvedValue(undefined),
        sendFlowResponse: vi.fn().mockResolvedValue(undefined),
        updateStepProgress: vi.fn().mockResolvedValue(undefined),
    }
}

function createTestProcessMaker() {
    let client: ClientSocket | null = null
    let child: (ChildProcess & EventEmitter) | null = null

    const maker: SandboxProcessMaker = {
        create: vi.fn(async (params) => {
            const port = params.env.AP_SANDBOX_WS_PORT
            child = new EventEmitter() as ChildProcess & EventEmitter
            ;(child as ChildProcess).pid = 12345
            ;(child as ChildProcess).exitCode = null
            ;(child as ChildProcess).kill = vi.fn()

            client = ioClient(`http://127.0.0.1:${port}`, {
                path: '/worker/ws',
                autoConnect: true,
                reconnection: false,
            })

            return child as ChildProcess
        }),
    }

    return {
        maker,
        getClient: () => client!,
        getChild: () => child!,
    }
}

const defaultOptions = {
    env: { MY_VAR: 'value' },
    memoryLimitMb: 256,
    cpuMsPerSec: 1000,
    timeLimitSeconds: 300,
    reusable: false,
}

const startOptions = {
    flowVersionId: 'fv-1',
    platformId: 'plat-1',
    mounts: [],
}

describe('createSandbox', () => {
    let sandbox: Sandbox | null = null
    let testPM: ReturnType<typeof createTestProcessMaker>

    afterEach(async () => {
        const client = testPM?.getClient()
        if (client?.connected) {
            client.disconnect()
        }
        if (sandbox) {
            await sandbox.shutdown()
            sandbox = null
        }
    })

    describe('start', () => {
        it('creates socket server and calls processMaker.create with correct params', async () => {
            const log = createMockLogger()
            const workerHandlers = createMockWorkerHandlers()
            testPM = createTestProcessMaker()
            sandbox = createSandbox(log, 'sb-1', defaultOptions, testPM.maker, workerHandlers)

            await sandbox.start(startOptions)

            expect(testPM.maker.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    sandboxId: 'sb-1',
                    command: [],
                    mounts: expect.arrayContaining([
                        expect.objectContaining({
                            sandboxPath: '/root/custom_pieces',
                        }),
                    ]),
                    env: expect.objectContaining({
                        MY_VAR: 'value',
                        AP_SANDBOX_WS_PORT: expect.any(String),
                        AP_CUSTOM_PIECES_PATHS: '/root/custom_pieces',
                    }),
                    resourceLimits: {
                        memoryBytes: 256 * 1024 * 1024,
                        cpuMsPerSec: 1000,
                        timeLimitSeconds: 300,
                    },
                }),
            )
        })

        it('does not add custom piece mount when platformId is empty', async () => {
            const log = createMockLogger()
            const workerHandlers = createMockWorkerHandlers()
            testPM = createTestProcessMaker()
            sandbox = createSandbox(log, 'sb-no-mount', defaultOptions, testPM.maker, workerHandlers)

            await sandbox.start({ flowVersionId: 'fv-1', platformId: '', mounts: [] })

            const createCall = (testPM.maker.create as ReturnType<typeof vi.fn>).mock.calls[0][0]
            expect(createCall.mounts).toEqual([])
            expect(createCall.env.AP_CUSTOM_PIECES_PATHS).toBeUndefined()
        })

        it('is idempotent when already connected', async () => {
            const log = createMockLogger()
            const workerHandlers = createMockWorkerHandlers()
            testPM = createTestProcessMaker()
            sandbox = createSandbox(log, 'sb-2', defaultOptions, testPM.maker, workerHandlers)

            await sandbox.start(startOptions)
            await sandbox.start(startOptions)
            expect(testPM.maker.create).toHaveBeenCalledTimes(1)
        })
    })

    describe('execute', () => {
        async function startSandbox() {
            const log = createMockLogger()
            const workerHandlers = createMockWorkerHandlers()
            testPM = createTestProcessMaker()
            sandbox = createSandbox(log, 'sb-exec', defaultOptions, testPM.maker, workerHandlers)
            await sandbox.start(startOptions)
            return { sandbox, log, workerHandlers }
        }

        it('sends RPC executeOperation and resolves on response', async () => {
            const { sandbox } = await startSandbox()
            const client = testPM.getClient()

            const engineResponse = { status: 200, body: 'ok' }

            client.on('rpc', (msg: { method: string, payload: unknown }, ack: (result: unknown) => void) => {
                if (msg.method === 'executeOperation') {
                    ack(engineResponse)
                }
            })

            const result = await sandbox.execute(
                'EXECUTE_FLOW' as any,
                {} as any,
                { timeoutInSeconds: 10 },
            )

            expect(result).toEqual({ ...engineResponse, logs: undefined })
        })

        it('recovers after engine returns INTERNAL_ERROR and handles next job', async () => {
            const { sandbox } = await startSandbox()
            const client = testPM.getClient()

            let callCount = 0
            client.on('rpc', (msg: { method: string, payload: unknown }, ack: (result: unknown) => void) => {
                if (msg.method === 'executeOperation') {
                    callCount++
                    if (callCount === 1) {
                        ack({
                            response: undefined,
                            status: EngineResponseStatus.INTERNAL_ERROR,
                            error: 'Engine error: AppWebhookUrlNotAvailableError',
                        })
                    }
                    else {
                        ack({ response: { success: true }, status: EngineResponseStatus.OK })
                    }
                }
            })

            const firstResult = await sandbox.execute(
                'EXECUTE_FLOW' as any,
                {} as any,
                { timeoutInSeconds: 10 },
            )
            expect(firstResult.status).toBe(EngineResponseStatus.INTERNAL_ERROR)
            expect(firstResult.error).toBe('Engine error: AppWebhookUrlNotAvailableError')

            const secondResult = await sandbox.execute(
                'EXECUTE_FLOW' as any,
                {} as any,
                { timeoutInSeconds: 10 },
            )
            expect(secondResult.status).toBe(EngineResponseStatus.OK)
            expect(secondResult.response).toEqual({ success: true })
        })

        it('resolves with engine response and captures stdout/stderr', async () => {
            const { sandbox } = await startSandbox()
            const client = testPM.getClient()

            const engineResponse = { status: 200, body: 'ok' }
            client.on('rpc', (msg: { method: string, payload: unknown }, ack: (result: unknown) => void) => {
                if (msg.method === 'executeOperation') {
                    client.emit('rpc-notify', { method: 'stdout', payload: { message: 'line1\n' } })
                    client.emit('rpc-notify', { method: 'stderr', payload: { message: 'err1\n' } })
                    client.emit('rpc-notify', { method: 'stdout', payload: { message: 'line2\n' } })
                    setTimeout(() => {
                        ack(engineResponse)
                    }, 50)
                }
            })

            const result = await sandbox.execute(
                'EXECUTE_FLOW' as any,
                {} as any,
                { timeoutInSeconds: 10 },
            )

            expect(result).toEqual({ ...engineResponse, logs: 'stdout:\nline1\nline2\n\nstderr:\nerr1\n' })
        })

        it('delegates worker contract calls to handlers', async () => {
            const { sandbox, workerHandlers } = await startSandbox()
            const client = testPM.getClient()

            client.on('rpc', (msg: { method: string, payload: unknown }, ack: (result: unknown) => void) => {
                if (msg.method === 'executeOperation') {
                    // Simulate calling back to worker via RPC
                    client.timeout(5000).emitWithAck('rpc', { method: 'updateRunProgress', payload: { progress: 50 } }).then(() => {
                        ack({ status: 200 })
                    })
                }
            })

            await sandbox.execute(
                'EXECUTE_FLOW' as any,
                {} as any,
                { timeoutInSeconds: 10 },
            )

            expect(workerHandlers.updateRunProgress).toHaveBeenCalledWith({ progress: 50 })
        })

        it('rejects with SANDBOX_EXECUTION_TIMEOUT on real timeout', async () => {
            const { sandbox } = await startSandbox()
            const child = testPM.getChild()

            // Don't respond to RPC — let it timeout
            treeKillMock.mockImplementation((_pid: number, _signal: string, cb: (err?: Error) => void) => {
                child.emit('exit', null, 'SIGKILL')
                cb()
            })

            const executePromise = sandbox.execute(
                'EXECUTE_FLOW' as any,
                {} as any,
                { timeoutInSeconds: 0.5 },
            )

            await expect(executePromise).rejects.toThrow()
            try {
                await executePromise
            }
            catch (err) {
                expect((err as ActivepiecesError).error.code).toBe(ErrorCode.SANDBOX_EXECUTION_TIMEOUT)
            }
        })

        it('rejects with SANDBOX_MEMORY_ISSUE on exit code 134 / SIGABRT', async () => {
            const { sandbox } = await startSandbox()
            const client = testPM.getClient()
            const child = testPM.getChild()

            client.on('rpc', () => {
                child.emit('exit', 134, null)
            })

            const executePromise = sandbox.execute(
                'EXECUTE_FLOW' as any,
                {} as any,
                { timeoutInSeconds: 10 },
            )

            await expect(executePromise).rejects.toThrow()
            try {
                await executePromise
            }
            catch (err) {
                expect((err as ActivepiecesError).error.code).toBe(ErrorCode.SANDBOX_MEMORY_ISSUE)
            }
        })

        it('rejects with SANDBOX_LOG_SIZE_EXCEEDED', async () => {
            const { sandbox } = await startSandbox()
            const client = testPM.getClient()
            const child = testPM.getChild()

            client.on('rpc', () => {
                client.emit('rpc-notify', { method: 'stderr', payload: { message: 'Flow run data size exceeded the maximum allowed size' } })
                setTimeout(() => {
                    child.emit('exit', 1, null)
                }, 50)
            })

            const executePromise = sandbox.execute(
                'EXECUTE_FLOW' as any,
                {} as any,
                { timeoutInSeconds: 10 },
            )

            await expect(executePromise).rejects.toThrow()
            try {
                await executePromise
            }
            catch (err) {
                expect((err as ActivepiecesError).error.code).toBe(ErrorCode.SANDBOX_LOG_SIZE_EXCEEDED)
            }
        })

        it('rejects with SANDBOX_INTERNAL_ERROR for other exit codes', async () => {
            const { sandbox } = await startSandbox()
            const client = testPM.getClient()
            const child = testPM.getChild()

            client.on('rpc', () => {
                child.emit('exit', 1, null)
            })

            const executePromise = sandbox.execute(
                'EXECUTE_FLOW' as any,
                {} as any,
                { timeoutInSeconds: 10 },
            )

            await expect(executePromise).rejects.toThrow()
            try {
                await executePromise
            }
            catch (err) {
                expect((err as ActivepiecesError).error.code).toBe(ErrorCode.SANDBOX_INTERNAL_ERROR)
            }
        })

        it('cleans up listener, timeout, and event handlers in finally block', async () => {
            const { sandbox } = await startSandbox()
            const client = testPM.getClient()
            const child = testPM.getChild()
            const removeAllListenersSpy = vi.spyOn(child, 'removeAllListeners')

            client.on('rpc', (msg: { method: string, payload: unknown }, ack: (result: unknown) => void) => {
                if (msg.method === 'executeOperation') {
                    ack({ status: 200 })
                }
            })

            await sandbox.execute(
                'EXECUTE_FLOW' as any,
                {} as any,
                { timeoutInSeconds: 10 },
            )

            expect(removeAllListenersSpy).toHaveBeenCalledWith('exit')
            expect(removeAllListenersSpy).toHaveBeenCalledWith('error')
        })
    })

    describe('shutdown', () => {
        it('kills process, disconnects socket, closes io server', async () => {
            const log = createMockLogger()
            const workerHandlers = createMockWorkerHandlers()
            testPM = createTestProcessMaker()
            sandbox = createSandbox(log, 'sb-shutdown', defaultOptions, testPM.maker, workerHandlers)
            await sandbox.start(startOptions)

            await sandbox.shutdown()
            sandbox = null // already shut down

            expect(treeKillMock).toHaveBeenCalledWith(12345, 'SIGKILL', expect.any(Function))
        })
    })
})
