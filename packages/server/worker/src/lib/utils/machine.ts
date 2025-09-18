import { exec } from 'child_process'
import fs from 'fs'
import os from 'os'
import { promisify } from 'util'
import { apVersionUtil, environmentVariables, exceptionHandler, fileExists, networkUtils, webhookSecretsUtils, WorkerSystemProp } from '@activepieces/server-shared'
import { apId, assertNotNullOrUndefined, isNil, MachineInformation, spreadIfDefined, WorkerMachineHealthcheckRequest, WorkerMachineHealthcheckResponse } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { engineProcessManager } from '../runner/process/engine-process-manager'

const execAsync = promisify(exec)

let settings: WorkerMachineHealthcheckResponse | undefined

const workerId = apId()

export const workerMachine = {
    getWorkerId: () => workerId,
    async getSystemInfo(): Promise<WorkerMachineHealthcheckRequest> {
        const { totalRamInBytes, ramUsage } = await getContainerMemoryUsage()
        const cpus = os.cpus()
        const cpuUsage = cpus.reduce((acc, cpu) => {
            const total = Object.values(cpu.times).reduce((acc, time) => acc + time, 0)
            const idle = cpu.times.idle
            return acc + (1 - idle / total)
        }, 0) / cpus.length * 100

        const ip = (await networkUtils.getPublicIp()).ip
        const diskInfo = await getDiskInfo()        

        return {
            diskInfo,
            cpuUsagePercentage: cpuUsage,
            ramUsagePercentage: ramUsage,
            totalAvailableRamInBytes: totalRamInBytes,
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
                ...spreadIfDefined('PIECES_SOURCE', settings?.PIECES_SOURCE),
                ...spreadIfDefined('DEV_PIECES', settings?.DEV_PIECES?.join(',')),
                ...spreadIfDefined('S3_USE_SIGNED_URLS', settings?.S3_USE_SIGNED_URLS),
                version: await apVersionUtil.getCurrentRelease(),
            },
            workerId,
            totalSandboxes: engineProcessManager.getTotalSandboxes(),
            freeSandboxes: engineProcessManager.getFreeSandboxes(),
        }
    },
    init: async (_settings: WorkerMachineHealthcheckResponse, log: FastifyBaseLogger) => {
        settings = {
            ..._settings,
            ...spreadIfDefined('WORKER_CONCURRENCY', environmentVariables.getNumberEnvironment(WorkerSystemProp.WORKER_CONCURRENCY)),
        }

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

async function getContainerMemoryUsage() {
    const memLimitPath = '/sys/fs/cgroup/memory/memory.limit_in_bytes'
    const memUsagePath = '/sys/fs/cgroup/memory/memory.usage_in_bytes'

    const memLimitExists = await fileExists(memLimitPath)
    const memUsageExists = await fileExists(memUsagePath)

    const totalRamInBytes = memLimitExists ? parseInt(await fs.promises.readFile(memLimitPath, 'utf8')) : os.totalmem()
    const usedRamInBytes = memUsageExists ? parseInt(await fs.promises.readFile(memUsagePath, 'utf8')) : os.totalmem() - os.freemem()

    return {
        totalRamInBytes,
        ramUsage: (usedRamInBytes / totalRamInBytes) * 100,
    }
}

async function getDiskInfo(): Promise<MachineInformation['diskInfo']> {
    const platform = os.platform()

    try {
        if (platform === 'win32') {
            const { stdout } = await execAsync('wmic logicaldisk get size,freespace,caption')
            const lines = stdout.trim().split('\n').slice(1)
            let total = 0, free = 0

            for (const line of lines) {
                const [, freeSpace, size] = line.trim().split(/\s+/)
                if (freeSpace && size) {
                    total += parseInt(size)
                    free += parseInt(freeSpace)
                }
            }

            const used = total - free
            return {
                total,
                free,
                used,
                percentage: (used / total) * 100,
            }
        }
        else {
            const { stdout } = await execAsync('df -k / | tail -1')
            const [, blocks, used, available] = stdout.trim().split(/\s+/)

            const totalBytes = parseInt(blocks) * 1024
            const usedBytes = parseInt(used) * 1024
            const freeBytes = parseInt(available) * 1024

            return {
                total: totalBytes,
                free: freeBytes,
                used: usedBytes,
                percentage: (usedBytes / totalBytes) * 100,
            }
        }
    }
    catch (error) {
        return {
            total: 0,
            free: 0,
            used: 0,
            percentage: 0,
        }
    }
}


function getEnvironmentVariables(): Record<string, string | undefined> {
    const allowedEnvVariables = workerMachine.getSettings().SANDBOX_PROPAGATED_ENV_VARS
    const propagatedEnvVars = Object.fromEntries(allowedEnvVariables.map((envVar) => [envVar, process.env[envVar]]))
    return {
        ...propagatedEnvVars,
        NODE_OPTIONS: '--enable-source-maps',
        AP_PAUSED_FLOW_TIMEOUT_DAYS: workerMachine.getSettings().PAUSED_FLOW_TIMEOUT_DAYS.toString(),
        AP_EXECUTION_MODE: workerMachine.getSettings().EXECUTION_MODE,
        AP_PIECES_SOURCE: workerMachine.getSettings().PIECES_SOURCE,
        AP_MAX_FILE_SIZE_MB: workerMachine.getSettings().MAX_FILE_SIZE_MB.toString(),
        AP_FILE_STORAGE_LOCATION: workerMachine.getSettings().FILE_STORAGE_LOCATION,
        AP_S3_USE_SIGNED_URLS: workerMachine.getSettings().S3_USE_SIGNED_URLS,
    }
}