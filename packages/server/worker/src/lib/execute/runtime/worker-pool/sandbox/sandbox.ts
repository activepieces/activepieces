import { ChildProcess } from 'child_process'
import { randomBytes } from 'crypto'
import path from 'path'
import { setTimeout as delay } from 'timers/promises'
import { ActivepiecesError, assertNotNullOrUndefined, EngineOperation, EngineOperationType, EngineResponse, ErrorCode, isNil, tryCatch } from '@activepieces/shared'
import treeKill from 'tree-kill'
import { getGlobalCachePathLatestVersion, getGlobalCodeCachePath } from '../../../cache/cache-paths'
import { Sandbox, SandboxInitOptions, SandboxLogger, SandboxMount, SandboxOptions, SandboxProcessMaker, SandboxResult } from '../../sandbox-contract'

const READINESS_TIMEOUT_MS = 30_000
const READINESS_POLL_INTERVAL_MS = 150

function assertSafePathSegment(value: string, field: string): void {
    const isUnsafe = value.length === 0
        || value === '.'
        || value === '..'
        || value.includes('..')
        || value.includes('/')
        || value.includes('\\')
        || value.includes('\0')
    if (isUnsafe) {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: { message: `Invalid ${field}: "${value}" — path segment contains disallowed characters` },
        })
    }
}

function assertSandboxPathUnderRoot(mount: SandboxMount): void {
    const normalized = path.posix.normalize(mount.sandboxPath)
    if (!normalized.startsWith('/root/') && normalized !== '/root') {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: { message: `Mount sandboxPath "${mount.sandboxPath}" must be under /root/` },
        })
    }
}

function buildCodeMount({ flowVersionId, reusable }: { flowVersionId: string | undefined, reusable: boolean }): SandboxMount | null {
    const codeCachePath = getGlobalCodeCachePath()
    if (reusable) {
        return {
            hostPath: codeCachePath,
            sandboxPath: '/root/codes',
            optional: true,
        }
    }
    if (!isNil(flowVersionId)) {
        assertSafePathSegment(flowVersionId, 'flowVersionId')
        return {
            hostPath: path.join(codeCachePath, flowVersionId),
            sandboxPath: `/root/codes/${flowVersionId}`,
            optional: true,
        }
    }
    return null
}

export function createSandbox(
    log: SandboxLogger,
    sandboxId: string,
    options: SandboxInitOptions,
    processMaker: SandboxProcessMaker,
): Sandbox {
    let childProcess: ChildProcess | null = null
    let engineToken: string | null = null
    let started = false
    let busy = false
    let killedByShutdown = false
    let stdOut = ''
    let stdError = ''

    const enginePort = options.enginePort
    const engineBaseUrl = `http://127.0.0.1:${enginePort}`

    function captureChildOutput(child: ChildProcess): void {
        child.stdout?.on('data', (data: Buffer) => {
            stdOut += data.toString()
            process.stdout.write(data)
        })
        child.stderr?.on('data', (data: Buffer) => {
            stdError += data.toString()
            process.stderr.write(data)
        })
    }

    async function waitForEngineReady(child: ChildProcess): Promise<void> {
        const deadline = Date.now() + READINESS_TIMEOUT_MS
        while (Date.now() < deadline) {
            if (child.exitCode !== null) {
                throw new Error(`Sandbox ${sandboxId} exited before becoming ready (code=${child.exitCode})`)
            }
            const { data: ready } = await tryCatch(async () => {
                const response = await fetch(`${engineBaseUrl}/health`)
                return response.ok
            })
            if (ready) {
                return
            }
            await delay(READINESS_POLL_INTERVAL_MS)
        }
        throw new Error(`Sandbox ${sandboxId} engine did not become ready within ${READINESS_TIMEOUT_MS}ms`)
    }

    function isReady(): boolean {
        return started && !isNil(childProcess) && childProcess.exitCode === null
    }

    return {
        id: sandboxId,
        start: async ({ flowVersionId, platformId, mounts }) => {
            if (isReady()) {
                return
            }
            log.debug({
                sandboxId,
                flowVersionId: flowVersionId ?? 'undefined',
                platformId,
            }, 'Starting sandbox')

            engineToken = randomBytes(32).toString('hex')
            stdOut = ''
            stdError = ''

            const codeMount = buildCodeMount({ flowVersionId, reusable: options.reusable })
            const customPieceMounts: SandboxMount[] = []
            if (platformId) {
                assertSafePathSegment(platformId, 'platformId')
                const customPiecesHostPath = path.resolve(getGlobalCachePathLatestVersion(), 'custom_pieces', platformId)
                customPieceMounts.push({
                    hostPath: customPiecesHostPath,
                    sandboxPath: '/root/custom_pieces',
                    optional: true,
                })
            }

            const allMounts: SandboxMount[] = [
                ...(options.baseMounts ?? []),
                ...(codeMount ? [codeMount] : []),
                ...mounts,
                ...customPieceMounts,
            ]
            for (const mount of allMounts) {
                assertSandboxPathUnderRoot(mount)
            }

            childProcess = await processMaker.create({
                sandboxId,
                command: options.command ?? [],
                mounts: allMounts,
                env: {
                    ...options.env,
                    AP_ENGINE_PORT: String(enginePort),
                    AP_ENGINE_TOKEN: engineToken,
                    ...(customPieceMounts.length > 0
                        ? { AP_CUSTOM_PIECES_PATHS: '/root/custom_pieces' }
                        : {}),
                },
                resourceLimits: {
                    memoryLimitMb: options.memoryLimitMb,
                    cpuMsPerSec: options.cpuMsPerSec,
                    timeLimitSeconds: options.timeLimitSeconds,
                },
            })

            captureChildOutput(childProcess)

            await waitForEngineReady(childProcess)
            started = true

            log.debug({
                sandboxId,
                flowVersionId: flowVersionId ?? 'undefined',
                platformId,
            }, 'Sandbox started')
        },
        execute: async (operationType: EngineOperationType, operation: EngineOperation, executeOptions: SandboxOptions) => {
            busy = true
            let killedByTimeout = false
            let timeout: NodeJS.Timeout | null = null
            const executeProcess = childProcess
            const executeToken = engineToken
            stdOut = ''
            stdError = ''

            const operationPromise = new Promise<SandboxResult>((resolve, reject) => {
                assertNotNullOrUndefined(executeProcess, 'Sandbox process should not be null')
                assertNotNullOrUndefined(executeToken, 'Engine token should not be null')

                timeout = setTimeout(async () => {
                    killedByTimeout = true
                    log.debug({ sandboxId }, 'Killing sandbox by timeout')
                    await killProcess(executeProcess, log)
                }, executeOptions.timeoutInSeconds * 1000)

                executeProcess.on('error', (error) => {
                    log.error({ sandboxId, error: String(error) }, 'Sandbox process error')
                })

                executeProcess.on('exit', (code, signal) => {
                    handleProcessExit(log, {
                        sandboxId,
                        operationType,
                        code,
                        signal,
                        killedByTimeout,
                        killedByShutdown,
                        stdOut,
                        stdError,
                        reject,
                    })
                })

                log.debug({ sandboxId, operationType }, '[Sandbox] Executing operation via HTTP')
                const operationTimeoutMs = (executeOptions.timeoutInSeconds + 5) * 1000

                postOperationToEngine({
                    engineBaseUrl,
                    engineToken: executeToken,
                    operationType,
                    operation,
                    operationTimeoutMs,
                })
                    .then(resolve)
                    .catch((error: unknown) => onHttpExecuteError({
                        error,
                        log,
                        sandboxId,
                        executeProcess,
                        wasKilled: killedByTimeout || killedByShutdown,
                        reject,
                    }))
            })

            try {
                return await operationPromise
            }
            finally {
                busy = false
                log.debug({
                    sandboxId,
                    operationType,
                    killedByTimeout: String(killedByTimeout),
                }, '[Sandbox] Execute completed (finally block)')
                if (!isNil(timeout)) {
                    clearTimeout(timeout)
                }
                executeProcess?.removeAllListeners('exit')
                executeProcess?.removeAllListeners('error')
            }
        },
        isReady,
        getPid: () => childProcess?.pid ?? null,
        isBusy: () => busy,
        shutdown: async () => {
            if (!isNil(childProcess)) {
                killedByShutdown = true
                log.debug({ sandboxId }, 'Shutting down sandbox')
                await killProcess(childProcess, log)
                childProcess = null
            }
            started = false
            engineToken = null
        },
    }
}

async function postOperationToEngine({ engineBaseUrl, engineToken, operationType, operation, operationTimeoutMs }: PostOperationParams): Promise<SandboxResult> {
    const response = await fetch(`${engineBaseUrl}/execute`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${engineToken}`,
        },
        body: JSON.stringify({ operationType, operation }),
        signal: AbortSignal.timeout(operationTimeoutMs),
    })
    if (!response.ok) {
        throw new ActivepiecesError({
            code: ErrorCode.SANDBOX_INTERNAL_ERROR,
            params: {
                reason: `Engine returned HTTP ${response.status}`,
                standardOutput: '',
                standardError: await response.text(),
            },
        })
    }
    const body: EngineHttpExecuteResponse = JSON.parse(await response.text())
    return { ...body.engineResponse, logs: body.logs }
}

// A mid-flight crash or timeout drops the loopback connection. When the engine process has
// exited (or the worker killed it), the 'exit' handler rejects with the proper OOM/timeout
// classification, so we suppress the raw network/abort error and let that win the race.
function onHttpExecuteError({ error, log, sandboxId, executeProcess, wasKilled, reject }: HttpExecuteErrorParams): void {
    if (wasKilled) {
        return
    }
    setTimeout(() => {
        if (executeProcess.exitCode === null) {
            log.error({ sandboxId, error: String(error) }, '[Sandbox] HTTP execute failed')
            reject(error)
        }
    }, 100)
}

function handleProcessExit(log: SandboxLogger, params: ProcessExitParams): void {
    const { sandboxId, operationType, code, signal, killedByTimeout, killedByShutdown, stdOut, stdError, reject } = params
    log.info({
        sandboxId,
        operationType,
        code: String(code),
        signal: signal ?? 'null',
        killedByTimeout: String(killedByTimeout),
        killedByShutdown: String(killedByShutdown),
    }, '[Sandbox] Process exit event fired')
    const isRamIssue = stdError.includes('JavaScript heap out of memory') || stdError.includes('Allocation failed - JavaScript heap out of memory') || (code === 134 || signal === 'SIGABRT' || (signal === 'SIGKILL' && !killedByShutdown))
    const isLogSizeExceeded = stdError.includes('Flow run data size exceeded the maximum allowed size')

    if (killedByTimeout) {
        reject(new ActivepiecesError({
            code: ErrorCode.SANDBOX_EXECUTION_TIMEOUT,
            params: { standardOutput: stdOut, standardError: stdError },
        }))
    }
    else if (isRamIssue) {
        reject(new ActivepiecesError({
            code: ErrorCode.SANDBOX_MEMORY_ISSUE,
            params: { standardOutput: stdOut, standardError: stdError },
        }))
    }
    else if (isLogSizeExceeded) {
        reject(new ActivepiecesError({
            code: ErrorCode.SANDBOX_LOG_SIZE_EXCEEDED,
            params: { standardOutput: stdOut, standardError: stdError },
        }))
    }
    else {
        const reason = 'Worker exited with code ' + code + ' and signal ' + signal
        reject(new ActivepiecesError({
            code: ErrorCode.SANDBOX_INTERNAL_ERROR,
            params: {
                reason,
                standardOutput: stdOut,
                standardError: stdError,
            },
        }, `${reason} standardOutput=${stdOut} standardError=${stdError}`))
    }
}

function killProcess(child: ChildProcess, log: SandboxLogger): Promise<void> {
    const pid = child.pid
    if (!pid) {
        throw new Error('No PID found for child process')
    }
    return new Promise<void>((resolve) => {
        treeKill(pid, 'SIGKILL', (err) => {
            if (err) {
                log.error({ pid: String(pid), error: String(err) }, 'Failed to kill child process tree')
            }
            else {
                log.debug({ pid: String(pid) }, 'Killed child process tree')
            }
            resolve()
        })
    })
}

type ProcessExitParams = {
    sandboxId: string
    operationType: EngineOperationType
    code: number | null
    signal: string | null
    killedByTimeout: boolean
    killedByShutdown: boolean
    stdOut: string
    stdError: string
    reject: (error: ActivepiecesError) => void
}

type PostOperationParams = {
    engineBaseUrl: string
    engineToken: string
    operationType: EngineOperationType
    operation: EngineOperation
    operationTimeoutMs: number
}

type HttpExecuteErrorParams = {
    error: unknown
    log: SandboxLogger
    sandboxId: string
    executeProcess: ChildProcess
    wasKilled: boolean
    reject: (error: unknown) => void
}

type EngineHttpExecuteResponse = {
    engineResponse: EngineResponse<unknown>
    logs?: string
}
