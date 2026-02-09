import { ChildProcess } from 'child_process'
import { ActivepiecesError, assertNotNullOrUndefined, EngineOperation, EngineOperationType, EngineResponse, EngineSocketEvent, EngineStderr, EngineStdout, ErrorCode, ExecutionMode, isNil, SendFlowResponseRequest, UpdateRunProgressRequest, UpdateStepProgressRequest } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import treeKill from 'tree-kill'
import { workerMachine } from '../../utils/machine'
import { sandboxSockerHandler } from '../sandbox-socket-handlers'
import { isolateSandboxProcess } from './process/isolate-sandbox-process'
import { simpleProcess } from './process/simple-process'
import { sandboxWebsocketServer } from './websocket-server'


const processMaker = {
    [ExecutionMode.UNSANDBOXED]: simpleProcess,
    [ExecutionMode.SANDBOX_PROCESS]: isolateSandboxProcess,
    [ExecutionMode.SANDBOX_CODE_ONLY]: simpleProcess,
    [ExecutionMode.SANDBOX_CODE_AND_PROCESS]: isolateSandboxProcess,
}


export const createSandbox = (log: FastifyBaseLogger, sandboxId: string, options: SandboxInitOptions): Sandbox => {
    let process: ChildProcess | null = null
    return {
        id: sandboxId,
        start: async ({ flowVersionId, platformId }) => {
            const ready = sandboxWebsocketServer.isConnected(sandboxId) && !isNil(process)
            if (ready) {
                return
            }
            log.debug({
                sandboxId,
                flowVersionId,
                platformId,
                reusable: options.reusable,
            }, 'Starting sandbox')
            const executionMode = workerMachine.getSettings().EXECUTION_MODE as ExecutionMode
            process = await processMaker[executionMode](log).create({
                env: options.env,
                memoryLimitMb: options.memoryLimitMb,
                sandboxId,
                flowVersionId,
                platformId,
                reusable: options.reusable,
            })
            await sandboxWebsocketServer.waitForConnection(sandboxId)
            log.debug({
                sandboxId,
                flowVersionId,
                platformId,
                reusable: options.reusable,
            }, 'Sandbox started')
        },
        execute: async (operationType: EngineOperationType, operation: EngineOperation, options: SandboxOptions) => {
            let killedByTimeout = false
            let timeout: NodeJS.Timeout | null = null
            const operationPromise = new Promise<SandboxResult>((resolve, reject) => {
                assertNotNullOrUndefined(process, 'Sandbox process should not be null')
                timeout = setTimeout(async () => {
                    killedByTimeout = true
                    log.debug({ sandboxId }, 'Killing sandbox by timeout')
                    if (!isNil(process)) {
                        await killProcess(process, log)
                    }
                }, options.timeoutInSeconds * 1000)

                let stdError = ''
                let stdOut = ''

                sandboxWebsocketServer.attachListener(sandboxId, async (event, payload) => {
                    switch (event) {
                        case EngineSocketEvent.ENGINE_RESPONSE:
                            resolve({
                                engine: (payload as EngineResponse<unknown>),
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
                        case EngineSocketEvent.SEND_FLOW_RESPONSE:
                            await sandboxSockerHandler(log).sendFlowResponse(payload as SendFlowResponseRequest)
                            break
                        case EngineSocketEvent.UPDATE_RUN_PROGRESS:
                            await sandboxSockerHandler(log).updateRunProgress(payload as UpdateRunProgressRequest)
                            break
                        case EngineSocketEvent.UPDATE_STEP_PROGRESS:
                            await sandboxSockerHandler(log).updateStepProgress(payload as UpdateStepProgressRequest)
                            break
                        case EngineSocketEvent.ENGINE_OPERATION:
                            break
                    }
                })
                process.on('error', (error) => {
                    log.error({ sandboxId, error }, 'Sandbox process error')
                })

                process.on('exit', (code, signal) => {
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
                })

                sandboxWebsocketServer.send(sandboxId, operation, operationType)
                log.debug({ sandboxId, operationType }, 'Sent operation to sandbox')

            })

            try {
                return await operationPromise
            }
            finally {
                if (!isNil(timeout)) {
                    clearTimeout(timeout)
                }
                void sandboxWebsocketServer.removeListener(sandboxId)
                process?.removeAllListeners('exit')
                process?.removeAllListeners('error')
                process?.removeAllListeners('command')
            }
        },
        shutdown: async () => {
            if (!isNil(process)) {
                log.debug({ sandboxId }, 'Shutting down sandbox')
                await killProcess(process, log)
                process = null
            }
        },
    }
}


export type Sandbox = {
    id: string
    start: (options: SandboxStartOptions) => Promise<void>
    execute: (operationType: EngineOperationType, operation: EngineOperation, options: SandboxOptions) => Promise<SandboxResult>
    shutdown: () => Promise<void>
}

type SandboxStartOptions = {
    flowVersionId: string | undefined
    platformId: string
}

export type SandboxInitOptions = {
    env: Record<string, string>
    memoryLimitMb: number
    reusable: boolean
}

type SandboxResult = {
    engine: EngineResponse<unknown>
    stdOut: string
    stdError: string
}
type SandboxOptions = {
    timeoutInSeconds: number
}

async function killProcess(childProcess: ChildProcess, log: FastifyBaseLogger): Promise<void> {
    const pid = childProcess.pid
    if (!pid) {
        throw new Error('No PID found for child process')
    }
    await new Promise<void>((resolve) => {
        treeKill(pid, 'SIGKILL', (err) => {
            if (err) {
                log.error({
                    pid,
                    error: err,
                }, 'Failed to kill child process tree')
            }
            else {
                log.debug({
                    pid,
                }, 'Killed child process tree')
            }
            resolve()
        })
    })
}