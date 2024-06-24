import { Worker, WorkerOptions } from 'worker_threads'
import { ApSemaphore } from '@activepieces/server-shared'
import { EngineOperation, EngineOperationType, EngineResponse, EngineResponseStatus } from '@activepieces/shared'

export type WorkerResult = {
    engine: EngineResponse<unknown>
    stdOut: string
    stdError: string
}

export class EngineWorker {
    workers: Worker[]
    availableWorkerIndexes: number[]
    lock: ApSemaphore
    enginePath: string
    engineOptions: WorkerOptions | undefined
    constructor(maxWorkers: number, enginePath: string, engineOptions?: WorkerOptions) {
        this.enginePath = enginePath
        this.engineOptions = engineOptions
        this.workers = []
        this.availableWorkerIndexes = []
        this.lock = new ApSemaphore(maxWorkers)

        // Create the initial workers
        for (let i = 0; i < maxWorkers; i++) {
            this.workers.push(new Worker(enginePath, engineOptions))
            this.availableWorkerIndexes.push(i)
        }
    }

    async executeTask(operationType: EngineOperationType,
        operation: EngineOperation) {
        await this.lock.acquire()
        const workerIndex = this.availableWorkerIndexes.pop()!
        // Perform task with the worker
        try {
            // lock makes sure that availableWorkerIndexes is not empty.
            const worker = this.workers[workerIndex]
            const result = await new Promise<WorkerResult>((resolve, reject) => {
                let stdError = ''
                let stdOut = ''
                worker.removeAllListeners()

                worker.on('message', (m: { type: string, message: unknown }) => {
                    if (m.type === 'result') {
                        resolve({
                            engine: m.message as EngineResponse<unknown>,
                            stdOut,
                            stdError,
                        })
                    }
                    else if (m.type === 'stdout') {
                        stdOut += m.message
                    }
                    else if (m.type === 'stderr') {
                        stdError += m.message
                    }
                })

                worker.on('error', () => {
                    this.workers[workerIndex] = new Worker(this.enginePath, this.engineOptions)
                    reject({ status: EngineResponseStatus.ERROR, response: {} })
                })

                worker.on('exit', () => {
                    this.workers[workerIndex] = new Worker(this.enginePath, this.engineOptions)
                    reject({ status: EngineResponseStatus.ERROR, response: {} })
                })
                worker.postMessage({ operation, operationType })
            })
            return result
        }
        finally {
            this.availableWorkerIndexes.push(workerIndex)
            this.lock.release()
        }
    }
}
