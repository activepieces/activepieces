import { type ApLogger } from '@activepieces/server-utils'
import { ExecutionMode, maxSocketHttpBufferSizeBytes, NetworkMode, WorkerContract, WorkerToApiContract } from '@activepieces/shared'
import { nanoid } from 'nanoid'
import { getEnginePath, getGlobalCacheCommonPath, getGlobalCodeCachePath } from '../cache/cache-paths'
import { workerSettings } from '../config/worker-settings'
import { sandboxCapacity } from '../sandbox/capacity'
import { simpleProcess } from '../sandbox/fork'
import { isolateProcess } from '../sandbox/isolate'
import { createSandbox } from '../sandbox/sandbox'
import { Sandbox, SandboxMount } from '../sandbox/types'

export function createSandboxForJob(params: {
    log: ApLogger
    apiClient: WorkerToApiContract
    boxId: number
    reusable: boolean
    egress: EgressContext
}): Sandbox {
    const { log, apiClient, boxId, reusable, egress } = params
    const { proxyPort, gatewayHost, netnsName } = egress
    const settings = workerSettings.getSettings()
    const sandboxId = nanoid()

    const workerHandlers: WorkerContract = {
        updateRunProgress: (input) => apiClient.updateRunProgress(input),
        uploadRunLog: (input) => apiClient.uploadRunLog(input),
        sendFlowResponse: (input) => apiClient.sendFlowResponse(input),
        updateStepProgress: (input) => apiClient.updateStepProgress(input),
    }

    const memoryLimitMb = parseMemoryLimit(settings.SANDBOX_MEMORY_LIMIT)
    const processMaker = getProcessMaker(settings.EXECUTION_MODE, log, boxId, netnsName)

    const baseMounts: SandboxMount[] = [
        { hostPath: getGlobalCacheCommonPath(), sandboxPath: '/root/common' },
    ]

    const executionMode = settings.EXECUTION_MODE as ExecutionMode

    return createSandbox(
        log,
        sandboxId,
        {
            env: buildSandboxEnv({ settings, proxyPort, gatewayHost }),
            memoryLimitMb,
            cpuMsPerSec: 1000,
            timeLimitSeconds: settings.FLOW_TIMEOUT_SECONDS,
            reusable,
            maxHttpBufferSizeBytes: maxSocketHttpBufferSizeBytes(settings.MAX_FILE_SIZE_MB),
            baseMounts,
            wsRpcPort: isIsolateMode(executionMode) ? sandboxCapacity.wsRpcPortForBox(boxId) : undefined,
            wsRpcHost: gatewayHost ?? undefined,
        },
        processMaker,
        workerHandlers,
    )
}

export function isIsolateMode(mode: ExecutionMode): boolean {
    return mode === ExecutionMode.SANDBOX_PROCESS || mode === ExecutionMode.SANDBOX_CODE_AND_PROCESS
}

function getProcessMaker(executionMode: string, log: ApLogger, boxId: number, netnsName: string | null) {
    switch (executionMode) {
        case ExecutionMode.SANDBOX_PROCESS:
        case ExecutionMode.SANDBOX_CODE_AND_PROCESS:
            return isolateProcess(log, getEnginePath(), getGlobalCodeCachePath(), boxId, netnsName ?? undefined)
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

function buildSandboxEnv({ settings, proxyPort, gatewayHost }: {
    settings: WorkerSettings
    proxyPort: number | null
    gatewayHost: string | null
}): Record<string, string> {
    // `gatewayHost` reflects what the egress stack actually started at worker boot:
    // non-null means the `ap-egress` netns exists AND the proxy + WS-RPC are bound to the
    // gateway veth IP (gatewayHost non-null ⇔ proxyPort non-null ⇔ STRICT).
    // `settings.NETWORK_MODE` is refreshed on every socket reconnect, so reading it here
    // can drift away from the namespace the worker already created. If the platform flips
    // STRICT → UNRESTRICTED at reconnect, reading the live setting would drop
    // AP_EGRESS_PROXY_URL / AP_SANDBOX_WS_HOST from the sandbox env while the netns stays
    // in place — the sandbox would then have no route off the /30 and surface
    // ENETUNREACH. Keying the entire network env off gatewayHost keeps the env vars, the
    // engine's ssrfGuard, and the namespace topology on the same axis.
    const networkMode = gatewayHost === null ? NetworkMode.UNRESTRICTED : NetworkMode.STRICT
    return {
        ...baseEnv({ settings, networkMode, gatewayHost }),
        ...ssrfEnv({ settings, networkMode, gatewayHost }),
        ...propagatedEnv({ settings, networkMode }),
        ...proxyEnv({ proxyPort, gatewayHost }),
    }
}

function baseEnv({ settings, networkMode, gatewayHost }: { settings: WorkerSettings, networkMode: NetworkMode, gatewayHost: string | null }): Record<string, string> {
    return {
        HOME: '/tmp/',
        AP_EXECUTION_MODE: settings.EXECUTION_MODE,
        AP_MAX_FLOW_RUN_LOG_SIZE_MB: String(settings.MAX_FLOW_RUN_LOG_SIZE_MB),
        AP_MAX_FILE_SIZE_MB: String(settings.MAX_FILE_SIZE_MB),
        NODE_PATH: '/usr/src/node_modules',
        AP_NETWORK_MODE: networkMode,
        // In STRICT the WS-RPC server binds to the gateway veth IP, not loopback —
        // inside ap-egress, 127.0.0.1 is the namespace's own isolated loopback.
        ...(networkMode === NetworkMode.STRICT && gatewayHost !== null
            ? { AP_SANDBOX_WS_HOST: gatewayHost }
            : {}),
    }
}

function ssrfEnv({ settings, networkMode, gatewayHost }: { settings: WorkerSettings, networkMode: NetworkMode, gatewayHost: string | null }): Record<string, string> {
    const env: Record<string, string> = {}
    if (settings.DEV_PIECES.length > 0) {
        env['AP_DEV_PIECES'] = settings.DEV_PIECES.join(',')
    }
    // In STRICT the engine's socket-connect-guard must permit connecting to the proxy
    // and WS-RPC on the private gateway IP; append it to the user's allow list entries.
    const allowList = networkMode === NetworkMode.STRICT && gatewayHost !== null
        ? [...settings.SSRF_ALLOW_LIST, gatewayHost]
        : settings.SSRF_ALLOW_LIST
    if (allowList.length > 0) {
        env['AP_SSRF_ALLOW_LIST'] = allowList.join(',')
    }
    return env
}

function proxyEnv({ proxyPort, gatewayHost }: { proxyPort: number | null, gatewayHost: string | null }): Record<string, string> {
    if (proxyPort === null || gatewayHost === null) {
        return {}
    }
    // Never export standard HTTP_PROXY / HTTPS_PROXY env vars: axios's built-in
    // proxy-from-env path sends `GET https://…` absolute-URL requests to an HTTP
    // proxy instead of issuing CONNECT, which proxy-chain rejects with 400
    // "Only HTTP protocol is supported". AP_EGRESS_PROXY_URL is a private signal
    // read by the engine to install http/https globalAgent + undici ProxyAgent.
    // The proxy binds to the gateway veth IP (loopback is unreachable from the netns).
    return {
        AP_EGRESS_PROXY_URL: `http://${gatewayHost}:${proxyPort}`,
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

export type EgressContext = {
    proxyPort: number | null
    gatewayHost: string | null
    netnsName: string | null
}
