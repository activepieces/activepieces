import { ChildProcess } from 'child_process'
import { createServer, Server as HttpServer } from 'http'
import path from 'path'
import { ActivepiecesError, assertNotNullOrUndefined, createNotifyServer, createRpcClient, createRpcServer, EngineContract, EngineOperation, EngineOperationType, EngineResponse, EngineStderr, EngineStdout, ErrorCode, isNil, WorkerContract, WorkerNotifyContract } from '@activepieces/shared'
import { Socket, Server as SocketIOServer } from 'socket.io'
import treeKill from 'tree-kill'
import { getGlobalCachePathLatestVersion } from '../cache/cache-paths'
import { Sandbox, SandboxInitOptions, SandboxLogger, SandboxMount, SandboxOptions, SandboxProcessMaker, SandboxResult } from './types'

export function createSandbox(
    log: SandboxLogger,
    sandboxId: string,
    options: SandboxInitOptions,
    processMaker: SandboxProcessMaker,
    workerHandlers: WorkerContract,
): Sandbox {
    let childProcess: ChildProcess | null = null
    let httpServer: HttpServer | null = null
    let io: SocketIOServer | null = null
    let connectedSocket: Socket | null = null
    let connectionResolve: (() => void) | null = null

    function createSocketServer(): number {
        httpServer = createServer()
        io = new SocketIOServer(httpServer, {
            path: '/worker/ws',
            maxHttpBufferSize: 1e8,
            cors: { origin: '*' },
        })

        io.on('connection', (socket) => {
            connectedSocket = socket
            log.info({ sandboxId, socketId: socket.id }, '[WebSocket] Sandbox connected')

            createRpcServer<WorkerContract>(socket, workerHandlers)

            socket.on('disconnect', (reason) => {
                log.info({ sandboxId, reason, socketId: socket.id }, '[WebSocket] Sandbox disconnected')
                connectedSocket = null
            })

            if (connectionResolve) {
                connectionResolve()
                connectionResolve = null
            }
        })

        httpServer.listen(0)

        const address = httpServer.address()
        if (typeof address === 'object' && address !== null) {
            return address.port
        }
        throw new Error('Could not determine socket.io server port')
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
                sandboxId,
                flowVersionId: flowVersionId ?? 'undefined',
                platformId,
            }, 'Starting sandbox')

            const port = createSocketServer()

            const customPieceMounts: SandboxMount[] = []
            if (platformId) {
                const customPiecesHostPath = path.resolve(getGlobalCachePathLatestVersion(), 'custom_pieces', platformId)
                customPieceMounts.push({
                    hostPath: customPiecesHostPath,
                    sandboxPath: '/root/custom_pieces',
                    optional: true,
                })
            }

            childProcess = await processMaker.create({
                sandboxId,
                command: options.command ?? [],
                mounts: [...(options.baseMounts ?? []), ...mounts, ...customPieceMounts],
                env: {
                    ...options.env,
                    AP_SANDBOX_WS_PORT: String(port),
                    ...(customPieceMounts.length > 0
                        ? { AP_CUSTOM_PIECES_PATHS: '/root/custom_pieces' }
                        : {}),
                },
                resourceLimits: {
                    memoryBytes: options.memoryLimitMb * 1024 * 1024,
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
                sandboxId,
                flowVersionId: flowVersionId ?? 'undefined',
                platformId,
            }, 'Sandbox started')
        },
        execute: async (operationType: EngineOperationType, operation: EngineOperation, executeOptions: SandboxOptions) => {
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
                    log.debug({ sandboxId }, 'Killing sandbox by timeout')
                    if (!isNil(executeProcess)) {
                        await killProcess(executeProcess, log)
                    }
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
                        stdOut,
                        stdError,
                        reject,
                    })
                })

                log.debug({ sandboxId, operationType }, '[Sandbox] Executing operation via RPC')
                const operationTimeoutMs = (executeOptions.timeoutInSeconds + 5) * 1000
                const client = createRpcClient<EngineContract>(executeSocket, operationTimeoutMs)
                client.executeOperation({ operationType, operation }).then((engineResponse: EngineResponse<unknown>) => {
                    resolve({ ...engineResponse, logs: buildLogs(stdOut, stdError) })
                }).catch((error: unknown) => {
                    log.error({ sandboxId, error: String(error) }, '[Sandbox] RPC call failed')
                    reject(error)
                })
            })

            try {
                return await operationPromise
            }
            finally {
                log.debug({
                    sandboxId,
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
        shutdown: async () => {
            if (!isNil(childProcess)) {
                log.debug({ sandboxId }, 'Shutting down sandbox')
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
            httpServer = null
        },
    }
}

function handleProcessExit(log: SandboxLogger, params: ProcessExitParams): void {
    const { sandboxId, operationType, code, signal, killedByTimeout, stdOut, stdError, reject } = params
    log.info({
        sandboxId,
        operationType,
        code: String(code),
        signal: signal ?? 'null',
        killedByTimeout: String(killedByTimeout),
    }, '[Sandbox] Process exit event fired')
    const isRamIssue = stdError.includes('JavaScript heap out of memory') || stdError.includes('Allocation failed - JavaScript heap out of memory') || (code === 134 || signal === 'SIGABRT' || signal === 'SIGKILL')
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

type ProcessExitParams = {
    sandboxId: string
    operationType: EngineOperationType
    code: number | null
    signal: string | null
    killedByTimeout: boolean
    stdOut: string
    stdError: string
    reject: (error: ActivepiecesError) => void
}
