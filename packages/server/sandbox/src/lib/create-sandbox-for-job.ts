import { tmpdir } from 'node:os'
import { spreadIfDefined } from '@activepieces/core-utils'
import { type ApLogger } from '@activepieces/server-utils'
import { ExecutionMode, maxSocketHttpBufferSizeBytes, NetworkMode } from '@activepieces/shared'
import { nanoid } from 'nanoid'
import { cacheUtils } from './cache/cache-paths'
import { simpleProcess } from './sandbox/fork'
import { isolateProcess } from './sandbox/isolate'
import { createSandbox } from './sandbox/sandbox'
import { Sandbox, SandboxMount } from './sandbox/types'
import { SandboxSettings } from './types'

export function createSandboxForJob(params: {
    log: ApLogger
    boxId: number
    reusable: boolean
    basePath: string
    getSettings: () => SandboxSettings
}): Sandbox {
    const { log, boxId, reusable, basePath, getSettings } = params
    const settings = getSettings()
    const sandboxId = nanoid()
    const paths = cacheUtils(basePath)

    const memoryLimitMb = parseMemoryLimit(settings.SANDBOX_MEMORY_LIMIT)
    const processMaker = getProcessMaker(settings.EXECUTION_MODE, log, boxId, paths)

    const baseMounts: SandboxMount[] = [
        { hostPath: paths.getGlobalCacheCommonPath(), sandboxPath: '/root/common' },
        // Isolated modes (`isolateProcess`) run with `--no-default-dirs`, so a bare host path is
        // invisible to the engine unless explicitly mounted here — without this the engine's own
        // `fs.mkdir`/Deno's cache writes would fail outright. Mounted read-write (Deno writes its
        // compiled cache here), and deliberately NOT under /box (where WRITE_TMP/READ_TMP's
        // TMPDIR=/box grant lives), so the sandboxed step can never reach it however it's configured.
        { hostPath: paths.getGlobalDenoCachePath(), sandboxPath: DENO_CACHE_SANDBOX_PATH, writable: true },
    ]

    return createSandbox(
        log,
        sandboxId,
        {
            env: buildSandboxEnv({ settings, paths }),
            memoryLimitMb,
            cpuMsPerSec: 1000,
            timeLimitSeconds: settings.FLOW_TIMEOUT_SECONDS,
            reusable,
            maxHttpBufferSizeBytes: maxSocketHttpBufferSizeBytes(settings.MAX_FILE_SIZE_MB),
            basePath,
            baseMounts,
        },
        processMaker,
    )
}

function getProcessMaker(executionMode: string, log: ApLogger, boxId: number, paths: ReturnType<typeof cacheUtils>) {
    switch (executionMode) {
        case ExecutionMode.SANDBOX_PROCESS:
        case ExecutionMode.SANDBOX_CODE_AND_PROCESS:
            return isolateProcess(log, paths.getEnginePath(), paths.getGlobalCodeCachePath(), boxId)
        case ExecutionMode.UNSANDBOXED:
        case ExecutionMode.SANDBOX_CODE_ONLY:
        default:
            return simpleProcess(paths.getEnginePath(), paths.getGlobalCodeCachePath())
    }
}

// SANDBOX_PROCESS / SANDBOX_CODE_AND_PROCESS route through isolateProcess, which chroots the
// engine into a rootfs built from explicit --dir= mounts only — the raw host path is never
// visible there, only the sandbox-side mount path set up in baseMounts above.
function isIsolatedExecutionMode(executionMode: string): boolean {
    return executionMode === ExecutionMode.SANDBOX_PROCESS || executionMode === ExecutionMode.SANDBOX_CODE_AND_PROCESS
}

// SANDBOX_CODE_ONLY deliberately stays out of this: deno-code-sandbox.ts's own resolveDenoDirBase
// scopes its DENO_DIR to the step's own cache dir and ignores this var entirely, so there's nothing
// to compute here — leave that mode's cache exactly as it already is.
function resolveDenoCacheDirForEngine({ executionMode, hostPath }: { executionMode: string, hostPath: string }): string | undefined {
    if (isIsolatedExecutionMode(executionMode)) {
        return DENO_CACHE_SANDBOX_PATH
    }
    if (executionMode === ExecutionMode.UNSANDBOXED) {
        // simpleProcess (plain child_process.fork, no chroot): the engine sees the real host path
        // as-is with no remapping, so it must not collide with the Deno child's own WRITE_TMP/
        // READ_TMP grant, which covers that same process's os.tmpdir(). An operator can point
        // AP_CACHE_BASE_PATH under the OS tmpdir (one shipped image does exactly that), so this is
        // checked at the resolved path rather than assumed from config. On collision, fail safe:
        // omit the var so deno.ts falls back to its default per-run mkdtemp — slower, never vulnerable.
        return hostPath.startsWith(tmpdir()) ? undefined : hostPath
    }
    return undefined
}

function parseMemoryLimit(memoryLimitKb: string): number {
    const parsed = parseInt(memoryLimitKb, 10)
    const kb = isNaN(parsed) ? 1048576 : parsed
    return Math.floor(kb / 1024)
}

function buildSandboxEnv({ settings, paths }: {
    settings: SandboxSettings
    paths: ReturnType<typeof cacheUtils>
}): Record<string, string> {
    // STRICT enables the engine's in-process ssrfGuard (best-effort dns + socket
    // guards only — there is no longer an egress proxy or kernel firewall). The hard
    // egress boundary now lives in infrastructure (e.g. the Cloud VPC firewall).
    const networkMode = settings.NETWORK_MODE
    return {
        ...baseEnv({ settings, networkMode, paths }),
        ...ssrfEnv(settings),
        ...propagatedEnv(settings),
    }
}

function baseEnv({ settings, networkMode, paths }: { settings: SandboxSettings, networkMode: NetworkMode, paths: ReturnType<typeof cacheUtils> }): Record<string, string> {
    return {
        HOME: '/tmp/',
        ...spreadIfDefined('AP_DENO_PATH', process.env['AP_DENO_PATH']),
        ...spreadIfDefined('AP_DENO_CACHE_DIR', resolveDenoCacheDirForEngine({ executionMode: settings.EXECUTION_MODE, hostPath: paths.getGlobalDenoCachePath() })),
        AP_EXECUTION_MODE: settings.EXECUTION_MODE,
        AP_MAX_FLOW_RUN_LOG_SIZE_MB: String(settings.MAX_FLOW_RUN_LOG_SIZE_MB),
        ...spreadIfDefined('AP_FLOW_RUN_LOG_INPUT_TRUNCATE_THRESHOLD_KB', settings.FLOW_RUN_LOG_INPUT_TRUNCATE_THRESHOLD_KB?.toString()),
        ...spreadIfDefined('AP_FLOW_RUN_LOG_SLICE_THRESHOLD_KB', settings.FLOW_RUN_LOG_SLICE_THRESHOLD_KB?.toString()),
        AP_MAX_FILE_SIZE_MB: String(settings.MAX_FILE_SIZE_MB),
        NODE_PATH: '/usr/src/node_modules',
        AP_NETWORK_MODE: networkMode,
        ...(settings.ENFORCE_CONNECTION_PIECE_BINDING ? { AP_ENFORCE_CONNECTION_PIECE_BINDING: 'true' } : {}),
    }
}

function ssrfEnv(settings: SandboxSettings): Record<string, string> {
    const env: Record<string, string> = {}
    if (settings.DEV_PIECES.length > 0) {
        env['AP_DEV_PIECES'] = settings.DEV_PIECES.join(',')
    }
    if (settings.SSRF_ALLOW_LIST.length > 0) {
        env['AP_SSRF_ALLOW_LIST'] = settings.SSRF_ALLOW_LIST.join(',')
    }
    return env
}

function propagatedEnv(settings: SandboxSettings): Record<string, string> {
    const env: Record<string, string> = {}
    if (settings.SANDBOX_PROPAGATED_ENV_VARS.length > 0) {
        env['AP_SANDBOX_PROPAGATED_ENV_VARS'] = settings.SANDBOX_PROPAGATED_ENV_VARS.join(',')
    }
    for (const key of settings.SANDBOX_PROPAGATED_ENV_VARS) {
        if (process.env[key]) {
            env[key] = process.env[key]!
        }
    }
    return env
}

const DENO_CACHE_SANDBOX_PATH = '/root/deno-cache'
