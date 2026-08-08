import { createServer } from 'http'
import os from 'os'
import { ActivepiecesError, isNil, spreadIfDefined, tryCatch } from '@activepieces/core-utils'
import { ACTION_RUN_CACHE_FIRST_SWEEP_DELAY_MS, ACTION_RUN_CACHE_SWEEP_INTERVAL_MS, actionRunCache, createResolver, createSandboxRuntime, Runtime } from '@activepieces/sandbox'
import { apVersionUtil, createLogger, onCallService, systemUsage, UNKNOWN_VERSION, wideEvent } from '@activepieces/server-utils'
import { ApiToWorkerContract, ConsumeJobRequest, createNotifyServer, createRpcClient, EngineResponseStatus, ExecutionMode, JobData, SandboxInformation, WebsocketServerEvent, WorkerJobType, WorkerMachineHealthcheckRequest, WorkerProps, WorkerSettingsResponse, WorkerToApiContract } from '@activepieces/shared'
import { nanoid } from 'nanoid'
import { io, Socket } from 'socket.io-client'
import { createApiToWorkerHandlers } from './api-notify-service'
import { getApiUrl, system, WorkerSystemProp } from './config/configs'
import { logger } from './config/logger'
import { workerSettings } from './config/worker-settings'
import { getHandler } from './execute/job-registry'
import { JobContext, JobResult, JobResultKind } from './execute/types'
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

// Front-loads the release-read failure signal to worker boot so a mis-packaged worker that hasn't
// polled yet doesn't silently look healthy in the logs. This only LOGS: the on-call page needs
// PAGE_ONCALL_WEBHOOK, which arrives with worker settings on socket connect and is not available at
// boot, so paging is left to the poll loop's version-compatibility check (which calls
// pageOnceForUnreadableWorkerVersion, once-guarded, as soon as settings are loaded). A '0.0.0' read
// pauses polling and will NOT self-heal on reconnect until the deployment is fixed.
function assertReleaseReadable(): void {
    if (AP_VERSION !== UNKNOWN_VERSION) {
        logger.info({ release: { version: AP_VERSION } }, 'Release version detected from package.json')
        return
    }
    logger.error({ release: { version: AP_VERSION } }, 'Worker could not read its release version from package.json (reported as 0.0.0); polling is paused and will NOT self-heal on reconnect until the deployment is fixed (check cwd/packaging)')
}

let socket: Socket | null = null
let polling = false
let connectionGeneration = 0

const workerId = `worker-${nanoid()}`

const workerHostname = os.hostname()

let healthServerInstance: ReturnType<typeof createServer> | null = null

let runtime: Runtime | null = null

// Jobs executing across all poll loops. stop() waits for these to finish + report before tearing
// down, so a deploy doesn't orphan them in the app's BullMQ `active` list. Abrupt death (OOM/SIGKILL)
// still falls to the stalled-scan.
let inFlightJobs = 0

const DRAIN_TIMEOUT_MS = 25_000

// Sandbox memory/state is UI-only telemetry (the workers page). Computing it needs a full
// process-table scan (si.processes()), so it must NOT run on the poll hot path — sampling it on
// every poll pegged worker CPU and collapsed throughput (~7x, #13497). Sample it on a slow
// interval instead and have buildMachineInfo() read the cached snapshot.
let cachedSandboxInfo: SandboxInformation[] = []
let sandboxInfoInterval: NodeJS.Timeout | null = null
const SANDBOX_INFO_REFRESH_MS = 15_000
const SERVER_PING_TIMEOUT_MS = 5_000
const MACHINE_INFO_TIMEOUT_MS = 15_000
const POLL_LIVENESS_TIMEOUT_MS = 180_000
const POLL_WATCHDOG_INTERVAL_MS = 30_000

let pollLoopLiveness: PollLoopLiveness[] = []
let pollWatchdogInterval: NodeJS.Timeout | null = null

let cacheSweepInterval: NodeJS.Timeout | null = null
let cacheSweepFirstRunTimeout: NodeJS.Timeout | null = null

export const worker = {
    async start({ apiUrl, socketUrl, workerToken, withHealthServer = false }: WorkerStartParams): Promise<void> {
        assertReleaseReadable()
        const workerGroupId = system.get(WorkerSystemProp.WORKER_GROUP_ID)
        const projectWorker = system.getBoolean(WorkerSystemProp.PROJECT_WORKER) ?? true
        socket = io(socketUrl.url, {
            auth: { token: workerToken, workerId, workerGroupId, projectWorker },
            path: socketUrl.path,
            transports: ['websocket'],
            reconnection: true,
        })

        const apiClient = createRpcClient<WorkerToApiContract>(socket, 60_000)

        socket.on('connect', async () => {
            logger.info('Connected to API server via Socket.IO')
            resetPollLoopLiveness({ loopCount: 1 })
            await fetchAndStoreSettings(socket!)
            void startPollingWorkers(apiClient).catch((err) => {
                logger.error({ error: err }, 'Polling workers crashed unexpectedly')
            })
        })

        socket.on('disconnect', (reason) => {
            connectionGeneration++
            polling = false
            logger.warn({ reason }, 'Disconnected from API server')
            // 'io client disconnect' is our own stop() — it already drained and tore down the runtime.
            // For any other reason the socket dropped while a job may still be running locally; the app
            // reclaims that job on disconnect, so kill the runtime now or the original keeps executing
            // to completion and double-runs the requeued copy. (The reconnect path recreates it.)
            if (reason !== 'io client disconnect') {
                abortInFlightRuntime()
            }
            // Socket.IO does NOT auto-reconnect when the server initiates the disconnect
            // (reason 'io server disconnect' — e.g. the API process restarts/hot-reloads).
            // Without a manual reconnect the worker stays dead and silently stops consuming
            // jobs. Every other non-client reason already triggers built-in reconnection.
            if (reason === 'io server disconnect') {
                socket?.connect()
            }
        })

        socket.on('connect_error', (error) => {
            logger.error({ error: error.message }, 'Socket.IO connection error')
        })

        createNotifyServer<ApiToWorkerContract>(socket, createApiToWorkerHandlers({
            getRuntime: () => runtime,
            apiClient,
            getPublicApiUrl: () => ensurePublicApiUrl(workerSettings.getSettings().PUBLIC_URL),
            log: logger,
        }))

        if (withHealthServer) {
            healthServerInstance = startHealthServer()
        }
        startSandboxInfoSampling()
        startPollWatchdog()
        startCacheSweeper()
        logger.info({ apiUrl, socketUrl }, 'Worker started, polling for jobs...')
    },

    async stop(): Promise<void> {
        polling = false
        pollLoopLiveness = []
        stopPollWatchdog()
        stopSandboxInfoSampling()
        stopCacheSweeper()
        await drainInFlightJobs()
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

    // The destination is one box per worker (concurrency 1), scaling out with replicas (ADR 0003).
    // Transitional compatibility mode (ADR 0004): honor AP_WORKER_CONCURRENCY=N by running N poll
    // loops over N in-process boxes, each routed by its workerIndex. The default (5, main's historical
    // value) is registered in configs.ts to preserve old behavior, so system.get always returns it; the
    // '1' below is an unreachable belt-and-suspenders fallback. At N>1 an OOM takes down all N in-flight
    // jobs, so the operator must size the container accordingly.
    const rawConcurrency = Number(system.get(WorkerSystemProp.WORKER_CONCURRENCY) ?? '1')
    const concurrency = Number.isInteger(rawConcurrency) && rawConcurrency > 0 ? rawConcurrency : 1
    if (!Number.isInteger(rawConcurrency) || rawConcurrency < 1) {
        logger.warn({ rawConcurrency }, 'Invalid AP_WORKER_CONCURRENCY value, falling back to 1')
    }
    // Bring up a fresh runtime on every (re)connect — a prior connection's in-flight job is killed
    // along with its box (usually already done by the disconnect handler), so it fails fast and is
    // retried instead of lingering on a reused box. Reusing the box made the next generation's poll
    // loop run a second operation on the same single-operation engine child (acquire() hands back a
    // busy sandbox) and let the lingering job's lock lapse during the reconnect → BullMQ "stalled";
    // a deploy disconnects every worker at once, so reuse turned that into mass stalls.
    abortInFlightRuntime()

    runtime = createSandboxRuntime({
        concurrency,
        basePath: sandboxConfig.getCacheBasePath(),
        getSettings: () => sandboxConfig.getSandboxSettings(),
    })

    // Fire-and-forget: warm the piece cache for this platform's flows without blocking the poll loop.
    void runtime.prewarm({
        log: logger, 
        apiClient,
        publicApiUrl: ensurePublicApiUrl(workerSettings.getSettings().PUBLIC_URL),
    })

    logger.info({ concurrency }, 'Starting poll loops')

    resetPollLoopLiveness({ loopCount: concurrency })
    const activeRuntime = runtime
    await Promise.all(Array.from({ length: concurrency }, (_, workerIndex) =>
        pollAndExecute(apiClient, activeRuntime, workerIndex, generation),
    ))
}

async function pollAndExecute(apiClient: WorkerToApiContract, runtime: Runtime, workerIndex: number, generation: number): Promise<void> {
    const workerLog = logger.child({ workerIndex })
    workerLog.info('Polling worker started')

    while (polling && connectionGeneration === generation) {
        markPollLoopIteration({ workerIndex, busy: false })
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

        // Counted for the duration of execute + completeJob so a graceful shutdown can wait for
        // the report to land before tearing down the socket (otherwise the job is orphaned in active).
        inFlightJobs++
        markPollLoopIteration({ workerIndex, busy: true })
        try {
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
        finally {
            inFlightJobs--
            markPollLoopIteration({ workerIndex, busy: false })
        }
    }
    workerLog.warn({ polling, generation, connectionGeneration }, 'Poll loop exited — this worker consumes no jobs until it starts again')
}

async function drainInFlightJobs(): Promise<void> {
    const deadline = Date.now() + DRAIN_TIMEOUT_MS
    while (inFlightJobs > 0 && Date.now() < deadline) {
        await sleep(100)
    }
    if (inFlightJobs > 0) {
        logger.warn({ inFlightJobs }, 'Drain timeout reached with jobs still in flight; leaving them for the stalled-scan to reclaim')
    }
}

// Kill the current runtime (and the job running on it) without awaiting — awaiting the shutdown
// while a job is in-flight deadlocks (the await never resolves, polling never restarts). Nulling
// `runtime` lets the next (re)connect create a fresh box.
function abortInFlightRuntime(): void {
    if (isNil(runtime)) {
        return
    }
    const oldRuntime = runtime
    runtime = null
    void tryCatch(() => oldRuntime.shutdown(logger)).then(({ error }) => {
        if (error) {
            logger.error({ error }, 'Failed to shut down runtime')
        }
    })
}

async function executeJob(apiClient: WorkerToApiContract, job: ConsumeJobRequest, runtime: Runtime, workerIndex: number): Promise<JobResult> {
    const rawData = job.jobData
    const jobData = JobData.parse(rawData)
    // Chat jobs reuse `runId` as the per-message chat run id (NOT a flow run);
    // map it to the `run`/`conversation` groups so chat logs correlate correctly.
    const isAgentJob = jobData.jobType === WorkerJobType.EXECUTE_AGENT_RUN
    const jobLogger = createLogger({
        event: 'job.execute',
        job: { id: job.jobId, type: jobData.jobType },
        ...spreadIfDefined('requestId', 'requestId' in jobData ? jobData.requestId : 'httpRequestId' in jobData ? jobData.httpRequestId : undefined),
        ...spreadIfDefined('project', 'projectId' in jobData && jobData.projectId != null ? { id: jobData.projectId } : undefined),
        ...spreadIfDefined('platform', 'platformId' in jobData ? { id: jobData.platformId } : undefined),
        ...spreadIfDefined('flow', 'flowId' in jobData ? { id: jobData.flowId } : undefined),
        ...spreadIfDefined('flowRun', !isAgentJob && 'runId' in jobData ? { id: jobData.runId } : undefined),
        ...spreadIfDefined('run', isAgentJob && 'runId' in jobData ? { id: jobData.runId } : undefined),
        ...spreadIfDefined('conversation', 'conversationId' in jobData ? { id: jobData.conversationId } : undefined),
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
            // The engine forks in-process inside this worker, so it reaches the app over the worker's own
            // app URL (cluster-internal when co-located with the app, the public URL for a standalone worker).
            const internalApiUrl = apiUrl
            const ctx: JobContext = {
                apiClient,
                runtime,
                resolver: createResolver({
                    apiClient,
                    basePath: sandboxConfig.getCacheBasePath(),
                    getSettings: () => sandboxConfig.getSandboxSettings(),
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
                const handler = await getHandler(jobData.jobType)
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
        const settings = sandboxConfig.getSandboxSettings()
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
    return withTimeout({
        promise: collectMachineInfo(),
        timeoutMs: MACHINE_INFO_TIMEOUT_MS,
        message: 'Timed out collecting machine info',
    })
}

async function collectMachineInfo(): Promise<WorkerMachineHealthcheckRequest> {
    const memInfo = await systemUsage.getContainerMemoryUsage()
    const diskInfo = await systemUsage.getDiskInfo()
    const cpuCores = await systemUsage.getCpuCores()
    const serverPingMs = await probeServerPing()
    return {
        workerId,
        cpuUsagePercentage: systemUsage.getCpuUsage(),
        diskInfo,
        workerProps: getWorkerProps(),
        ramUsagePercentage: memInfo.ramUsage,
        totalAvailableRamInBytes: memInfo.totalRamInBytes,
        totalCpuCores: cpuCores,
        ip: workerHostname,
        serverPingMs,
        sandboxes: cachedSandboxInfo,
    }
}

async function probeServerPing(): Promise<number | undefined> {
    const startedAt = Date.now()
    const probe = tryCatch(() => fetch(`${getApiUrl()}v1/health`, { signal: AbortSignal.timeout(SERVER_PING_TIMEOUT_MS) }))
        .then(({ data: response, error }) => {
            void response?.body?.cancel()
            return error ? undefined : Date.now() - startedAt
        })
    return Promise.race([probe, sleep(SERVER_PING_TIMEOUT_MS).then(() => undefined)])
}

function withTimeout<T>({ promise, timeoutMs, message }: { promise: Promise<T>, timeoutMs: number, message: string }): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(message)), timeoutMs)
        promise.then(resolve, reject).finally(() => clearTimeout(timer))
    })
}

function startSandboxInfoSampling(): void {
    if (!isNil(sandboxInfoInterval)) {
        return
    }
    void refreshSandboxInfo()
    sandboxInfoInterval = setInterval(() => void refreshSandboxInfo(), SANDBOX_INFO_REFRESH_MS)
    sandboxInfoInterval.unref()
}

function stopSandboxInfoSampling(): void {
    if (!isNil(sandboxInfoInterval)) {
        clearInterval(sandboxInfoInterval)
        sandboxInfoInterval = null
    }
    cachedSandboxInfo = []
}

async function refreshSandboxInfo(): Promise<void> {
    const { data, error } = await tryCatch(buildSandboxInfo)
    if (error) {
        logger.warn({ error }, 'Failed to refresh sandbox info')
        return
    }
    cachedSandboxInfo = data
}

async function buildSandboxInfo(): Promise<SandboxInformation[]> {
    const activeExecutors = runtime?.getActiveExecutors() ?? []
    if (activeExecutors.length === 0) {
        return []
    }
    const memoryByPid = await systemUsage.getProcessTreeMemoryBytesByPids(activeExecutors.map((executor) => executor.pid))
    return activeExecutors.map((executor) => ({
        sandboxId: executor.sandboxId,
        boxId: executor.boxId,
        busy: executor.busy,
        memoryUsageBytes: memoryByPid.get(executor.pid) ?? 0,
    }))
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

function resetPollLoopLiveness({ loopCount }: { loopCount: number }): void {
    const startedAt = Date.now()
    pollLoopLiveness = Array.from({ length: loopCount }, () => ({ iteratedAt: startedAt, busy: false }))
}

function markPollLoopIteration({ workerIndex, busy }: { workerIndex: number, busy: boolean }): void {
    const liveness = pollLoopLiveness[workerIndex]
    if (isNil(liveness)) {
        return
    }
    liveness.iteratedAt = Date.now()
    liveness.busy = busy
}

function findStalledPollLoop(): StalledPollLoop | undefined {
    const connected = socket?.connected ?? false
    if (!connected) {
        return undefined
    }
    const now = Date.now()
    const workerIndex = findStalledLoopIndex({ loops: pollLoopLiveness, now, timeoutMs: POLL_LIVENESS_TIMEOUT_MS })
    if (workerIndex === -1) {
        return undefined
    }
    return { workerIndex, stalledForMs: now - pollLoopLiveness[workerIndex].iteratedAt }
}

function startCacheSweeper(): void {
    if (!isNil(cacheSweepInterval) || !isNil(cacheSweepFirstRunTimeout)) {
        return
    }
    cacheSweepFirstRunTimeout = setTimeout(() => {
        cacheSweepFirstRunTimeout = null
        void sweepActionRunCache()
        cacheSweepInterval = setInterval(() => void sweepActionRunCache(), ACTION_RUN_CACHE_SWEEP_INTERVAL_MS)
        cacheSweepInterval.unref()
    }, ACTION_RUN_CACHE_FIRST_SWEEP_DELAY_MS)
    cacheSweepFirstRunTimeout.unref()
}

function stopCacheSweeper(): void {
    if (!isNil(cacheSweepFirstRunTimeout)) {
        clearTimeout(cacheSweepFirstRunTimeout)
        cacheSweepFirstRunTimeout = null
    }
    if (!isNil(cacheSweepInterval)) {
        clearInterval(cacheSweepInterval)
        cacheSweepInterval = null
    }
}

async function sweepActionRunCache(): Promise<void> {
    const { error } = await tryCatch(() => actionRunCache.sweep({ basePath: sandboxConfig.getCacheBasePath(), log: logger }))
    if (error) {
        logger.warn({ error }, 'Action-run code cache sweep failed')
    }
}

function startPollWatchdog(): void {
    if (!isNil(pollWatchdogInterval)) {
        return
    }
    pollWatchdogInterval = setInterval(() => {
        const stalled = findStalledPollLoop()
        if (isNil(stalled)) {
            return
        }
        logger.error({ ...stalled, loopCount: pollLoopLiveness.length }, 'Poll loop stalled — exiting so the process manager restarts a worker that can consume jobs')
        process.exit(1)
    }, POLL_WATCHDOG_INTERVAL_MS)
    pollWatchdogInterval.unref()
}

function stopPollWatchdog(): void {
    if (!isNil(pollWatchdogInterval)) {
        clearInterval(pollWatchdogInterval)
        pollWatchdogInterval = null
    }
}


function startHealthServer(): ReturnType<typeof createServer> {
    const port = Number(process.env[WorkerSystemProp.PORT] ?? system.get(WorkerSystemProp.PORT))
    const healthPaths = new Set(['/worker/health', '/v1/health', '/api/v1/health'])
    const server = createServer((req, res) => {
        if (req.method === 'GET' && req.url && healthPaths.has(req.url)) {
            const stalled = !isNil(findStalledPollLoop())
            res.writeHead(stalled ? 503 : 200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ status: stalled ? 'poll_loop_stalled' : 'ok' }))
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

export function findStalledLoopIndex({ loops, now, timeoutMs }: { loops: PollLoopLiveness[], now: number, timeoutMs: number }): number {
    return loops.findIndex((loop) => !loop.busy && now - loop.iteratedAt > timeoutMs)
}

export type PollLoopLiveness = {
    iteratedAt: number
    busy: boolean
}

type StalledPollLoop = {
    workerIndex: number
    stalledForMs: number
}
