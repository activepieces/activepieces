import { EngineOperation, EngineOperationType, EngineResponse, EngineStderr, EngineStdout } from './engine-operation'

export type EngineContract = {
    executeOperation(input: { operationType: EngineOperationType, operation: EngineOperation }): Promise<EngineResponse<unknown>>
}

export type WorkerNotifyContract = {
    stdout(input: EngineStdout): void
    stderr(input: EngineStderr): void
}
