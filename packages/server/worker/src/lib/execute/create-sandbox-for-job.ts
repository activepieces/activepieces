import { ExecutionMode, WorkerContract, WorkerToApiContract } from '@activepieces/shared'
import { nanoid } from 'nanoid'
import { Logger } from 'pino'
import { getEnginePath, getGlobalCacheCommonPath, getGlobalCodeCachePath } from '../cache/cache-paths'
import { workerSettings } from '../config/worker-settings'
import { simpleProcess } from '../sandbox/fork'
import { isolateProcess } from '../sandbox/isolate'
import { createSandbox } from '../sandbox/sandbox'
import { Sandbox, SandboxMount } from '../sandbox/types'

export function createSandboxForJob(params: {
    log: Logger
    apiClient: WorkerToApiContract
    boxId: number
}): Sandbox {
    const { log, apiClient, boxId } = params
    const settings = workerSettings.getSettings()
    const sandboxId = nanoid()

    const workerHandlers: WorkerContract = {
        updateRunProgress: (input) => apiClient.updateRunProgress(input),
        uploadRunLog: (input) => apiClient.uploadRunLog(input),
        sendFlowResponse: (input) => apiClient.sendFlowResponse(input),
        updateStepProgress: (input) => apiClient.updateStepProgress(input),
    }

    const memoryLimitMb = parseMemoryLimit(settings.SANDBOX_MEMORY_LIMIT)
    const processMaker = getProcessMaker(settings.EXECUTION_MODE, log, boxId)

    const baseMounts: SandboxMount[] = [
        { hostPath: getGlobalCacheCommonPath(), sandboxPath: '/root/common' },
        { hostPath: getGlobalCodeCachePath(), sandboxPath: '/root/codes', optional: true },
    ]

    return createSandbox(
        log,
        sandboxId,
        {
            env: buildSandboxEnv(settings),
            memoryLimitMb,
            cpuMsPerSec: 1000,
            timeLimitSeconds: settings.FLOW_TIMEOUT_SECONDS,
            baseMounts,
        },
        processMaker,
        workerHandlers,
    )
}

function getProcessMaker(executionMode: string, log: Logger, boxId: number) {
    switch (executionMode) {
        case ExecutionMode.SANDBOX_PROCESS:
        case ExecutionMode.SANDBOX_CODE_AND_PROCESS:
            return isolateProcess(log, getEnginePath(), getGlobalCodeCachePath(), boxId)
        case ExecutionMode.UNSANDBOXED:
        case ExecutionMode.SANDBOX_CODE_ONLY:
        default:
            return simpleProcess(getEnginePath(), getGlobalCodeCachePath())
    }
}

function parseMemoryLimit(memoryLimit: string): number {
    const parsed = parseInt(memoryLimit, 10)
    return isNaN(parsed) ? 256 : parsed
}

function buildSandboxEnv(settings: ReturnType<typeof workerSettings.getSettings>): Record<string, string> {
    const env: Record<string, string> = {
        HOME: '/tmp/',
        AP_EXECUTION_MODE: settings.EXECUTION_MODE,
        AP_MAX_FLOW_RUN_LOG_SIZE_MB: String(settings.MAX_FLOW_RUN_LOG_SIZE_MB),
        AP_MAX_FILE_SIZE_MB: String(settings.MAX_FILE_SIZE_MB),
        NODE_PATH: '/usr/src/node_modules',
        AP_SSRF_PROTECTION_ENABLED: settings.SSRF_PROTECTION_ENABLED === true ? 'true' : 'false',
    }
    if (settings.DEV_PIECES.length > 0) {
        env['AP_DEV_PIECES'] = settings.DEV_PIECES.join(',')
    }
    if (settings.SSRF_ALLOW_LIST.length > 0) {
        env['AP_SSRF_ALLOW_LIST'] = settings.SSRF_ALLOW_LIST.join(',')
    }

    for (const key of settings.SANDBOX_PROPAGATED_ENV_VARS) {
        if (process.env[key]) {
            env[key] = process.env[key]!
        }
    }
    return env
}
