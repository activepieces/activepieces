import { EngineOperation, EngineOperationType, EngineResponse, EngineStderr, EngineStdout } from './engine-operation'

export type EngineContract = {
    executeOperation(input: { operationType: EngineOperationType, operation: EngineOperation }): Promise<EngineResponse<unknown>>
}

export type WorkerNotifyContract = {
    stdout(input: EngineStdout): void
    stderr(input: EngineStderr): void
}

export type WorkerRpcContract = {
    forceReinstallPiece(input: ForceReinstallPieceRequest): Promise<void>
}

export type ForceReinstallPieceRequest = {
    pieceName: string
    pieceVersion: string
}
