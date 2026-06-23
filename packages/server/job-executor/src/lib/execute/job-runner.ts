import { ActivepiecesError, isNil, spreadIfDefined, tryCatch } from '@activepieces/core-utils'
import { type Runtime, type RuntimeExecutorInfo } from '@activepieces/sandbox-pool'
import { type ApLogger, apVersionUtil, onCallService, systemUsage, UNKNOWN_VERSION, wideEvent } from '@activepieces/server-utils'
import { ConsumeJobRequest, createRpcClient, EngineResponseStatus, ExecutionMode, JobData, SandboxInformation, WebsocketServerEvent, WorkerMachineHealthcheckRequest, WorkerProps, WorkerSettingsResponse, WorkerToApiContract } from '@activepieces/shared'
import { createLogger } from 'evlog'
import { io, Socket } from 'socket.io-client'
import { getApiUrl, system, WorkerSystemProp } from '../config/configs'
import { logger } from '../config/logger'
import { workerSettings } from '../config/worker-settings'
import { getHandler } from './job-registry'
import { JobContext, JobResult, JobResultKind } from './types'

const AP_VERSION = apVersionUtil.getCurrentRelease()

let pagedForUnreadableWorkerVersion = false

export function createApiConnection({ socketUrl, workerToken, workerId, workerGroupId }: CreateApiConnectionParams): ApiConnection {
    const socket = io(socketUrl.url, {
        auth: { token: workerToken, workerId, workerGroupId },
        path: socketUrl.path,
        transports: ['websocket'],
        reconnection: true,
    })
    const apiClient = createRpcClient<WorkerToApiContract>(socket, 60_000)
    return { socket, apiClient }
}

export async function fetchAndStoreSettings({ sock, workerId, workerHostname, getActiveExecutors }: FetchAndStoreSettingsParams): Promise<void> {
    const { data: request, error } = await tryCatch(() => buildMachineInfo({ workerId, workerHostname, getActiveExecutors }))
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

export function appVersionCompatible({ log }: { log: ApLogger }): boolean {
    const appVersion = workerSettings.getSettings().APP_VERSION
    if (apVersionUtil.versionsAreCompatible({ versionA: appVersion, versionB: AP_VERSION })) {
        return true
    }
    const versionUnreadable = appVersion === UNKNOWN_VERSION || AP_VERSION === UNKNOWN_VERSION
    if (versionUnreadable) {
        log.error({ appVersion, workerVersion: AP_VERSION }, 'A release version could not be read from package.json (reported as 0.0.0); this will NOT self-heal on reconnect, check the worker/app deployment (cwd/packaging)')
    }
    else {
        log.warn({ appVersion, workerVersion: AP_VERSION }, 'Connected app version mismatch — pausing until reconnect to a compatible app')
    }
    if (AP_VERSION === UNKNOWN_VERSION) {
        pageOnceForUnreadableWorkerVersion(log)
    }
    return false
}

export async function buildMachineInfo({ workerId, workerHostname, getActiveExecutors }: BuildMachineInfoParams): Promise<WorkerMachineHealthcheckRequest> {
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
        sandboxes: await buildSandboxInfo({ getActiveExecutors }),
    }
}

export async function executeJob({ apiClient, job, runtime, workerIndex }: ExecuteJobParams): Promise<JobResult> {
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
            const ctx: JobContext = {
                apiClient,
                runtime,
                workerIndex,
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

export async function runJob({ apiClient, runtime, job, workerIndex, log }: RunJobParams): Promise<EngineResponseStatus> {
    const lockExtensionInterval = setInterval(() => {
        void tryCatch(() => apiClient.extendLock({ jobId: job.jobId, token: job.token, queueName: job.queueName })).then(({ error }) => {
            if (error) {
                log.warn({ error, job: { id: job.jobId } }, 'Failed to extend lock')
            }
        })
    }, 30_000)

    const { data: result, error: execError } = await tryCatch(() =>
        executeJob({ apiClient, job, runtime, workerIndex }),
    )

    const status = execError ? EngineResponseStatus.INTERNAL_ERROR : result.status

    const { error: completeError } = await tryCatch(() =>
        apiClient.completeJob({
            jobId: job.jobId,
            token: job.token,
            queueName: job.queueName,
            status,
            errorMessage: buildErrorMessage({ execError: execError ?? undefined, result: result ?? undefined }),
            logs: extractLogs({ execError: execError ?? undefined, result: result ?? undefined }),
            response: result?.kind === JobResultKind.SYNCHRONOUS ? result.response : undefined,
        }),
    )

    clearInterval(lockExtensionInterval)

    if (completeError) {
        log.error({ error: completeError, job: { id: job.jobId } }, 'Failed to complete job')
    }

    return status
}

export function ensurePublicApiUrl(publicUrl: string): string {
    if (publicUrl.endsWith('/api/')) return publicUrl
    if (publicUrl.endsWith('/api')) return publicUrl + '/'
    if (publicUrl.endsWith('/')) return publicUrl + 'api/'
    return publicUrl + '/api/'
}

export function buildErrorMessage({ execError, result }: BuildErrorMessageParams): string | undefined {
    if (execError) {
        return execError.message
    }
    const isFailure = result?.kind === JobResultKind.SYNCHRONOUS && result.status !== EngineResponseStatus.OK
    if (!isFailure) {
        return undefined
    }
    return result.errorMessage
}

export function extractLogs({ execError, result }: ExtractLogsParams): string | undefined {
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

function pageOnceForUnreadableWorkerVersion(log: ApLogger): void {
    if (pagedForUnreadableWorkerVersion) {
        return
    }
    pagedForUnreadableWorkerVersion = true
    onCallService(log, workerSettings.getSettings().PAGE_ONCALL_WEBHOOK).page({
        code: 'WORKER_VERSION_READ_FAILED',
        message: 'Worker could not read its release version from package.json (reported as 0.0.0); execution is paused and will NOT self-heal on reconnect until the deployment is fixed (check cwd/packaging)',
        params: { workerVersion: AP_VERSION },
    }).catch((pageError) => {
        log.error({ pageError }, 'Failed to send on-call page for unreadable worker version')
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

async function buildSandboxInfo({ getActiveExecutors }: { getActiveExecutors: () => RuntimeExecutorInfo[] }): Promise<SandboxInformation[]> {
    const activeExecutors = getActiveExecutors()
    return Promise.all(activeExecutors.map(async (executor) => ({
        sandboxId: executor.sandboxId,
        boxId: executor.boxId,
        busy: executor.busy,
        memoryUsageBytes: await systemUsage.getProcessTreeMemoryBytes(executor.pid),
    })))
}

export const WORKER_RELEASE_VERSION = AP_VERSION

type ApiConnection = {
    socket: Socket
    apiClient: WorkerToApiContract
}

type CreateApiConnectionParams = {
    socketUrl: { url: string, path: string }
    workerToken: string
    workerId: string
    workerGroupId: string | undefined
}

type FetchAndStoreSettingsParams = {
    sock: Socket
    workerId: string
    workerHostname: string
    getActiveExecutors: () => RuntimeExecutorInfo[]
}

type BuildMachineInfoParams = {
    workerId: string
    workerHostname: string
    getActiveExecutors: () => RuntimeExecutorInfo[]
}

type ExecuteJobParams = {
    apiClient: WorkerToApiContract
    job: ConsumeJobRequest
    runtime: Runtime
    workerIndex: number
}

type RunJobParams = {
    apiClient: WorkerToApiContract
    runtime: Runtime
    job: ConsumeJobRequest
    workerIndex: number
    log: ApLogger
}

type BuildErrorMessageParams = {
    execError: Error | undefined
    result: JobResult | undefined
}

type ExtractLogsParams = {
    execError: Error | undefined
    result: JobResult | undefined
}
