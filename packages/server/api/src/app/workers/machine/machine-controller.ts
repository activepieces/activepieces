import { AppSystemProp, WorkerSystemProp } from '@activepieces/server-shared'
import { PrincipalType, WorkerMachineHealthcheckRequest, WorkerMachineHealthcheckResponse, WorkerPrincipal } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { platformMustBeOwnedByCurrentUser } from '../../ee/authentication/ee-authorization'
import { domainHelper } from '../../ee/custom-domains/domain-helper'
import { system } from '../../helper/system/system'
import { machineService } from './machine-service'

export const workerMachineController: FastifyPluginAsyncTypebox = async (app) => {

    app.get('/', ListWorkersParams, async (req, reply) => {
        await platformMustBeOwnedByCurrentUser.call(app, req, reply)
        return machineService.list()
    })

    app.post('/heartbeat', HeartbeatParams, async (request) => {
        const { cpuUsagePercentage, ramUsagePercentage, totalAvailableRamInBytes, diskInfo, ip, workerProps, workerId } = request.body
        const workerPrincipal = request.principal as unknown as WorkerPrincipal
        await machineService.upsert({
            cpuUsagePercentage,
            diskInfo,
            ramUsagePercentage,
            totalAvailableRamInBytes,
            ip,
            workerProps,
            workerId: workerId ?? workerPrincipal.id,
            workerPrincipal,
        })
        const response: WorkerMachineHealthcheckResponse = {
            TRIGGER_TIMEOUT_SECONDS: system.getNumberOrThrow(AppSystemProp.TRIGGER_TIMEOUT_SECONDS),
            PAUSED_FLOW_TIMEOUT_DAYS: system.getNumberOrThrow(AppSystemProp.PAUSED_FLOW_TIMEOUT_DAYS),
            EXECUTION_MODE: system.getOrThrow(AppSystemProp.EXECUTION_MODE),
            FLOW_TIMEOUT_SECONDS: system.getNumberOrThrow(AppSystemProp.FLOW_TIMEOUT_SECONDS),
            FLOW_WORKER_CONCURRENCY: system.getNumberOrThrow(WorkerSystemProp.FLOW_WORKER_CONCURRENCY),
            SCHEDULED_WORKER_CONCURRENCY: system.getNumberOrThrow(WorkerSystemProp.SCHEDULED_WORKER_CONCURRENCY),
            AGENTS_WORKER_CONCURRENCY: system.getNumberOrThrow(WorkerSystemProp.AGENTS_WORKER_CONCURRENCY),
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
            FILE_STORAGE_LOCATION: system.getOrThrow(AppSystemProp.FILE_STORAGE_LOCATION),
            S3_USE_SIGNED_URLS: system.getOrThrow(AppSystemProp.S3_USE_SIGNED_URLS),
            EDITION: system.getOrThrow(AppSystemProp.EDITION),
        }
        return response
    })
}

const HeartbeatParams = {
    config: {
        allowedPrincipals: [PrincipalType.WORKER],
    },
    schema: {
        body: WorkerMachineHealthcheckRequest,
    },
}


const ListWorkersParams = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
}
