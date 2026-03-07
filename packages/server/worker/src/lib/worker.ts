import { systemUsage } from '@activepieces/server-utils'
import {
    ConsumeJobRequest,
    ConsumeJobResponseStatus,
    createRpcClient,
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
import { system, WorkerSystemProp } from './config/configs'
import { logger } from './config/logger'
import { workerSettings } from './config/worker-settings'
import { getHandler } from './execute/job-registry'
import { JobContext, JobResult } from './execute/types'


const tracer = trace.getTracer('worker')

let socket: Socket | null = null
let polling = false

const workerId = `worker-${nanoid()}`

export const worker = {
    async start(apiUrl: string, workerToken: string): Promise<void> {
        socket = io(apiUrl, {
            auth: { token: workerToken, workerId },
            transports: ['websocket'],
            reconnection: true,
        })

        const apiClient = createRpcClient<WorkerToApiContract>(socket, 60_000)

        socket.on('connect', () => {
            logger.info('Connected to API server via Socket.IO')
            void fetchAndStoreSettings(socket!, () => {
                void startPollingLoop(apiClient)
            })
        })

        socket.on('disconnect', (reason) => {
            logger.warn({ reason }, 'Disconnected from API server')
            polling = false
        })

        socket.on('connect_error', (error) => {
            logger.error({ error: error.message }, 'Socket.IO connection error')
        })

        logger.info({ apiUrl }, 'Worker started, polling for jobs...')
    },

    stop(): void {
        polling = false
        socket?.disconnect()
        socket = null
        logger.info('Worker stopped')
    },
}

async function startPollingLoop(apiClient: WorkerToApiContract): Promise<void> {
    if (polling) return
    polling = true
    logger.info('Starting job polling loop')

    while (polling) {
        const { data: machineInfo, error: machineError } = await tryCatch(buildMachineInfo)
        if (machineError) {
            logger.error({ error: machineError }, 'Failed to build machine info')
            await sleep(5000)
            continue
        }

        const { data: job, error: pollError } = await tryCatch(() => apiClient.poll(machineInfo))
        if (pollError) {
            logger.error({ error: pollError }, 'Poll failed')
            await sleep(5000)
            continue
        }

        if (!job) {
            logger.debug('Poll returned null, re-polling')
            continue
        }

        logger.info({ jobId: job.jobId, jobType: job.jobData.jobType }, 'Job received from poll')

        const { data: result, error: execError } = await tryCatch(() =>
            executeJob(apiClient, job),
        )

        const { error: completeError } = await tryCatch(() =>
            apiClient.completeJob({
                jobId: job.jobId,
                status: execError ? ConsumeJobResponseStatus.INTERNAL_ERROR : ConsumeJobResponseStatus.OK,
                errorMessage: execError?.message,
                delayInSeconds: result?.delayInSeconds,
                response: result?.response,
            }),
        )

        if (completeError) {
            logger.error({ error: completeError, jobId: job.jobId }, 'Failed to complete job')
        }
    }
}

async function executeJob(apiClient: WorkerToApiContract, job: ConsumeJobRequest): Promise<JobResult> {
    const rawData = job.jobData
    const jobData = JobData.parse(rawData)
    return tracer.startActiveSpan('worker.executeJob', {
        attributes: {
            'worker.jobId': job.jobId,
            'worker.jobType': jobData.jobType,
        },
    }, async (span) => {
        const log = logger.child({ jobId: job.jobId, jobType: jobData.jobType })
        const apiUrl = system.getOrThrow(WorkerSystemProp.API_URL)
        const { PUBLIC_URL: publicUrl } = await workerSettings.waitForSettings()
        log.info({ apiUrl, publicUrl }, 'Worker settings resolved')
        const ctx: JobContext = {
            apiClient,
            jobId: job.jobId,
            engineToken: job.engineToken,
            internalApiUrl: ensureTrailingSlash(apiUrl),
            publicApiUrl: ensurePublicApiUrl(publicUrl),
            log,
        }
        try {
            const handler = getHandler(jobData.jobType)
            log.info({ handlerType: handler.jobType }, 'Executing job with handler')
            const { data: result, error } = await tryCatch(() => handler.execute(ctx, jobData))
            if (error) {
                log.error({ error }, 'Job execution failed')
                span.recordException(error)
                throw error
            }
            log.info('Job completed')
            return result
        }
        finally {
            span.end()
        }
    })
}

function ensureTrailingSlash(url: string): string {
    return url.endsWith('/') ? url : url + '/'
}

function ensurePublicApiUrl(publicUrl: string): string {
    if (publicUrl.endsWith('/api/')) return publicUrl
    if (publicUrl.endsWith('/api')) return publicUrl + '/'
    if (publicUrl.endsWith('/')) return publicUrl + 'api/'
    return publicUrl + '/api/'
}

function fetchAndStoreSettings(sock: Socket, onReady: () => void): void {
    buildMachineInfo().then((request) => {
        sock.emit(WebsocketServerEvent.FETCH_WORKER_SETTINGS, request, (response: WorkerSettingsResponse) => {
            workerSettings.set(response)
            logger.info({ environment: response.ENVIRONMENT, executionMode: response.EXECUTION_MODE }, 'Worker settings loaded')
            onReady()
        })
    }).catch((err) => {
        logger.error({ error: err }, 'Failed to build machine info for settings fetch')
    })
}

async function buildMachineInfo(): Promise<WorkerMachineHealthcheckRequest> {
    const memInfo = await systemUsage.getContainerMemoryUsage()
    const diskInfo = await systemUsage.getDiskInfo()
    const cpuCores = await systemUsage.getCpuCores()
    return {
        workerId,
        cpuUsagePercentage: systemUsage.getCpuUsage(),
        diskInfo,
        workerProps: {},
        ramUsagePercentage: memInfo.ramUsage,
        totalAvailableRamInBytes: memInfo.totalRamInBytes,
        totalCpuCores: cpuCores,
        ip: '127.0.0.1',
        totalSandboxes: 0,
        freeSandboxes: 0,
    }
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}
