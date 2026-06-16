import { ChildProcess } from 'child_process'
import { createServer, IncomingMessage, Server as HttpServer, ServerResponse } from 'http'
import { AddressInfo, createServer as createNetServer } from 'net'
import { EventEmitter } from 'node:events'
import { ActivepiecesError, EngineResponseStatus, ErrorCode } from '@activepieces/shared'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Sandbox, SandboxInitOptions, SandboxLogger, SandboxMount, SandboxProcessMaker } from '../../../../../../src/lib/execute/runtime/sandbox-contract'
import { createSandbox } from '../../../../../../src/lib/execute/runtime/worker-pool/sandbox/sandbox'

const { treeKillMock } = vi.hoisted(() => ({
    treeKillMock: vi.fn((_pid: number, _signal: string, cb: (err?: Error) => void) => cb()),
}))

vi.mock('tree-kill', () => ({
    default: treeKillMock,
}))

vi.mock('../../../../../../src/lib/execute/cache/cache-paths', () => ({
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

function getFreePort(): Promise<number> {
    return new Promise((resolve, reject) => {
        const server = createNetServer()
        server.unref()
        server.on('error', reject)
        server.listen(0, '127.0.0.1', () => {
            const port = (server.address() as AddressInfo).port
            server.close(() => resolve(port))
        })
    })
}

// Stands in for the real engine: an HTTP server bound to the worker-assigned loopback port that
// answers /health and /execute. The child is a mock so tests can drive native stdout/stderr and
// exit signals directly, exactly as the worker observes them.
function createTestEngine() {
    let server: HttpServer | null = null
    let child: (ChildProcess & EventEmitter) | null = null
    let capturedToken: string | null = null
    let executeResponder: ((req: IncomingMessage, res: ServerResponse) => void) | null = null

    const defaultResponder = (_req: IncomingMessage, res: ServerResponse): void => {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ engineResponse: { status: EngineResponseStatus.OK, response: { success: true } }, logs: undefined }))
    }

    const maker: SandboxProcessMaker = {
        create: vi.fn(async (params) => {
            // A reused slot rebinds the same loopback port, so release the previous engine's
            // server before binding the new one — the real engine frees the port on kill.
            if (server) {
                await new Promise<void>((resolve) => server!.close(() => resolve()))
                server = null
            }
            capturedToken = params.env.AP_ENGINE_TOKEN ?? null
            const port = Number(params.env.AP_ENGINE_PORT)

            const stdout = new EventEmitter()
            const stderr = new EventEmitter()
            child = new EventEmitter() as ChildProcess & EventEmitter
            ;(child as ChildProcess).pid = 12345
            ;(child as ChildProcess).exitCode = null
            ;(child as ChildProcess).kill = vi.fn()
            Object.assign(child, { stdout, stderr })

            server = createServer((req, res) => {
                if (req.method === 'GET' && req.url === '/health') {
                    res.writeHead(200).end('ok')
                    return
                }
                if (req.method === 'POST' && req.url === '/execute') {
                    if (req.headers.authorization !== `Bearer ${capturedToken}`) {
                        res.writeHead(401).end()
                        return
                    }
                    ;(executeResponder ?? defaultResponder)(req, res)
                    return
                }
                res.writeHead(404).end()
            })
            await new Promise<void>((resolve) => server!.listen(port, '127.0.0.1', resolve))

            return child as ChildProcess
        }),
    }

    return {
        maker,
        getChild: () => child!,
        getToken: () => capturedToken,
        setExecuteResponder: (responder: (req: IncomingMessage, res: ServerResponse) => void) => {
            executeResponder = responder
        },
        close: async () => {
            if (server) {
                await new Promise<void>((resolve) => server!.close(() => resolve()))
                server = null
            }
        },
    }
}

async function buildOptions(overrides: Partial<SandboxInitOptions> = {}): Promise<SandboxInitOptions> {
    return {
        env: { MY_VAR: 'value' },
        memoryLimitMb: 256,
        cpuMsPerSec: 1000,
        timeLimitSeconds: 300,
        reusable: false,
        enginePort: await getFreePort(),
        ...overrides,
    }
}

const startOptions = {
    flowVersionId: 'fv-1',
    platformId: 'plat-1',
    mounts: [],
}

function getCreateCall(testEngine: ReturnType<typeof createTestEngine>): { mounts: SandboxMount[], env: Record<string, string> } {
    return (testEngine.maker.create as ReturnType<typeof vi.fn>).mock.calls[0][0]
}

describe('createSandbox', () => {
    let sandbox: Sandbox | null = null
    let testEngine: ReturnType<typeof createTestEngine>

    afterEach(async () => {
        if (sandbox) {
            await sandbox.shutdown()
            sandbox = null
        }
        if (testEngine) {
            await testEngine.close()
        }
    })

    describe('start', () => {
        it('starts the engine and calls processMaker.create with correct params', async () => {
            testEngine = createTestEngine()
            sandbox = createSandbox(createMockLogger(), 'sb-1', await buildOptions(), testEngine.maker)

            await sandbox.start(startOptions)

            expect(testEngine.maker.create).toHaveBeenCalledWith(
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
                        AP_ENGINE_PORT: expect.any(String),
                        AP_ENGINE_TOKEN: expect.any(String),
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
            testEngine = createTestEngine()
            sandbox = createSandbox(createMockLogger(), 'sb-no-mount', await buildOptions(), testEngine.maker)

            await sandbox.start({ flowVersionId: 'fv-1', platformId: '', mounts: [] })

            const createCall = getCreateCall(testEngine)
            const customPieceMount = createCall.mounts.find((m) => m.sandboxPath === '/root/custom_pieces')
            expect(customPieceMount).toBeUndefined()
            expect(createCall.env.AP_CUSTOM_PIECES_PATHS).toBeUndefined()
        })

        it('scopes code mount to flowVersionId when non-reusable', async () => {
            testEngine = createTestEngine()
            sandbox = createSandbox(createMockLogger(), 'sb-scoped', await buildOptions({ reusable: false }), testEngine.maker)

            await sandbox.start({ flowVersionId: 'fv-1', platformId: '', mounts: [] })

            const codeMount = getCreateCall(testEngine).mounts.find((m) => m.sandboxPath.startsWith('/root/codes'))
            expect(codeMount).toEqual({
                hostPath: '/tmp/test-cache/codes/fv-1',
                sandboxPath: '/root/codes/fv-1',
                optional: true,
            })
        })

        it('mounts full codes directory when reusable even with flowVersionId', async () => {
            testEngine = createTestEngine()
            sandbox = createSandbox(createMockLogger(), 'sb-reuse', await buildOptions({ reusable: true }), testEngine.maker)

            await sandbox.start({ flowVersionId: 'fv-1', platformId: '', mounts: [] })

            const codeMount = getCreateCall(testEngine).mounts.find((m) => m.sandboxPath.startsWith('/root/codes'))
            expect(codeMount).toEqual({
                hostPath: '/tmp/test-cache/codes',
                sandboxPath: '/root/codes',
                optional: true,
            })
        })

        it('omits code mount when non-reusable without flowVersionId', async () => {
            testEngine = createTestEngine()
            sandbox = createSandbox(createMockLogger(), 'sb-no-fv', await buildOptions({ reusable: false }), testEngine.maker)

            await sandbox.start({ flowVersionId: undefined, platformId: '', mounts: [] })

            const codeMount = getCreateCall(testEngine).mounts.find((m) => m.sandboxPath.startsWith('/root/codes'))
            expect(codeMount).toBeUndefined()
        })

        it('resolves custom_pieces hostPath to cache/custom_pieces/<platformId>', async () => {
            testEngine = createTestEngine()
            sandbox = createSandbox(createMockLogger(), 'sb-plat', await buildOptions(), testEngine.maker)

            await sandbox.start({ flowVersionId: 'fv-1', platformId: 'plat-xyz', mounts: [] })

            const customPieceMount = getCreateCall(testEngine).mounts.find((m) => m.sandboxPath === '/root/custom_pieces')
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
            testEngine = createTestEngine()
            sandbox = createSandbox(createMockLogger(), 'sb-fv-trav', await buildOptions(), testEngine.maker)

            let caughtErr: unknown
            try {
                await sandbox.start({ flowVersionId, platformId: '', mounts: [] })
            }
            catch (err) {
                caughtErr = err
            }
            expect(caughtErr).toBeDefined()
            expect((caughtErr as ActivepiecesError).error.code).toBe(ErrorCode.VALIDATION)
            expect(testEngine.maker.create).not.toHaveBeenCalled()
        })

        it.each([
            ['.'],
            ['..'],
            ['../other'],
            ['plat/sub'],
            ['plat\\x'],
            ['plat\0null'],
        ])('rejects path traversal in platformId: %s', async (platformId) => {
            testEngine = createTestEngine()
            sandbox = createSandbox(createMockLogger(), 'sb-plat-trav', await buildOptions(), testEngine.maker)

            let caughtErr: unknown
            try {
                await sandbox.start({ flowVersionId: 'fv-1', platformId, mounts: [] })
            }
            catch (err) {
                caughtErr = err
            }
            expect(caughtErr).toBeDefined()
            expect((caughtErr as ActivepiecesError).error.code).toBe(ErrorCode.VALIDATION)
            expect(testEngine.maker.create).not.toHaveBeenCalled()
        })

        it('rejects caller-supplied mount whose sandboxPath escapes /root/', async () => {
            testEngine = createTestEngine()
            sandbox = createSandbox(createMockLogger(), 'sb-escape', await buildOptions(), testEngine.maker)

            const maliciousMount: SandboxMount = { hostPath: '/host/evil', sandboxPath: '/root/../etc' }

            await expect(
                sandbox.start({ flowVersionId: 'fv-1', platformId: '', mounts: [maliciousMount] }),
            ).rejects.toThrow()
            expect(testEngine.maker.create).not.toHaveBeenCalled()
        })

        it('rejects baseMount whose sandboxPath escapes /root/', async () => {
            testEngine = createTestEngine()
            const baseMounts: SandboxMount[] = [{ hostPath: '/host/secret', sandboxPath: '/etc/passwd-evil' }]
            sandbox = createSandbox(createMockLogger(), 'sb-base-escape', await buildOptions({ baseMounts }), testEngine.maker)

            await expect(
                sandbox.start({ flowVersionId: 'fv-1', platformId: '', mounts: [] }),
            ).rejects.toThrow()
            expect(testEngine.maker.create).not.toHaveBeenCalled()
        })

        it('composes mounts in order: baseMounts, codeMount, callerMounts, customPieceMounts', async () => {
            testEngine = createTestEngine()
            const baseMounts: SandboxMount[] = [{ hostPath: '/host/common', sandboxPath: '/root/common' }]
            sandbox = createSandbox(createMockLogger(), 'sb-order', await buildOptions({ baseMounts }), testEngine.maker)

            const callerMount: SandboxMount = { hostPath: '/host/x', sandboxPath: '/root/x' }
            await sandbox.start({ flowVersionId: 'fv-1', platformId: 'plat-1', mounts: [callerMount] })

            expect(getCreateCall(testEngine).mounts).toEqual([
                { hostPath: '/host/common', sandboxPath: '/root/common' },
                { hostPath: '/tmp/test-cache/codes/fv-1', sandboxPath: '/root/codes/fv-1', optional: true },
                { hostPath: '/host/x', sandboxPath: '/root/x' },
                { hostPath: '/tmp/test-cache/custom_pieces/plat-1', sandboxPath: '/root/custom_pieces', optional: true },
            ])
        })

        it('is idempotent when already started', async () => {
            testEngine = createTestEngine()
            sandbox = createSandbox(createMockLogger(), 'sb-2', await buildOptions(), testEngine.maker)

            await sandbox.start(startOptions)
            await sandbox.start(startOptions)
            expect(testEngine.maker.create).toHaveBeenCalledTimes(1)
        })

        it('passes a per-start AP_ENGINE_TOKEN to the child', async () => {
            testEngine = createTestEngine()
            sandbox = createSandbox(createMockLogger(), 'sb-token', await buildOptions(), testEngine.maker)

            await sandbox.start(startOptions)

            expect(getCreateCall(testEngine).env.AP_ENGINE_TOKEN).toMatch(/^[a-f0-9]{64}$/)
        })

        it('rotates AP_ENGINE_TOKEN between successive start() calls on a reusable sandbox', async () => {
            testEngine = createTestEngine()
            sandbox = createSandbox(createMockLogger(), 'sb-rotate', await buildOptions({ reusable: true }), testEngine.maker)

            await sandbox.start(startOptions)
            const firstToken = getCreateCall(testEngine).env.AP_ENGINE_TOKEN
            await sandbox.shutdown()
            await sandbox.start(startOptions)
            const secondToken = (testEngine.maker.create as ReturnType<typeof vi.fn>).mock.calls[1][0].env.AP_ENGINE_TOKEN

            expect(firstToken).toBeTruthy()
            expect(secondToken).toBeTruthy()
            expect(firstToken).not.toBe(secondToken)
        })
    })

    describe('execute', () => {
        async function startSandbox() {
            const log = createMockLogger()
            testEngine = createTestEngine()
            sandbox = createSandbox(log, 'sb-exec', await buildOptions(), testEngine.maker)
            await sandbox.start(startOptions)
            return { sandbox, log }
        }

        it('POSTs the operation and resolves on the engine response', async () => {
            const { sandbox } = await startSandbox()
            testEngine.setExecuteResponder((_req, res) => {
                res.writeHead(200, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ engineResponse: { status: EngineResponseStatus.OK, response: { ok: true } }, logs: undefined }))
            })

            const result = await sandbox.execute('EXECUTE_FLOW' as never, {} as never, { timeoutInSeconds: 10 })

            expect(result).toEqual({ status: EngineResponseStatus.OK, response: { ok: true }, logs: undefined })
        })

        it('returns the logs carried back in the response body', async () => {
            const { sandbox } = await startSandbox()
            testEngine.setExecuteResponder((_req, res) => {
                res.writeHead(200, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ engineResponse: { status: EngineResponseStatus.OK, response: {} }, logs: 'line1\nline2\nerr1\n' }))
            })

            const result = await sandbox.execute('EXECUTE_FLOW' as never, {} as never, { timeoutInSeconds: 10 })

            expect(result.logs).toBe('line1\nline2\nerr1\n')
        })

        it('forwards a per-spawn bearer token the engine validates', async () => {
            const { sandbox } = await startSandbox()
            let seenAuth: string | undefined
            testEngine.setExecuteResponder((req, res) => {
                seenAuth = req.headers.authorization
                res.writeHead(200, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ engineResponse: { status: EngineResponseStatus.OK, response: {} } }))
            })

            await sandbox.execute('EXECUTE_FLOW' as never, {} as never, { timeoutInSeconds: 10 })

            expect(seenAuth).toBe(`Bearer ${testEngine.getToken()}`)
        })

        it('passes INTERNAL_ERROR responses through and handles the next job', async () => {
            const { sandbox } = await startSandbox()
            let callCount = 0
            testEngine.setExecuteResponder((_req, res) => {
                callCount++
                res.writeHead(200, { 'Content-Type': 'application/json' })
                if (callCount === 1) {
                    res.end(JSON.stringify({ engineResponse: { response: undefined, status: EngineResponseStatus.INTERNAL_ERROR, error: 'Engine error: AppWebhookUrlNotAvailableError' } }))
                }
                else {
                    res.end(JSON.stringify({ engineResponse: { response: { success: true }, status: EngineResponseStatus.OK } }))
                }
            })

            const firstResult = await sandbox.execute('EXECUTE_FLOW' as never, {} as never, { timeoutInSeconds: 10 })
            expect(firstResult.status).toBe(EngineResponseStatus.INTERNAL_ERROR)
            expect(firstResult.error).toBe('Engine error: AppWebhookUrlNotAvailableError')

            const secondResult = await sandbox.execute('EXECUTE_FLOW' as never, {} as never, { timeoutInSeconds: 10 })
            expect(secondResult.status).toBe(EngineResponseStatus.OK)
            expect(secondResult.response).toEqual({ success: true })
        })

        it('rejects with SANDBOX_EXECUTION_TIMEOUT on real timeout', async () => {
            const { sandbox } = await startSandbox()
            const child = testEngine.getChild()
            testEngine.setExecuteResponder(() => { /* never respond — force timeout */ })
            treeKillMock.mockImplementation((_pid: number, _signal: string, cb: (err?: Error) => void) => {
                child.emit('exit', null, 'SIGKILL')
                cb()
            })

            const executePromise = sandbox.execute('EXECUTE_FLOW' as never, {} as never, { timeoutInSeconds: 0.5 })

            await expect(executePromise).rejects.toMatchObject({ error: { code: ErrorCode.SANDBOX_EXECUTION_TIMEOUT } })
            treeKillMock.mockImplementation((_pid: number, _signal: string, cb: (err?: Error) => void) => cb())
        })

        it('rejects with SANDBOX_MEMORY_ISSUE on exit code 134 / SIGABRT', async () => {
            const { sandbox } = await startSandbox()
            const child = testEngine.getChild()
            testEngine.setExecuteResponder(() => { /* engine crashes instead of responding */ })

            const executePromise = sandbox.execute('EXECUTE_FLOW' as never, {} as never, { timeoutInSeconds: 10 })
            child.emit('exit', 134, null)

            await expect(executePromise).rejects.toMatchObject({ error: { code: ErrorCode.SANDBOX_MEMORY_ISSUE } })
        })

        it('rejects with SANDBOX_LOG_SIZE_EXCEEDED from native stderr', async () => {
            const { sandbox } = await startSandbox()
            const child = testEngine.getChild()
            testEngine.setExecuteResponder(() => { /* engine crashes instead of responding */ })

            const executePromise = sandbox.execute('EXECUTE_FLOW' as never, {} as never, { timeoutInSeconds: 10 })
            child.stderr!.emit('data', Buffer.from('Flow run data size exceeded the maximum allowed size'))
            child.emit('exit', 1, null)

            await expect(executePromise).rejects.toMatchObject({ error: { code: ErrorCode.SANDBOX_LOG_SIZE_EXCEEDED } })
        })

        it('rejects with SANDBOX_INTERNAL_ERROR for other exit codes', async () => {
            const { sandbox } = await startSandbox()
            const child = testEngine.getChild()
            testEngine.setExecuteResponder(() => { /* engine crashes instead of responding */ })

            const executePromise = sandbox.execute('EXECUTE_FLOW' as never, {} as never, { timeoutInSeconds: 10 })
            child.emit('exit', 1, null)

            await expect(executePromise).rejects.toMatchObject({ error: { code: ErrorCode.SANDBOX_INTERNAL_ERROR } })
        })

        it('cleans up exit/error listeners in the finally block', async () => {
            const { sandbox } = await startSandbox()
            const child = testEngine.getChild()
            const removeAllListenersSpy = vi.spyOn(child, 'removeAllListeners')

            await sandbox.execute('EXECUTE_FLOW' as never, {} as never, { timeoutInSeconds: 10 })

            expect(removeAllListenersSpy).toHaveBeenCalledWith('exit')
            expect(removeAllListenersSpy).toHaveBeenCalledWith('error')
        })
    })

    describe('shutdown', () => {
        it('tree-kills the engine process on clean shutdown (orphan test A)', async () => {
            testEngine = createTestEngine()
            sandbox = createSandbox(createMockLogger(), 'sb-shutdown', await buildOptions(), testEngine.maker)
            await sandbox.start(startOptions)

            await sandbox.shutdown()
            sandbox = null

            expect(treeKillMock).toHaveBeenCalledWith(12345, 'SIGKILL', expect.any(Function))
        })
    })
})
