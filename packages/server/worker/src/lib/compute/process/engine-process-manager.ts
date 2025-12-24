import { ChildProcess } from 'child_process'
import { ApSemaphore } from '@activepieces/server-shared'
import { ApEnvironment, assertNotNullOrUndefined, EngineOperation, EngineOperationType, EngineResponse, EngineResponseStatus, EngineStderr, EngineStdout, ExecuteFlowOperation, ExecutePropsOptions, ExecuteTriggerOperation, ExecutionMode, isNil, TriggerHookType } from '@activepieces/shared'
import { trace } from '@opentelemetry/api'
import { FastifyBaseLogger } from 'fastify'
import { nanoid } from 'nanoid'
import treeKill from 'tree-kill'
import { devPiecesState } from '../../cache/pieces/development/dev-pieces-state'
import { workerMachine } from '../../utils/machine'
import { engineRunnerSocket } from '../engine-runner-socket'
import { engineSocketHandlers } from './engine-socket-handlers'
import { EngineProcessOptions } from './factory/engine-factory-types'
import { engineProcessFactory } from './factory/index'

const tracer = trace.getTracer('engine-process-manager')

export type WorkerResult = {
    engine: EngineResponse<unknown>
    stdOut: string
    stdError: string
}

let processes: (ChildProcess | undefined)[] = []
let availableProcessIndexes: number[] = []
let processIds: string[] = []
let workerGenerations: number[] = []
let options: EngineProcessOptions
let lock: ApSemaphore
let engineSocketServer: ReturnType<typeof engineRunnerSocket>
let initialized = false

export const engineProcessManager = {
    init(_maxWorkers: number, _options: EngineProcessOptions, log: FastifyBaseLogger) {

        if (initialized) {
            return
        }
        options = _options
        processes = []
        availableProcessIndexes = []
        lock = new ApSemaphore(_maxWorkers)
        engineSocketServer = engineRunnerSocket(log)
        processIds = []
        workerGenerations = []
        // Create the initial workers
        for (let i = 0; i < _maxWorkers; i++) {
            processes.push(undefined)
            availableProcessIndexes.push(i)
            processIds.push(nanoid())
            workerGenerations.push(-1)
        }
        initialized = true
    },

    getFreeSandboxes(): number {
        return availableProcessIndexes.length
    },
    getTotalSandboxes(): number {
        return processes.length
    },

    async executeTask(operationType: EngineOperationType, operation: EngineOperation, log: FastifyBaseLogger, timeoutInSeconds: number): Promise<WorkerResult> {
        log.trace({
            operationType,
            operation,
        }, 'Executing operation')
        await lock.acquire()
        const workerIndex = availableProcessIndexes.pop()

        try {
            log.debug({
                workerIndex,
            }, 'Acquired worker')
            assertNotNullOrUndefined(workerIndex, 'Worker index should not be undefined')

            const workerIsDisconnected = isNil(processes[workerIndex]) || !engineSocketServer.isConnected(processIds[workerIndex])
            const workerIsDead = workerIsDisconnected || shouldRecreateWorker(workerGenerations[workerIndex])
            if (!workerIsDead) {
                log.info({
                    workerIndex,
                    generation: workerGenerations[workerIndex],
                }, 'Reusing existing worker (generation still valid)')
            }
            if (workerIsDead) {
                await tracer.startActiveSpan('engineProcessManager.provisionWorker', {
                    attributes: {
                        'worker.index': workerIndex,
                        'worker.isDisconnected': workerIsDisconnected,
                        'worker.isReusable': canReuseWorkers(),
                    },
                }, async (span) => {
                    try {
                        log.info({
                            workerIndex,
                            workerIsDisconnected,
                        }, 'Worker is not available, creating a new one')
                        if (!isNil(processes[workerIndex])) {
                            await forceTerminate(processes[workerIndex], log)
                            processIds[workerIndex] = nanoid()
                            workerGenerations[workerIndex] = -1
                        }

                        const workerId = processIds[workerIndex]
                        const startTime = performance.now()
                        
                        await tracer.startActiveSpan('engineProcessManager.createProcess', {
                            attributes: {
                                'worker.id': workerId,
                                'worker.index': workerIndex,
                            },
                        }, async (createSpan) => {
                            try {
                                processes[workerIndex] = await engineProcessFactory(log).create({
                                    workerId,
                                    workerIndex,
                                    platformId: operation.platformId,
                                    flowVersionId: getFlowVersionId(operation, operationType),
                                    options,
                                    reusable: canReuseWorkers(),
                                })
                                workerGenerations[workerIndex] = devPiecesState.getGeneration()
                                const processCreationTime = Math.floor(performance.now() - startTime)
                                createSpan.setAttribute('worker.processCreationTimeMs', processCreationTime)
                            }
                            finally {
                                createSpan.end()
                            }
                        })
                        
                        const connectionStartTime = performance.now()
                        await tracer.startActiveSpan('engineProcessManager.waitForConnection', {
                            attributes: {
                                'worker.id': workerId,
                                'worker.index': workerIndex,
                            },
                        }, async (connectSpan) => {
                            try {
                                const connection = await engineSocketServer.waitForConnect(workerId)
                                const connectionWaitTime = Math.floor(performance.now() - connectionStartTime)
                                connectSpan.setAttribute('worker.connectionWaitTimeMs', connectionWaitTime)
                                
                                if (!connection) {
                                    connectSpan.recordException(new Error('Worker connection failed'))
                                    log.error({
                                        workerIndex,
                                    }, 'Worker connection failed')
                                    throw new Error('Worker connection failed')
                                }
                            }
                            finally {
                                connectSpan.end()
                            }
                        })
                        
                        const totalTime = Math.floor(performance.now() - startTime)
                        span.setAttribute('worker.totalProvisioningTimeMs', totalTime)
                        log.info({
                            workerIndex,
                            timeTaken: `${totalTime}ms`,
                        }, 'Worker connected')
                    }
                    finally {
                        span.end()
                    }
                })
            }

            const result = await processTask(workerIndex, operationType, operation, log, timeoutInSeconds)
            // Keep an await so finally does not run before the task is finished
            return result
        }
        catch (error) {
            log.error({
                error,
            }, 'Error executing task')
            throw error
        }
        finally {
            if (!isNil(workerIndex)) {
                availableProcessIndexes.push(workerIndex)
            }
            lock.release()
        }
    },

    async shutdown(): Promise<void> {
        if (!initialized) {
            return
        }
        for (const worker of processes) {
            worker?.kill()
        }
    },
}

async function processTask(workerIndex: number, operationType: EngineOperationType, operation: EngineOperation, log: FastifyBaseLogger, timeoutInSeconds: number): Promise<WorkerResult> {
    return tracer.startActiveSpan('engineProcessManager.processTask', {
        attributes: {
            'worker.index': workerIndex,
            'worker.operationType': operationType,
            'worker.timeoutInSeconds': timeoutInSeconds,
        },
    }, async (span) => {
        const worker = processes[workerIndex]
        assertNotNullOrUndefined(worker, 'Worker should not be undefined')
        let didTimeout = false
        const workerId = processIds[workerIndex]
        let timeoutWorker: NodeJS.Timeout | undefined
        const taskStartTime = performance.now()
        try {

            const result = await new Promise<WorkerResult>((resolve, reject) => {
                let stdError = ''
                let stdOut = ''
                // eslint-disable-next-line @typescript-eslint/no-misused-promises
                timeoutWorker = setTimeout(async () => {
                    didTimeout = true
                    await forceTerminate(worker, log)
                    processes[workerIndex] = undefined
                }, timeoutInSeconds * 1000)


                const onResult = (result: EngineResponse<unknown>) => {
                    const executionTimeMs = Math.floor(performance.now() - taskStartTime)
                    span.setAttribute('worker.executionTimeMs', executionTimeMs)
                    span.setAttribute('worker.resultStatus', result.status)
                    resolve({
                        engine: result,
                        stdOut,
                        stdError,
                    })
                }
                const onStdout = (stdout: EngineStdout) => {
                    stdOut += stdout.message
                }
                const onStderr = (stderr: EngineStderr) => {
                    stdError += stderr.message
                }

                engineSocketServer.subscribe({
                    workerId,
                    onResult,
                    onStdout,
                    onStderr,
                    ...engineSocketHandlers(log),
                })

                worker.on('error', (error) => {
                    log.info({
                        error,
                    }, 'Worker returned something in stderr')
                    span.recordException(error)
                    reject({ status: EngineResponseStatus.INTERNAL_ERROR, error })
                })

                worker.on('exit', (code, signal) => {
                    const isRamIssue = stdError.includes('JavaScript heap out of memory') || stdError.includes('Allocation failed - JavaScript heap out of memory') || (code === 134 || signal === 'SIGABRT' || signal === 'SIGKILL')

                    log.error({
                        stdError,
                        stdOut,
                        workerIndex,
                        code,
                        isRamIssue,
                        signal,
                    }, 'Worker exited')

                    span.setAttribute('worker.exitCode', code ?? -1)
                    span.setAttribute('worker.exitSignal', signal ?? 'none')

                    if (didTimeout) {
                        span.setAttribute('worker.didTimeout', true)
                        resolve({
                            engine: {
                                status: EngineResponseStatus.TIMEOUT,
                                response: {},
                            },
                            stdError,
                            stdOut,
                        })
                    }
                    else if (isRamIssue) {
                        span.setAttribute('worker.isRamIssue', true)
                        resolve({
                            engine: {
                                status: EngineResponseStatus.MEMORY_ISSUE,
                                response: {},
                            },
                            stdError,
                            stdOut,
                        })
                    }
                    else {
                        span.recordException(new Error(`Worker exited with code ${code} and signal ${signal}`))
                        reject({
                            status: EngineResponseStatus.INTERNAL_ERROR,
                            error: 'Worker exited with code ' + code + ' and signal ' + signal,
                            stdError,
                            stdOut,
                        })
                    }
                })
                log.info({
                    workerIndex,
                    timeoutInSeconds,
                }, 'Sending operation to worker')
                engineSocketServer.send(workerId, { operation, operationType })
            })
            span.end()
            return result
        }
        catch (error) {
            log.error({
                error,
            }, 'Worker throw unexpected error')
            span.recordException(error as Error)
            span.end()
            throw error
        }
        finally {
            engineSocketServer.unsubscribe(workerId)
            worker.removeAllListeners('exit')
            worker.removeAllListeners('error')
            worker.removeAllListeners('message')
            if (!isNil(timeoutWorker)) {
                clearTimeout(timeoutWorker)
            }
            if (shouldRecreateWorker(workerGenerations[workerIndex])) {
                if (!isNil(processes[workerIndex])) {
                    await forceTerminate(processes[workerIndex], log)
                }
                processes[workerIndex] = undefined
                processIds[workerIndex] = nanoid()
                workerGenerations[workerIndex] = -1
            }
            log.debug({
                workerIndex,
            }, 'Releasing worker')
        }
    })
}

function getFlowVersionId(operation: EngineOperation, type: EngineOperationType): string | undefined {
    switch (type) {
        case EngineOperationType.EXECUTE_FLOW:
            return (operation as ExecuteFlowOperation).flowVersion.id
        case EngineOperationType.EXECUTE_PROPERTY:
            return (operation as ExecutePropsOptions).flowVersion?.id
        case EngineOperationType.EXECUTE_TRIGGER_HOOK:
            return (operation as ExecuteTriggerOperation<TriggerHookType>).flowVersion.id
        case EngineOperationType.EXTRACT_PIECE_METADATA:
        case EngineOperationType.EXECUTE_VALIDATE_AUTH:
            return undefined
    }
}

async function forceTerminate(childProcess: ChildProcess, log: FastifyBaseLogger): Promise<void> {
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
                log.info({
                    pid,
                }, 'Killed child process tree')
            }
            resolve()
        })
    })
}

function canReuseWorkers(): boolean {
    const settings = workerMachine.getSettings()

    if (settings.ENVIRONMENT === ApEnvironment.DEVELOPMENT) {
        return true
    }
    const trustedModes = [ExecutionMode.SANDBOX_CODE_ONLY, ExecutionMode.UNSANDBOXED]
    if (trustedModes.includes(settings.EXECUTION_MODE as ExecutionMode)) {
        return true
    }
    if (workerMachine.isDedicatedWorker()) {
        return true
    }
    return false
}

function shouldRecreateWorker(workerGeneration: number): boolean {
    if (devPiecesState.isWorkerGenerationStale(workerGeneration)) {
        return true
    }
    return !canReuseWorkers()
}
