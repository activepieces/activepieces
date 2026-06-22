import { ChildProcess } from 'child_process'
import http from 'http'
import { EventEmitter } from 'node:events'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { ActivepiecesError, ErrorCode } from '@activepieces/core-utils'
import { EngineResponseStatus, WorkerContract } from '@activepieces/shared'
import { createSandbox } from '../../../../../src/lib/runtime/local-pool/sandbox/sandbox'
import { Sandbox, SandboxLogger, SandboxMount, SandboxProcessMaker } from '../../../../../src/lib/runtime/local-pool/sandbox/types'

const { treeKillMock } = vi.hoisted(() => ({
    treeKillMock: vi.fn((_pid: number, _signal: string, cb: (err?: Error) => void) => cb()),
}))

vi.mock('tree-kill', () => ({
    default: treeKillMock,
}))

vi.mock('../../../../../src/lib/runtime/local-pool/cache/cache-paths', () => ({
    getGlobalCachePathLatestVersion: vi.fn(() => '/tmp/test-cache'),
    getGlobalCodeCachePath: vi.fn(() => '/tmp/test-cache/codes'),
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

type EngineEmitter = {
    stdout: (message: string) => void
    stderr: (message: string) => void
    rpc: (method: string, payload: unknown) => void
    result: (response: unknown) => void
    error: (message: string) => void
}

type ExecuteHandler = (emit: EngineEmitter, operation: { operationType: string, operation: unknown }) => void

// Stands in for the real engine: an HTTP server that serves POST /execute and streams
// an SSE response (notify / rpc / result / error frames) exactly like worker-http.ts.
function createTestProcessMaker() {
    let child: (ChildProcess & EventEmitter) | null = null
    let engineServer: http.Server | null = null
    let onExecute: ExecuteHandler | null = null

    function frame(event: unknown): string {
        return `data: ${JSON.stringify(event)}\n\n`
    }

    const maker: SandboxProcessMaker = {
        create: vi.fn(async (params) => {
            const port = Number(params.env.AP_SANDBOX_WS_PORT)
            const token = params.env.AP_SANDBOX_WS_TOKEN
            child = new EventEmitter() as ChildProcess & EventEmitter
            ;(child as ChildProcess).pid = 12345
            ;(child as ChildProcess).exitCode = null
            ;(child as ChildProcess).kill = vi.fn()

            engineServer = http.createServer((req, res) => {
                if (req.method !== 'POST' || req.url !== '/execute') {
                    res.writeHead(404)
                    res.end()
                    return
                }
                if (req.headers['x-connection-token'] !== token) {
                    res.writeHead(401)
                    res.end()
                    return
                }
                res.writeHead(200, { 'Content-Type': 'text/event-stream' })
                const emit: EngineEmitter = {
                    stdout: (message) => res.write(frame({ t: 'notify', method: 'stdout', payload: { message } })),
                    stderr: (message) => res.write(frame({ t: 'notify', method: 'stderr', payload: { message } })),
                    rpc: (method, payload) => res.write(frame({ t: 'rpc', method, payload })),
                    result: (response) => { res.write(frame({ t: 'result', payload: response })); res.end() },
                    error: (message) => { res.write(frame({ t: 'error', message })); res.end() },
                }
                let body = ''
                req.on('data', (chunk) => { body += chunk })
                req.on('end', () => onExecute?.(emit, JSON.parse(body)))
            })
            await new Promise<void>((resolve) => engineServer!.listen(port, '127.0.0.1', resolve))

            return child as ChildProcess
        }),
    }

    return {
        maker,
        getChild: () => child!,
        setOnExecute: (fn: ExecuteHandler) => { onExecute = fn },
        close: async () => {
            if (engineServer) {
                engineServer.closeAllConnections?.()
                await new Promise<void>((resolve) => engineServer!.close(() => resolve()))
                engineServer = null
            }
        },
    }
}

const defaultOptions = {
    env: { MY_VAR: 'value' },
    memoryLimitMb: 256,
    cpuMsPerSec: 1000,
    timeLimitSeconds: 300,
    reusable: false,
    maxHttpBufferSizeBytes: 100 * 1024 * 1024,
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
        if (sandbox) {
            await sandbox.shutdown()
            sandbox = null
        }
        await testPM?.close()
    })

    describe('start', () => {
        it('passes the engine HTTP port and calls processMaker.create with correct params', async () => {
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
                        memoryLimitMb: 256,
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
            const customPieceMount = createCall.mounts.find((m: { sandboxPath: string }) => m.sandboxPath === '/root/custom_pieces')
            expect(customPieceMount).toBeUndefined()
            expect(createCall.env.AP_CUSTOM_PIECES_PATHS).toBeUndefined()
        })

        it('scopes code mount to flowVersionId when non-reusable', async () => {
            const log = createMockLogger()
            const workerHandlers = createMockWorkerHandlers()
            testPM = createTestProcessMaker()
            sandbox = createSandbox(log, 'sb-scoped', { ...defaultOptions, reusable: false }, testPM.maker, workerHandlers)

            await sandbox.start({ flowVersionId: 'fv-1', platformId: '', mounts: [] })

            const createCall = (testPM.maker.create as ReturnType<typeof vi.fn>).mock.calls[0][0]
            const codeMount = createCall.mounts.find((m: { sandboxPath: string }) => m.sandboxPath.startsWith('/root/codes'))
            expect(codeMount).toEqual({
                hostPath: '/tmp/test-cache/codes/fv-1',
                sandboxPath: '/root/codes/fv-1',
                optional: true,
            })
        })

        it('mounts full codes directory when reusable even with flowVersionId', async () => {
            const log = createMockLogger()
            const workerHandlers = createMockWorkerHandlers()
            testPM = createTestProcessMaker()
            sandbox = createSandbox(log, 'sb-reuse', { ...defaultOptions, reusable: true }, testPM.maker, workerHandlers)

            await sandbox.start({ flowVersionId: 'fv-1', platformId: '', mounts: [] })

            const createCall = (testPM.maker.create as ReturnType<typeof vi.fn>).mock.calls[0][0]
            const codeMount = createCall.mounts.find((m: { sandboxPath: string }) => m.sandboxPath.startsWith('/root/codes'))
            expect(codeMount).toEqual({
                hostPath: '/tmp/test-cache/codes',
                sandboxPath: '/root/codes',
                optional: true,
            })
        })

        it('omits code mount when non-reusable without flowVersionId', async () => {
            const log = createMockLogger()
            const workerHandlers = createMockWorkerHandlers()
            testPM = createTestProcessMaker()
            sandbox = createSandbox(log, 'sb-no-fv', { ...defaultOptions, reusable: false }, testPM.maker, workerHandlers)

            await sandbox.start({ flowVersionId: undefined, platformId: '', mounts: [] })

            const createCall = (testPM.maker.create as ReturnType<typeof vi.fn>).mock.calls[0][0]
            const codeMount = createCall.mounts.find((m: { sandboxPath: string }) => m.sandboxPath.startsWith('/root/codes'))
            expect(codeMount).toBeUndefined()
        })

        it('resolves custom_pieces hostPath to cache/custom_pieces/<platformId>', async () => {
            const log = createMockLogger()
            const workerHandlers = createMockWorkerHandlers()
            testPM = createTestProcessMaker()
            sandbox = createSandbox(log, 'sb-plat', defaultOptions, testPM.maker, workerHandlers)

            await sandbox.start({ flowVersionId: 'fv-1', platformId: 'plat-xyz', mounts: [] })

            const createCall = (testPM.maker.create as ReturnType<typeof vi.fn>).mock.calls[0][0]
            const customPieceMount = createCall.mounts.find((m: SandboxMount) => m.sandboxPath === '/root/custom_pieces')
            expect(customPieceMount).toEqual({
                hostPath: '/tmp/test-cache/custom_pieces/plat-xyz',
                sandboxPath: '/root/custom_pieces',
                optional: true,
            })
        })

        it.each([
            ['.'],
            ['..'],
            ['../etc'],
            ['a/b'],
            ['fv\\1'],
            ['fv\0null'],
            [''],
        ])('rejects path traversal in flowVersionId: %s', async (flowVersionId) => {
            const log = createMockLogger()
            const workerHandlers = createMockWorkerHandlers()
            testPM = createTestProcessMaker()
            sandbox = createSandbox(log, 'sb-fv-trav', defaultOptions, testPM.maker, workerHandlers)

            let caughtErr: unknown
            try {
                await sandbox.start({ flowVersionId, platformId: '', mounts: [] })
            }
            catch (err) {
                caughtErr = err
            }
            expect(caughtErr).toBeDefined()
            expect((caughtErr as ActivepiecesError).error.code).toBe(ErrorCode.VALIDATION)
            expect(testPM.maker.create).not.toHaveBeenCalled()
        })

        it.each([
            ['.'],
            ['..'],
            ['../other'],
            ['plat/sub'],
            ['plat\\x'],
            ['plat\0null'],
        ])('rejects path traversal in platformId: %s', async (platformId) => {
            const log = createMockLogger()
            const workerHandlers = createMockWorkerHandlers()
            testPM = createTestProcessMaker()
            sandbox = createSandbox(log, 'sb-plat-trav', defaultOptions, testPM.maker, workerHandlers)

            let caughtErr: unknown
            try {
                await sandbox.start({ flowVersionId: 'fv-1', platformId, mounts: [] })
            }
            catch (err) {
                caughtErr = err
            }
            expect(caughtErr).toBeDefined()
            expect((caughtErr as ActivepiecesError).error.code).toBe(ErrorCode.VALIDATION)
            expect(testPM.maker.create).not.toHaveBeenCalled()
        })

        it('rejects caller-supplied mount whose sandboxPath escapes /root/', async () => {
            const log = createMockLogger()
            const workerHandlers = createMockWorkerHandlers()
            testPM = createTestProcessMaker()
            sandbox = createSandbox(log, 'sb-escape', defaultOptions, testPM.maker, workerHandlers)

            const maliciousMount: SandboxMount = { hostPath: '/host/evil', sandboxPath: '/root/../etc' }

            await expect(
                sandbox.start({ flowVersionId: 'fv-1', platformId: '', mounts: [maliciousMount] }),
            ).rejects.toThrow()
            expect(testPM.maker.create).not.toHaveBeenCalled()
        })

        it('rejects baseMount whose sandboxPath escapes /root/', async () => {
            const log = createMockLogger()
            const workerHandlers = createMockWorkerHandlers()
            testPM = createTestProcessMaker()
            const baseMounts: SandboxMount[] = [{ hostPath: '/host/secret', sandboxPath: '/etc/passwd-evil' }]
            sandbox = createSandbox(log, 'sb-base-escape', { ...defaultOptions, baseMounts }, testPM.maker, workerHandlers)

            await expect(
                sandbox.start({ flowVersionId: 'fv-1', platformId: '', mounts: [] }),
            ).rejects.toThrow()
            expect(testPM.maker.create).not.toHaveBeenCalled()
        })

        it('composes mounts in order: baseMounts, codeMount, callerMounts, customPieceMounts', async () => {
            const log = createMockLogger()
            const workerHandlers = createMockWorkerHandlers()
            testPM = createTestProcessMaker()
            const baseMounts: SandboxMount[] = [{ hostPath: '/host/common', sandboxPath: '/root/common' }]
            sandbox = createSandbox(log, 'sb-order', { ...defaultOptions, baseMounts }, testPM.maker, workerHandlers)

            const callerMount: SandboxMount = { hostPath: '/host/x', sandboxPath: '/root/x' }
            await sandbox.start({ flowVersionId: 'fv-1', platformId: 'plat-1', mounts: [callerMount] })

            const createCall = (testPM.maker.create as ReturnType<typeof vi.fn>).mock.calls[0][0]
            expect(createCall.mounts).toEqual([
                { hostPath: '/host/common', sandboxPath: '/root/common' },
                { hostPath: '/tmp/test-cache/codes/fv-1', sandboxPath: '/root/codes/fv-1', optional: true },
                { hostPath: '/host/x', sandboxPath: '/root/x' },
                { hostPath: '/tmp/test-cache/custom_pieces/plat-1', sandboxPath: '/root/custom_pieces', optional: true },
            ])
        })

        it('never exposes host /etc, /root, or / as a sandbox mount', async () => {
            const log = createMockLogger()
            const workerHandlers = createMockWorkerHandlers()
            testPM = createTestProcessMaker()
            sandbox = createSandbox(log, 'sb-no-host-leak', defaultOptions, testPM.maker, workerHandlers)

            await sandbox.start(startOptions)

            const createCall = (testPM.maker.create as ReturnType<typeof vi.fn>).mock.calls[0][0]
            for (const mount of createCall.mounts as SandboxMount[]) {
                expect(mount.hostPath).not.toBe('/')
                expect(mount.hostPath).not.toBe('/etc')
                expect(mount.hostPath).not.toBe('/root')
                expect(mount.hostPath).not.toMatch(/^\/home(\/|$)/)
            }
        })

        it('does not inject AP_CUSTOM_PIECES_PATHS when platformId is undefined', async () => {
            const log = createMockLogger()
            const workerHandlers = createMockWorkerHandlers()
            testPM = createTestProcessMaker()
            sandbox = createSandbox(log, 'sb-no-plat-env', defaultOptions, testPM.maker, workerHandlers)

            await sandbox.start({ flowVersionId: 'fv-1', platformId: '', mounts: [] })

            const createCall = (testPM.maker.create as ReturnType<typeof vi.fn>).mock.calls[0][0]
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

        it('passes a per-start AP_SANDBOX_WS_TOKEN to the child', async () => {
            const log = createMockLogger()
            const workerHandlers = createMockWorkerHandlers()
            testPM = createTestProcessMaker()
            sandbox = createSandbox(log, 'sb-token', defaultOptions, testPM.maker, workerHandlers)

            await sandbox.start(startOptions)

            const createCall = (testPM.maker.create as ReturnType<typeof vi.fn>).mock.calls[0][0]
            expect(createCall.env.AP_SANDBOX_WS_TOKEN).toMatch(/^[a-f0-9]{64}$/)
        })

        it('rotates AP_SANDBOX_WS_TOKEN between successive start() calls on a reusable sandbox', async () => {
            const log = createMockLogger()
            const workerHandlers = createMockWorkerHandlers()
            const reusableOptions = { ...defaultOptions, reusable: true }
            testPM = createTestProcessMaker()
            sandbox = createSandbox(log, 'sb-rotate', reusableOptions, testPM.maker, workerHandlers)

            await sandbox.start(startOptions)
            const firstToken = (testPM.maker.create as ReturnType<typeof vi.fn>).mock.calls[0][0].env.AP_SANDBOX_WS_TOKEN
            await sandbox.shutdown()
            await sandbox.start(startOptions)
            const secondToken = (testPM.maker.create as ReturnType<typeof vi.fn>).mock.calls[1][0].env.AP_SANDBOX_WS_TOKEN

            expect(firstToken).toBeTruthy()
            expect(secondToken).toBeTruthy()
            expect(firstToken).not.toBe(secondToken)
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

        it('POSTs the operation and resolves on the result frame', async () => {
            const { sandbox } = await startSandbox()

            const engineResponse = { status: 200, body: 'ok' }
            testPM.setOnExecute((emit) => emit.result(engineResponse))

            const result = await sandbox.execute(
                'EXECUTE_FLOW' as any,
                {} as any,
                { timeoutInSeconds: 10 },
            )

            expect(result).toEqual({ ...engineResponse, logs: undefined })
        })

        it('recovers after engine returns INTERNAL_ERROR and handles next job', async () => {
            const { sandbox } = await startSandbox()

            let callCount = 0
            testPM.setOnExecute((emit) => {
                callCount++
                if (callCount === 1) {
                    emit.result({
                        response: undefined,
                        status: EngineResponseStatus.INTERNAL_ERROR,
                        error: 'Engine error: AppWebhookUrlNotAvailableError',
                    })
                }
                else {
                    emit.result({ response: { success: true }, status: EngineResponseStatus.OK })
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

            const engineResponse = { status: 200, body: 'ok' }
            testPM.setOnExecute((emit) => {
                emit.stdout('line1\n')
                emit.stderr('err1\n')
                emit.stdout('line2\n')
                emit.result(engineResponse)
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

            testPM.setOnExecute((emit) => {
                emit.rpc('updateRunProgress', { progress: 50 })
                emit.result({ status: 200 })
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

            // Never send a result — let the operation time out.
            testPM.setOnExecute(() => { })
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
            const child = testPM.getChild()

            testPM.setOnExecute(() => child.emit('exit', 134, null))

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
            const child = testPM.getChild()

            testPM.setOnExecute((emit) => {
                emit.stderr('Flow run data size exceeded the maximum allowed size')
                setTimeout(() => child.emit('exit', 1, null), 50)
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
            const child = testPM.getChild()

            testPM.setOnExecute(() => child.emit('exit', 1, null))

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

        it('cleans up timeout and process event handlers in finally block', async () => {
            const { sandbox } = await startSandbox()
            const child = testPM.getChild()
            const removeAllListenersSpy = vi.spyOn(child, 'removeAllListeners')

            testPM.setOnExecute((emit) => emit.result({ status: 200 }))

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
        it('kills the process tree', async () => {
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
