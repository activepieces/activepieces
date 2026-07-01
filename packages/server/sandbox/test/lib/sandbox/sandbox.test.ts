import { ChildProcess } from 'child_process'
import { EventEmitter } from 'node:events'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { io as ioClient, type Socket as ClientSocket } from 'socket.io-client'
import { ActivepiecesError, ErrorCode } from '@activepieces/core-utils'
import { EngineResponseStatus } from '@activepieces/shared'
import { createSandbox } from '../../../src/lib/sandbox/sandbox'
import { Sandbox, SandboxLogger, SandboxMount, SandboxProcessMaker } from '../../../src/lib/sandbox/types'

const { treeKillMock } = vi.hoisted(() => ({
    treeKillMock: vi.fn((_pid: number, _signal: string, cb: (err?: Error) => void) => cb()),
}))

vi.mock('tree-kill', () => ({
    default: treeKillMock,
}))

vi.mock('../../../src/lib/cache/cache-paths', () => ({
    cacheUtils: vi.fn(() => ({
        getGlobalCachePathLatestVersion: vi.fn(() => '/tmp/test-cache'),
        getGlobalCodeCachePath: vi.fn(() => '/tmp/test-cache/codes'),
        getCustomPiecesPath: vi.fn((platformId: string) => `/tmp/test-cache/custom_pieces/${platformId}`),
    })),
}))

function createMockLogger(): SandboxLogger {
    return {
        info: vi.fn(),
        debug: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
    }
}

function createTestProcessMaker() {
    let client: ClientSocket | null = null
    let child: (ChildProcess & EventEmitter) | null = null

    const maker: SandboxProcessMaker = {
        create: vi.fn(async (params) => {
            const port = params.env.AP_SANDBOX_WS_PORT
            const token = params.env.AP_SANDBOX_WS_TOKEN ?? null
            child = new EventEmitter() as ChildProcess & EventEmitter
            ;(child as ChildProcess).pid = 12345
            ;(child as ChildProcess).exitCode = null
            ;(child as ChildProcess).kill = vi.fn()
            ;(child as unknown as { stdout: EventEmitter }).stdout = new EventEmitter()
            ;(child as unknown as { stderr: EventEmitter }).stderr = new EventEmitter()

            client = ioClient(`http://127.0.0.1:${port}`, {
                path: '/worker/ws',
                autoConnect: true,
                reconnection: false,
                auth: { sandboxId: params.sandboxId, connectionToken: token },
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
    maxHttpBufferSizeBytes: 100 * 1024 * 1024,
    basePath: '/tmp',
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
            testPM = createTestProcessMaker()
            sandbox = createSandbox(log, 'sb-1', defaultOptions, testPM.maker)

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
            testPM = createTestProcessMaker()
            sandbox = createSandbox(log, 'sb-no-mount', defaultOptions, testPM.maker)

            await sandbox.start({ flowVersionId: 'fv-1', platformId: '', mounts: [] })

            const createCall = (testPM.maker.create as ReturnType<typeof vi.fn>).mock.calls[0][0]
            const customPieceMount = createCall.mounts.find((m: { sandboxPath: string }) => m.sandboxPath === '/root/custom_pieces')
            expect(customPieceMount).toBeUndefined()
            expect(createCall.env.AP_CUSTOM_PIECES_PATHS).toBeUndefined()
        })

        it('scopes code mount to flowVersionId when non-reusable', async () => {
            const log = createMockLogger()
            testPM = createTestProcessMaker()
            sandbox = createSandbox(log, 'sb-scoped', { ...defaultOptions, reusable: false }, testPM.maker)

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
            testPM = createTestProcessMaker()
            sandbox = createSandbox(log, 'sb-reuse', { ...defaultOptions, reusable: true }, testPM.maker)

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
            testPM = createTestProcessMaker()
            sandbox = createSandbox(log, 'sb-no-fv', { ...defaultOptions, reusable: false }, testPM.maker)

            await sandbox.start({ flowVersionId: undefined, platformId: '', mounts: [] })

            const createCall = (testPM.maker.create as ReturnType<typeof vi.fn>).mock.calls[0][0]
            const codeMount = createCall.mounts.find((m: { sandboxPath: string }) => m.sandboxPath.startsWith('/root/codes'))
            expect(codeMount).toBeUndefined()
        })

        it('resolves custom_pieces hostPath to cache/custom_pieces/<platformId>', async () => {
            const log = createMockLogger()
            testPM = createTestProcessMaker()
            sandbox = createSandbox(log, 'sb-plat', defaultOptions, testPM.maker)

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
            testPM = createTestProcessMaker()
            sandbox = createSandbox(log, 'sb-fv-trav', defaultOptions, testPM.maker)

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
            testPM = createTestProcessMaker()
            sandbox = createSandbox(log, 'sb-plat-trav', defaultOptions, testPM.maker)

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
            testPM = createTestProcessMaker()
            sandbox = createSandbox(log, 'sb-escape', defaultOptions, testPM.maker)

            const maliciousMount: SandboxMount = { hostPath: '/host/evil', sandboxPath: '/root/../etc' }

            await expect(
                sandbox.start({ flowVersionId: 'fv-1', platformId: '', mounts: [maliciousMount] }),
            ).rejects.toThrow()
            expect(testPM.maker.create).not.toHaveBeenCalled()
        })

        it('rejects baseMount whose sandboxPath escapes /root/', async () => {
            const log = createMockLogger()
            testPM = createTestProcessMaker()
            const baseMounts: SandboxMount[] = [{ hostPath: '/host/secret', sandboxPath: '/etc/passwd-evil' }]
            sandbox = createSandbox(log, 'sb-base-escape', { ...defaultOptions, baseMounts }, testPM.maker)

            await expect(
                sandbox.start({ flowVersionId: 'fv-1', platformId: '', mounts: [] }),
            ).rejects.toThrow()
            expect(testPM.maker.create).not.toHaveBeenCalled()
        })

        it('composes mounts in order: baseMounts, codeMount, callerMounts, customPieceMounts', async () => {
            const log = createMockLogger()
            testPM = createTestProcessMaker()
            const baseMounts: SandboxMount[] = [{ hostPath: '/host/common', sandboxPath: '/root/common' }]
            sandbox = createSandbox(log, 'sb-order', { ...defaultOptions, baseMounts }, testPM.maker)

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
            testPM = createTestProcessMaker()
            sandbox = createSandbox(log, 'sb-no-host-leak', defaultOptions, testPM.maker)

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
            testPM = createTestProcessMaker()
            sandbox = createSandbox(log, 'sb-no-plat-env', defaultOptions, testPM.maker)

            await sandbox.start({ flowVersionId: 'fv-1', platformId: '', mounts: [] })

            const createCall = (testPM.maker.create as ReturnType<typeof vi.fn>).mock.calls[0][0]
            expect(createCall.env.AP_CUSTOM_PIECES_PATHS).toBeUndefined()
        })

        it('does NOT crash the process when a fixed ws port is already bound — fails just that sandbox', async () => {
            // Isolate mode pins a fixed ws port per box. Two boxes contending the same port must not
            // let the EADDRINUSE 'error' event become an uncaught exception that kills the whole worker.
            const log = createMockLogger()
            const fixedPort = 53777
            const pmA = createTestProcessMaker()
            const pmB = createTestProcessMaker()
            const sandboxA = createSandbox(log, 'sb-port-a', { ...defaultOptions, wsRpcPort: fixedPort }, pmA.maker)
            const sandboxB = createSandbox(log, 'sb-port-b', { ...defaultOptions, wsRpcPort: fixedPort }, pmB.maker)

            await sandboxA.start(startOptions)

            let code: ErrorCode | undefined
            try {
                await sandboxB.start(startOptions)
            }
            catch (err) {
                code = (err as ActivepiecesError).error.code
            }
            // A catchable error, NOT an uncaught crash (the test process is still running).
            expect(code).toBe(ErrorCode.SANDBOX_INTERNAL_ERROR)
            // A keeps working on its port.
            expect(pmA.getClient().connected).toBe(true)

            await sandboxA.shutdown()
            const clientB = pmB.getClient()
            if (clientB?.connected) clientB.disconnect()
        }, 20_000)

        it('is idempotent when already connected', async () => {
            const log = createMockLogger()
            testPM = createTestProcessMaker()
            sandbox = createSandbox(log, 'sb-2', defaultOptions, testPM.maker)

            await sandbox.start(startOptions)
            await sandbox.start(startOptions)
            expect(testPM.maker.create).toHaveBeenCalledTimes(1)
        })

        it('passes a per-start AP_SANDBOX_WS_TOKEN to the child', async () => {
            const log = createMockLogger()
            testPM = createTestProcessMaker()
            sandbox = createSandbox(log, 'sb-token', defaultOptions, testPM.maker)

            await sandbox.start(startOptions)

            const createCall = (testPM.maker.create as ReturnType<typeof vi.fn>).mock.calls[0][0]
            expect(createCall.env.AP_SANDBOX_WS_TOKEN).toMatch(/^[a-f0-9]{64}$/)
        })

        it('rotates AP_SANDBOX_WS_TOKEN between successive start() calls on a reusable sandbox', async () => {
            const log = createMockLogger()
            const reusableOptions = { ...defaultOptions, reusable: true }
            testPM = createTestProcessMaker()
            sandbox = createSandbox(log, 'sb-rotate', reusableOptions, testPM.maker)

            await sandbox.start(startOptions)
            const firstToken = (testPM.maker.create as ReturnType<typeof vi.fn>).mock.calls[0][0].env.AP_SANDBOX_WS_TOKEN
            await sandbox.shutdown()
            await sandbox.start(startOptions)
            const secondToken = (testPM.maker.create as ReturnType<typeof vi.fn>).mock.calls[1][0].env.AP_SANDBOX_WS_TOKEN

            expect(firstToken).toBeTruthy()
            expect(secondToken).toBeTruthy()
            expect(firstToken).not.toBe(secondToken)
        })

        it('rejects an unauthenticated Socket.IO connection', async () => {
            const log = createMockLogger()
            testPM = createTestProcessMaker()
            sandbox = createSandbox(log, 'sb-rej-noauth', defaultOptions, testPM.maker)

            await sandbox.start(startOptions)
            const port = (testPM.maker.create as ReturnType<typeof vi.fn>).mock.calls[0][0].env.AP_SANDBOX_WS_PORT

            const attacker = ioClient(`http://127.0.0.1:${port}`, {
                path: '/worker/ws',
                autoConnect: true,
                reconnection: false,
            })
            const err = await new Promise<Error>((resolve, reject) => {
                attacker.on('connect_error', resolve)
                attacker.on('connect', () => reject(new Error('attacker should not have connected')))
                setTimeout(() => reject(new Error('no connect_error received')), 2000)
            })
            attacker.disconnect()

            expect(err.message).toBe('unauthorized')
            expect(testPM.getClient().connected).toBe(true)
        })

        it('rejects a Socket.IO connection that presents the wrong token', async () => {
            const log = createMockLogger()
            testPM = createTestProcessMaker()
            sandbox = createSandbox(log, 'sb-rej-wrong', defaultOptions, testPM.maker)

            await sandbox.start(startOptions)
            const port = (testPM.maker.create as ReturnType<typeof vi.fn>).mock.calls[0][0].env.AP_SANDBOX_WS_PORT

            const attacker = ioClient(`http://127.0.0.1:${port}`, {
                path: '/worker/ws',
                autoConnect: true,
                reconnection: false,
                auth: { sandboxId: 'spoof', connectionToken: 'definitely-not-the-real-token' },
            })
            const err = await new Promise<Error>((resolve, reject) => {
                attacker.on('connect_error', resolve)
                attacker.on('connect', () => reject(new Error('attacker should not have connected')))
                setTimeout(() => reject(new Error('no connect_error received')), 2000)
            })
            attacker.disconnect()

            expect(err.message).toBe('unauthorized')
            expect(testPM.getClient().connected).toBe(true)
        })

        it('disconnects a second authenticated connection while keeping the first active', async () => {
            const log = createMockLogger()
            testPM = createTestProcessMaker()
            sandbox = createSandbox(log, 'sb-rej-second', defaultOptions, testPM.maker)

            await sandbox.start(startOptions)
            const createCall = (testPM.maker.create as ReturnType<typeof vi.fn>).mock.calls[0][0]
            const port = createCall.env.AP_SANDBOX_WS_PORT
            const token = createCall.env.AP_SANDBOX_WS_TOKEN

            const second = ioClient(`http://127.0.0.1:${port}`, {
                path: '/worker/ws',
                autoConnect: true,
                reconnection: false,
                auth: { sandboxId: 'second', connectionToken: token },
            })
            await new Promise<void>((resolve, reject) => {
                second.on('disconnect', () => resolve())
                second.on('connect_error', (e) => reject(new Error(`unexpected connect_error: ${e.message}`)))
                setTimeout(() => reject(new Error('second connection was not disconnected')), 2000)
            })

            expect(second.connected).toBe(false)
            expect(testPM.getClient().connected).toBe(true)
        })
    })

    describe('execute', () => {
        async function startSandbox() {
            const log = createMockLogger()
            testPM = createTestProcessMaker()
            sandbox = createSandbox(log, 'sb-exec', defaultOptions, testPM.maker)
            await sandbox.start(startOptions)
            return { sandbox, log }
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

        it('captures native process stderr into the error when the engine crashes without socket output', async () => {
            const { sandbox } = await startSandbox()
            const client = testPM.getClient()
            const child = testPM.getChild()
            const nativeStack = 'Error: Boom inside engine trigger hook: cannot read properties of undefined\n    at run (google-sheets)\n'

            client.on('rpc', () => {
                ;(child.stderr as unknown as EventEmitter).emit('data', Buffer.from(nativeStack))
                setTimeout(() => child.emit('exit', 1, null), 20)
            })

            const executePromise = sandbox.execute(
                'EXECUTE_TRIGGER_HOOK' as any,
                {} as any,
                { timeoutInSeconds: 10 },
            )

            await expect(executePromise).rejects.toThrow()
            try {
                await executePromise
            }
            catch (err) {
                const activepiecesError = err as ActivepiecesError
                expect(activepiecesError.error.code).toBe(ErrorCode.SANDBOX_INTERNAL_ERROR)
                expect((activepiecesError.error.params as { standardError: string }).standardError).toContain('Boom inside engine trigger hook')
            }
        })

        it('classifies a native heap-OOM crash (exit code 1 / null) as SANDBOX_MEMORY_ISSUE', async () => {
            const { sandbox } = await startSandbox()
            const client = testPM.getClient()
            const child = testPM.getChild()

            client.on('rpc', () => {
                ;(child.stderr as unknown as EventEmitter).emit('data', Buffer.from('FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory\n'))
                setTimeout(() => child.emit('exit', 1, null), 20)
            })

            const executePromise = sandbox.execute(
                'EXECUTE_TRIGGER_HOOK' as any,
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
            testPM = createTestProcessMaker()
            sandbox = createSandbox(log, 'sb-shutdown', defaultOptions, testPM.maker)
            await sandbox.start(startOptions)

            await sandbox.shutdown()
            sandbox = null // already shut down

            expect(treeKillMock).toHaveBeenCalledWith(12345, 'SIGKILL', expect.any(Function))
        })
    })
})
