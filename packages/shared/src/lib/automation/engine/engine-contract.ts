import { EngineOperation, EngineOperationType, EngineResponse, EngineStderr, EngineStdout } from './engine-operation'
import { SendFlowResponseRequest, UpdateRunProgressRequest, UpdateStepProgressRequest, UploadRunLogsRequest } from './requests'

export type EngineContract = {
    executeOperation(input: { operationType: EngineOperationType, operation: EngineOperation }): Promise<EngineResponse<unknown>>
}

export type WorkerContract = {
    updateRunProgress(input: UpdateRunProgressRequest): Promise<void>
    uploadRunLog(input: UploadRunLogsRequest): Promise<void>
    sendFlowResponse(input: SendFlowResponseRequest): Promise<void>
    updateStepProgress(input: UpdateStepProgressRequest): Promise<void>
}

export type WorkerNotifyContract = {
    stdout(input: EngineStdout): void
    stderr(input: EngineStderr): void
}
