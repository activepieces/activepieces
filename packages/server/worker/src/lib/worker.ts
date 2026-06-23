import { createServer } from 'http'
import os from 'os'
import { tryCatch } from '@activepieces/core-utils'
import { Runtime, RuntimeExecutorInfo, warmupPieces } from '@activepieces/sandbox-pool'
import { type ApLogger } from '@activepieces/server-utils'
import { ConsumeJobRequest, WorkerToApiContract } from '@activepieces/shared'
import { nanoid } from 'nanoid'
import { Socket } from 'socket.io-client'
import { system, WorkerSystemProp } from './config/configs'
import { logger } from './config/logger'
import { createCloudRunDispatcher } from './execute/cloud-run-dispatch'
import { appVersionCompatible, buildMachineInfo, createApiConnection, fetchAndStoreSettings, runJob } from './execute/job-runner'
import { selectRuntime } from './runtime/runtime-factory'
import { sandboxConfig } from './runtime/sandbox-config'

const VERSION_MISMATCH_POLL_PAUSE_MS = 10_000

let socket: Socket | null = null
let polling = false
let connectionGeneration = 0

const workerId = `worker-${nanoid()}`

const workerHostname = os.hostname()

let healthServerInstance: ReturnType<typeof createServer> | null = null

let runtime: Runtime | null = null

function getActiveExecutors(): RuntimeExecutorInfo[] {
    return runtime?.getActiveExecutors() ?? []
}

export const worker = {
    async start({ apiUrl, socketUrl, workerToken, withHealthServer = false }: WorkerStartParams): Promise<void> {
        const workerGroupId = system.get(WorkerSystemProp.WORKER_GROUP_ID)
        const connection = createApiConnection({ socketUrl, workerToken, workerId, workerGroupId })
        socket = connection.socket
        const apiClient = connection.apiClient

        socket.on('connect', async () => {
            logger.info('Connected to API server via Socket.IO')
            await fetchAndStoreSettings({ sock: socket!, workerId, workerHostname, getActiveExecutors })
            void warmupPiecesOnStartup(apiClient)
            void startPollingWorkers(apiClient).catch((err) => {
                logger.error({ error: err }, 'Polling workers crashed unexpectedly')
            })
        })

        socket.on('disconnect', (reason) => {
            connectionGeneration++
            polling = false
            logger.warn({ reason }, 'Disconnected from API server')
        })

        socket.on('connect_error', (error) => {
            logger.error({ error: error.message }, 'Socket.IO connection error')
        })

        if (withHealthServer) {
            healthServerInstance = startHealthServer()
        }
        logger.info({ apiUrl, socketUrl }, 'Worker started, polling for jobs...')
    },

    async stop(): Promise<void> {
        polling = false
        if (runtime) {
            await runtime.shutdown(logger)
            runtime = null
        }
        socket?.disconnect()
        socket = null
        healthServerInstance?.close()
        healthServerInstance = null
        logger.info('Worker stopped')
    },
}

async function startPollingWorkers(apiClient: WorkerToApiContract): Promise<void> {
    if (polling) return
    polling = true

    const generation = connectionGeneration

    if (runtime) {
        logger.info('Shutting down old runtime before creating a new one')
        await runtime.shutdown(logger)
        runtime = null
    }

    const rawConcurrency = Number(system.get(WorkerSystemProp.WORKER_CONCURRENCY) ?? '1')
    const concurrency = Number.isInteger(rawConcurrency) && rawConcurrency > 0 ? rawConcurrency : 1
    if (!Number.isInteger(rawConcurrency) || rawConcurrency < 1) {
        logger.warn({ rawConcurrency }, 'Invalid AP_WORKER_CONCURRENCY value, falling back to 1')
    }

    const handleJob = buildJobHandler({ apiClient, concurrency })

    const workers = Array.from({ length: concurrency }, (_, workerIndex) =>
        pollLoop({ apiClient, workerIndex, generation, handleJob }),
    )
    await Promise.all(workers)
}

// The worker either executes jobs in a local sandbox pool (LOCAL) or, when AP_CLOUD_RUN_URL is set,
// forwards each polled job to a Cloud Run instance over HTTP. In dispatch mode the instance owns the
// whole lifecycle (provision/run/progress/completeJob) over its own API connection, so the worker
// builds no local runtime — it just polls and forwards. See ADR 0001.
function buildJobHandler({ apiClient, concurrency }: BuildJobHandlerParams): HandleJob {
    const cloudRunUrl = system.get(WorkerSystemProp.CLOUD_RUN_URL)
    if (cloudRunUrl) {
        const dispatcher = createCloudRunDispatcher({ baseUrl: cloudRunUrl })
        logger.info({ concurrency, cloudRun: { url: cloudRunUrl } }, 'Starting workers in Cloud Run dispatch mode')
        return ({ job, log }) => dispatcher.dispatch({ job, log })
    }
    runtime = selectRuntime({ concurrency, log: logger })
    const activeRuntime = runtime
    logger.info({ concurrency }, 'Starting workers in local execution mode')
    return async ({ job, workerIndex, log }) => {
        await runJob({ apiClient, runtime: activeRuntime, job, workerIndex, log })
    }
}

async function pollLoop({ apiClient, workerIndex, generation, handleJob }: PollLoopParams): Promise<void> {
    const workerLog = logger.child({ workerIndex })
    workerLog.info('Polling worker started')

    while (polling && connectionGeneration === generation) {
        if (!appVersionCompatible({ log: workerLog })) {
            await sleep(VERSION_MISMATCH_POLL_PAUSE_MS)
            continue
        }

        const { data: machineInfo, error: machineError } = await tryCatch(() => buildMachineInfo({ workerId, workerHostname, getActiveExecutors }))
        if (machineError) {
            workerLog.error({ error: machineError }, 'Failed to build machine info')
            await sleep(20000)
            continue
        }

        const { data: job, error: pollError } = await tryCatch(() => apiClient.poll(machineInfo))
        if (pollError) {
            workerLog.error({ error: pollError }, 'Poll failed')
            await sleep(25000)
            continue
        }

        if (!job) {
            workerLog.debug('Poll returned null, re-polling')
            continue
        }

        workerLog.debug({ job: { id: job.jobId, type: job.jobData.jobType } }, 'Job received from poll')

        await handleJob({ job, workerIndex, log: workerLog })
    }
}

async function warmupPiecesOnStartup(apiClient: WorkerToApiContract): Promise<void> {
    const { data: pieces, error } = await tryCatch(() => apiClient.getUsedPieces({}))
    if (error) {
        logger.error({ error }, 'Failed to fetch used pieces for warmup')
        return
    }
    if (!pieces || pieces.length === 0) {
        logger.info('No pieces to warm up')
        return
    }
    logger.info({ count: pieces.length }, 'Starting piece cache warmup')
    const { error: installError } = await tryCatch(() =>
        warmupPieces({
            pieces,
            basePath: sandboxConfig.getCacheBasePath(),
            getSettings: () => sandboxConfig.getSandboxPoolSettings(),
            log: logger,
            apiClient,
        }),
    )
    if (installError) {
        logger.error({ error: installError }, 'Failed to install pieces during startup warmup')
    }
    else {
        void tryCatch(() => apiClient.markPieceAsUsed({ pieces }))
    }
    logger.info({ count: pieces.length }, 'Piece cache warmup complete')
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

function startHealthServer(): ReturnType<typeof createServer> {
    const port = Number(process.env[WorkerSystemProp.PORT] ?? system.get(WorkerSystemProp.PORT))
    const healthPaths = new Set(['/worker/health', '/v1/health', '/api/v1/health'])
    const server = createServer((req, res) => {
        if (req.method === 'GET' && req.url && healthPaths.has(req.url)) {
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ status: 'ok' }))
        }
        else {
            res.writeHead(404)
            res.end()
        }
    })
    server.listen(port, () => {
        logger.info({ port }, 'Health server listening')
    })
    return server
}

type WorkerStartParams = {
    apiUrl: string
    socketUrl: { url: string, path: string }
    workerToken: string
    withHealthServer?: boolean
}

type HandleJob = (params: { job: ConsumeJobRequest, workerIndex: number, log: ApLogger }) => Promise<void>

type BuildJobHandlerParams = {
    apiClient: WorkerToApiContract
    concurrency: number
}

type PollLoopParams = {
    apiClient: WorkerToApiContract
    workerIndex: number
    generation: number
    handleJob: HandleJob
}
