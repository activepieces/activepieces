import { ChildProcess } from 'child_process'
import { ActivepiecesError, assertNotNullOrUndefined, EngineOperation, EngineOperationType, EngineResponse, EngineSocketEvent, EngineStderr, EngineStdout, ErrorCode, isNil } from '@activepieces/shared'
import treeKill from 'tree-kill'
import { Sandbox, SandboxInitOptions, SandboxLogger, SandboxOptions, SandboxProcessMaker, SandboxResult, SandboxSocketEventHandler, SandboxWebsocketServer } from './types'

export function createSandbox(
    log: SandboxLogger,
    sandboxId: string,
    options: SandboxInitOptions,
    processMaker: SandboxProcessMaker,
    websocketServer: SandboxWebsocketServer,
    socketEventHandler: SandboxSocketEventHandler,
): Sandbox {
    let childProcess: ChildProcess | null = null
    return {
        id: sandboxId,
        start: async ({ flowVersionId, platformId, mounts }) => {
            const ready = websocketServer.isConnected(sandboxId) && !isNil(childProcess)
            if (ready) {
                return
            }
            log.debug({
                sandboxId,
                flowVersionId: flowVersionId ?? 'undefined',
                platformId,
                reusable: String(options.reusable),
            }, 'Starting sandbox')
            childProcess = await processMaker.create({
                sandboxId,
                command: options.command ?? [],
                mounts,
                env: options.env,
                resourceLimits: {
                    memoryBytes: options.memoryLimitMb * 1024 * 1024,
                    cpuMsPerSec: options.cpuMsPerSec,
                    timeLimitSeconds: options.timeLimitSeconds,
                },
            })
            await websocketServer.waitForConnection(sandboxId)
            log.debug({
                sandboxId,
                flowVersionId: flowVersionId ?? 'undefined',
                platformId,
                reusable: String(options.reusable),
            }, 'Sandbox started')
        },
        execute: async (operationType: EngineOperationType, operation: EngineOperation, executeOptions: SandboxOptions) => {
            let killedByTimeout = false
            let timeout: NodeJS.Timeout | null = null
            const operationPromise = new Promise<SandboxResult>((resolve, reject) => {
                assertNotNullOrUndefined(childProcess, 'Sandbox process should not be null')
                timeout = setTimeout(async () => {
                    killedByTimeout = true
                    log.debug({ sandboxId }, 'Killing sandbox by timeout')
                    if (!isNil(childProcess)) {
                        await killProcess(childProcess, log)
                    }
                }, executeOptions.timeoutInSeconds * 1000)

                let stdError = ''
                let stdOut = ''
                let responseReceived = false

                log.info({ sandboxId, operationType }, '[Sandbox] Attaching listener for execution')
                websocketServer.attachListener(sandboxId, async (event, payload) => {
                    if (responseReceived && event !== EngineSocketEvent.ENGINE_RESPONSE) {
                        log.warn({
                            sandboxId,
                            operationType,
                            event,
                        }, '[Sandbox] Message received AFTER ENGINE_RESPONSE already resolved')
                    }

                    switch (event) {
                        case EngineSocketEvent.ENGINE_RESPONSE:
                            log.info({
                                sandboxId,
                                operationType,
                                status: (payload as EngineResponse<unknown>).status,
                            }, '[Sandbox] ENGINE_RESPONSE received, resolving promise')
                            responseReceived = true
                            resolve({
                                engine: payload as EngineResponse<unknown>,
                                stdOut,
                                stdError,
                            })
                            break
                        case EngineSocketEvent.ENGINE_STDOUT:
                            stdOut += (payload as EngineStdout).message
                            break
                        case EngineSocketEvent.ENGINE_STDERR:
                            stdError += (payload as EngineStderr).message
                            break
                        case EngineSocketEvent.ENGINE_OPERATION:
                            break
                        default:
                            await socketEventHandler.handle(log, event, payload)
                            break
                    }
                })

                childProcess.on('error', (error) => {
                    log.error({ sandboxId, error: String(error) }, 'Sandbox process error')
                })

                childProcess.on('exit', (code, signal) => {
                    handleProcessExit(log, {
                        sandboxId,
                        operationType,
                        code,
                        signal,
                        responseReceived,
                        killedByTimeout,
                        stdOut,
                        stdError,
                        reject,
                    })
                })

                websocketServer.send(sandboxId, operation, operationType)
                log.debug({ sandboxId, operationType }, 'Sent operation to sandbox')
            })

            try {
                return await operationPromise
            }
            finally {
                log.info({
                    sandboxId,
                    operationType,
                    killedByTimeout: String(killedByTimeout),
                }, '[Sandbox] Execute completed (finally block), removing listener')
                websocketServer.removeListener(sandboxId)
                if (!isNil(timeout)) {
                    clearTimeout(timeout)
                }
                childProcess?.removeAllListeners('exit')
                childProcess?.removeAllListeners('error')
            }
        },
        shutdown: async () => {
            if (!isNil(childProcess)) {
                log.debug({ sandboxId }, 'Shutting down sandbox')
                await killProcess(childProcess, log)
                childProcess = null
            }
        },
    }
}

function handleProcessExit(log: SandboxLogger, params: ProcessExitParams): void {
    const { sandboxId, operationType, code, signal, responseReceived, killedByTimeout, stdOut, stdError, reject } = params
    log.info({
        sandboxId,
        operationType,
        code: String(code),
        signal: signal ?? 'null',
        responseReceived: String(responseReceived),
        killedByTimeout: String(killedByTimeout),
    }, '[Sandbox] Process exit event fired')
    const isRamIssue = stdError.includes('JavaScript heap out of memory') || stdError.includes('Allocation failed - JavaScript heap out of memory') || (code === 134 || signal === 'SIGABRT' || signal === 'SIGKILL')
    if (killedByTimeout) {
        reject(new ActivepiecesError({
            code: ErrorCode.SANDBOX_EXECUTION_TIMEOUT,
            params: {
                standardOutput: stdOut,
                standardError: stdError,
            },
        }))
    }
    else if (isRamIssue) {
        reject(new ActivepiecesError({
            code: ErrorCode.SANDBOX_MEMORY_ISSUE,
            params: {
                standardOutput: stdOut,
                standardError: stdError,
            },
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
                log.error({
                    pid: String(pid),
                    error: String(err),
                }, 'Failed to kill child process tree')
            }
            else {
                log.debug({
                    pid: String(pid),
                }, 'Killed child process tree')
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
    responseReceived: boolean
    killedByTimeout: boolean
    stdOut: string
    stdError: string
    reject: (error: ActivepiecesError) => void
}
