import { createServer } from 'node:http'
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { Server as IOServer } from 'socket.io'
import {
    createRpcServer,
    ExecutionMode,
    WebsocketServerEvent,
} from '@activepieces/shared'
import type { WorkerToApiContract, WorkerSettingsResponse } from '@activepieces/shared'

const mockWorkerSettingsSet = vi.fn()

vi.mock('../../src/lib/config/worker-settings', () => ({
    workerSettings: {
        set: (...args: unknown[]) => mockWorkerSettingsSet(...args),
        waitForSettings: vi.fn().mockResolvedValue({ PUBLIC_URL: 'http://localhost:3000' }),
        getSettings: vi.fn().mockReturnValue({ PUBLIC_URL: 'http://localhost:3000' }),
    },
}))

vi.mock('../../src/lib/config/logger', () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
        child: vi.fn().mockReturnValue({
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
            debug: vi.fn(),
        }),
    },
}))

vi.mock('../../src/lib/execute/job-registry', () => ({
    getHandler: vi.fn(),
}))

import { worker } from '../../src/lib/worker'

function buildWorkerSettingsResponse(overrides?: Partial<WorkerSettingsResponse>): WorkerSettingsResponse {
    return {
        PUBLIC_URL: 'http://localhost:3000',
        TRIGGER_TIMEOUT_SECONDS: 60,
        TRIGGER_HOOKS_TIMEOUT_SECONDS: 60,
        PAUSED_FLOW_TIMEOUT_DAYS: 30,
        EXECUTION_MODE: ExecutionMode.SANDBOX_CODE_AND_PROCESS,
        FLOW_TIMEOUT_SECONDS: 600,
        LOG_LEVEL: 'info',
        LOG_PRETTY: 'false',
        ENVIRONMENT: 'prod',
        APP_WEBHOOK_SECRETS: '{}',
        MAX_FLOW_RUN_LOG_SIZE_MB: 10,
        MAX_FILE_SIZE_MB: 10,
        SANDBOX_MEMORY_LIMIT: '1024',
        SANDBOX_PROPAGATED_ENV_VARS: [],
        DEV_PIECES: [],
        OTEL_ENABLED: false,
        FILE_STORAGE_LOCATION: '/tmp',
        S3_USE_SIGNED_URLS: 'false',
        EVENT_DESTINATION_TIMEOUT_SECONDS: 30,
        EDITION: 'community',
        SSRF_PROTECTION_ENABLED: false,
        SSRF_ALLOW_LIST: [],
        ...overrides,
    }
}

function buildMinimalHandlers(): WorkerToApiContract {
    return {
        poll: vi.fn(async () => null),
        completeJob: vi.fn(),
        updateRunProgress: vi.fn(),
        uploadRunLog: vi.fn(),
        sendFlowResponse: vi.fn(),
        updateStepProgress: vi.fn(),
        submitPayloads: vi.fn(),
        savePayloads: vi.fn(),
        getFlowVersion: vi.fn(),
        getPiece: vi.fn(),
        getPieceArchive: vi.fn(),
        extendLock: vi.fn(),
        getPayloadFile: vi.fn(),
        getUsedPieces: vi.fn().mockResolvedValue([]),
        markPieceAsUsed: vi.fn(),
        disableFlow: vi.fn(),
    }
}

describe('worker settings override', () => {
    let httpServer: ReturnType<typeof createServer>
    let ioServer: IOServer
    let port: number

    beforeEach(async () => {
        httpServer = createServer()
        ioServer = new IOServer(httpServer, { transports: ['websocket'], path: '/api/socket.io' })
        await new Promise<void>((resolve) => {
            httpServer.listen(0, () => {
                port = (httpServer.address() as { port: number }).port
                resolve()
            })
        })
        process.env.AP_FRONTEND_URL = `http://127.0.0.1:${port}`
        process.env.AP_CONTAINER_TYPE = 'WORKER'
        delete process.env.AP_EXECUTION_MODE
        delete process.env.AP_WORKER_GROUP_ID
        mockWorkerSettingsSet.mockClear()
    })

    afterEach(async () => {
        await worker.stop()
        delete process.env.AP_EXECUTION_MODE
        delete process.env.AP_WORKER_GROUP_ID
        delete process.env.AP_REUSE_SANDBOX
        await new Promise<void>((resolve) => {
            ioServer.close(() => resolve())
        })
    })

    function connectAndWaitForSettings(serverResponse: WorkerSettingsResponse): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Timed out waiting for settings')), 5000)
            ioServer.on('connection', (serverSocket) => {
                serverSocket.on(WebsocketServerEvent.FETCH_WORKER_SETTINGS, (...args: unknown[]) => {
                    const callback = args[args.length - 1]
                    if (typeof callback === 'function') {
                        callback(serverResponse)
                        setTimeout(() => {
                            clearTimeout(timeout)
                            resolve()
                        }, 200)
                    }
                })
                createRpcServer<WorkerToApiContract>(serverSocket, buildMinimalHandlers())
            })
            worker.start({
                apiUrl: `http://127.0.0.1:${port}/api/`,
                socketUrl: { url: `http://127.0.0.1:${port}`, path: '/api/socket.io' },
                workerToken: 'test-token',
            })
        })
    }

    function connectAndExpectCrash(serverResponse: WorkerSettingsResponse): Promise<Error> {
        return new Promise<Error>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Timed out waiting for crash')), 5000)
            const handler = (err: Error) => {
                clearTimeout(timeout)
                process.removeListener('uncaughtException', handler)
                resolve(err)
            }
            process.on('uncaughtException', handler)
            ioServer.on('connection', (serverSocket) => {
                serverSocket.on(WebsocketServerEvent.FETCH_WORKER_SETTINGS, (...args: unknown[]) => {
                    const callback = args[args.length - 1]
                    if (typeof callback === 'function') {
                        callback(serverResponse)
                    }
                })
                createRpcServer<WorkerToApiContract>(serverSocket, buildMinimalHandlers())
            })
            worker.start({
                apiUrl: `http://127.0.0.1:${port}/api/`,
                socketUrl: { url: `http://127.0.0.1:${port}`, path: '/api/socket.io' },
                workerToken: 'test-token',
            })
        })
    }

    it('no local override, no worker group → server mode used as-is', async () => {
        const serverSettings = buildWorkerSettingsResponse({ EXECUTION_MODE: ExecutionMode.SANDBOX_CODE_AND_PROCESS })
        await connectAndWaitForSettings(serverSettings)

        expect(mockWorkerSettingsSet).toHaveBeenCalledTimes(1)
        const stored = mockWorkerSettingsSet.mock.calls[0][0] as WorkerSettingsResponse
        expect(stored.EXECUTION_MODE).toBe(ExecutionMode.SANDBOX_CODE_AND_PROCESS)
    }, 10_000)

    it('local AP_EXECUTION_MODE overrides server-provided mode', async () => {
        process.env.AP_EXECUTION_MODE = ExecutionMode.SANDBOX_CODE_ONLY
        const serverSettings = buildWorkerSettingsResponse({ EXECUTION_MODE: ExecutionMode.SANDBOX_CODE_AND_PROCESS })
        await connectAndWaitForSettings(serverSettings)

        expect(mockWorkerSettingsSet).toHaveBeenCalledTimes(1)
        const stored = mockWorkerSettingsSet.mock.calls[0][0] as WorkerSettingsResponse
        expect(stored.EXECUTION_MODE).toBe(ExecutionMode.SANDBOX_CODE_ONLY)
    }, 10_000)

    it('worker group + SANDBOX_PROCESS passes validation', async () => {
        process.env.AP_WORKER_GROUP_ID = 'group-1'
        process.env.AP_EXECUTION_MODE = ExecutionMode.SANDBOX_PROCESS
        process.env.AP_REUSE_SANDBOX = 'false'
        const serverSettings = buildWorkerSettingsResponse()
        await connectAndWaitForSettings(serverSettings)

        expect(mockWorkerSettingsSet).toHaveBeenCalledTimes(1)
        const stored = mockWorkerSettingsSet.mock.calls[0][0] as WorkerSettingsResponse
        expect(stored.EXECUTION_MODE).toBe(ExecutionMode.SANDBOX_PROCESS)
    }, 10_000)

    it('worker group + SANDBOX_CODE_AND_PROCESS passes validation', async () => {
        process.env.AP_WORKER_GROUP_ID = 'group-1'
        process.env.AP_EXECUTION_MODE = ExecutionMode.SANDBOX_CODE_AND_PROCESS
        process.env.AP_REUSE_SANDBOX = 'false'
        const serverSettings = buildWorkerSettingsResponse()
        await connectAndWaitForSettings(serverSettings)

        expect(mockWorkerSettingsSet).toHaveBeenCalledTimes(1)
        const stored = mockWorkerSettingsSet.mock.calls[0][0] as WorkerSettingsResponse
        expect(stored.EXECUTION_MODE).toBe(ExecutionMode.SANDBOX_CODE_AND_PROCESS)
    }, 10_000)

    it('worker group + SANDBOX_CODE_ONLY throws error', async () => {
        process.env.AP_WORKER_GROUP_ID = 'group-1'
        process.env.AP_EXECUTION_MODE = ExecutionMode.SANDBOX_CODE_ONLY
        const serverSettings = buildWorkerSettingsResponse()

        const err = await connectAndExpectCrash(serverSettings)
        expect(err.message).toMatch(/Worker group "group-1" requires AP_EXECUTION_MODE/)
    }, 10_000)

    it('worker group + UNSANDBOXED throws error', async () => {
        process.env.AP_WORKER_GROUP_ID = 'group-1'
        process.env.AP_EXECUTION_MODE = ExecutionMode.UNSANDBOXED
        const serverSettings = buildWorkerSettingsResponse()

        const err = await connectAndExpectCrash(serverSettings)
        expect(err.message).toMatch(/Worker group "group-1" requires AP_EXECUTION_MODE/)
    }, 10_000)

    it('worker group + no local override, server sends SANDBOX_PROCESS → passes', async () => {
        process.env.AP_WORKER_GROUP_ID = 'group-1'
        process.env.AP_REUSE_SANDBOX = 'false'
        const serverSettings = buildWorkerSettingsResponse({ EXECUTION_MODE: ExecutionMode.SANDBOX_PROCESS })
        await connectAndWaitForSettings(serverSettings)

        expect(mockWorkerSettingsSet).toHaveBeenCalledTimes(1)
        const stored = mockWorkerSettingsSet.mock.calls[0][0] as WorkerSettingsResponse
        expect(stored.EXECUTION_MODE).toBe(ExecutionMode.SANDBOX_PROCESS)
    }, 10_000)
})
