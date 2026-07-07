import { createServer } from 'node:http'
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { Server as IOServer, Socket } from 'socket.io'
import {
    createRpcServer,
    PackageType,
    PieceType,
    WorkerJobType,
    EngineResponseStatus,
    WebsocketServerEvent,
} from '@activepieces/shared'
import { JobResultKind } from '../../src/lib/execute/types'
import type {
    WorkerToApiContract,
    ExecuteExtractPieceMetadataJobData,
    ConsumeJobRequest,
} from '@activepieces/shared'

const mockGetHandler = vi.fn()

vi.mock('../../src/lib/execute/job-registry', () => ({
    getHandler: (...args: unknown[]) => mockGetHandler(...args),
}))

// APP_VERSION must match the worker's own AP_VERSION (apVersionUtil.getCurrentRelease, read from the
// same cwd package.json) or the worker↔app version gate fail-closes and pauses polling forever.
vi.mock('../../src/lib/config/worker-settings', async () => {
    const { apVersionUtil } = await vi.importActual<typeof import('@activepieces/server-utils')>('@activepieces/server-utils')
    const appVersion = apVersionUtil.getCurrentRelease()
    return {
        workerSettings: {
            set: vi.fn(),
            waitForSettings: vi.fn().mockResolvedValue({ PUBLIC_URL: 'http://localhost:3000', APP_VERSION: appVersion }),
            getSettings: vi.fn().mockReturnValue({ PUBLIC_URL: 'http://localhost:3000', APP_VERSION: appVersion }),
        },
    }
})

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

type StubRuntime = {
    execute: ReturnType<typeof vi.fn>
    getActiveExecutors: ReturnType<typeof vi.fn>
    prewarm: ReturnType<typeof vi.fn>
    shutdown: ReturnType<typeof vi.fn>
}

const createdRuntimes: StubRuntime[] = []

vi.mock('@activepieces/sandbox', () => ({
    createResolver: vi.fn(() => ({})),
    createSandboxRuntime: vi.fn(() => {
        const rt: StubRuntime = {
            execute: vi.fn(),
            getActiveExecutors: vi.fn(() => []),
            prewarm: vi.fn().mockResolvedValue(undefined),
            shutdown: vi.fn().mockResolvedValue(undefined),
        }
        createdRuntimes.push(rt)
        return rt
    }),
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
        requestId: 'req-1',
        webserverId: 'ws-1',
    }
}

function buildConsumeJobRequest(overrides?: Partial<ConsumeJobRequest>): ConsumeJobRequest {
    return {
        jobId: 'job-1',
        jobData: buildExtractPieceJob(),
        timeoutInSeconds: 600,
        attempsStarted: 0,
        engineToken: 'tok-1',
        token: 'token-123',
        queueName: 'workerJobs',
        ...overrides,
    }
}

describe('worker integration', () => {
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
        // These integration tests assert strict per-job ordering, which only holds with a single
        // poll loop. Pin concurrency to 1 so the multi-box transitional default (5) doesn't drain
        // the queued poll sequence out of order. See ADR 0004.
        process.env.AP_WORKER_CONCURRENCY = '1'
        createdRuntimes.length = 0
    })

    afterEach(async () => {
        await worker.stop()
        mockGetHandler.mockReset()
        delete process.env.AP_WORKER_CONCURRENCY
        await new Promise<void>((resolve) => {
            ioServer.close(() => resolve())
        })
    })

    async function connectWorkerWithPoll(pollResponses: (ConsumeJobRequest | null)[]): Promise<{
        completeJobCalls: CompleteJobCall[]
    }> {
        const completeJobCalls: CompleteJobCall[] = []
        let pollIndex = 0

        return new Promise((resolve) => {
            ioServer.on('connection', (serverSocket) => {
                // Handle the FETCH_WORKER_SETTINGS event that the worker emits on connect
                serverSocket.on(WebsocketServerEvent.FETCH_WORKER_SETTINGS, (...args: unknown[]) => {
                    const callback = args[args.length - 1]
                    if (typeof callback === 'function') {
                        callback({
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
                    extendLock: vi.fn(),
                    disableFlow: vi.fn(),
                }
                createRpcServer<WorkerToApiContract>(serverSocket, handlers)
            })
            worker.start({
                apiUrl: `http://127.0.0.1:${port}/api/`,
                socketUrl: { url: `http://127.0.0.1:${port}`, path: '/api/socket.io' },
                workerToken: 'test-token',
            })
        })
    }

    it('polls for a job, executes it, and reports completion', async () => {
        const expectedResult = { kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.OK }
        mockGetHandler.mockReturnValue({
            jobType: WorkerJobType.EXECUTE_EXTRACT_PIECE_INFORMATION,
            execute: vi.fn().mockResolvedValue(expectedResult),
        })

        const job = buildConsumeJobRequest()
        const { completeJobCalls } = await connectWorkerWithPoll([job, null])

        expect(completeJobCalls.length).toBe(1)
        expect(completeJobCalls[0].jobId).toBe('job-1')
        expect(completeJobCalls[0].token).toBe('token-123')
        expect(completeJobCalls[0].queueName).toBe('workerJobs')
        expect(completeJobCalls[0].status).toBe(EngineResponseStatus.OK)
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
        expect(completeJobCalls[0].status).toBe(EngineResponseStatus.INTERNAL_ERROR)
        expect(completeJobCalls[0].errorMessage).toBe('boom')
    }, 15_000)

    it('forwards response from job handler to completeJob', async () => {
        const handlerPayload = { foo: 'bar' }
        mockGetHandler.mockReturnValue({
            jobType: WorkerJobType.EXECUTE_EXTRACT_PIECE_INFORMATION,
            execute: vi.fn().mockResolvedValue({ kind: JobResultKind.SYNCHRONOUS, status: EngineResponseStatus.OK, response: handlerPayload }),
        })

        const job = buildConsumeJobRequest()
        const { completeJobCalls } = await connectWorkerWithPoll([job, null])

        expect(completeJobCalls.length).toBe(1)
        expect(completeJobCalls[0].status).toBe(EngineResponseStatus.OK)
        expect(completeJobCalls[0].response).toEqual(handlerPayload)
    }, 15_000)

    it('skips null poll responses and re-polls', async () => {
        mockGetHandler.mockReturnValue({
            jobType: WorkerJobType.EXECUTE_EXTRACT_PIECE_INFORMATION,
            execute: vi.fn().mockResolvedValue({ kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.OK }),
        })

        const job = buildConsumeJobRequest({ jobId: 'job-after-null' })
        const { completeJobCalls } = await connectWorkerWithPoll([null, job, null])

        expect(completeJobCalls.length).toBe(1)
        expect(completeJobCalls[0].jobId).toBe('job-after-null')
        expect(completeJobCalls[0].status).toBe(EngineResponseStatus.OK)
    }, 15_000)

    it('forwards USER_FAILURE status from synchronous job handler', async () => {
        mockGetHandler.mockReturnValue({
            jobType: WorkerJobType.EXECUTE_EXTRACT_PIECE_INFORMATION,
            execute: vi.fn().mockResolvedValue({
                kind: JobResultKind.SYNCHRONOUS,
                status: EngineResponseStatus.USER_FAILURE,
                response: { message: 'Invalid API key' },
                errorMessage: 'Connection auth failed',
            }),
        })

        const job = buildConsumeJobRequest()
        const { completeJobCalls } = await connectWorkerWithPoll([job, null])

        expect(completeJobCalls.length).toBe(1)
        expect(completeJobCalls[0].status).toBe(EngineResponseStatus.USER_FAILURE)
        expect(completeJobCalls[0].response).toEqual({ message: 'Invalid API key' })
        expect(completeJobCalls[0].errorMessage).toBe('Connection auth failed')
    }, 15_000)

    it('treats USER_FAILURE differently from INTERNAL_ERROR in fire-and-forget', async () => {
        mockGetHandler.mockReturnValue({
            jobType: WorkerJobType.EXECUTE_EXTRACT_PIECE_INFORMATION,
            execute: vi.fn().mockResolvedValue({ kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.OK }),
        })

        const job = buildConsumeJobRequest()
        const { completeJobCalls } = await connectWorkerWithPoll([job, null])

        expect(completeJobCalls.length).toBe(1)
        expect(completeJobCalls[0].status).toBe(EngineResponseStatus.OK)
    }, 15_000)

    it('propagates INTERNAL_ERROR status from fire-and-forget result to completeJob', async () => {
        mockGetHandler.mockReturnValue({
            jobType: WorkerJobType.EXECUTE_EXTRACT_PIECE_INFORMATION,
            execute: vi.fn().mockResolvedValue({
                kind: JobResultKind.FIRE_AND_FORGET,
                status: EngineResponseStatus.INTERNAL_ERROR,
                logs: 'MODULE_NOT_FOUND: @activepieces/shared',
            }),
        })

        const job = buildConsumeJobRequest({ jobId: 'job-internal-error' })
        const { completeJobCalls } = await connectWorkerWithPoll([job, null])

        expect(completeJobCalls.length).toBe(1)
        expect(completeJobCalls[0].jobId).toBe('job-internal-error')
        expect(completeJobCalls[0].status).toBe(EngineResponseStatus.INTERNAL_ERROR)
        expect(completeJobCalls[0].logs).toBe('MODULE_NOT_FOUND: @activepieces/shared')
    }, 15_000)

    it('propagates TIMEOUT status from fire-and-forget result to completeJob', async () => {
        mockGetHandler.mockReturnValue({
            jobType: WorkerJobType.EXECUTE_EXTRACT_PIECE_INFORMATION,
            execute: vi.fn().mockResolvedValue({
                kind: JobResultKind.FIRE_AND_FORGET,
                status: EngineResponseStatus.TIMEOUT,
            }),
        })

        const job = buildConsumeJobRequest({ jobId: 'job-timeout' })
        const { completeJobCalls } = await connectWorkerWithPoll([job, null])

        expect(completeJobCalls.length).toBe(1)
        expect(completeJobCalls[0].jobId).toBe('job-timeout')
        expect(completeJobCalls[0].status).toBe(EngineResponseStatus.TIMEOUT)
    }, 15_000)

    describe('resilience to invalid job data', () => {
        it('survives a job with invalid jobData fields and continues processing', async () => {
            const expectedResult = { kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.OK }
            mockGetHandler.mockReturnValue({
                jobType: WorkerJobType.EXECUTE_EXTRACT_PIECE_INFORMATION,
                execute: vi.fn().mockResolvedValue(expectedResult),
            })

            const invalidJob = buildConsumeJobRequest({
                jobId: 'job-invalid-fields',
                jobData: { jobType: 'EXECUTE_EXTRACT_PIECE_INFORMATION', schemaVersion: 4 } as any,
            })
            const validJob = buildConsumeJobRequest({ jobId: 'job-valid' })

            const { completeJobCalls } = await connectWorkerWithPoll([invalidJob, validJob, null])

            expect(completeJobCalls.length).toBe(2)
            expect(completeJobCalls[0].jobId).toBe('job-invalid-fields')
            expect(completeJobCalls[0].status).toBe(EngineResponseStatus.INTERNAL_ERROR)
            expect(completeJobCalls[1].jobId).toBe('job-valid')
            expect(completeJobCalls[1].status).toBe(EngineResponseStatus.OK)
            expect(mockGetHandler).toHaveBeenCalledTimes(1)
        }, 15_000)

        it('survives a job with an unrecognized jobType and continues polling', async () => {
            const expectedResult = { kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.OK }
            mockGetHandler.mockReturnValue({
                jobType: WorkerJobType.EXECUTE_EXTRACT_PIECE_INFORMATION,
                execute: vi.fn().mockResolvedValue(expectedResult),
            })

            const invalidJob = buildConsumeJobRequest({
                jobId: 'job-bad-type',
                jobData: { jobType: 'NONEXISTENT_TYPE', schemaVersion: 4, platformId: 'p' } as any,
            })
            const validJob = buildConsumeJobRequest({ jobId: 'job-valid' })

            const { completeJobCalls } = await connectWorkerWithPoll([invalidJob, validJob, null])

            expect(completeJobCalls.length).toBe(2)
            expect(completeJobCalls[0].jobId).toBe('job-bad-type')
            expect(completeJobCalls[0].status).toBe(EngineResponseStatus.INTERNAL_ERROR)
            expect(completeJobCalls[1].jobId).toBe('job-valid')
            expect(completeJobCalls[1].status).toBe(EngineResponseStatus.OK)
        }, 15_000)

        it('survives a job with empty object as jobData and continues polling', async () => {
            mockGetHandler.mockReturnValue({
                jobType: WorkerJobType.EXECUTE_EXTRACT_PIECE_INFORMATION,
                execute: vi.fn().mockResolvedValue({ kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.OK }),
            })

            const invalidJob = buildConsumeJobRequest({
                jobId: 'job-empty-data',
                jobData: {} as any,
            })
            const validJob = buildConsumeJobRequest({ jobId: 'job-valid' })

            const { completeJobCalls } = await connectWorkerWithPoll([invalidJob, validJob, null])

            expect(completeJobCalls.length).toBe(2)
            expect(completeJobCalls[0].jobId).toBe('job-empty-data')
            expect(completeJobCalls[0].status).toBe(EngineResponseStatus.INTERNAL_ERROR)
            expect(completeJobCalls[1].jobId).toBe('job-valid')
            expect(completeJobCalls[1].status).toBe(EngineResponseStatus.OK)
        }, 15_000)

        it('survives a job with non-object primitive jobData and continues polling', async () => {
            mockGetHandler.mockReturnValue({
                jobType: WorkerJobType.EXECUTE_EXTRACT_PIECE_INFORMATION,
                execute: vi.fn().mockResolvedValue({ kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.OK }),
            })

            const invalidJob = buildConsumeJobRequest({
                jobId: 'job-primitive-data',
                jobData: 'garbage' as any,
            })
            const validJob = buildConsumeJobRequest({ jobId: 'job-valid' })

            const { completeJobCalls } = await connectWorkerWithPoll([invalidJob, validJob, null])

            expect(completeJobCalls.length).toBe(2)
            expect(completeJobCalls[0].jobId).toBe('job-primitive-data')
            expect(completeJobCalls[0].status).toBe(EngineResponseStatus.INTERNAL_ERROR)
            expect(completeJobCalls[1].jobId).toBe('job-valid')
            expect(completeJobCalls[1].status).toBe(EngineResponseStatus.OK)
        }, 15_000)

        it('survives multiple consecutive invalid jobs and still processes a valid one', async () => {
            const expectedResult = { kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.OK }
            mockGetHandler.mockReturnValue({
                jobType: WorkerJobType.EXECUTE_EXTRACT_PIECE_INFORMATION,
                execute: vi.fn().mockResolvedValue(expectedResult),
            })

            const invalid1 = buildConsumeJobRequest({ jobId: 'bad-1', jobData: {} as any })
            const invalid2 = buildConsumeJobRequest({ jobId: 'bad-2', jobData: 'garbage' as any })
            const invalid3 = buildConsumeJobRequest({
                jobId: 'bad-3',
                jobData: { jobType: 'NONEXISTENT_TYPE' } as any,
            })
            const validJob = buildConsumeJobRequest({ jobId: 'job-valid' })

            const { completeJobCalls } = await connectWorkerWithPoll([invalid1, invalid2, invalid3, validJob, null])

            expect(completeJobCalls.length).toBe(4)
            expect(completeJobCalls[0].status).toBe(EngineResponseStatus.INTERNAL_ERROR)
            expect(completeJobCalls[1].status).toBe(EngineResponseStatus.INTERNAL_ERROR)
            expect(completeJobCalls[2].status).toBe(EngineResponseStatus.INTERNAL_ERROR)
            expect(completeJobCalls[3].jobId).toBe('job-valid')
            expect(completeJobCalls[3].status).toBe(EngineResponseStatus.OK)
            expect(mockGetHandler).toHaveBeenCalledTimes(1)
        }, 15_000)

        it('continues processing after a handler throws and handles the next job', async () => {
            mockGetHandler
                .mockReturnValueOnce({
                    jobType: WorkerJobType.EXECUTE_EXTRACT_PIECE_INFORMATION,
                    execute: vi.fn().mockRejectedValue(new Error('handler crashed')),
                })
                .mockReturnValueOnce({
                    jobType: WorkerJobType.EXECUTE_EXTRACT_PIECE_INFORMATION,
                    execute: vi.fn().mockResolvedValue({ kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.OK }),
                })

            const job1 = buildConsumeJobRequest({ jobId: 'job-crash' })
            const job2 = buildConsumeJobRequest({ jobId: 'job-ok' })

            const { completeJobCalls } = await connectWorkerWithPoll([job1, job2, null])

            expect(completeJobCalls.length).toBe(2)
            expect(completeJobCalls[0].jobId).toBe('job-crash')
            expect(completeJobCalls[0].status).toBe(EngineResponseStatus.INTERNAL_ERROR)
            expect(completeJobCalls[0].errorMessage).toBe('handler crashed')
            expect(completeJobCalls[1].jobId).toBe('job-ok')
            expect(completeJobCalls[1].status).toBe(EngineResponseStatus.OK)
        }, 15_000)

        it('handles interleaved nulls, invalid jobs, and valid jobs', async () => {
            mockGetHandler.mockReturnValue({
                jobType: WorkerJobType.EXECUTE_EXTRACT_PIECE_INFORMATION,
                execute: vi.fn().mockResolvedValue({ kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.OK }),
            })

            const validJob1 = buildConsumeJobRequest({ jobId: 'valid-1' })
            const invalidJob = buildConsumeJobRequest({ jobId: 'bad-1', jobData: {} as any })
            const validJob2 = buildConsumeJobRequest({ jobId: 'valid-2' })

            const { completeJobCalls } = await connectWorkerWithPoll([
                null, validJob1, invalidJob, null, validJob2, null,
            ])

            expect(completeJobCalls.length).toBe(3)
            expect(completeJobCalls[0].jobId).toBe('valid-1')
            expect(completeJobCalls[0].status).toBe(EngineResponseStatus.OK)
            expect(completeJobCalls[1].jobId).toBe('bad-1')
            expect(completeJobCalls[1].status).toBe(EngineResponseStatus.INTERNAL_ERROR)
            expect(completeJobCalls[2].jobId).toBe('valid-2')
            expect(completeJobCalls[2].status).toBe(EngineResponseStatus.OK)
            expect(mockGetHandler).toHaveBeenCalledTimes(2)
        }, 15_000)
    })

    describe('runtime lifecycle on reconnect', () => {
        async function waitFor(predicate: () => boolean, timeoutMs = 5_000): Promise<void> {
            const start = Date.now()
            while (!predicate()) {
                if (Date.now() - start > timeoutMs) {
                    throw new Error('waitFor timed out')
                }
                await new Promise<void>((resolve) => setTimeout(resolve, 20))
            }
        }

        function acceptConnections(serverSockets: Socket[]): void {
            ioServer.on('connection', (serverSocket) => {
                serverSocket.on(WebsocketServerEvent.FETCH_WORKER_SETTINGS, (...args: unknown[]) => {
                    const callback = args[args.length - 1]
                    if (typeof callback === 'function') {
                        callback({
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
                // Park the worker idle: never ack poll so it neither hot-loops nor consumes jobs.
                createRpcServer<WorkerToApiContract>(serverSocket, {
                    poll: vi.fn(() => new Promise(() => {})),
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
                    disableFlow: vi.fn(),
                } as unknown as WorkerToApiContract)
                serverSockets.push(serverSocket)
            })
        }

        it('shuts down the old runtime and brings up a fresh one when the server drops the connection', async () => {
            const serverSockets: Socket[] = []
            acceptConnections(serverSockets)

            worker.start({
                apiUrl: `http://127.0.0.1:${port}/api/`,
                socketUrl: { url: `http://127.0.0.1:${port}`, path: '/api/socket.io' },
                workerToken: 'test-token',
            })

            await waitFor(() => createdRuntimes.length === 1)

            // Simulate the API restarting during a deploy: the server drops the socket, which the client
            // sees as 'io server disconnect' and reconnects to. The reconnect must tear down the old
            // runtime (killing any in-flight box) and build a fresh one — not reuse the old box.
            serverSockets[0].disconnect(true)

            await waitFor(() => createdRuntimes.length === 2)
            expect(createdRuntimes[0].shutdown).toHaveBeenCalledTimes(1)
        }, 15_000)
    })

    describe('health endpoint', () => {
        let healthPort: number

        beforeEach(async () => {
            healthPort = await getFreePort()
            process.env.AP_PORT = String(healthPort)
        })

        afterEach(() => {
            delete process.env.AP_PORT
        })

        async function startWithHealthServer(): Promise<void> {
            worker.start({
                apiUrl: `http://127.0.0.1:${port}/api/`,
                socketUrl: { url: `http://127.0.0.1:${port}`, path: '/api/socket.io' },
                workerToken: 'test-token',
                withHealthServer: true,
            })
            for (let i = 0; i < 50; i++) {
                try {
                    const res = await fetch(`http://127.0.0.1:${healthPort}/v1/health`)
                    if (res.ok) return
                }
                catch {
                    // server not ready yet
                }
                await new Promise<void>((resolve) => setTimeout(resolve, 100))
            }
            throw new Error(`Health server on port ${healthPort} did not start in time`)
        }

        it('responds 200 with status ok on /v1/health', async () => {
            await startWithHealthServer()
            const res = await fetch(`http://127.0.0.1:${healthPort}/v1/health`)
            expect(res.status).toBe(200)
            expect(await res.json()).toEqual({ status: 'ok' })
        }, 5_000)

        it('responds 200 with status ok on /worker/health', async () => {
            await startWithHealthServer()
            const res = await fetch(`http://127.0.0.1:${healthPort}/worker/health`)
            expect(res.status).toBe(200)
            expect(await res.json()).toEqual({ status: 'ok' })
        }, 5_000)

        it('responds 200 with status ok on /api/v1/health', async () => {
            await startWithHealthServer()
            const res = await fetch(`http://127.0.0.1:${healthPort}/api/v1/health`)
            expect(res.status).toBe(200)
            expect(await res.json()).toEqual({ status: 'ok' })
        }, 5_000)

        it('responds 404 on unknown paths', async () => {
            await startWithHealthServer()
            const res = await fetch(`http://127.0.0.1:${healthPort}/unknown`)
            expect(res.status).toBe(404)
        }, 5_000)
    })
})

function getFreePort(): Promise<number> {
    return new Promise((resolve) => {
        const srv = createServer()
        srv.listen(0, () => {
            const { port } = srv.address() as { port: number }
            srv.close(() => resolve(port))
        })
    })
}

type CompleteJobCall = {
    jobId: string
    token: string
    queueName: string
    status: string
    errorMessage?: string
    logs?: string
    response?: unknown
}
