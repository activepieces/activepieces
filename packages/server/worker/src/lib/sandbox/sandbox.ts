import { ChildProcess } from 'child_process'
import { createServer, Server as HttpServer } from 'http'
import { ActivepiecesError, assertNotNullOrUndefined, createNotifyServer, createRpcClient, createRpcServer, EngineContract, EngineOperation, EngineOperationType, EngineResponse, EngineStderr, EngineStdout, ErrorCode, isNil, WorkerContract, WorkerNotifyContract } from '@activepieces/shared'
import { Socket, Server as SocketIOServer } from 'socket.io'
import treeKill from 'tree-kill'
import { Sandbox, SandboxInitOptions, SandboxLogger, SandboxOptions, SandboxProcessMaker, SandboxResult } from './types'

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
    let engineClient: EngineContract | null = null

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
            engineClient = createRpcClient<EngineContract>(socket)

            socket.on('disconnect', (reason) => {
                log.info({ sandboxId, reason, socketId: socket.id }, '[WebSocket] Sandbox disconnected')
                connectedSocket = null
                engineClient = null
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
        return new Promise<void>((resolve) => {
            connectionResolve = resolve
        })
    }

    return {
        id: sandboxId,
        start: async ({ flowVersionId, platformId, mounts }) => {
            const ready = !isNil(connectedSocket) && connectedSocket.connected && !isNil(childProcess)
            if (ready) {
                return
            }
            log.debug({
                sandboxId,
                flowVersionId: flowVersionId ?? 'undefined',
                platformId,
            }, 'Starting sandbox')

            const port = createSocketServer()

            childProcess = await processMaker.create({
                sandboxId,
                command: options.command ?? [],
                mounts: [...(options.baseMounts ?? []), ...mounts],
                env: {
                    ...options.env,
                    AP_SANDBOX_WS_PORT: String(port),
                },
                resourceLimits: {
                    memoryBytes: options.memoryLimitMb * 1024 * 1024,
                    cpuMsPerSec: options.cpuMsPerSec,
                    timeLimitSeconds: options.timeLimitSeconds,
                },
            })

            await waitForConnection()

            log.debug({
                sandboxId,
                flowVersionId: flowVersionId ?? 'undefined',
                platformId,
            }, 'Sandbox started')
        },
        execute: async (operationType: EngineOperationType, operation: EngineOperation, executeOptions: SandboxOptions) => {
            let killedByTimeout = false
            let timeout: NodeJS.Timeout | null = null
            const operationPromise = new Promise<SandboxResult>((resolve, reject) => {
                assertNotNullOrUndefined(childProcess, 'Sandbox process should not be null')
                assertNotNullOrUndefined(engineClient, 'Engine client should not be null')

                let stdError = ''
                let stdOut = ''

                createNotifyServer<WorkerNotifyContract>(connectedSocket!, {
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
                    if (!isNil(childProcess)) {
                        await killProcess(childProcess, log)
                    }
                }, executeOptions.timeoutInSeconds * 1000)

                childProcess.on('error', (error) => {
                    log.error({ sandboxId, error: String(error) }, 'Sandbox process error')
                })

                childProcess.on('exit', (code, signal) => {
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

                log.info({ sandboxId, operationType }, '[Sandbox] Executing operation via RPC')
                engineClient!.executeOperation({ operationType, operation }).then((engineResponse: EngineResponse<unknown>) => {
                    resolve({ engine: engineResponse, stdOut, stdError })
                }).catch((error: unknown) => {
                    log.error({ sandboxId, error: String(error) }, '[Sandbox] RPC call failed')
                    reject(error)
                })
            })

            try {
                return await operationPromise
            }
            finally {
                log.info({
                    sandboxId,
                    operationType,
                    killedByTimeout: String(killedByTimeout),
                }, '[Sandbox] Execute completed (finally block)')
                if (!isNil(timeout)) {
                    clearTimeout(timeout)
                }
                connectedSocket?.removeAllListeners('rpc-notify')
                childProcess?.removeAllListeners('exit')
                childProcess?.removeAllListeners('error')
            }
        },
        isReady: () => {
            return !isNil(connectedSocket) && connectedSocket.connected && !isNil(childProcess)
        },
        shutdown: async () => {
            if (!isNil(childProcess)) {
                log.debug({ sandboxId }, 'Shutting down sandbox')
                await killProcess(childProcess, log)
                childProcess = null
            }
            connectedSocket?.disconnect()
            connectedSocket = null
            engineClient = null
            await new Promise<void>((resolve) => {
                if (io) {
                    io.close(() => resolve())
                }
                else {
                    resolve()
                }
            })
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
        reject(new ActivepiecesError({
            code: ErrorCode.SANDBOX_INTERNAL_ERROR,
            params: {
                reason: 'Worker exited with code ' + code + ' and signal ' + signal,
                standardOutput: stdOut,
                standardError: stdError,
            },
        }))
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
    stdOut: string
    stdError: string
    reject: (error: ActivepiecesError) => void
}
