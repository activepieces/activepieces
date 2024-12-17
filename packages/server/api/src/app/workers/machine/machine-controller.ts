import { PrincipalType, WorkerMachineHealthcheckRequest, WorkerMachineHealthcheckResponse, WorkerPrincipal } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { platformMustBeOwnedByCurrentUser } from '../../ee/authentication/ee-authorization'
import { machineService } from './machine-service'
import { system } from '../../helper/system/system'
import { AppSystemProp, WorkerSystemProps } from '../../helper/system/system-prop'

export const workerMachineController: FastifyPluginAsyncTypebox = async (app) => {

    app.get('/', ListWorkersParams, async (req, reply) => {
        await platformMustBeOwnedByCurrentUser.call(app, req, reply)
        return machineService.list()
    })



    app.post('/heartbeat', HeartbeatParams, async (request) => {
        const { cpuUsagePercentage, ramUsagePercentage, totalAvailableRamInBytes, diskInfo, ip, workerProps } = request.body
        const workerPrincipal = request.principal as unknown as WorkerPrincipal
        await machineService.upsert({
            cpuUsagePercentage,
            diskInfo,
            ramUsagePercentage,
            totalAvailableRamInBytes,
            ip,
            workerProps,
            workerPrincipal,
        })
        const response: WorkerMachineHealthcheckResponse = {
            TRIGGER_TIMEOUT_SECONDS: system.getNumberOrThrow(WorkerSystemProps.TRIGGER_TIMEOUT_SECONDS),
            PAUSED_FLOW_TIMEOUT_DAYS: system.getNumberOrThrow(WorkerSystemProps.PAUSED_FLOW_TIMEOUT_DAYS),
            EXECUTION_MODE: system.getOrThrow(WorkerSystemProps.EXECUTION_MODE),
            FLOW_TIMEOUT_SECONDS: system.getNumberOrThrow(WorkerSystemProps.FLOW_TIMEOUT_SECONDS),
            FLOW_WORKER_CONCURRENCY: system.getNumberOrThrow(WorkerSystemProps.FLOW_WORKER_CONCURRENCY),
            SCHEDULED_WORKER_CONCURRENCY: system.getNumberOrThrow(WorkerSystemProps.SCHEDULED_WORKER_CONCURRENCY),
            SCHEDULED_POLLING_COUNT: system.getNumberOrThrow(WorkerSystemProps.SCHEDULED_POLLING_COUNT),
            LOG_LEVEL: system.getOrThrow(WorkerSystemProps.LOG_LEVEL),
            LOG_PRETTY: system.getOrThrow(WorkerSystemProps.LOG_PRETTY),
            ENVIRONMENT: system.getOrThrow(WorkerSystemProps.ENVIRONMENT),
            APP_WEBHOOK_SECRETS: system.getOrThrow(WorkerSystemProps.APP_WEBHOOK_SECRETS),
            MAX_FILE_SIZE_MB: system.getNumberOrThrow(WorkerSystemProps.MAX_FILE_SIZE_MB),
            FRONTEND_URL: system.getOrThrow(WorkerSystemProps.FRONTEND_URL),
            SANDBOX_MEMORY_LIMIT: system.getOrThrow(WorkerSystemProps.SANDBOX_MEMORY_LIMIT),
            SANDBOX_PROPAGATED_ENV_VARS: system.getOrThrow(WorkerSystemProps.SANDBOX_PROPAGATED_ENV_VARS)?.split(',') ?? [],
            PIECES_SOURCE: system.getOrThrow(WorkerSystemProps.PIECES_SOURCE),
            DEV_PIECES: system.getOrThrow(AppSystemProp.DEV_PIECES)?.split(',') ?? [],
            SENTRY_DSN: system.getOrThrow(WorkerSystemProps.SENTRY_DSN),
            LOKI_PASSWORD: system.getOrThrow(WorkerSystemProps.LOKI_PASSWORD),
            LOKI_URL: system.getOrThrow(WorkerSystemProps.LOKI_URL),
            LOKI_USERNAME: system.getOrThrow(WorkerSystemProps.LOKI_USERNAME),
            FILE_STORAGE_LOCATION: system.getOrThrow(AppSystemProp.FILE_STORAGE_LOCATION),
            S3_USE_SIGNED_URLS: system.getOrThrow(AppSystemProp.S3_USE_SIGNED_URLS),
        }
        return response;
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

const SettingsParams = {
    config: {
        allowedPrincipals: [PrincipalType.WORKER],
    },
    schema: {},
}

const ListWorkersParams = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
}
