import { createServer } from 'node:http'
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { Server as IOServer } from 'socket.io'
import {
    createRpcServer,
    PackageType,
    PieceType,
    WorkerJobType,
    ConsumeJobResponseStatus,
    WebsocketServerEvent,
} from '@activepieces/shared'
import type {
    WorkerToApiContract,
    ExecuteExtractPieceMetadataJobData,
    ConsumeJobRequest,
} from '@activepieces/shared'

const mockGetHandler = vi.fn()

vi.mock('../../src/lib/execute/job-registry', () => ({
    getHandler: (...args: unknown[]) => mockGetHandler(...args),
}))

vi.mock('../../src/lib/config/worker-settings', () => ({
    workerSettings: {
        set: vi.fn(),
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

import { worker } from '../../src/lib/worker'

function buildExtractPieceJob(): ExecuteExtractPieceMetadataJobData {
    return {
        schemaVersion: 4,
        jobType: WorkerJobType.EXECUTE_EXTRACT_PIECE_INFORMATION,
        projectId: undefined,
        platformId: 'plat-1',
        piece: {
            pieceName: '@activepieces/piece-test',
            pieceVersion: '0.1.0',
            packageType: PackageType.REGISTRY,
            pieceType: PieceType.OFFICIAL,
        },
    }
}

function buildConsumeJobRequest(overrides?: Partial<ConsumeJobRequest>): ConsumeJobRequest {
    return {
        jobId: 'job-1',
        jobData: buildExtractPieceJob(),
        timeoutInSeconds: 600,
        attempsStarted: 0,
        engineToken: 'tok-1',
        ...overrides,
    }
}

describe('worker integration', () => {
    let httpServer: ReturnType<typeof createServer>
    let ioServer: IOServer
    let port: number

    beforeEach(async () => {
        httpServer = createServer()
        ioServer = new IOServer(httpServer, { transports: ['websocket'] })
        await new Promise<void>((resolve) => {
            httpServer.listen(0, () => {
                port = (httpServer.address() as { port: number }).port
                resolve()
            })
        })
        process.env.AP_API_URL = `http://127.0.0.1:${port}`
    })

    afterEach(async () => {
        await worker.stop()
        mockGetHandler.mockReset()
        await new Promise<void>((resolve) => {
            ioServer.close(() => resolve())
        })
    })

    async function connectWorkerWithPoll(pollResponses: (ConsumeJobRequest | null)[]): Promise<{
        completeJobCalls: Array<{ jobId: string, status: string, errorMessage?: string, delayInSeconds?: number, response?: unknown }>
    }> {
        const completeJobCalls: Array<{ jobId: string, status: string, errorMessage?: string, delayInSeconds?: number, response?: unknown }> = []
        let pollIndex = 0

        return new Promise((resolve) => {
            ioServer.on('connection', (serverSocket) => {
                // Handle the FETCH_WORKER_SETTINGS event that the worker emits on connect
                serverSocket.on(WebsocketServerEvent.FETCH_WORKER_SETTINGS, (...args: unknown[]) => {
                    const callback = args[args.length - 1]
                    if (typeof callback === 'function') {
                        callback({
                            WORKER_CACHE_ID: 0,
                            PUBLIC_URL: 'http://localhost:3000',
                            ENVIRONMENT: 'test',
                            EXECUTION_MODE: 'SANDBOX_CODE_AND_PROCESS',
                            TRIGGER_TIMEOUT_SECONDS: 60,
                            TRIGGER_HOOKS_TIMEOUT_SECONDS: 60,
                            PAUSED_FLOW_TIMEOUT_DAYS: 30,
                            FLOW_TIMEOUT_SECONDS: 600,
                            LOG_LEVEL: 'info',
                            LOG_PRETTY: 'false',
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
                        })
                    }
                })

                const handlers: WorkerToApiContract = {
                    poll: vi.fn(async () => {
                        const response = pollIndex < pollResponses.length ? pollResponses[pollIndex] : null
                        pollIndex++
                        if (pollIndex >= pollResponses.length) {
                            setTimeout(() => resolve({ completeJobCalls }), 200)
                        }
                        return response
                    }),
                    completeJob: vi.fn(async (input) => {
                        completeJobCalls.push(input)
                    }),
                    updateRunProgress: vi.fn(),
                    uploadRunLog: vi.fn(),
                    sendFlowResponse: vi.fn(),
                    updateStepProgress: vi.fn(),
                    submitPayloads: vi.fn(),
                    savePayloads: vi.fn(),
                    getFlowVersion: vi.fn(),
                    getPiece: vi.fn(),
                    getPieceArchive: vi.fn(),
                }
                createRpcServer<WorkerToApiContract>(serverSocket, handlers)
            })
            worker.start(`http://127.0.0.1:${port}`, 'test-token')
        })
    }

    it('polls for a job, executes it, and reports completion', async () => {
        const expectedResult = { delayInSeconds: 10 }
        mockGetHandler.mockReturnValue({
            jobType: WorkerJobType.EXECUTE_EXTRACT_PIECE_INFORMATION,
            execute: vi.fn().mockResolvedValue(expectedResult),
        })

        const job = buildConsumeJobRequest()
        const { completeJobCalls } = await connectWorkerWithPoll([job, null])

        expect(completeJobCalls.length).toBe(1)
        expect(completeJobCalls[0].jobId).toBe('job-1')
        expect(completeJobCalls[0].status).toBe(ConsumeJobResponseStatus.OK)
        expect(completeJobCalls[0].delayInSeconds).toBe(10)
        expect(mockGetHandler).toHaveBeenCalledWith(WorkerJobType.EXECUTE_EXTRACT_PIECE_INFORMATION)
    }, 15_000)

    it('reports error when job execution fails', async () => {
        mockGetHandler.mockReturnValue({
            jobType: WorkerJobType.EXECUTE_EXTRACT_PIECE_INFORMATION,
            execute: vi.fn().mockRejectedValue(new Error('boom')),
        })

        const job = buildConsumeJobRequest({ jobId: 'job-fail' })
        const { completeJobCalls } = await connectWorkerWithPoll([job, null])

        expect(completeJobCalls.length).toBe(1)
        expect(completeJobCalls[0].jobId).toBe('job-fail')
        expect(completeJobCalls[0].status).toBe(ConsumeJobResponseStatus.INTERNAL_ERROR)
        expect(completeJobCalls[0].errorMessage).toBe('boom')
    }, 15_000)

    it('forwards response from job handler to completeJob', async () => {
        const expectedResponse = { status: 'OK', response: { foo: 'bar' } }
        mockGetHandler.mockReturnValue({
            jobType: WorkerJobType.EXECUTE_EXTRACT_PIECE_INFORMATION,
            execute: vi.fn().mockResolvedValue({ response: expectedResponse }),
        })

        const job = buildConsumeJobRequest()
        const { completeJobCalls } = await connectWorkerWithPoll([job, null])

        expect(completeJobCalls.length).toBe(1)
        expect(completeJobCalls[0].response).toEqual(expectedResponse)
    }, 15_000)

    it('skips null poll responses and re-polls', async () => {
        mockGetHandler.mockReturnValue({
            jobType: WorkerJobType.EXECUTE_EXTRACT_PIECE_INFORMATION,
            execute: vi.fn().mockResolvedValue({}),
        })

        const job = buildConsumeJobRequest({ jobId: 'job-after-null' })
        const { completeJobCalls } = await connectWorkerWithPoll([null, job, null])

        expect(completeJobCalls.length).toBe(1)
        expect(completeJobCalls[0].jobId).toBe('job-after-null')
        expect(completeJobCalls[0].status).toBe(ConsumeJobResponseStatus.OK)
    }, 15_000)
})
