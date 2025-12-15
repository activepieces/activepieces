import { AppSystemProp, WorkerSystemProp } from '@activepieces/server-shared'
import {
    ExecutionMode,
    isNil,
    partition,
    WebsocketServerEvent,
    WorkerMachineHealthcheckRequest,
    WorkerMachineStatus,
    WorkerMachineWithStatus,
    WorkerSettingsResponse,
} from '@activepieces/shared'

import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { FastifyBaseLogger } from 'fastify'
import { websocketService } from '../../core/websockets.service'
import { redisConnections } from '../../database/redis-connections'
import { domainHelper } from '../../ee/custom-domains/domain-helper'
import { dedicatedWorkers } from '../../ee/platform/platform-plan/platform-dedicated-workers'
import { jwtUtils } from '../../helper/jwt-utils'
import { system } from '../../helper/system/system'
import { workerMachineCache } from './machine-cache'

dayjs.extend(utc)

export const machineService = (log: FastifyBaseLogger) => {
    return {
        async onDisconnect(request: OnDisconnectParams): Promise<void> {
            log.info({
                message: 'Worker disconnected',
                workerId: request.workerId,
            })
            await workerMachineCache().delete([request.workerId])
        },
        async onConnection(request: WorkerMachineHealthcheckRequest, platformIdForDedicatedWorker?: string | undefined): Promise<WorkerSettingsResponse> {
            await workerMachineCache().upsert({
                id: request.workerId,
                information: request,
            })
            const executionMode = await getExecutionMode(log, platformIdForDedicatedWorker)
            const isDedicatedWorker = !isNil(platformIdForDedicatedWorker)
            return {
                JWT_SECRET: await jwtUtils.getJwtSecret(),
                TRIGGER_TIMEOUT_SECONDS: system.getNumberOrThrow(AppSystemProp.TRIGGER_TIMEOUT_SECONDS),
                PAUSED_FLOW_TIMEOUT_DAYS: system.getNumberOrThrow(AppSystemProp.PAUSED_FLOW_TIMEOUT_DAYS),
                EXECUTION_MODE: executionMode,
                TRIGGER_HOOKS_TIMEOUT_SECONDS: system.getNumberOrThrow(AppSystemProp.TRIGGER_HOOKS_TIMEOUT_SECONDS),
                FLOW_TIMEOUT_SECONDS: system.getNumberOrThrow(AppSystemProp.FLOW_TIMEOUT_SECONDS),
                WORKER_CONCURRENCY: system.getNumberOrThrow(WorkerSystemProp.WORKER_CONCURRENCY),
                LOG_LEVEL: system.getOrThrow(AppSystemProp.LOG_LEVEL),
                LOG_PRETTY: system.getOrThrow(AppSystemProp.LOG_PRETTY),
                ENVIRONMENT: system.getOrThrow(AppSystemProp.ENVIRONMENT),
                APP_WEBHOOK_SECRETS: system.getOrThrow(AppSystemProp.APP_WEBHOOK_SECRETS),
                MAX_FILE_SIZE_MB: system.getNumberOrThrow(AppSystemProp.MAX_FILE_SIZE_MB),
                SANDBOX_MEMORY_LIMIT: system.getOrThrow(AppSystemProp.SANDBOX_MEMORY_LIMIT),
                SANDBOX_PROPAGATED_ENV_VARS: system.get(AppSystemProp.SANDBOX_PROPAGATED_ENV_VARS)?.split(',').map(f => f.trim()) ?? [],
                DEV_PIECES: system.get(AppSystemProp.DEV_PIECES)?.split(',') ?? [],
                SENTRY_DSN: system.get(AppSystemProp.SENTRY_DSN),
                LOKI_PASSWORD: system.get(AppSystemProp.LOKI_PASSWORD),
                LOKI_URL: system.get(AppSystemProp.LOKI_URL),
                LOKI_USERNAME: system.get(AppSystemProp.LOKI_USERNAME),
                OTEL_ENABLED: system.get(AppSystemProp.OTEL_ENABLED) === 'true',
                PUBLIC_URL: await domainHelper.getPublicUrl({
                    path: '',
                }),
                PROJECT_RATE_LIMITER_ENABLED: isDedicatedWorker ? false : system.getBooleanOrThrow(AppSystemProp.PROJECT_RATE_LIMITER_ENABLED),
                MAX_CONCURRENT_JOBS_PER_PROJECT: system.getNumberOrThrow(AppSystemProp.MAX_CONCURRENT_JOBS_PER_PROJECT),
                FILE_STORAGE_LOCATION: system.getOrThrow(AppSystemProp.FILE_STORAGE_LOCATION),
                S3_USE_SIGNED_URLS: system.getOrThrow(AppSystemProp.S3_USE_SIGNED_URLS),
                REDIS_TYPE: redisConnections.getRedisType(),
                REDIS_SSL_CA_FILE: system.get(AppSystemProp.REDIS_SSL_CA_FILE),
                REDIS_DB: system.getNumber(AppSystemProp.REDIS_DB) ?? undefined,
                REDIS_HOST: system.get(AppSystemProp.REDIS_HOST),
                REDIS_PASSWORD: system.get(AppSystemProp.REDIS_PASSWORD),
                REDIS_PORT: system.get(AppSystemProp.REDIS_PORT),
                REDIS_URL: system.get(AppSystemProp.REDIS_URL),
                REDIS_USER: system.get(AppSystemProp.REDIS_USER),
                REDIS_USE_SSL: system.get(AppSystemProp.REDIS_USE_SSL) === 'true',
                REDIS_SENTINEL_ROLE: system.get(AppSystemProp.REDIS_SENTINEL_ROLE),
                REDIS_SENTINEL_HOSTS: system.get(AppSystemProp.REDIS_SENTINEL_HOSTS),
                REDIS_SENTINEL_NAME: system.get(AppSystemProp.REDIS_SENTINEL_NAME),
                REDIS_FAILED_JOB_RETENTION_DAYS: system.getNumberOrThrow(AppSystemProp.REDIS_FAILED_JOB_RETENTION_DAYS),
                REDIS_FAILED_JOB_RETENTION_MAX_COUNT: system.getNumberOrThrow(AppSystemProp.REDIS_FAILED_JOB_RETENTION_MAX_COUNT),
                EDITION: system.getOrThrow(AppSystemProp.EDITION),
            }
        },
        async list(): Promise<WorkerMachineWithStatus[]> {

            let allWorkers = await workerMachineCache().find()

            await Promise.all(allWorkers.map(async worker => {
                const settings = await websocketService.emitWithAck<WorkerMachineHealthcheckRequest[]>( WebsocketServerEvent.WORKER_HEALTHCHECK, worker.id)
                    .catch(error => {
                        log.error({
                            message: 'Failed to get worker healthcheck',
                            error,
                            workerId: worker.id,
                        })
                    })
                if (settings && settings[0]) {
                    await workerMachineCache().upsert({
                        id: worker.id,
                        information: settings[0],
                    })
                }
            }))

            allWorkers = await workerMachineCache().find()

            const offlineThreshold = dayjs().subtract(60, 'seconds').utc()

            const [onlineWorkers, offLineWorkers] = partition(allWorkers, (worker) => dayjs(worker.updated).isAfter(offlineThreshold))

            await workerMachineCache().delete(offLineWorkers.map(worker => worker.id))

            return onlineWorkers.map(worker => ({
                ...worker,
                status: WorkerMachineStatus.ONLINE,
            }))
        },
    }
}


async function getExecutionMode(log: FastifyBaseLogger, platformIdForDedicatedWorker: string | undefined): Promise<ExecutionMode> {
    const executionMode = system.getOrThrow<ExecutionMode>(AppSystemProp.EXECUTION_MODE)
    if (isNil(platformIdForDedicatedWorker)) {
        return executionMode
    }

    const dedicatedWorkerConfig = await dedicatedWorkers(log).getWorkerConfig(platformIdForDedicatedWorker)
    if (isNil(dedicatedWorkerConfig)) {
        return executionMode
    }
    if (dedicatedWorkerConfig.trustedEnvironment) {
        return ExecutionMode.SANDBOX_PROCESS
    }
    return ExecutionMode.SANDBOX_CODE_AND_PROCESS
}

type OnDisconnectParams = {
    workerId: string
}