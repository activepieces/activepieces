import { ChildProcess } from 'child_process'
import { ApSemaphore } from '@activepieces/server-shared'
import { ApEnvironment, assertNotNullOrUndefined, EngineOperation, EngineOperationType, EngineResponse, EngineResponseStatus, EngineStderr, EngineStdout, ExecuteFlowOperation, ExecutePropsOptions, ExecuteTriggerOperation, ExecutionMode, isNil, TriggerHookType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { nanoid } from 'nanoid'
import treeKill from 'tree-kill'
import { executionFiles } from '../../cache/execution-files'
import { workerMachine } from '../../utils/machine'
import { engineRunnerSocket } from '../engine-runner-socket'
import { EngineProcessOptions } from './factory/engine-factory-types'
import { engineProcessFactory } from './factory/index'

export type WorkerResult = {
    engine: EngineResponse<unknown>
    stdOut: string
    stdError: string
}

let processes: (ChildProcess | undefined)[] = []
let availableProcessIndexes: number[] = []
let processIds: string[] = []
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
        // Create the initial workers
        for (let i = 0; i < _maxWorkers; i++) {
            processes.push(undefined)
            availableProcessIndexes.push(i)
            processIds.push(nanoid())
        }
        initialized = true
    },

    getFreeSandboxes(): number {
        return availableProcessIndexes.length
    },
    getTotalSandboxes(): number {
        return processes.length
    },

    async executeTask(operationType: EngineOperationType, operation: EngineOperation, log: FastifyBaseLogger, timeout: number): Promise<WorkerResult> {
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

            const workerIsDead = isNil(processes[workerIndex]) || !processes[workerIndex]?.connected || isWorkerNotResuable()
            if (workerIsDead) {
                log.info({
                    workerIndex,
                }, 'Worker is not available, creating a new one')
                if (!isNil(processes[workerIndex])) {
                    await forceTerminate(processes[workerIndex], log)
                    processIds[workerIndex] = nanoid()
                }

                const workerId = processIds[workerIndex]

                processes[workerIndex] = await engineProcessFactory(log).create({
                    workerId,
                    workerIndex,
                    customPiecesPath: executionFiles(log).getCustomPiecesPath(operation),
                    flowVersionId: getFlowVersionId(operation, operationType),
                    options,
                })
                const connection = await engineSocketServer.waitForConnect(workerId)
                if (!connection) {
                    log.error({
                        workerIndex,
                    }, 'Worker connection failed')
                    throw new Error('Worker connection failed')
                }
                log.info({
                    workerIndex,
                }, 'Worker connected')
            }

            const result = await processTask(workerIndex, operationType, operation, log, timeout)
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

async function processTask(workerIndex: number, operationType: EngineOperationType, operation: EngineOperation, log: FastifyBaseLogger, timeout: number): Promise<WorkerResult> {
    const worker = processes[workerIndex]
    assertNotNullOrUndefined(worker, 'Worker should not be undefined')
    let didTimeout = false
    const workerId = processIds[workerIndex]
    let timeoutWorker: NodeJS.Timeout | undefined
    try {

        const result = await new Promise<WorkerResult>((resolve, reject) => {
            let stdError = ''
            let stdOut = ''

            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            timeoutWorker = setTimeout(async () => {
                didTimeout = true
                await forceTerminate(worker, log)
                processes[workerIndex] = undefined
            }, timeout * 1000)


            const onResult = (result: EngineResponse<unknown>) => {

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

            engineSocketServer.subscribe(workerId, onResult, onStdout, onStderr)

            worker.on('error', (error) => {
                log.info({
                    error,
                }, 'Worker returned something in stderr')
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


                if (didTimeout) {
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
                    reject({
                        status: EngineResponseStatus.INTERNAL_ERROR,
                        error: 'Worker exited with code ' + code + ' and signal ' + signal,
                        stdError,
                        stdOut,
                    })
                }
            })
            log.debug({
                workerIndex,
            }, 'Sending operation to worker')
            engineSocketServer.send(workerId, { operation, operationType })
        })
        return result
    }
    catch (error) {
        log.error({
            error,
        }, 'Worker throw unexpected error')
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
        if (isWorkerNotResuable()) {
            if (!isNil(processes[workerIndex])) {
                await forceTerminate(processes[workerIndex], log)
            }
            processes[workerIndex] = undefined
            processIds[workerIndex] = nanoid()
        }
        log.debug({
            workerIndex,
        }, 'Releasing worker')
    }
}

function getFlowVersionId(operation: EngineOperation, type: EngineOperationType): string | undefined {
    switch (type) {
        case EngineOperationType.EXECUTE_FLOW:
            return (operation as ExecuteFlowOperation).flowVersion.id
        case EngineOperationType.EXECUTE_PROPERTY:
            return (operation as ExecutePropsOptions).flowVersion?.id
        case EngineOperationType.EXECUTE_TRIGGER_HOOK:
            return (operation as ExecuteTriggerOperation<TriggerHookType>).flowVersion.id
        case EngineOperationType.EXECUTE_TOOL:
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


function isWorkerNotResuable(): boolean {
    const isDevelopment = workerMachine.getSettings().ENVIRONMENT === ApEnvironment.DEVELOPMENT
    const isSandboxed = workerMachine.getSettings().EXECUTION_MODE === ExecutionMode.SANDBOXED
    return isDevelopment || isSandboxed
}