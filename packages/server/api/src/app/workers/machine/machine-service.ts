import {
    ExecutionMode,
    isNil,
    NetworkMode,
    partition,
    WorkerMachineHealthcheckRequest,
    WorkerMachineStatus,
    WorkerMachineType,
    WorkerMachineWithStatus,
    WorkerSettingsResponse,
} from '@activepieces/shared'

import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { FastifyBaseLogger } from 'fastify'
import { domainHelper } from '../../ee/custom-domains/domain-helper'
import { workerGroupService } from '../../ee/platform/platform-plan/worker-group.service'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { workerMachineCache } from './machine-cache'

dayjs.extend(utc)

const settingsCache = new Map<string, WorkerSettingsResponse>()

async function buildSettingsResponse(_log: FastifyBaseLogger): Promise<WorkerSettingsResponse> {
    const cacheKey = '__shared__'
    const cached = settingsCache.get(cacheKey)
    if (cached) {
        return cached
    }
    const executionMode = system.getOrThrow<ExecutionMode>(AppSystemProp.EXECUTION_MODE)
    const settings = {
        TRIGGER_TIMEOUT_SECONDS: system.getNumberOrThrow(AppSystemProp.TRIGGER_TIMEOUT_SECONDS),
        PAUSED_FLOW_TIMEOUT_DAYS: system.getNumberOrThrow(AppSystemProp.PAUSED_FLOW_TIMEOUT_DAYS),
        EXECUTION_MODE: executionMode,
        TRIGGER_HOOKS_TIMEOUT_SECONDS: system.getNumberOrThrow(AppSystemProp.TRIGGER_HOOKS_TIMEOUT_SECONDS),
        FLOW_TIMEOUT_SECONDS: system.getNumberOrThrow(AppSystemProp.FLOW_TIMEOUT_SECONDS),
        LOG_LEVEL: system.getOrThrow(AppSystemProp.LOG_LEVEL),
        LOG_PRETTY: system.getOrThrow(AppSystemProp.LOG_PRETTY),
        ENVIRONMENT: system.getOrThrow(AppSystemProp.ENVIRONMENT),
        APP_WEBHOOK_SECRETS: system.getOrThrow(AppSystemProp.APP_WEBHOOK_SECRETS),
        MAX_FLOW_RUN_LOG_SIZE_MB: system.getNumberOrThrow(AppSystemProp.MAX_FLOW_RUN_LOG_SIZE_MB),
        MAX_FILE_SIZE_MB: system.getNumberOrThrow(AppSystemProp.MAX_FILE_SIZE_MB),
        SANDBOX_MEMORY_LIMIT: system.getOrThrow(AppSystemProp.SANDBOX_MEMORY_LIMIT),
        SANDBOX_PROPAGATED_ENV_VARS: system.get(AppSystemProp.SANDBOX_PROPAGATED_ENV_VARS)?.split(',').map(f => f.trim()) ?? [],
        DEV_PIECES: system.get(AppSystemProp.DEV_PIECES)?.split(',') ?? [],
        SENTRY_DSN: system.get(AppSystemProp.SENTRY_DSN),
        LOKI_PASSWORD: system.get(AppSystemProp.LOKI_PASSWORD),
        LOKI_URL: system.get(AppSystemProp.LOKI_URL),
        LOKI_USERNAME: system.get(AppSystemProp.LOKI_USERNAME),
        BETTERSTACK_HOST: system.get(AppSystemProp.BETTERSTACK_HOST),
        BETTERSTACK_TOKEN: system.get(AppSystemProp.BETTERSTACK_TOKEN),
        OTEL_ENABLED: system.get(AppSystemProp.OTEL_ENABLED) === 'true',
        PUBLIC_URL: await domainHelper.getPublicUrl({
            path: '',
        }),
        FILE_STORAGE_LOCATION: system.getOrThrow(AppSystemProp.FILE_STORAGE_LOCATION),
        S3_USE_SIGNED_URLS: system.getOrThrow(AppSystemProp.S3_USE_SIGNED_URLS),
        EVENT_DESTINATION_TIMEOUT_SECONDS: system.getNumberOrThrow(AppSystemProp.EVENT_DESTINATION_TIMEOUT_SECONDS),
        EDITION: system.getOrThrow(AppSystemProp.EDITION),
        SSRF_ALLOW_LIST: system.get(AppSystemProp.SSRF_ALLOW_LIST)?.split(',').map(f => f.trim()) ?? [],
        NETWORK_MODE: system.getOrThrow<NetworkMode>(AppSystemProp.NETWORK_MODE),
        PAGE_ONCALL_WEBHOOK: system.get(AppSystemProp.PAGE_ONCALL_WEBHOOK),
    }
    settingsCache.set(cacheKey, settings)
    return settings
}

export const machineService = (log: FastifyBaseLogger) => {
    return {
        async onDisconnect(request: OnDisconnectParams): Promise<void> {
            log.info({
                message: 'Worker disconnected',
                workerId: request.workerId,
            })
            await workerMachineCache().delete([request.workerId])
        },
        async onConnection(request: WorkerMachineHealthcheckRequest, workerGroupId?: string | undefined): Promise<WorkerSettingsResponse> {
            const existingWorker = await workerMachineCache().findOne(request.workerId)

            const type = isNil(workerGroupId) ? 'SHARED' : 'DEDICATED'
            await workerMachineCache().upsert({
                id: request.workerId,
                information: request,
                type,
                workerGroupId,
            }, existingWorker)
            return buildSettingsResponse(log)
        },
        async list(platformId: string): Promise<WorkerMachineWithStatus[]> {
            const allWorkers = await workerMachineCache().find()

            const offlineThreshold = dayjs().subtract(60, 'seconds').utc()

            const [onlineWorkers, offLineWorkers] = partition(allWorkers, (worker) => dayjs(worker.updated).isAfter(offlineThreshold))

            await workerMachineCache().delete(offLineWorkers.map(worker => worker.id))

            const platformWorkerGroupId = await workerGroupService(log).getWorkerGroupId({ platformId })
            return onlineWorkers
                .filter(worker => {
                    if (worker.type === WorkerMachineType.DEDICATED) {
                        return !isNil(platformWorkerGroupId) && worker.workerGroupId === platformWorkerGroupId
                    }
                    return isNil(platformWorkerGroupId)
                })
                .map(worker => ({
                    ...worker,
                    status: WorkerMachineStatus.ONLINE,
                    type: worker.type === 'DEDICATED' ? WorkerMachineType.DEDICATED : WorkerMachineType.SHARED,
                    workerGroupId: worker.workerGroupId,
                }))
        },
    }
}

type OnDisconnectParams = {
    workerId: string
}
