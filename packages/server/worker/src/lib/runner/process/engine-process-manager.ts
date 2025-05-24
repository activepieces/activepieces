import { ChildProcess } from 'child_process'
import { ApSemaphore, getEngineTimeout } from '@activepieces/server-shared'
import { ApEnvironment, assertNotNullOrUndefined, EngineError, EngineOperation, EngineOperationType, EngineResponse, EngineResult, ExecuteFlowOperation, ExecutePropsOptions, ExecuteStepOperation, ExecuteTriggerOperation, ExecutionMode, isNil, TriggerHookType, EngineStderr, EngineResponseStatus, EngineStdout } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { workerMachine } from '../../utils/machine'
import { engineProcessFactory } from './factory/index'
import { EngineProcessOptions } from './factory/engine-factory-types'
import { engineRunnerSocket } from '../engine-runner-socket'
import { nanoid } from 'nanoid'
import { executionFiles } from '../../cache/execution-files'


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
    enginePath: string
    options: EngineProcessOptions
    lock: ApSemaphore
    engineSocketServer: ReturnType<typeof engineRunnerSocket>

    constructor(log: FastifyBaseLogger, maxWorkers: number, enginePath: string, options: EngineProcessOptions) {
        this.log = log
        this.enginePath = enginePath
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

    private async createWorkerIfNeeded(workerIndex: number, operation: EngineOperation, operationType: EngineOperationType): Promise<void> {
        try {
            const workerIsDead = isNil(this.processes[workerIndex]) || !this.processes[workerIndex]?.connected
            if (workerIsDead) {
                const workerId = this.workerIds[workerIndex]
                this.log.info({
                    workerIndex,
                }, 'Worker is not available, creating a new one')
                if (!isNil(this.processes[workerIndex])) {
                    this.processes[workerIndex]?.kill()
                    cleanUp(this.processes[workerIndex], undefined)
                }
                this.processes[workerIndex] = await engineProcessFactory(this.log).create({
                    enginePath: this.enginePath,
                    workerId,
                    workerIndex,
                    customPiecesPath: executionFiles(this.log).getCustomPiecesPath(operation),
                    flowVersionId: getFlowVersionId(operation, operationType),
                    options: this.options,
                })
                await this.engineSocketServer.waitForConnect(workerId)

                this.log.info({
                    workerIndex,
                }, 'Worker connected')
            }
        }
        catch (error) {
            this.log.error({
                error,
            }, 'Error creating worker')
            throw error
        }
    }

    private async processTask(workerIndex: number, operationType: EngineOperationType, operation: EngineOperation): Promise<WorkerResult> {
        const worker = this.processes[workerIndex]
        assertNotNullOrUndefined(worker, 'Worker should not be undefined')
        const timeout = getEngineTimeout(operationType, workerMachine.getSettings().FLOW_TIMEOUT_SECONDS, workerMachine.getSettings().TRIGGER_TIMEOUT_SECONDS)
        let didTimeout = false
        const workerId = this.workerIds[workerIndex]
        try {

            const result = await new Promise<WorkerResult>(async (resolve, reject) => {
                let stdError = ''
                let stdOut = ''

                // eslint-disable-next-line @typescript-eslint/no-misused-promises
                const timeoutWorker = setTimeout(() => {
                    didTimeout = true
                    worker.kill()
                }, timeout * 1000)


                const onResult = (result: EngineResult) => {
                    cleanUp(worker, timeoutWorker)

                    resolve({
                        engine: result.result as EngineResponse<unknown>,
                        stdOut,
                        stdError,
                    })
                }
                const onError = (error: EngineError) => {
                    cleanUp(worker, timeoutWorker)
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
                    cleanUp(worker, timeoutWorker)
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

                    cleanUp(worker, timeoutWorker)
                    this.processes[workerIndex] = undefined

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
                await this.engineSocketServer.send(workerId, { operation, operationType })
            })
            return result
        }
        catch (error) {
            this.log.error({
                error,
            }, 'Worker throw unexpected error')
            throw error
        } finally {
            this.engineSocketServer.unsubscribe(workerId)

            if (shouldCleanWorkerOnFinish()) {
                killWorker(worker, workerIndex, this.log)
                this.processes[workerIndex] = undefined
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


            await this.createWorkerIfNeeded(workerIndex, operation, operationType)

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
            return (operation as ExecutePropsOptions).flowVersion.id
        case EngineOperationType.EXECUTE_STEP:
            return (operation as ExecuteStepOperation).flowVersion.id
        case EngineOperationType.EXECUTE_TRIGGER_HOOK:
            return (operation as ExecuteTriggerOperation<TriggerHookType>).flowVersion.id
        case EngineOperationType.EXECUTE_TOOL:
        case EngineOperationType.EXTRACT_PIECE_METADATA:
        case EngineOperationType.EXECUTE_VALIDATE_AUTH:
            return undefined
    }
}

function killWorker(worker: ChildProcess, workerIndex: number, log: FastifyBaseLogger): void {
    try {
        log.debug({
            workerIndex,
        }, 'Removing worker in development mode to avoid caching issues')
        worker.kill()
    }
    catch (e) {
        log.error({
            error: e,
        }, 'Error terminating worker')
    }
}

function cleanUp(worker: ChildProcess, timeout: NodeJS.Timeout | undefined): void {
    worker.removeAllListeners('exit')
    worker.removeAllListeners('error')
    worker.removeAllListeners('message')
    if (!isNil(timeout)) {
        clearTimeout(timeout)
    }
}


function shouldCleanWorkerOnFinish(): boolean {
    const isDevelopment = workerMachine.getSettings().ENVIRONMENT === ApEnvironment.DEVELOPMENT
    const isSandboxed = workerMachine.getSettings().EXECUTION_MODE === ExecutionMode.SANDBOXED
    return isDevelopment || isSandboxed
}