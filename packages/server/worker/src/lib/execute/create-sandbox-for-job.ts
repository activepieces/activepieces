import { ExecutionMode, WorkerContract, WorkerToApiContract } from '@activepieces/shared'
import { nanoid } from 'nanoid'
import { Logger } from 'pino'
import { ENGINE_PATH, GLOBAL_CACHE_COMMON_PATH, GLOBAL_CODE_CACHE_PATH } from '../cache/cache-paths'
import { workerSettings } from '../config/worker-settings'
import { simpleProcess } from '../sandbox/fork'
import { isolateProcess } from '../sandbox/isolate'
import { createSandbox } from '../sandbox/sandbox'
import { Sandbox, SandboxMount } from '../sandbox/types'

export function createSandboxForJob(params: {
    log: Logger
    apiClient: WorkerToApiContract
}): Sandbox {
    const { log, apiClient } = params
    const settings = workerSettings.getSettings()
    const sandboxId = nanoid()

    const workerHandlers: WorkerContract = {
        updateRunProgress: (input) => apiClient.updateRunProgress(input),
        uploadRunLog: (input) => apiClient.uploadRunLog(input),
        sendFlowResponse: (input) => apiClient.sendFlowResponse(input),
        updateStepProgress: (input) => apiClient.updateStepProgress(input),
    }

    const memoryLimitMb = parseMemoryLimit(settings.SANDBOX_MEMORY_LIMIT)
    const processMaker = getProcessMaker(settings.EXECUTION_MODE, log)

    const _mounts: SandboxMount[] = [
        { hostPath: GLOBAL_CACHE_COMMON_PATH, sandboxPath: '/root/common' },
        { hostPath: GLOBAL_CODE_CACHE_PATH, sandboxPath: '/root/codes', optional: true },
    ]

    return createSandbox(
        log,
        sandboxId,
        {
            env: buildSandboxEnv(settings),
            memoryLimitMb,
            cpuMsPerSec: 1000,
            timeLimitSeconds: settings.FLOW_TIMEOUT_SECONDS,
            reusable: false,
        },
        processMaker,
        workerHandlers,
    )
}

function getProcessMaker(executionMode: string, log: Logger) {
    switch (executionMode) {
        case ExecutionMode.SANDBOX_PROCESS:
        case ExecutionMode.SANDBOX_CODE_AND_PROCESS:
            return isolateProcess(log)
        case ExecutionMode.UNSANDBOXED:
        case ExecutionMode.SANDBOX_CODE_ONLY:
        default:
            return simpleProcess(ENGINE_PATH, GLOBAL_CODE_CACHE_PATH)
    }
}

function parseMemoryLimit(memoryLimit: string): number {
    const parsed = parseInt(memoryLimit, 10)
    return isNaN(parsed) ? 256 : parsed
}

function buildSandboxEnv(settings: ReturnType<typeof workerSettings.getSettings>): Record<string, string> {
    const env: Record<string, string> = {
        AP_EXECUTION_MODE: settings.EXECUTION_MODE,
    }
    for (const key of settings.SANDBOX_PROPAGATED_ENV_VARS) {
        if (process.env[key]) {
            env[key] = process.env[key]!
        }
    }
    return env
}
