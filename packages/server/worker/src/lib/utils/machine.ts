import { apVersionUtil, environmentVariables, exceptionHandler, networkUtils, systemUsage, webhookSecretsUtils, WorkerSystemProp } from '@activepieces/server-shared'
import { apId, assertNotNullOrUndefined, isNil, spreadIfDefined, WorkerMachineHealthcheckRequest, WorkerSettingsResponse } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { engineProcessManager } from '../compute/process/engine-process-manager'

let settings: WorkerSettingsResponse | undefined
let workerToken: string | undefined
const workerId = apId()

export const workerMachine = {
    getWorkerId: () => workerId,
    getWorkerToken: () => {
        assertNotNullOrUndefined(workerToken, 'Worker token is not set')
        return workerToken
    },
    async getSystemInfo(): Promise<WorkerMachineHealthcheckRequest> {
        const { totalRamInBytes, ramUsage } = await systemUsage.getContainerMemoryUsage()
        const cpuUsage = systemUsage.getCpuUsage()
        const ip = (await networkUtils.getPublicIp()).ip
        const diskInfo = await systemUsage.getDiskInfo()
        const cpuCores = await systemUsage.getCpuCores()

        return {
            diskInfo,
            cpuUsagePercentage: cpuUsage,
            ramUsagePercentage: ramUsage,
            totalAvailableRamInBytes: totalRamInBytes,
            totalCpuCores: cpuCores,
            ip,
            workerProps: {
                ...spreadIfDefined('SANDBOX_PROPAGATED_ENV_VARS', settings?.SANDBOX_PROPAGATED_ENV_VARS?.join(',')),
                ...spreadIfDefined('EXECUTION_MODE', settings?.EXECUTION_MODE),
                ...spreadIfDefined('FILE_STORAGE_LOCATION', settings?.FILE_STORAGE_LOCATION),
                ...spreadIfDefined('WORKER_CONCURRENCY', settings?.WORKER_CONCURRENCY?.toString()),
                ...spreadIfDefined('TRIGGER_TIMEOUT_SECONDS', settings?.TRIGGER_TIMEOUT_SECONDS?.toString()),
                ...spreadIfDefined('PAUSED_FLOW_TIMEOUT_DAYS', settings?.PAUSED_FLOW_TIMEOUT_DAYS?.toString()),
                ...spreadIfDefined('FLOW_TIMEOUT_SECONDS', settings?.FLOW_TIMEOUT_SECONDS?.toString()),
                ...spreadIfDefined('LOG_LEVEL', settings?.LOG_LEVEL),
                ...spreadIfDefined('LOG_PRETTY', settings?.LOG_PRETTY),
                ...spreadIfDefined('ENVIRONMENT', settings?.ENVIRONMENT),
                ...spreadIfDefined('MAX_FILE_SIZE_MB', settings?.MAX_FILE_SIZE_MB?.toString()),
                ...spreadIfDefined('SANDBOX_MEMORY_LIMIT', settings?.SANDBOX_MEMORY_LIMIT),
                ...spreadIfDefined('DEV_PIECES', settings?.DEV_PIECES?.join(',')),
                ...spreadIfDefined('S3_USE_SIGNED_URLS', settings?.S3_USE_SIGNED_URLS),
                ...spreadIfDefined('PLATFORM_ID_FOR_DEDICATED_WORKER', settings?.PLATFORM_ID_FOR_DEDICATED_WORKER),
                version: await apVersionUtil.getCurrentRelease(),
            },
            workerId,
            totalSandboxes: engineProcessManager.getTotalSandboxes(),
            freeSandboxes: engineProcessManager.getFreeSandboxes(),
        }
    },
    isDedicatedWorker: () => {
        return !isNil(workerMachine.getSettings().PLATFORM_ID_FOR_DEDICATED_WORKER)
    },
    init: async (_settings: WorkerSettingsResponse, _workerToken: string, log: FastifyBaseLogger) => {
        settings = {
            ..._settings,
            ...spreadIfDefined('WORKER_CONCURRENCY', environmentVariables.getNumberEnvironment(WorkerSystemProp.WORKER_CONCURRENCY)),
            ...spreadIfDefined('PLATFORM_ID_FOR_DEDICATED_WORKER', environmentVariables.getEnvironment(WorkerSystemProp.PLATFORM_ID_FOR_DEDICATED_WORKER)),
        }

        workerToken = _workerToken

        const memoryLimit = Math.floor(Number(settings.SANDBOX_MEMORY_LIMIT) / 1024)
        await webhookSecretsUtils.init(settings.APP_WEBHOOK_SECRETS)
        engineProcessManager.init(settings.WORKER_CONCURRENCY, {
            env: getEnvironmentVariables(),
            resourceLimits: {
                maxOldGenerationSizeMb: memoryLimit,
                maxYoungGenerationSizeMb: memoryLimit,
                stackSizeMb: memoryLimit,
            },
            execArgv: [],
        }, log)
        exceptionHandler.initializeSentry(settings.SENTRY_DSN)
    },
    hasSettings: () => {
        return !isNil(settings)
    },
    getSettings: () => {
        assertNotNullOrUndefined(settings, 'Settings are not set')
        return settings
    },
    getSettingOrThrow: (prop: keyof WorkerSettingsResponse) => {
        assertNotNullOrUndefined(settings, 'Settings are not set')
        return settings[prop]
    },
    getInternalApiUrl: (): string => {
        if (environmentVariables.hasAppModules()) {
            return 'http://127.0.0.1:3000/'
        }
        const url = environmentVariables.getEnvironmentOrThrow(WorkerSystemProp.FRONTEND_URL)
        return appendSlashAndApi(replaceLocalhost(url))
    },
    getSocketUrlAndPath: (): { url: string, path: string } => {
        if (environmentVariables.hasAppModules()) {
            return {
                url: 'http://127.0.0.1:3000/',
                path: '/socket.io',
            }
        }
        const url = environmentVariables.getEnvironmentOrThrow(WorkerSystemProp.FRONTEND_URL)
        return {
            url: removeTrailingSlash(replaceLocalhost(url)),
            path: '/api/socket.io',
        }
    },
    getPublicApiUrl: (): string => {
        return appendSlashAndApi(replaceLocalhost(getPublicUrl()))
    },
    getPlatformIdForDedicatedWorker: (): string | undefined => {
        return environmentVariables.getEnvironment(WorkerSystemProp.PLATFORM_ID_FOR_DEDICATED_WORKER)
    },
    preWarmCacheEnabled: () => {
        const enabledVar = environmentVariables.getEnvironment(WorkerSystemProp.PRE_WARM_CACHE)
        return isNil(enabledVar) || environmentVariables.getEnvironment(WorkerSystemProp.PRE_WARM_CACHE) === 'true'
    },
}

function getPublicUrl(): string {
    if (isNil(settings)) {
        const url = environmentVariables.getEnvironmentOrThrow(WorkerSystemProp.FRONTEND_URL)
        return url
    }
    return settings.PUBLIC_URL
}

function replaceLocalhost(urlString: string): string {
    const url = new URL(urlString)
    if (url.hostname === 'localhost') {
        url.hostname = '127.0.0.1'
    }
    return url.toString()
}

function removeTrailingSlash(url: string): string {
    return url.replace(/\/$/, '')
}

function appendSlashAndApi(url: string): string {
    const slash = url.endsWith('/') ? '' : '/'
    return `${url}${slash}api/`
}

function getEnvironmentVariables(): Record<string, string | undefined> {
    const allowedEnvVariables = workerMachine.getSettings().SANDBOX_PROPAGATED_ENV_VARS
    const propagatedEnvVars = Object.fromEntries(allowedEnvVariables.map((envVar) => [envVar, process.env[envVar]]))
    return {
        ...propagatedEnvVars,
        NODE_OPTIONS: '--enable-source-maps',
        AP_PAUSED_FLOW_TIMEOUT_DAYS: workerMachine.getSettings().PAUSED_FLOW_TIMEOUT_DAYS.toString(),
        AP_EXECUTION_MODE: workerMachine.getSettings().EXECUTION_MODE,
        AP_DEV_PIECES: workerMachine.getSettings().DEV_PIECES.join(','),
        AP_MAX_FILE_SIZE_MB: workerMachine.getSettings().MAX_FILE_SIZE_MB.toString(),
        AP_FILE_STORAGE_LOCATION: workerMachine.getSettings().FILE_STORAGE_LOCATION,
        AP_S3_USE_SIGNED_URLS: workerMachine.getSettings().S3_USE_SIGNED_URLS,
    }
}