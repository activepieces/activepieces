import { AppSystemProp, WorkerSystemProp } from '@activepieces/server-shared'
import {
    MachineInformation,
    WorkerMachineStatus,
    WorkerMachineWithStatus,
    WorkerSettingsResponse,
} from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { Socket } from 'socket.io'
import { In } from 'typeorm'
import { repoFactory } from '../../core/db/repo-factory'
import { redisConnections } from '../../database/redis-connections'
import { domainHelper } from '../../ee/custom-domains/domain-helper'
import { jwtUtils } from '../../helper/jwt-utils'
import { system } from '../../helper/system/system'
import { WorkerMachineEntity } from './machine-entity'

const workerRepo = repoFactory(WorkerMachineEntity)

export const machineService = (_log: FastifyBaseLogger) => {
    return {
        async onDisconnect(request: OnDisconnectParams): Promise<void> {
            system.globalLogger().info({
                message: 'Worker disconnected',
                workerId: request.workerId,
            })
            await workerRepo().delete({ id: request.workerId })
        },
        async onConnection(): Promise<WorkerSettingsResponse> {
            return  {
                JWT_SECRET: await jwtUtils.getJwtSecret(),
                TRIGGER_TIMEOUT_SECONDS: system.getNumberOrThrow(AppSystemProp.TRIGGER_TIMEOUT_SECONDS),
                PAUSED_FLOW_TIMEOUT_DAYS: system.getNumberOrThrow(AppSystemProp.PAUSED_FLOW_TIMEOUT_DAYS),
                EXECUTION_MODE: system.getOrThrow(AppSystemProp.EXECUTION_MODE),
                TRIGGER_HOOKS_TIMEOUT_SECONDS: system.getNumberOrThrow(AppSystemProp.TRIGGER_HOOKS_TIMEOUT_SECONDS),
                AGENT_TIMEOUT_SECONDS: system.getNumberOrThrow(AppSystemProp.AGENT_TIMEOUT_SECONDS),
                FLOW_TIMEOUT_SECONDS: system.getNumberOrThrow(AppSystemProp.FLOW_TIMEOUT_SECONDS),
                WORKER_CONCURRENCY: system.getNumberOrThrow(WorkerSystemProp.WORKER_CONCURRENCY),
                LOG_LEVEL: system.getOrThrow(AppSystemProp.LOG_LEVEL),
                LOG_PRETTY: system.getOrThrow(AppSystemProp.LOG_PRETTY),
                ENVIRONMENT: system.getOrThrow(AppSystemProp.ENVIRONMENT),
                APP_WEBHOOK_SECRETS: system.getOrThrow(AppSystemProp.APP_WEBHOOK_SECRETS),
                MAX_FILE_SIZE_MB: system.getNumberOrThrow(AppSystemProp.MAX_FILE_SIZE_MB),
                SANDBOX_MEMORY_LIMIT: system.getOrThrow(AppSystemProp.SANDBOX_MEMORY_LIMIT),
                SANDBOX_PROPAGATED_ENV_VARS: system.get(AppSystemProp.SANDBOX_PROPAGATED_ENV_VARS)?.split(',').map(f => f.trim()) ?? [],
                PIECES_SOURCE: system.getOrThrow(AppSystemProp.PIECES_SOURCE),
                DEV_PIECES: system.get(AppSystemProp.DEV_PIECES)?.split(',') ?? [],
                SENTRY_DSN: system.get(AppSystemProp.SENTRY_DSN),
                LOKI_PASSWORD: system.get(AppSystemProp.LOKI_PASSWORD),
                LOKI_URL: system.get(AppSystemProp.LOKI_URL),
                LOKI_USERNAME: system.get(AppSystemProp.LOKI_USERNAME),
                OTEL_ENABLED: system.get(AppSystemProp.OTEL_ENABLED) === 'true',
                PUBLIC_URL: await domainHelper.getPublicUrl({
                    path: '',
                }),
                PROJECT_RATE_LIMITER_ENABLED: system.getBooleanOrThrow(AppSystemProp.PROJECT_RATE_LIMITER_ENABLED),
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
            }
        },
        async onHeartbeat({
            workerId,
            totalSandboxes,
            diskInfo,
            cpuUsagePercentage,
            ramUsagePercentage,
            totalAvailableRamInBytes,
            workerProps,
            ip,
            freeSandboxes,
        }: OnHeartbeatParams): Promise<void> {
            await workerRepo().upsert({
                information: {
                    diskInfo,
                    cpuUsagePercentage,
                    ramUsagePercentage,
                    totalAvailableRamInBytes,
                    workerProps,
                    ip,
                    totalSandboxes,
                    freeSandboxes,
                },
                updated: dayjs().toISOString(),
                id: workerId,
            }, ['id'])
        },
        async list(): Promise<WorkerMachineWithStatus[]> {
            const allWorkers = await workerRepo().find()
            const offlineThreshold = dayjs().subtract(60, 'seconds').utc()

            const workersToDelete = allWorkers.filter(worker => dayjs(worker.updated).isBefore(offlineThreshold))

            if (workersToDelete.length > 0) {
                await workerRepo().delete({
                    id: In(workersToDelete.map(worker => worker.id)),
                })
            }

            const onlineWorkers = allWorkers.filter(worker => dayjs(worker.updated).isAfter(offlineThreshold))
            return onlineWorkers.map(worker => ({
                ...worker,
                status: WorkerMachineStatus.ONLINE,
            }))
        },
    }
}

type OnDisconnectParams = {
    workerId: string
}

type OnHeartbeatParams = {
    socket: Socket
    workerId: string
    cpuUsagePercentage: number
    diskInfo: MachineInformation['diskInfo']
    ramUsagePercentage: number
    totalAvailableRamInBytes: number
    ip: string
    totalSandboxes: number
    freeSandboxes: number
    workerProps: Record<string, string>
}