import { ChildProcess } from 'child_process'
import { randomBytes, timingSafeEqual } from 'crypto'
import { createServer, Server as HttpServer } from 'http'
import path from 'path'
import { ActivepiecesError, assertNotNullOrUndefined, ErrorCode, isNil, tryCatch } from '@activepieces/core-utils'
import { createNotifyServer, createRpcClient, EngineContract, EngineOperation, EngineOperationType, EngineResponse, EngineStderr, EngineStdout, WorkerNotifyContract } from '@activepieces/shared'
import { Socket, Server as SocketIOServer } from 'socket.io'
import treeKill from 'tree-kill'
import { cacheUtils } from '../cache/cache-paths'
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

function buildCodeMount({ flowVersionId, reusable, basePath }: { flowVersionId: string | undefined, reusable: boolean, basePath: string }): SandboxMount | null {
    const codeCachePath = cacheUtils(basePath).getGlobalCodeCachePath()
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
    let io: SocketIOServer | null = null
    let connectedSocket: Socket | null = null
    let connectionResolve: (() => void) | null = null
    let wsRpcToken: string | null = null
    let busy = false
    let killedByShutdown = false

    function wireConnectionHandler(ioServer: SocketIOServer): void {
        ioServer.use(authenticateHandshake({ getExpectedToken: () => wsRpcToken, log, sandboxId }))
        ioServer.on('connection', (socket) => {
            if (!isNil(connectedSocket) && connectedSocket.connected) {
                log.warn({ sandbox: { id: sandboxId }, socketId: socket.id }, '[WebSocket] Rejecting extra connection — sandbox already has an active socket')
                socket.disconnect(true)
                return
            }
            connectedSocket = socket
            log.info({ sandbox: { id: sandboxId }, socketId: socket.id }, '[WebSocket] Sandbox connected')

            socket.on('disconnect', (reason) => {
                log.info({ sandbox: { id: sandboxId }, reason, socketId: socket.id }, '[WebSocket] Sandbox disconnected')
                if (connectedSocket === socket) {
                    connectedSocket = null
                }
            })

            if (connectionResolve) {
                connectionResolve()
                connectionResolve = null
            }
        })
    }

    // In isolate mode the ws port is fixed per box (WS_RPC_BASE_PORT + boxId). A reused box whose
    // previous server hasn't finished releasing that port — or a brief double-allocation under high
    // concurrency — makes the bind emit EADDRINUSE. Without an 'error' listener that event is an
    // UNHANDLED exception that crashes the ENTIRE worker process (and every in-flight sandbox on it),
    // which is exactly what made busy workers crash-loop. Await the bind, and on a bind error retry a
    // few times (a concurrent close frees the port within a beat); if it never frees, fail just this
    // sandbox with a catchable error. A random port (listen(0)) can't collide, so it needs no retries.
    async function createSocketServer(): Promise<number> {
        const requestedPort = options.wsRpcPort ?? 0
        const maxAttempts = requestedPort === 0 ? 1 : 30
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            const server = createServer()
            const ioServer = new SocketIOServer(server, {
                path: '/worker/ws',
                maxHttpBufferSize: options.maxHttpBufferSizeBytes,
                cors: { origin: '*' },
            })
            wireConnectionHandler(ioServer)

            const { error } = await tryCatch(() => listenOnce(server, requestedPort))
            if (isNil(error)) {
                io = ioServer
                const address = server.address()
                if (typeof address === 'object' && address !== null) {
                    return address.port
                }
                throw new Error('Could not determine socket.io server port')
            }

            await tryCatch(() => closeServer(ioServer))
            if (attempt === maxAttempts) {
                throw new ActivepiecesError({
                    code: ErrorCode.SANDBOX_INTERNAL_ERROR,
                    params: { reason: `Failed to bind sandbox ws port ${requestedPort} after ${maxAttempts} attempts: ${String(error)}` },
                })
            }
            await delay(100)
        }
        throw new Error('Could not start sandbox socket server')
    }

    function waitForConnection(): Promise<void> {
        if (!isNil(connectedSocket) && connectedSocket.connected) {
            return Promise.resolve()
        }
        return new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
                connectionResolve = null
                reject(new Error(`Sandbox ${sandboxId} did not connect within 30 seconds`))
            }, 30_000)

            connectionResolve = () => {
                clearTimeout(timeout)
                resolve()
            }
        })
    }

    function isReady(): boolean {
        return !isNil(connectedSocket) && connectedSocket.connected && !isNil(childProcess) && childProcess.exitCode === null
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

            wsRpcToken = randomBytes(32).toString('hex')
            const port = await createSocketServer()

            const codeMount = buildCodeMount({ flowVersionId, reusable: options.reusable, basePath: options.basePath })
            const customPieceMounts: SandboxMount[] = []
            if (platformId) {
                assertSafePathSegment(platformId, 'platformId')
                const customPiecesHostPath = path.resolve(cacheUtils(options.basePath).getGlobalCachePathLatestVersion(), 'custom_pieces', platformId)
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
                    AP_SANDBOX_WS_PORT: String(port),
                    AP_SANDBOX_WS_TOKEN: wsRpcToken,
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

            await Promise.race([waitForConnection(), exitPromise])
            childProcess!.removeAllListeners('exit')

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
            const executeSocket = connectedSocket
            const executeProcess = childProcess
            const operationPromise = new Promise<SandboxResult>((resolve, reject) => {
                assertNotNullOrUndefined(executeProcess, 'Sandbox process should not be null')
                assertNotNullOrUndefined(executeSocket, 'Connected socket should not be null')

                let stdError = ''
                let stdOut = ''

                createNotifyServer<WorkerNotifyContract>(executeSocket, {
                    stdout: (input: EngineStdout) => {
                        stdOut += input.message
                    },
                    stderr: (input: EngineStderr) => {
                        stdError += input.message
                    },
                })

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

                log.debug({ sandbox: { id: sandboxId }, operationType }, '[Sandbox] Executing operation via RPC')
                const operationTimeoutMs = (executeOptions.timeoutInSeconds + 5) * 1000
                const client = createRpcClient<EngineContract>(executeSocket, operationTimeoutMs)
                client.executeOperation({ operationType, operation }).then((engineResponse: EngineResponse<unknown>) => {
                    resolve({ ...engineResponse, logs: buildLogs(stdOut, stdError) })
                }).catch((error: unknown) => {
                    log.error({ sandbox: { id: sandboxId }, error: String(error) }, '[Sandbox] RPC call failed')
                    reject(error)
                })
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
                executeSocket?.removeAllListeners('rpc-notify')
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
                log.debug({ sandbox: { id: sandboxId } }, 'Shutting down sandbox')
                await killProcess(childProcess, log)
                childProcess = null
            }
            connectedSocket?.disconnect()
            connectedSocket = null
            if (io) {
                // eslint-disable-next-line @typescript-eslint/await-thenable
                await io.close()
            }
            io = null
            wsRpcToken = null
        },
    }
}

function listenOnce(server: HttpServer, port: number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const onError = (err: Error): void => {
            server.removeListener('listening', onListening)
            reject(err)
        }
        const onListening = (): void => {
            server.removeListener('error', onError)
            resolve()
        }
        server.once('error', onError)
        server.once('listening', onListening)
        server.listen(port)
    })
}

function closeServer(ioServer: SocketIOServer): Promise<void> {
    return new Promise<void>((resolve) => {
        ioServer.close(() => resolve())
    })
}

function delay(ms: number): Promise<void> {
    return new Promise<void>((resolve) => setTimeout(resolve, ms))
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

function authenticateHandshake({ getExpectedToken, log, sandboxId }: {
    getExpectedToken: () => string | null
    log: SandboxLogger
    sandboxId: string
}): (socket: Socket, next: (err?: Error) => void) => void {
    return (socket, next) => {
        const provided = socket.handshake.auth?.['connectionToken']
        const expected = getExpectedToken()
        if (typeof provided !== 'string' || expected === null) {
            log.warn({ sandbox: { id: sandboxId }, socketId: socket.id }, '[WebSocket] Rejecting handshake: missing connection token')
            return next(new Error('unauthorized'))
        }
        const a = Buffer.from(provided)
        const b = Buffer.from(expected)
        if (a.length !== b.length || !timingSafeEqual(a, b)) {
            log.warn({ sandbox: { id: sandboxId }, socketId: socket.id }, '[WebSocket] Rejecting handshake: invalid connection token')
            return next(new Error('unauthorized'))
        }
        next()
    }
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
