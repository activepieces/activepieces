import { ChildProcess } from 'child_process'
import { randomBytes } from 'crypto'
import http from 'http'
import { connect as netConnect, createServer as netCreateServer } from 'net'
import path from 'path'
import { ActivepiecesError, assertNotNullOrUndefined, ErrorCode, isNil } from '@activepieces/core-utils'
import { EngineOperation, EngineOperationType, EngineResponse, EngineStderr, EngineStdout, WorkerContract } from '@activepieces/shared'
import treeKill from 'tree-kill'
import { getGlobalCachePathLatestVersion, getGlobalCodeCachePath } from '../cache/cache-paths'
import { Sandbox, SandboxInitOptions, SandboxLogger, SandboxMount, SandboxOptions, SandboxProcessMaker, SandboxResult } from './types'

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
    workerHandlers: WorkerContract,
): Sandbox {
    let childProcess: ChildProcess | null = null
    let engineHttpPort: number | null = null
    let engineHttpToken: string | null = null
    let connected = false
    let busy = false
    let killedByShutdown = false

    function isReady(): boolean {
        return connected && !isNil(childProcess) && childProcess.exitCode === null
    }

    return {
        id: sandboxId,
        start: async ({ flowVersionId, platformId, mounts }) => {
            if (isReady()) {
                return
            }
            log.debug({
                sandbox: { id: sandboxId },
                flowVersion: { id: flowVersionId ?? 'undefined' },
                platform: { id: platformId },
            }, 'Starting sandbox')

            engineHttpToken = randomBytes(32).toString('hex')
            // The engine hosts the HTTP server; in isolate mode it must bind the fixed,
            // iptables-allowed port, otherwise grab a free loopback port for it to listen on.
            engineHttpPort = options.wsRpcPort ?? await allocateFreePort()

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
                    AP_SANDBOX_WS_PORT: String(engineHttpPort),
                    AP_SANDBOX_WS_TOKEN: engineHttpToken,
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

            const exitPromise = new Promise<never>((_, reject) => {
                childProcess!.once('exit', (code, signal) => {
                    reject(new Error(`Sandbox ${sandboxId} exited before connecting (code=${code}, signal=${signal})`))
                })
            })

            await Promise.race([waitForEngineReady(engineHttpPort), exitPromise])
            childProcess!.removeAllListeners('exit')
            connected = true

            log.debug({
                sandbox: { id: sandboxId },
                flowVersion: { id: flowVersionId ?? 'undefined' },
                platform: { id: platformId },
            }, 'Sandbox started')
        },
        execute: async (operationType: EngineOperationType, operation: EngineOperation, executeOptions: SandboxOptions) => {
            busy = true
            let killedByTimeout = false
            let timeout: NodeJS.Timeout | null = null
            const executeProcess = childProcess
            const port = engineHttpPort
            const token = engineHttpToken
            const operationPromise = new Promise<SandboxResult>((resolve, reject) => {
                assertNotNullOrUndefined(executeProcess, 'Sandbox process should not be null')
                assertNotNullOrUndefined(port, 'Engine port should not be null')
                assertNotNullOrUndefined(token, 'Engine token should not be null')

                let stdError = ''
                let stdOut = ''
                let settled = false

                timeout = setTimeout(async () => {
                    killedByTimeout = true
                    log.debug({ sandbox: { id: sandboxId } }, 'Killing sandbox by timeout')
                    if (!isNil(executeProcess)) {
                        await killProcess(executeProcess, log)
                    }
                }, executeOptions.timeoutInSeconds * 1000)

                executeProcess.on('error', (error) => {
                    log.error({ sandbox: { id: sandboxId }, error: String(error) }, 'Sandbox process error')
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

                log.debug({ sandbox: { id: sandboxId }, operationType }, '[Sandbox] Executing operation via HTTP')
                const req = http.request({
                    host: '127.0.0.1',
                    port,
                    path: '/execute',
                    method: 'POST',
                    headers: {
                        'content-type': 'application/json',
                        'x-connection-token': token,
                    },
                }, (res) => {
                    if (res.statusCode !== 200) {
                        res.resume()
                        reject(new Error(`Engine returned status ${res.statusCode}`))
                        return
                    }
                    res.setEncoding('utf8')
                    let buffer = ''
                    res.on('data', (chunk: string) => {
                        buffer += chunk
                        let boundary = buffer.indexOf('\n\n')
                        while (boundary !== -1) {
                            const frame = buffer.slice(0, boundary)
                            buffer = buffer.slice(boundary + 2)
                            handleEngineEvent({
                                frame,
                                workerHandlers,
                                appendStdout: (m) => {
                                    stdOut += m
                                },
                                appendStderr: (m) => {
                                    stdError += m
                                },
                                onResult: (response) => {
                                    settled = true
                                    resolve({ ...response, logs: buildLogs(stdOut, stdError) })
                                },
                                onError: (message) => {
                                    settled = true
                                    reject(new Error(message))
                                },
                                log,
                                sandboxId,
                            })
                            boundary = buffer.indexOf('\n\n')
                        }
                    })
                    res.on('end', () => {
                        if (!settled) {
                            reject(new Error(`Engine stream for sandbox ${sandboxId} ended without a result`))
                        }
                    })
                })
                req.on('error', (error) => {
                    log.error({ sandbox: { id: sandboxId }, error: String(error) }, '[Sandbox] HTTP execute request failed')
                    reject(error)
                })
                req.end(JSON.stringify({ operationType, operation }))
            })

            try {
                return await operationPromise
            }
            finally {
                busy = false
                log.debug({
                    sandbox: { id: sandboxId },
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
            connected = false
            if (!isNil(childProcess)) {
                killedByShutdown = true
                log.debug({ sandbox: { id: sandboxId } }, 'Shutting down sandbox')
                await killProcess(childProcess, log)
                childProcess = null
            }
            engineHttpPort = null
            engineHttpToken = null
        },
    }
}

function handleEngineEvent(params: EngineEventParams): void {
    const { frame, workerHandlers, appendStdout, appendStderr, onResult, onError, log, sandboxId } = params
    const data = frame.startsWith('data: ') ? frame.slice(6) : frame
    if (data.length === 0) {
        return
    }
    const event = JSON.parse(data) as EngineEvent
    switch (event.t) {
        case 'notify':
            if (event.method === 'stdout') {
                appendStdout((event.payload as EngineStdout).message)
            }
            else if (event.method === 'stderr') {
                appendStderr((event.payload as EngineStderr).message)
            }
            break
        case 'rpc': {
            const handler = workerHandlers[event.method as keyof WorkerContract]
            // Fire-and-forget: the engine doesn't await these (they stream one-way), so a
            // handler failure must not break stream parsing — just log it.
            if (typeof handler !== 'function') {
                log.warn({ sandbox: { id: sandboxId }, method: event.method }, '[Sandbox] Unknown RPC method received from engine, ignoring')
                break
            }
            void Promise.resolve(handler(event.payload as never)).catch((error: unknown) => {
                log.error({ sandbox: { id: sandboxId }, method: event.method, error: String(error) }, '[Sandbox] Worker RPC handler failed')
            })
            break
        }
        case 'result':
            onResult(event.payload as EngineResponse<unknown>)
            break
        case 'error':
            onError(event.message ?? 'Engine reported an unknown error')
            break
    }
}

function allocateFreePort(): Promise<number> {
    // ponytail: tiny TOCTOU window between close and the engine binding — loopback
    // ephemeral port, negligible for a one-shot sandbox. Switch to engine-reports-port
    // if it ever collides.
    return new Promise((resolve, reject) => {
        const srv = netCreateServer()
        srv.on('error', reject)
        srv.listen(0, '127.0.0.1', () => {
            const address = srv.address()
            const port = typeof address === 'object' && address !== null ? address.port : 0
            srv.close(() => port ? resolve(port) : reject(new Error('Could not allocate a free port')))
        })
    })
}

function waitForEngineReady(port: number): Promise<void> {
    const deadline = Date.now() + 30_000
    const attempt = (): Promise<void> => new Promise<void>((resolve, reject) => {
        const socket = netConnect({ host: '127.0.0.1', port })
        socket.once('connect', () => {
            socket.destroy()
            resolve()
        })
        socket.once('error', () => {
            socket.destroy()
            if (Date.now() > deadline) {
                reject(new Error(`Engine did not start listening on port ${port} within 30 seconds`))
                return
            }
            setTimeout(() => attempt().then(resolve, reject), 100)
        })
    })
    return attempt()
}

function handleProcessExit(log: SandboxLogger, params: ProcessExitParams): void {
    const { sandboxId, operationType, code, signal, killedByTimeout, killedByShutdown, stdOut, stdError, reject } = params
    log.info({
        sandbox: { id: sandboxId },
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

function buildLogs(stdOut: string, stdError: string): string | undefined {
    const parts: string[] = []
    if (stdOut) parts.push(`stdout:\n${stdOut}`)
    if (stdError) parts.push(`stderr:\n${stdError}`)
    return parts.length > 0 ? parts.join('\n') : undefined
}

type EngineEvent = {
    t: 'notify' | 'rpc' | 'result' | 'error'
    method?: string
    payload?: unknown
    message?: string
}

type EngineEventParams = {
    frame: string
    workerHandlers: WorkerContract
    appendStdout: (message: string) => void
    appendStderr: (message: string) => void
    onResult: (response: EngineResponse<unknown>) => void
    onError: (message: string) => void
    log: SandboxLogger
    sandboxId: string
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
