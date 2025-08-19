import { ChildProcess } from 'child_process'
import { ApSemaphore, getEngineTimeout } from '@activepieces/server-shared'
import { ApEnvironment, assertNotNullOrUndefined, EngineError, EngineOperation, EngineOperationType, EngineResponse, EngineResponseStatus, EngineResult, EngineStderr, EngineStdout, ExecuteFlowOperation, ExecutePropsOptions, ExecuteTriggerOperation, ExecutionMode, isNil, TriggerHookType } from '@activepieces/shared'
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


export class EngineProcessManager {
    processes: (ChildProcess | undefined)[]
    availableWorkerIndexes: number[]
    workerIds: string[]
    log: FastifyBaseLogger
    options: EngineProcessOptions
    lock: ApSemaphore
    engineSocketServer: ReturnType<typeof engineRunnerSocket>

    constructor(log: FastifyBaseLogger, maxWorkers: number, options: EngineProcessOptions) {
        this.log = log
        this.options = options
        this.processes = []
        this.availableWorkerIndexes = []
        this.lock = new ApSemaphore(maxWorkers)
        this.engineSocketServer = engineRunnerSocket(this.log)
        this.workerIds = []
        // Create the initial workers
        for (let i = 0; i < maxWorkers; i++) {
            this.processes.push(undefined)
            this.availableWorkerIndexes.push(i)
            this.workerIds.push(nanoid())
        }
    }

    private async processTask(workerIndex: number, operationType: EngineOperationType, operation: EngineOperation): Promise<WorkerResult> {
        const worker = this.processes[workerIndex]
        assertNotNullOrUndefined(worker, 'Worker should not be undefined')
        const timeout = getEngineTimeout(operationType, workerMachine.getSettings().FLOW_TIMEOUT_SECONDS, workerMachine.getSettings().TRIGGER_TIMEOUT_SECONDS)
        let didTimeout = false
        const workerId = this.workerIds[workerIndex]
        let timeoutWorker: NodeJS.Timeout | undefined
        try {

            const result = await new Promise<WorkerResult>((resolve, reject) => {
                let stdError = ''
                let stdOut = ''

                // eslint-disable-next-line @typescript-eslint/no-misused-promises
                timeoutWorker = setTimeout(async () => {
                    didTimeout = true
                    await forceTerminate(worker, this.log)
                    this.processes[workerIndex] = undefined
                }, timeout * 1000)


                const onResult = (result: EngineResult) => {

                    resolve({
                        engine: result.result as EngineResponse<unknown>,
                        stdOut,
                        stdError,
                    })
                }
                const onError = (error: EngineError) => {
                    reject({ status: EngineResponseStatus.ERROR, response: error.error })
                }
                const onStdout = (stdout: EngineStdout) => {
                    stdOut += stdout.message
                }
                const onStderr = (stderr: EngineStderr) => {
                    stdError += stderr.message
                }

                this.engineSocketServer.subscribe(workerId, onResult, onError, onStdout, onStderr)

                worker.on('error', (error) => {
                    this.log.info({
                        error,
                    }, 'Worker returned something in stderr')
                    reject({ status: EngineResponseStatus.ERROR, response: error })
                })

                worker.on('exit', (code, signal) => {
                    const isRamIssue = stdError.includes('JavaScript heap out of memory') || stdError.includes('Allocation failed - JavaScript heap out of memory') || (code === 134 || signal === 'SIGABRT' || signal === 'SIGKILL')

                    this.log.error({
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
                            stdError: '',
                            stdOut: '',
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
                        reject({ status: EngineResponseStatus.ERROR, response: 'Worker exited with code ' + code + ' and signal ' + signal })
                    }
                })
                this.log.debug({
                    workerIndex,
                }, 'Sending operation to worker')
                this.engineSocketServer.send(workerId, { operation, operationType })
            })
            return result
        }
        catch (error) {
            this.log.error({
                error,
            }, 'Worker throw unexpected error')
            throw error
        }
        finally {
            this.engineSocketServer.unsubscribe(workerId)
            worker.removeAllListeners('exit')
            worker.removeAllListeners('error')
            worker.removeAllListeners('message')
            if (!isNil(timeoutWorker)) {
                clearTimeout(timeoutWorker)
            }
            if (isWorkerNotResuable()) {
                if (!isNil(this.processes[workerIndex])) {
                    await forceTerminate(this.processes[workerIndex], this.log)
                }
                this.processes[workerIndex] = undefined
                this.workerIds[workerIndex] = nanoid()
            }
            this.log.debug({
                workerIndex,
            }, 'Releasing worker')
        }
    }

    async executeTask(operationType: EngineOperationType, operation: EngineOperation): Promise<WorkerResult> {
        this.log.trace({
            operationType,
            operation,
        }, 'Executing operation')
        await this.lock.acquire()
        const workerIndex = this.availableWorkerIndexes.pop()
        assertNotNullOrUndefined(workerIndex, 'Worker index should not be undefined')

        try {
            this.log.debug({
                workerIndex,
            }, 'Acquired worker')
            assertNotNullOrUndefined(workerIndex, 'Worker index should not be undefined')


            const workerIsDead = isNil(this.processes[workerIndex]) || !this.processes[workerIndex]?.connected || isWorkerNotResuable()
            if (workerIsDead) {
                this.log.info({
                    workerIndex,
                }, 'Worker is not available, creating a new one')
                if (!isNil(this.processes[workerIndex])) {
                    await forceTerminate(this.processes[workerIndex], this.log)
                    this.workerIds[workerIndex] = nanoid()
                }

                const workerId = this.workerIds[workerIndex]

                this.processes[workerIndex] = await engineProcessFactory(this.log).create({
                    workerId,
                    workerIndex,
                    customPiecesPath: executionFiles(this.log).getCustomPiecesPath(operation),
                    flowVersionId: getFlowVersionId(operation, operationType),
                    options: this.options,
                })
                const connection = await this.engineSocketServer.waitForConnect(workerId)
                if (!connection) {
                    this.log.error({
                        workerIndex,
                    }, 'Worker connection failed')
                    throw new Error('Worker connection failed')
                }
                this.log.info({
                    workerIndex,
                }, 'Worker connected')
            }

            const result = await this.processTask(workerIndex, operationType, operation)
            // Keep an await so finally does not run before the task is finished
            return result
        }
        catch (error) {
            this.log.error({
                error,
            }, 'Error executing task')
            throw error
        }
        finally {
            this.availableWorkerIndexes.push(workerIndex)
            this.lock.release()
        }
    }

    async shutdown(): Promise<void> {
        this.log.info('Sending shutdown signal to all workers')
        for (const worker of this.processes) {
            worker?.kill()
        }
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