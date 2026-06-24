import { createServer } from 'http'
import os from 'os'
import { ActivepiecesError, isNil, spreadIfDefined, tryCatch } from '@activepieces/core-utils'
import { createResolver, Runtime } from '@activepieces/sandbox-pool'
import { apVersionUtil, onCallService, systemUsage, UNKNOWN_VERSION, wideEvent } from '@activepieces/server-utils'
import { ConsumeJobRequest, createRpcClient, EngineResponseStatus, ExecutionMode, JobData, RuntimeKind, SandboxInformation, WebsocketServerEvent, WorkerMachineHealthcheckRequest, WorkerProps, WorkerSettingsResponse, WorkerToApiContract } from '@activepieces/shared'
import { createLogger } from 'evlog'
import { nanoid } from 'nanoid'
import { io, Socket } from 'socket.io-client'
import { getApiUrl, system, WorkerSystemProp } from './config/configs'
import { logger } from './config/logger'
import { workerSettings } from './config/worker-settings'
import { getHandler } from './execute/job-registry'
import { JobContext, JobResult, JobResultKind } from './execute/types'
import { selectRuntime } from './runtime/runtime-factory'
import { sandboxConfig } from './runtime/sandbox-config'


const AP_VERSION = apVersionUtil.getCurrentRelease()

const VERSION_MISMATCH_POLL_PAUSE_MS = 10_000

let pagedForUnreadableWorkerVersion = false

function pageOnceForUnreadableWorkerVersion(workerLog: typeof logger): void {
    if (pagedForUnreadableWorkerVersion) {
        return
    }
    pagedForUnreadableWorkerVersion = true
    onCallService(workerLog, workerSettings.getSettings().PAGE_ONCALL_WEBHOOK).page({
        code: 'WORKER_VERSION_READ_FAILED',
        message: 'Worker could not read its release version from package.json (reported as 0.0.0); polling is paused and will NOT self-heal on reconnect until the deployment is fixed (check cwd/packaging)',
        params: { workerVersion: AP_VERSION },
    }).catch((pageError) => {
        workerLog.error({ pageError }, 'Failed to send on-call page for unreadable worker version')
    })
}

let socket: Socket | null = null
let polling = false
let connectionGeneration = 0

const workerId = `worker-${nanoid()}`

const workerHostname = os.hostname()

let healthServerInstance: ReturnType<typeof createServer> | null = null

let runtime: Runtime | null = null

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
    runtime = selectRuntime({ concurrency, log: logger })

    logger.info({ concurrency }, 'Starting polling workers')

    const activeRuntime = runtime
    const workers = Array.from({ length: concurrency }, (_, workerIndex) =>
        pollAndExecute(apiClient, activeRuntime, workerIndex, generation),
    )
    await Promise.all(workers)
}

async function pollAndExecute(apiClient: WorkerToApiContract, runtime: Runtime, workerIndex: number, generation: number): Promise<void> {
    const workerLog = logger.child({ workerIndex })
    workerLog.info('Polling worker started')

    while (polling && connectionGeneration === generation) {
        const appVersion = workerSettings.getSettings().APP_VERSION
        if (!apVersionUtil.versionsAreCompatible({ versionA: appVersion, versionB: AP_VERSION })) {
            const versionUnreadable = appVersion === UNKNOWN_VERSION || AP_VERSION === UNKNOWN_VERSION
            if (versionUnreadable) {
                workerLog.error({ appVersion, workerVersion: AP_VERSION }, 'Pausing polling — a release version could not be read from package.json (reported as 0.0.0); this will NOT self-heal on reconnect, check the worker/app deployment (cwd/packaging)')
            }
            else {
                workerLog.warn({ appVersion, workerVersion: AP_VERSION }, 'Connected app version mismatch — pausing polling until reconnect to a compatible app')
            }
            if (AP_VERSION === UNKNOWN_VERSION) {
                pageOnceForUnreadableWorkerVersion(workerLog)
            }
            await sleep(VERSION_MISMATCH_POLL_PAUSE_MS)
            continue
        }

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

        workerLog.debug({ job: { id: job.jobId, type: job.jobData.jobType } }, 'Job received from poll')

        const lockExtensionInterval = setInterval(() => {
            void tryCatch(() => apiClient.extendLock({ jobId: job.jobId, token: job.token, queueName: job.queueName })).then(({ error }) => {
                if (error) {
                    workerLog.warn({ error, job: { id: job.jobId } }, 'Failed to extend lock')
                }
            })
        }, 30_000)

        const { data: result, error: execError } = await tryCatch(() =>
            executeJob(apiClient, job, runtime, workerIndex),
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
            workerLog.error({ error: completeError, job: { id: job.jobId } }, 'Failed to complete job')
        }
    }
}

async function executeJob(apiClient: WorkerToApiContract, job: ConsumeJobRequest, runtime: Runtime, workerIndex: number): Promise<JobResult> {
    const rawData = job.jobData
    const jobData = JobData.parse(rawData)
    const jobLogger = createLogger({
        event: 'job.execute',
        job: { id: job.jobId, type: jobData.jobType },
        ...spreadIfDefined('requestId', 'requestId' in jobData ? jobData.requestId : 'httpRequestId' in jobData ? jobData.httpRequestId : undefined),
        ...spreadIfDefined('project', 'projectId' in jobData && jobData.projectId != null ? { id: jobData.projectId } : undefined),
        ...spreadIfDefined('platform', 'platformId' in jobData ? { id: jobData.platformId } : undefined),
        ...spreadIfDefined('flow', 'flowId' in jobData ? { id: jobData.flowId } : undefined),
        ...spreadIfDefined('flowRun', 'runId' in jobData ? { id: jobData.runId } : undefined),
        ...spreadIfDefined('flowVersion', 'flowVersionId' in jobData ? { id: jobData.flowVersionId } : undefined),
    })
    return wideEvent.run({
        logger: jobLogger,
        fn: async () => {
            const log = logger.child({ job: { id: job.jobId, type: jobData.jobType } })
            const apiUrl = getApiUrl()
            const { PUBLIC_URL: publicUrl } = await workerSettings.waitForSettings()
            log.debug({ apiUrl, publicUrl }, 'Worker settings resolved')
            const publicApiUrl = ensurePublicApiUrl(publicUrl)
            // A remote runtime (e.g. GCP_CLOUD_RUN) runs the engine off-box, so its callback URL must be
            // publicly reachable; only the in-process LOCAL runtime can use the internal (cluster) apiUrl.
            const internalApiUrl = runtime.kind === RuntimeKind.LOCAL ? apiUrl : publicApiUrl
            const ctx: JobContext = {
                apiClient,
                runtime,
                resolver: createResolver({
                    apiClient,
                    basePath: sandboxConfig.getCacheBasePath(),
                    getSettings: () => sandboxConfig.getSandboxPoolSettings(),
                    log,
                }),
                workerIndex,
                jobId: job.jobId,
                engineToken: job.engineToken,
                internalApiUrl,
                publicApiUrl,
                log,
            }
            try {
                const handler = getHandler(jobData.jobType)
                log.debug({ handlerType: handler.jobType }, 'Executing job with handler')
                const { data: result, error } = await tryCatch(() => handler.execute(ctx, jobData))
                if (error) {
                    log.error({ error }, 'Job execution failed')
                    wideEvent.error(error)
                    wideEvent.set({ outcome: 'failed' })
                    throw error
                }
                log.debug('Job completed')
                wideEvent.set({ outcome: 'success' })
                return result
            }
            finally {
                jobLogger.emit()
            }
        },
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

function getWorkerProps(): WorkerProps {
    try {
        const settings = workerSettings.getSettings()
        return {
            EXECUTION_MODE: settings.EXECUTION_MODE,
            WORKER_CONCURRENCY: system.get(WorkerSystemProp.WORKER_CONCURRENCY)!,
            SANDBOX_MEMORY_LIMIT: settings.SANDBOX_MEMORY_LIMIT,
            REUSE_SANDBOX: system.get(WorkerSystemProp.REUSE_SANDBOX) ?? 'false',
            version: AP_VERSION,
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
        sandboxes: await buildSandboxInfo(),
    }
}

async function buildSandboxInfo(): Promise<SandboxInformation[]> {
    const activeExecutors = runtime?.getActiveExecutors() ?? []

    return Promise.all(activeExecutors.map(async (executor) => ({
        sandboxId: executor.sandboxId,
        boxId: executor.boxId,
        busy: executor.busy,
        memoryUsageBytes: await systemUsage.getProcessTreeMemoryBytes(executor.pid),
    })))
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
