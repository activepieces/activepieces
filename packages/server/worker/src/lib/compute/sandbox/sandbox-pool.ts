import { ApEnvironment, ExecutionMode, isNil } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { nanoid } from 'nanoid'
import { workerMachine } from '../../utils/machine'
import { createSandbox, Sandbox } from './sandbox'

const sandboxes: Map<string, Sandbox> = new Map()
let sandboxQueue: string[] = []
let workerConcurrency: number
let sandboxMemoryLimit: number
let reusable = false

export const sandboxPool = {
    getTotalSandboxes: () => {
        return workerConcurrency - sandboxQueue.length
    },
    getFreeSandboxes: () => {
        return sandboxQueue.length
    },
    init: (_log: FastifyBaseLogger) => {
        workerConcurrency = workerMachine.getSettings().WORKER_CONCURRENCY
        sandboxMemoryLimit = Math.floor(parseInt(workerMachine.getSettings().SANDBOX_MEMORY_LIMIT) / 1024)
        reusable = canReuseWorkers()
        sandboxQueue = Array.from({ length: workerConcurrency }, () => nanoid())
    },
    allocate: (log: FastifyBaseLogger): Sandbox => {
        const sandboxId = sandboxQueue.shift()
        if (!sandboxId) {
            throw new Error('No sandbox available')
        }
        const existingSandbox = sandboxes.get(sandboxId)
        if (!isNil(existingSandbox)) {
            return existingSandbox
        }
        const workerSettings = workerMachine.getSettings()
        const allowedEnvVariables = workerSettings.SANDBOX_PROPAGATED_ENV_VARS
        const propagatedEnvVars = Object.fromEntries(allowedEnvVariables.map((envVar) => [envVar, process.env[envVar]]))
        const newSandbox = createSandbox(log, sandboxId, {
            env: {
                ...propagatedEnvVars,
                NODE_OPTIONS: '--enable-source-maps',
                AP_PAUSED_FLOW_TIMEOUT_DAYS: workerSettings.PAUSED_FLOW_TIMEOUT_DAYS.toString(),
                AP_EXECUTION_MODE: workerSettings.EXECUTION_MODE,
                AP_DEV_PIECES: workerSettings.DEV_PIECES.join(','),
                AP_MAX_FILE_SIZE_MB: workerSettings.MAX_FILE_SIZE_MB.toString(),
                AP_MAX_FLOW_RUN_LOG_SIZE_MB: workerSettings.MAX_FLOW_RUN_LOG_SIZE_MB.toString(),
                AP_FILE_STORAGE_LOCATION: workerSettings.FILE_STORAGE_LOCATION,
                AP_S3_USE_SIGNED_URLS: workerSettings.S3_USE_SIGNED_URLS,
            },
            memoryLimitMb: sandboxMemoryLimit,
            reusable,
        })
        sandboxes.set(sandboxId, newSandbox)
        return newSandbox
    },
    release: async (sandbox: Sandbox | undefined) => {
        if (isNil(sandbox)) {
            return
        }
        if (!reusable) {
            await sandbox.shutdown()
            sandboxes.delete(sandbox.id)
        }
        sandboxQueue.push(sandbox.id)
    },
    drain: async () => {
        for (const sandbox of sandboxes.values()) {
            await sandbox.shutdown()
        }
        sandboxes.clear()
    },
}

function canReuseWorkers(): boolean {
    const settings = workerMachine.getSettings()

    if (settings.ENVIRONMENT === ApEnvironment.DEVELOPMENT) {
        return true
    }
    const trustedModes = [ExecutionMode.SANDBOX_CODE_ONLY, ExecutionMode.UNSANDBOXED]
    if (trustedModes.includes(settings.EXECUTION_MODE as ExecutionMode)) {
        return true
    }
    if (workerMachine.isDedicatedWorker()) {
        return true
    }
    return false
}
