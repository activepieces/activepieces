import { ChildProcess, fork } from 'child_process'
import { ApSemaphore, getEngineTimeout } from '@activepieces/server-shared'
import { ApEnvironment, assertNotNullOrUndefined, EngineOperation, EngineOperationType, EngineResponse, EngineResponseStatus, isNil } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { workerMachine } from '../../utils/machine'

export type WorkerResult = {
    engine: EngineResponse<unknown>
    stdOut: string
    stdError: string
}

export class EngineWorker {
    workers: (ChildProcess | undefined)[]
    availableWorkerIndexes: number[]
    lock: ApSemaphore
    enginePath: string
    log: FastifyBaseLogger
    options: {
        env: Record<string, string | undefined>
        resourceLimits: {
            maxOldGenerationSizeMb: number
            maxYoungGenerationSizeMb: number
            stackSizeMb: number
        }
    }
    constructor(log: FastifyBaseLogger, maxWorkers: number, enginePath: string, options: {
        env: Record<string, string | undefined>
        execArgv: string[]
        resourceLimits: { maxOldGenerationSizeMb: number, maxYoungGenerationSizeMb: number, stackSizeMb: number }
    }) {
        this.log = log
        this.enginePath = enginePath
        this.options = options
        this.workers = []
        this.availableWorkerIndexes = []
        this.lock = new ApSemaphore(maxWorkers)

        // Create the initial workers
        for (let i = 0; i < maxWorkers; i++) {
            this.workers.push(fork(enginePath, [], options))
            this.availableWorkerIndexes.push(i)
        }
    }

    private createWorkerIfNeeded(workerIndex: number): void {
        try {
            const workerIsDead = isNil(this.workers[workerIndex]) || !this.workers[workerIndex]?.connected
            if (workerIsDead) {
                this.log.info({
                    workerIndex,
                }, 'Worker is not available, creating a new one')
                if (!isNil(this.workers[workerIndex])) {
                    this.workers[workerIndex]?.kill()
                    cleanUp(this.workers[workerIndex], undefined)
                }
                this.workers[workerIndex] = fork(this.enginePath, [], this.options)
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
        const worker = this.workers[workerIndex]
        assertNotNullOrUndefined(worker, 'Worker should not be undefined')
        const environment = workerMachine.getSettings().ENVIRONMENT
        const timeout = getEngineTimeout(operationType, workerMachine.getSettings().FLOW_TIMEOUT_SECONDS, workerMachine.getSettings().TRIGGER_TIMEOUT_SECONDS)
        let didTimeout = false
        try {

            const result = await new Promise<WorkerResult>((resolve, reject) => {
                let stdError = ''
                let stdOut = ''

                // eslint-disable-next-line @typescript-eslint/no-misused-promises
                const timeoutWorker = setTimeout(() => {
                    didTimeout = true
                    worker.kill()
                }, timeout * 1000)

                worker.on('message', (m: { type: string, message: unknown }) => {
                    switch (m.type) {
                        case 'result':
                            cleanUp(worker, timeoutWorker)
                            resolve({
                                engine: m.message as EngineResponse<unknown>,
                                stdOut,
                                stdError,
                            })
                            break
                        case 'stdout':
                            stdOut += m.message as string
                            break
                        case 'stderr':
                            stdError += m.message as string
                            break
                        case 'error':
                            cleanUp(worker, timeoutWorker)
                            reject({ status: EngineResponseStatus.ERROR, response: m.message })
                            break
                    }
                })

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
                    this.workers[workerIndex] = undefined

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
                worker.send({ operation, operationType })
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
            if (environment === ApEnvironment.DEVELOPMENT) {
                try {
                    this.log.trace({
                        workerIndex,
                    }, 'Removing worker in development mode to avoid caching issues')
                    worker.kill()
                }
                catch (e) {
                    this.log.error({
                        error: e,
                    }, 'Error terminating worker')
                }
                this.workers[workerIndex] = undefined
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


            this.createWorkerIfNeeded(workerIndex)

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

}

function cleanUp(worker: ChildProcess, timeout: NodeJS.Timeout | undefined): void {
    worker.removeAllListeners('exit')
    worker.removeAllListeners('error')
    worker.removeAllListeners('message')
    if (!isNil(timeout)) {
        clearTimeout(timeout)
    }
}
