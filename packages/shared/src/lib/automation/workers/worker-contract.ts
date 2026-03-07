import { ProgressUpdateType } from '../engine/engine-operation'
import { GetFlowVersionForWorkerRequest, SendFlowResponseRequest, UpdateRunProgressRequest, UpdateStepProgressRequest, UploadRunLogsRequest } from '../engine/requests'
import { FlowRun, RunEnvironment } from '../flow-run/flow-run'
import { FlowVersion } from '../flows/flow-version'
import { ConsumeJobRequest, ConsumeJobResponse, WorkerMachineHealthcheckRequest } from './index'

export type SubmitPayloadsRequest = {
    flowVersionId: string
    projectId: string
    payloads: unknown[]
    httpRequestId?: string
    environment: RunEnvironment
    progressUpdateType: ProgressUpdateType
    parentRunId?: string
    failParentOnFailure?: boolean
}

export type SavePayloadRequest = {
    flowId: string
    flowVersionId: string
    projectId: string
    payloads: unknown[]
}

export type GetPieceRequest = {
    name: string
    version?: string
    projectId?: string
}

export type WorkerToApiContract = {
    poll(input: WorkerMachineHealthcheckRequest): Promise<ConsumeJobRequest | null>
    completeJob(input: ConsumeJobResponse & { jobId: string }): Promise<void>
    updateRunProgress(input: UpdateRunProgressRequest): Promise<void>
    uploadRunLog(input: UploadRunLogsRequest): Promise<void>
    sendFlowResponse(input: SendFlowResponseRequest): Promise<void>
    updateStepProgress(input: UpdateStepProgressRequest): Promise<void>
    submitPayloads(input: SubmitPayloadsRequest): Promise<FlowRun[]>
    savePayloads(input: SavePayloadRequest): Promise<void>
    getFlowVersion(input: GetFlowVersionForWorkerRequest): Promise<FlowVersion | null>
    getPiece(input: GetPieceRequest): Promise<unknown>
    getPieceArchive(input: { archiveId: string }): Promise<Buffer>
    extendLock(input: { jobId: string }): Promise<void>
}
