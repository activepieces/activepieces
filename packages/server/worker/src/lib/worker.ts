import { createServer } from 'http'
import os from 'os'
import { systemUsage } from '@activepieces/server-utils'
import {
    ActivepiecesError,
    ConsumeJobRequest,
    createRpcClient,
    EngineResponseStatus,
    ExecutionMode,
    isNil,
    JobData,
    tryCatch,
    WebsocketServerEvent,
    WorkerMachineHealthcheckRequest,
    WorkerSettingsResponse,
    WorkerToApiContract,
} from '@activepieces/shared'
import { trace } from '@opentelemetry/api'
import { nanoid } from 'nanoid'
import { io, Socket } from 'socket.io-client'
import { pieceInstaller } from './cache/pieces/piece-installer'
import { getApiUrl, system, WorkerSystemProp } from './config/configs'
import { logger } from './config/logger'
import { workerSettings } from './config/worker-settings'
import { getHandler } from './execute/job-registry'
import { createSandboxManager, SandboxManager } from './execute/sandbox-manager'
import { JobContext, JobResult, JobResultKind } from './execute/types'


const tracer = trace.getTracer('worker')

let socket: Socket | null = null
let polling = false
let connectionGeneration = 0

const workerId = `worker-${nanoid()}`

const workerHostname = os.hostname()

let healthServerInstance: ReturnType<typeof createServer> | null = null

let sandboxManagers: SandboxManager[] = []

export const worker = {
    async start({ apiUrl, socketUrl, workerToken, withHealthServer = false }: WorkerStartParams): Promise<void> {
        const workerGroupId = system.get(WorkerSystemProp.WORKER_GROUP_ID)
        socket = io(socketUrl.url, {
            auth: { token: workerToken, workerId, workerGroupId },
            path: socketUrl.path,
            transports: ['websocket'],
            reconnection: true,
        })

        const apiClient = createRpcClient<WorkerToApiContract>(socket, 60_000)

        socket.on('connect', async () => {
            logger.info('Connected to API server via Socket.IO')
            await fetchAndStoreSettings(socket!)
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
        await Promise.all(sandboxManagers.map((sm) => sm.shutdown(logger)))
        sandboxManagers = []
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

    if (sandboxManagers.length > 0) {
        logger.info({ count: sandboxManagers.length }, 'Shutting down old sandbox managers before creating new ones')
        await Promise.all(sandboxManagers.map((sm) => sm.shutdown(logger)))
        sandboxManagers = []
    }

    const rawConcurrency = Number(system.get(WorkerSystemProp.WORKER_CONCURRENCY) ?? '1')
    const concurrency = Number.isInteger(rawConcurrency) && rawConcurrency > 0 ? rawConcurrency : 1
    if (!Number.isInteger(rawConcurrency) || rawConcurrency < 1) {
        logger.warn({ rawConcurrency }, 'Invalid AP_WORKER_CONCURRENCY value, falling back to 1')
    }
    sandboxManagers = Array.from({ length: concurrency }, (_, i) => createSandboxManager(i + 1))

    logger.info({ concurrency }, 'Starting polling workers')

    const workers = sandboxManagers.map((sbManager, index) =>
        pollAndExecute(apiClient, sbManager, index, generation),
    )
    await Promise.all(workers)
}

async function pollAndExecute(apiClient: WorkerToApiContract, sbManager: SandboxManager, workerIndex: number, generation: number): Promise<void> {
    const workerLog = logger.child({ workerIndex })
    workerLog.info('Polling worker started')

    while (polling && connectionGeneration === generation) {
        const { data: machineInfo, error: machineError } = await tryCatch(buildMachineInfo)
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

        workerLog.debug({ jobId: job.jobId, jobType: job.jobData.jobType }, 'Job received from poll')

        const lockExtensionInterval = setInterval(() => {
            void tryCatch(() => apiClient.extendLock({ jobId: job.jobId, token: job.token, queueName: job.queueName })).then(({ error }) => {
                if (error) {
                    workerLog.warn({ error, jobId: job.jobId }, 'Failed to extend lock')
                }
            })
        }, 30_000)

        const { data: result, error: execError } = await tryCatch(() =>
            executeJob(apiClient, job, sbManager),
        )


        const { error: completeError } = await tryCatch(() =>
            apiClient.completeJob({
                jobId: job.jobId,
                token: job.token,
                queueName: job.queueName,
                status: execError
                    ? EngineResponseStatus.INTERNAL_ERROR
                    : result.status,
                errorMessage: buildErrorMessage(execError ?? undefined, result ?? undefined),
                logs: extractLogs(execError ?? undefined, result ?? undefined),
                response: result?.kind === JobResultKind.SYNCHRONOUS ? result.response : undefined,
            }),
        )

        clearInterval(lockExtensionInterval)

        if (completeError) {
            workerLog.error({ error: completeError, jobId: job.jobId }, 'Failed to complete job')
        }
    }
}

async function executeJob(apiClient: WorkerToApiContract, job: ConsumeJobRequest, sbManager: SandboxManager): Promise<JobResult> {
    const rawData = job.jobData
    const jobData = JobData.parse(rawData)
    return tracer.startActiveSpan('worker.executeJob', {
        attributes: {
            'worker.jobId': job.jobId,
            'worker.jobType': jobData.jobType,
        },
    }, async (span) => {
        const log = logger.child({ jobId: job.jobId, jobType: jobData.jobType })
        const apiUrl = getApiUrl()
        const { PUBLIC_URL: publicUrl } = await workerSettings.waitForSettings()
        log.debug({ apiUrl, publicUrl }, 'Worker settings resolved')
        const ctx: JobContext = {
            apiClient,
            sandboxManager: sbManager,
            jobId: job.jobId,
            engineToken: job.engineToken,
            internalApiUrl: apiUrl,
            publicApiUrl: ensurePublicApiUrl(publicUrl),
            log,
        }
        try {
            const handler = getHandler(jobData.jobType)
            log.debug({ handlerType: handler.jobType }, 'Executing job with handler')
            const { data: result, error } = await tryCatch(() => handler.execute(ctx, jobData))
            if (error) {
                log.error({ error }, 'Job execution failed')
                span.recordException(error)
                throw error
            }
            log.debug('Job completed')
            return result
        }
        finally {
            span.end()
        }
    })
}

export function ensurePublicApiUrl(publicUrl: string): string {
    if (publicUrl.endsWith('/api/')) return publicUrl
    if (publicUrl.endsWith('/api')) return publicUrl + '/'
    if (publicUrl.endsWith('/')) return publicUrl + 'api/'
    return publicUrl + '/api/'
}

async function fetchAndStoreSettings(sock: Socket): Promise<void> {
    const { data: request, error } = await tryCatch(buildMachineInfo)
    if (error) {
        logger.error({ error }, 'Failed to build machine info for settings fetch')
        return
    }
    return new Promise<void>((resolve) => {
        sock.emit(WebsocketServerEvent.FETCH_WORKER_SETTINGS, request, (response: WorkerSettingsResponse) => {
            const localExecutionMode = system.get(WorkerSystemProp.EXECUTION_MODE)
            if (!isNil(localExecutionMode)) {
                response.EXECUTION_MODE = localExecutionMode
            }
            const workerGroupId = system.get(WorkerSystemProp.WORKER_GROUP_ID)
            if (!isNil(workerGroupId)) {
                const processSandboxedModes = [ExecutionMode.SANDBOX_PROCESS, ExecutionMode.SANDBOX_CODE_AND_PROCESS]
                if (!processSandboxedModes.includes(response.EXECUTION_MODE as ExecutionMode)) {
                    throw new Error(`Worker group "${workerGroupId}" requires AP_EXECUTION_MODE to be one of: ${processSandboxedModes.join(', ')}. Got: ${response.EXECUTION_MODE}`)
                }
                const reuseSandbox = system.get(WorkerSystemProp.REUSE_SANDBOX)
                if (isNil(reuseSandbox)) {
                    throw new Error(`Worker group "${workerGroupId}" requires AP_REUSE_SANDBOX to be set (true or false)`)
                }
            }
            workerSettings.set(response)
            logger.info({ environment: response.ENVIRONMENT, executionMode: response.EXECUTION_MODE }, 'Worker settings loaded')
            resolve()
        })
    })
}

function getWorkerProps(): Record<string, string> {
    try {
        const settings = workerSettings.getSettings()
        return {
            EXECUTION_MODE: settings.EXECUTION_MODE,
            WORKER_CONCURRENCY: system.get(WorkerSystemProp.WORKER_CONCURRENCY)!,
            SANDBOX_MEMORY_LIMIT: settings.SANDBOX_MEMORY_LIMIT,
            REUSE_SANDBOX: system.get(WorkerSystemProp.REUSE_SANDBOX) ?? 'false',
        }
    }
    catch {
        return {}
    }
}

async function buildMachineInfo(): Promise<WorkerMachineHealthcheckRequest> {
    const memInfo = await systemUsage.getContainerMemoryUsage()
    const diskInfo = await systemUsage.getDiskInfo()
    const cpuCores = await systemUsage.getCpuCores()
    return {
        workerId,
        cpuUsagePercentage: systemUsage.getCpuUsage(),
        diskInfo,
        workerProps: getWorkerProps(),
        ramUsagePercentage: memInfo.ramUsage,
        totalAvailableRamInBytes: memInfo.totalRamInBytes,
        totalCpuCores: cpuCores,
        ip: workerHostname,
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
        pieceInstaller(logger, apiClient).install({ pieces, includeFilters: false }),
    )
    if (installError) {
        logger.error({ error: installError }, 'Failed to install pieces during startup warmup')
    }
    else {
        void tryCatch(() => apiClient.markPieceAsUsed({ pieces }))
    }
    logger.info({ count: pieces.length }, 'Piece cache warmup complete')
}

function buildErrorMessage(execError: Error | undefined, result: JobResult | undefined): string | undefined {
    if (execError) {
        return execError.message
    }
    const isFailure = result?.kind === JobResultKind.SYNCHRONOUS && result.status !== EngineResponseStatus.OK
    if (!isFailure) {
        return undefined
    }
    return result.errorMessage
}

function extractLogs(execError: Error | undefined, result: JobResult | undefined): string | undefined {
    if (execError instanceof ActivepiecesError) {
        const params = execError.error.params as Record<string, unknown>
        const parts: string[] = []
        if (params?.['standardOutput']) parts.push(`stdout:\n${params['standardOutput']}`)
        if (params?.['standardError']) parts.push(`stderr:\n${params['standardError']}`)
        return parts.length > 0 ? parts.join('\n') : undefined
    }
    if (result && 'logs' in result) {
        return result.logs
    }
    return undefined
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}


function startHealthServer(): ReturnType<typeof createServer> {
    const port = Number(process.env[WorkerSystemProp.PORT] ?? system.get(WorkerSystemProp.PORT))
    const healthPaths = new Set(['/worker/health', '/v1/health'])
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
