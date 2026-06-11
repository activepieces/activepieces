import { ExecutionMode, maxSocketHttpBufferSizeBytes, NetworkMode, WorkerContract, WorkerToApiContract } from '@activepieces/shared'
import { nanoid } from 'nanoid'
import { Logger } from 'pino'
import { aiExecutionService } from '../ai/ai-execution-service'
import { getEnginePath, getGlobalCacheCommonPath, getGlobalCodeCachePath } from '../cache/cache-paths'
import { workerSettings } from '../config/worker-settings'
import { sandboxCapacity } from '../sandbox/capacity'
import { simpleProcess } from '../sandbox/fork'
import { isolateProcess } from '../sandbox/isolate'
import { createSandbox } from '../sandbox/sandbox'
import { ExecutionDeadlineRef, Sandbox, SandboxMount } from '../sandbox/types'

export function createSandboxForJob(params: {
    log: Logger
    apiClient: WorkerToApiContract
    boxId: number
    reusable: boolean
    proxyPort: number | null
}): Sandbox {
    const { log, apiClient, boxId, reusable, proxyPort } = params
    const settings = workerSettings.getSettings()
    const sandboxId = nanoid()

    const executionDeadline: ExecutionDeadlineRef = { epochMs: null }
    const aiService = aiExecutionService({ log, apiClient, executionDeadline })
    const workerHandlers: WorkerContract = {
        updateRunProgress: (input) => apiClient.updateRunProgress(input),
        uploadRunLog: (input) => apiClient.uploadRunLog(input),
        sendFlowResponse: (input) => apiClient.sendFlowResponse(input),
        updateStepProgress: (input) => apiClient.updateStepProgress(input),
        executeAi: (input) => aiService.executeAi(input),
        runAgent: (input) => aiService.runAgent(input),
        continueAgent: (input) => aiService.continueAgent(input),
    }

    const memoryLimitMb = parseMemoryLimit(settings.SANDBOX_MEMORY_LIMIT)
    const processMaker = getProcessMaker(settings.EXECUTION_MODE, log, boxId)

    const baseMounts: SandboxMount[] = [
        { hostPath: getGlobalCacheCommonPath(), sandboxPath: '/root/common' },
    ]

    const executionMode = settings.EXECUTION_MODE as ExecutionMode

    return createSandbox(
        log,
        sandboxId,
        {
            env: buildSandboxEnv({ settings, proxyPort }),
            memoryLimitMb,
            cpuMsPerSec: 1000,
            timeLimitSeconds: settings.FLOW_TIMEOUT_SECONDS,
            reusable,
            maxHttpBufferSizeBytes: maxSocketHttpBufferSizeBytes(settings.MAX_FILE_SIZE_MB),
            baseMounts,
            wsRpcPort: isIsolateMode(executionMode) ? sandboxCapacity.wsRpcPortForBox(boxId) : undefined,
        },
        processMaker,
        workerHandlers,
        executionDeadline,
        () => aiService.disposeAllSessions(),
    )
}

export function isIsolateMode(mode: ExecutionMode): boolean {
    return mode === ExecutionMode.SANDBOX_PROCESS || mode === ExecutionMode.SANDBOX_CODE_AND_PROCESS
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

function parseMemoryLimit(memoryLimitKb: string): number {
    const parsed = parseInt(memoryLimitKb, 10)
    const kb = isNaN(parsed) ? 1048576 : parsed
    return Math.floor(kb / 1024)
}

function buildSandboxEnv({ settings, proxyPort }: {
    settings: WorkerSettings
    proxyPort: number | null
}): Record<string, string> {
    // `proxyPort` reflects what the egress stack actually started at worker boot:
    // non-null means the proxy is listening AND the iptables UID-owner REJECT chain is
    // armed. `settings.NETWORK_MODE` is refreshed on every socket reconnect, so reading
    // it here can drift away from the firewall the worker already armed. If the
    // platform flips STRICT → UNRESTRICTED at reconnect, reading the live setting would
    // drop AP_EGRESS_PROXY_URL from the sandbox env while iptables stays in place —
    // user fetches then fall back to direct connect, hit the REJECT chain, and surface
    // EHOSTUNREACH / "fetch failed". Keying the entire network env off proxyPort keeps
    // the env var, the engine's ssrfGuard, and the kernel firewall on the same axis.
    const networkMode = proxyPort === null ? NetworkMode.UNRESTRICTED : NetworkMode.STRICT
    return {
        ...baseEnv({ settings, networkMode }),
        ...ssrfEnv(settings),
        ...propagatedEnv({ settings, networkMode }),
        ...proxyEnv({ proxyPort }),
    }
}

function baseEnv({ settings, networkMode }: { settings: WorkerSettings, networkMode: NetworkMode }): Record<string, string> {
    return {
        HOME: '/tmp/',
        AP_EXECUTION_MODE: settings.EXECUTION_MODE,
        AP_MAX_FLOW_RUN_LOG_SIZE_MB: String(settings.MAX_FLOW_RUN_LOG_SIZE_MB),
        AP_MAX_FILE_SIZE_MB: String(settings.MAX_FILE_SIZE_MB),
        AP_FLOW_TIMEOUT_SECONDS: String(settings.FLOW_TIMEOUT_SECONDS),
        NODE_PATH: '/usr/src/node_modules',
        AP_NETWORK_MODE: networkMode,
    }
}

function ssrfEnv(settings: WorkerSettings): Record<string, string> {
    const env: Record<string, string> = {}
    if (settings.DEV_PIECES.length > 0) {
        env['AP_DEV_PIECES'] = settings.DEV_PIECES.join(',')
    }
    if (settings.SSRF_ALLOW_LIST.length > 0) {
        env['AP_SSRF_ALLOW_LIST'] = settings.SSRF_ALLOW_LIST.join(',')
    }
    return env
}

function proxyEnv({ proxyPort }: { proxyPort: number | null }): Record<string, string> {
    if (proxyPort === null) {
        return {}
    }
    // Never export standard HTTP_PROXY / HTTPS_PROXY env vars: axios's built-in
    // proxy-from-env path sends `GET https://…` absolute-URL requests to an HTTP
    // proxy instead of issuing CONNECT, which proxy-chain rejects with 400
    // "Only HTTP protocol is supported". AP_EGRESS_PROXY_URL is a private signal
    // read by the engine to install http/https globalAgent + undici ProxyAgent.
    return {
        AP_EGRESS_PROXY_URL: `http://127.0.0.1:${proxyPort}`,
    }
}

function propagatedEnv({ settings, networkMode }: { settings: WorkerSettings, networkMode: NetworkMode }): Record<string, string> {
    const env: Record<string, string> = {}
    for (const key of settings.SANDBOX_PROPAGATED_ENV_VARS) {
        if (STRICT_MODE_BLOCKED_PROPAGATED_KEYS.has(key) && networkMode === NetworkMode.STRICT) {
            continue
        }
        if (process.env[key]) {
            env[key] = process.env[key]!
        }
    }
    return env
}

const STRICT_MODE_BLOCKED_PROPAGATED_KEYS = new Set([
    'HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy', 'NO_PROXY', 'no_proxy',
])

type WorkerSettings = ReturnType<typeof workerSettings.getSettings>
